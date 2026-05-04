import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  buildWhatsAppMessage,
} from '@/lib/whatsapp-parser';

/**
 *  ARISE WHATSAPP SEND API v12.0 (Diamond Resilience)
 *  Endpoint de despacho manual y automatizado con Aislamiento Tenant RLS.
 *  Cero 'any'. 
 */
export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  try {
    const { contactId, content } = (await req.json()) as { contactId: string; content: string };

    if (!contactId || !content) {
      return NextResponse.json(
        { error: 'Incomplete_Request: contactId and content required' },
        { status: 400 }
      );
    }

    // 1. Recuperación de Contexto con Aislamiento Tenant (RLS Habilitado)
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('phone, company_id, companies!inner(id, settings)')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: 'Access_Denied: Contact or Company configuration not found' },
        { status: 404 }
      );
    }

    const company = contact.companies as any;
    const whatsapp = company?.settings?.whatsapp;

    if (!whatsapp?.access_token || !whatsapp?.phone_number_id) {
      return NextResponse.json(
        { error: 'Infrastructure_Failure: WhatsApp credentials missing for this tenant' },
        { status: 404 }
      );
    }

    const { access_token, phone_number_id, catalog_id } = whatsapp;
    const apiVersion = process.env.META_API_VERSION || 'v21.0';

    // 2. Localización de Conversación (Tenant Guard)
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_id', contactId)
      .eq('company_id', contact.company_id) // 🛡️ AISLAMIENTO TENANT OBLIGATORIO
      .maybeSingle();

    if (convError || !conv) {
      return NextResponse.json({ error: 'Conversation_Isolation_Failure' }, { status: 404 });
    }

    // 3. Construcción de Payload Meta (Parser v12.0)
    const waPayload = buildWhatsAppMessage(contact.phone, content, catalog_id);

    // 4. Despacho a Meta Graph API (v21.0 Hardened)
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(waPayload),
      }
    );

    const result = (await response.json()) as any;

    if (result.error) {
      throw new Error(`Meta_API_Error: ${result.error.message}`);
    }

    // 5. Registro de Mensaje y Telemetría Diamond
    const { error: insertError } = await supabase.from('messages').insert({
      conversation_id: conv.id,
      company_id: contact.company_id,
      sender_type: 'bot',
      content: content,
      metadata: {
        message_type: waPayload.type,
        meta_id: result.messages?.[0]?.id,
        processed_at: new Date().toISOString()
      },
    });


    if (insertError) {
      console.warn('[DB_SYNC_WARNING]', insertError.message);
    }

    // Auditoría Centralizada
    await supabase.from('audit_logs').insert({
      company_id: contact.company_id,
      action: 'WHATSAPP_MESSAGE_SENT',
      new_data: { type: waPayload.type, meta_id: result.messages?.[0]?.id }
    });

    return NextResponse.json({
      success: true,
      messageId: result.messages?.[0]?.id,
      messageType: waPayload.type,
    });

  } catch (err: unknown) {
    const error = err as Error;
    console.error('[WHATSAPP_SEND_FAILURE]', error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
