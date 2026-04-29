import { NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { supabase, resolveIdentity, getWhatsAppConfig, logEvent } from '@/lib/webhook/utils';
import { handleActionRouting } from '@/lib/webhook/router';
import { generateAndSendAIResponse } from '@/lib/neural-engine/whatsapp';

export const maxDuration = 60; // 60 segundos (Blindaje Diamond v10.2)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.META_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    return new Response(challenge, { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
  return new Response('Forbidden', { status: 403 });
}


export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0]?.value;

    if (!changes || !changes.messages) {
      return NextResponse.json({ status: 'ignored' });
    }

    const message = changes.messages[0];
    const sender = message.from;
    const buttonId = message.interactive?.button_reply?.id || message.interactive?.list_reply?.id;
    const content = message.text?.body || message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || '';

    // 1. Identificación Relámpago (E2: Mover al inicio)
    const identity = await resolveIdentity(sender);

    // 2. LOG DE HIERRO: Asegurar persistencia con identidad resuelta
    await logEvent({
      companyId: identity.company_id,
      action: 'WEBHOOK_RECEIVED',
      details: { sender, buttonId, content, fullPayload: body }
    });

    // 0. Registro en Base de Datos (Para activar Triggers)
    const { data: savedMsg } = await supabase.from('messages').insert({
        content,
        sender_type: 'user',
        metadata: { 
            whatsapp_message_id: message.id,
            button_id: buttonId,
            type: message.type,
            company_id: identity.company_id // Enlace explícito
        }
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
    
    const aiPromise = generateAndSendAIResponse({
      content,
      companyId: identity.company_id,
      contactId: identity.id,
      conversationId: 'temp_conv',
      sender,
      phoneNumberId: waPhoneId,
      whatsappToken
    }).catch(async (err) => {
        await logEvent({ 
            companyId: identity.company_id, 
            action: 'FATAL_AI_RESPONSE_ERROR', 
            details: { error: err.message } 
        });
    });

    waitUntil(aiPromise);

    return NextResponse.json({ status: 'ai_responded' });

  } catch (error: any) {
    console.error('[WH_ERROR]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
