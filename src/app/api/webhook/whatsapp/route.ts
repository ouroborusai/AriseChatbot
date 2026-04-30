import { NextResponse } from 'next/server';
import { supabase, resolveIdentity, getWhatsAppConfig, logEvent } from '@/lib/webhook/utils';
import { handleActionRouting } from '@/lib/webhook/router';
import { generateAndSendAIResponse } from '@/lib/neural-engine/whatsapp';
import { handleOrderMessage } from '@/lib/webhook/handlers/order';

export const maxDuration = 60; // 60 segundos (Blindaje Diamond v10.2)

export async function POST(req: Request) {
  let body: any;
  let identity: any;
  try {
    body = await req.json();
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    if (!changes || !changes.messages) return NextResponse.json({ status: 'ignored' });

    const message = changes.messages[0];
    const sender = message.from;
    const buttonId = message.interactive?.button_reply?.id || message.interactive?.list_reply?.id;
    const content = message.text?.body || message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || '';

    // LOG DE SEGURIDAD v10.4
    await logEvent({ 
        companyId: process.env.ARISE_MASTER_COMPANY_ID || 'ca69f43b-7b11-4dd3-abe8-8338580b2d84', 
        action: 'RAW_MSG_CHECK', 
        details: { type: message.type, hasOrder: !!message.order } 
    });

    // BYPASS PLATINUM v10.4: Detección reforzada
    if (message.type === 'order' || message.order) {
        console.log('[WH_ORDER] Detectado pedido de catálogo');
        const success = await handleOrderMessage({
            order: message.order,
            sender,
            companyId: process.env.ARISE_MASTER_COMPANY_ID || 'ca69f43b-7b11-4dd3-abe8-8338580b2d84',
            whatsappToken: process.env.WHATSAPP_ACCESS_TOKEN!,
            phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!
        });
        if (success) return NextResponse.json({ status: 'order_processed_fast' });
    }

    // 1. Identificación Relámpago (E2: Mover al inicio)
    identity = await resolveIdentity(sender);

    if (!identity) {
      await logEvent({ companyId: process.env.ARISE_MASTER_COMPANY_ID || 'ca69f43b-7b11-4dd3-abe8-8338580b2d84', action: 'IDENTITY_NOT_FOUND', details: { sender } });
      return NextResponse.json({ status: 'unknown_sender' });
    }

    await logEvent({
      companyId: identity.company_id,
      action: 'WEBHOOK_RECEIVED',
      details: { sender, buttonId, content, fullPayload: body }
    });

    // 0. Registro en Base de Datos (Para activar Triggers)
    const { data: savedMsg } = await supabase.from('messages').insert({
        content,
        sender,
        type: message.type,
        company_id: identity.company_id // Enlace explícito
    }).select().single();

    const { token: whatsappToken, phoneId: waPhoneId } = await getWhatsAppConfig(identity.company_id);

    if (!whatsappToken || !waPhoneId) {
      await logEvent({ companyId: identity.company_id, action: 'CONFIG_MISSING_ABORTING' });
      return NextResponse.json({ error: 'Config error' }, { status: 500 });
    }

    // 2. Intento de Ruteo de Acción (PDF, etc)
    const actionTriggered = await handleActionRouting({
      buttonId,
      content,
      sender,
      companyId: identity.company_id,
      whatsappToken,
      phoneNumberId: waPhoneId
    });

    if (actionTriggered) {
      return NextResponse.json({ status: 'action_triggered' });
    }

    // 3. Fallback a IA (B1: Usar waitUntil para respuesta instantánea a Meta)
    await logEvent({ companyId: identity.company_id, action: 'FALLBACK_TO_AI' });
    
    // Iniciar generación de IA en segundo plano
    const aiPromise = generateAndSendAIResponse({
      content,
      companyId: identity.company_id,
      contactId: identity.contact_id,
      conversationId: identity.conversation_id,
      sender,
      phoneNumberId: waPhoneId,
      whatsappToken
    });

    return NextResponse.json({ status: 'ai_responded' });

  } catch (error: any) {
    console.error('[WH_ERROR]', error.message);
    const errorCompanyId = identity?.company_id || process.env.ARISE_MASTER_COMPANY_ID || 'ca69f43b-7b11-4dd3-abe8-8338580b2d84';
    await generateAndSendAIResponse({
      content: `⚠️ *LOOP Debug System 🟢*\n\nSe detectó un fallo crítico.\n*Error:* ${error.message}`,
      companyId: errorCompanyId,
      contactId: identity?.contact_id || 'error_logger',
      conversationId: identity?.conversation_id || 'error_trace',
      sender: body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
      whatsappToken: process.env.WHATSAPP_ACCESS_TOKEN!
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 });
    }
  }
  return new Response('Forbidden', { status: 403 });
}
