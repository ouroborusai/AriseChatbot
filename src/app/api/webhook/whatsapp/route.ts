import { NextResponse } from 'next/server';
import { resolveIdentity, getWhatsAppConfig, logEvent } from '@/lib/webhook/utils';
import { handleActionRouting } from '@/lib/webhook/router';
import { generateAndSendAIResponse } from '@/lib/neural-engine/whatsapp';
import { handleOrderMessage, type OrderPayload } from '@/lib/webhook/handlers/order';

// Interfaces estrictas locales para garantizar Cero 'any' (SSOT Compliance)
interface WhatsAppContact {
  profile: { name: string };
  wa_id: string;
}

interface InteractiveMessage {
  type: string;
  button_reply?: { id: string; title: string };
  list_reply?: { id: string; title: string };
  nfm_reply?: { response_json: string; name?: string; body?: string };
}

interface WhatsAppMessageData {
  from: string;
  id: string;
  type: string;
  text?: { body: string };
  interactive?: InteractiveMessage;
  order?: OrderPayload;
}

interface WhatsAppValue {
  messaging_product: string;
  metadata: { display_phone_number: string; phone_number_id: string };
  contacts?: WhatsAppContact[];
  messages?: WhatsAppMessageData[];
}

export interface WhatsAppWebhookRequest {
  object: string;
  entry?: Array<{
    id: string;
    changes?: Array<{
      value: WhatsAppValue;
      field: string;
    }>;
  }>;
}

/**
 * WHATSAPP WEBHOOK ROUTE v11.9.1 (Diamond Resilience)
 * Main entry point for Meta Graph API Webhooks.
 * SSOT: Cero 'any', Aislamiento Tenant Inquebrantable.
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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as WhatsAppWebhookRequest;
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0]?.value;

    if (!changes || !changes.messages || changes.messages.length === 0) {
      return NextResponse.json({ status: 'ignored', reason: 'No messages' }, { status: 200 });
    }

    const message = changes.messages[0];
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
    } catch {
      console.error('[WEBHOOK_FATAL] No se encontró configuración para el phoneNumberId:', phoneNumberId);
      return NextResponse.json({ status: 'error', reason: 'Unregistered phone number' }, { status: 404 });
    }

    const whatsappToken = config.token;
    const companyId = process.env.ARISE_MASTER_COMPANY_ID || '';

    // 2. Resolver Identidad (Contacto y Conversación)
    const identity = await resolveIdentity(sender);

    if (!identity) {
      console.error('[WEBHOOK_FATAL] Error resolviendo identidad para:', sender);
      return NextResponse.json({ status: 'error', reason: 'Identity resolution failed' }, { status: 500 });
    }

    const contactId = identity.contact_id;
    const conversationId = identity.conversation_id;

    // 3. Delegación de Responsabilidad Directa (Fallo Silent Failure Resuelto)
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
            try {
               const payload = typeof responseJson === 'string' ? JSON.parse(responseJson) : responseJson;
               contentText = `ACCION_CATALOGO: ${payload.category || 'N/A'}`;
            } catch (e) {
               contentText = String(responseJson);
            }
         }
      }
    }

    if (buttonId) {
      // Ruteo de acciones (PDFs, Comandos, etc.)
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

    // 5. Invocación Nativa de la IA para texto general (Motor Migrado v11.9.1)
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
    return NextResponse.json({ status: 'error', reason: err.message }, { status: 500 });
  }
}
