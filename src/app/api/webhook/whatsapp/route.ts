import { NextResponse } from 'next/server';
import { resolveIdentity, getWhatsAppConfig, logEvent } from '@/lib/webhook/utils';
import { handleActionRouting } from '@/lib/webhook/router';
import { generateAndSendAIResponse } from '@/lib/neural-engine/whatsapp';
import { handleOrderMessage } from '@/lib/webhook/handlers/order';
import { handleFlowResponse } from '@/lib/webhook/handlers/flows';
import { supabase as supabaseAdmin } from '@/lib/webhook/utils';
import crypto from 'crypto';

import { type WhatsAppWebhookRequest, type OrderPayload } from '@/lib/whatsapp/types';



/**
 * WHATSAPP WEBHOOK ROUTE v12.0 (Diamond Resilience)
 * Main entry point for Meta Graph API Webhooks.
 * Protocolo 2026: Soporte BSUID (Business-Scoped User ID).
 */
export const maxDuration = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse('Forbidden', { status: 403 });
  }
  return new NextResponse('Bad Request', { status: 400 });
}

function validateSignature(payload: string, signature: string | null): boolean {
  if (!signature) return false;
  const APP_SECRET = process.env.META_APP_SECRET || '';
  if (!APP_SECRET) return true; // Si no hay secreto configurado, permitimos (deuda de config)

  const [algo, hash] = signature.split('=');
  if (algo !== 'sha256') return false;

  const hmac = crypto.createHmac('sha256', APP_SECRET);
  const digest = hmac.update(payload).digest('hex');
  return digest === hash;
}

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    await logEvent({
      action: 'WEBHOOK_RAW_ENTRY',
      details: { raw: bodyText.substring(0, 1000) } // Evitamos saturar si es muy largo
    });
    
    const signature = req.headers.get('X-Hub-Signature-256');
    if (!validateSignature(bodyText, signature)) {
      console.warn('[WEBHOOK_SECURITY] Invalid Signature');
      // Respondemos 200 para evitar que Meta reintente un payload "malicioso" o mal configurado
      return NextResponse.json({ status: 'forbidden', reason: 'Invalid signature' }, { status: 200 });
    }

    const body = JSON.parse(bodyText) as WhatsAppWebhookRequest;
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0]?.value;

    if (!changes || !changes.messages || changes.messages.length === 0) {
      return NextResponse.json({ status: 'ignored', reason: 'No messages' }, { status: 200 });
    }

    const message = changes.messages[0];

    // 0. Deduplicación de Eventos (Meta Protocol 2026)
    const { data: existingMessage } = await supabaseAdmin
      .from('messages')
      .select('id')
      .eq('external_id', message.id)
      .maybeSingle();

    if (existingMessage) {
      return NextResponse.json({ status: 'success', detail: 'Duplicate ignored' }, { status: 200 });
    }
    const contact = changes.contacts?.[0];
    const phoneNumberId = changes.metadata.phone_number_id;
    const sender = message.from;

    // 1. Obtener Configuración de la Empresa via phoneNumberId
    let config: { token: string; phoneId: string } | null = null;
    try {
      // getWhatsAppConfig espera companyId pero resolvemos via PHONE_NUMBER_ID del env
      // como fallback directo para el tenant maestro
      const masterCompanyId = process.env.ARISE_MASTER_COMPANY_ID || '';
      config = await getWhatsAppConfig(masterCompanyId);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('[WEBHOOK_FATAL] No se encontró configuración para el phoneNumberId:', phoneNumberId);
      await logEvent({
        action: 'WEBHOOK_CONFIG_ERROR',
        details: { error: error.message || 'Unknown error', phoneNumberId }
      });
      return NextResponse.json({ status: 'error', reason: 'Unregistered phone number' }, { status: 404 });
    }

    const whatsappToken = config.token;
    const companyId = process.env.ARISE_MASTER_COMPANY_ID || '';
    const bsuid = contact?.bsuid || contact?.wa_id;

    // 2. Resolver Identidad (Contacto y Conversación) con Aislamiento Tenant
    const identity = await resolveIdentity(sender, bsuid, companyId);

    if (!identity) {
      console.error('[WEBHOOK_FATAL] Error resolviendo identidad para:', sender);
      return NextResponse.json({ status: 'error', reason: 'Identity resolution failed' }, { status: 500 });
    }

    const contactId = identity.contact_id;
    const conversationId = identity.conversation_id;

    // 3. PERSISTENCIA DE MENSAJE ENTRANTE (Memoria Neural Diamond v12.0)
    let incomingText = '';
    if (message.type === 'text') incomingText = message.text?.body || '';
    else if (message.type === 'interactive') incomingText = message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || 'Interaction';
    else if (message.type === 'order') incomingText = '🛒 Orden de Catálogo';

    if (incomingText) {
      await supabaseAdmin.from('messages').insert({
        conversation_id: conversationId,
        company_id: companyId,
        sender_type: 'user',
        content: incomingText,
        external_id: message.id
      });
    }

    // 4. Delegación de Responsabilidad Directa (Fallo Silent Failure Resuelto)
    if (message.type === 'order' && message.order) {

      await handleOrderMessage({
        order: message.order,
        sender,
        companyId,
        contactId,
        conversationId,
        whatsappToken,
        phoneNumberId
      });

      return NextResponse.json({ status: 'success', type: 'order_processed' }, { status: 200 });
    }

    // 4. Manejo de Otros Tipos (Texto, Interactivo, Flows)
    let contentText = '';
    let buttonId: string | undefined = undefined;

    if (message.type === 'text' && message.text) {
      contentText = message.text.body;
    } else if (message.type === 'interactive' && message.interactive) {
      const interactive = message.interactive;
      if (interactive.type === 'button_reply' && interactive.button_reply) {
        buttonId = interactive.button_reply.id;
        contentText = interactive.button_reply.title;
      } else if (interactive.type === 'list_reply' && interactive.list_reply) {
        buttonId = interactive.list_reply.id;
        contentText = interactive.list_reply.title;
      } else if (interactive.type === 'nfm_reply' && interactive.nfm_reply) {
         const responseJson = interactive.nfm_reply.response_json;
         if (responseJson) {
            // PROCESAMIENTO NEURAL DE FLOWS (v12.0)
            const isFlowProcessed = await handleFlowResponse({
               supabase: supabaseAdmin,
               responseJson,
               sender,
               companyId,
               messageId: message.id
            });

            if (isFlowProcessed) {
               return NextResponse.json({ status: 'success', type: 'flow_processed' }, { status: 200 });
            }

            try {
               const payload = typeof responseJson === 'string' ? JSON.parse(responseJson) : responseJson;
               contentText = `ACCION_CATALOGO: ${payload.category || 'N/A'}`;
            } catch (e) {
               contentText = String(responseJson);
            }
         }
      }
    }

    if (buttonId || contentText.includes('ACCION_CATALOGO:')) {
      // Ruteo de acciones (PDFs, Comandos, Catálogos de Flows, etc.)
      const isRouted = await handleActionRouting({
        buttonId,
        content: contentText,
        sender,
        companyId,
        whatsappToken,
        phoneNumberId
      });

      if (isRouted) {
        return NextResponse.json({ status: 'success', type: 'action_routed' }, { status: 200 });
      }
    }

    // 5. Invocación Nativa de la IA para texto general (Motor Migrado v12.0)
    if (contentText) {
       await generateAndSendAIResponse({
         content: contentText,
         companyId,
         contactId,
         conversationId,
         sender,
         phoneNumberId,
         whatsappToken
       });
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[WEBHOOK_FATAL_ERROR]', err.message);
    await logEvent({
      action: 'WEBHOOK_POST_CATCH_ERROR',
      details: { error: err.message, stack: err.stack }
    });
    // SIEMPRE respondemos 200 a Meta tras un error interno para detener el bucle de reintentos
    return NextResponse.json({ status: 'error_logged', reason: err.message }, { status: 200 });
  }
}
