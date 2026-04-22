import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  buildWhatsAppMessage,
  validateMessage,
  debugParse,
  type WhatsAppApiResponse,
} from '@/lib/whatsapp-parser';

/**
 * ARISE WHATSAPP SEND API v9.0
 * Envía mensajes interactivos con tipos TypeScript estrictos
 */
export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  try {
    const { contactId, content } = await req.json();

    if (!contactId || !content) {
      return NextResponse.json(
        { error: 'Parámetros requeridos: contactId y content' },
        { status: 400 }
      );
    }

    // 1. Obtener datos de empresa y contacto
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('phone, companies(id, settings)')
      .eq('id', contactId)
      .single();

    const company = Array.isArray(contact?.companies) 
      ? contact?.companies[0] 
      : (contact?.companies as any);

    if (contactError || !company?.settings?.whatsapp) {
      console.error('[WhatsApp Send] Contacto o configuración no encontrada');
      return NextResponse.json(
        { error: 'Configuración de WhatsApp no encontrada' },
        { status: 404 }
      );
    }

    const { access_token, phone_number_id } = company.settings.whatsapp;

    // 2. Buscar conversación activa
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_id', contactId)
      .maybeSingle();

    if (!conv) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      );
    }

    // 3. Validar contenido antes de enviar
    const validation = validateMessage(content);
    if (!validation.valid) {
      console.warn('[WhatsApp Send] Validación fallida:', validation.errors);
    }

    // 4. Debug parse (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      debugParse(content);
    }

    // 5. Construir mensaje con parser inteligente
    const waPayload = buildWhatsAppMessage(contact.phone, content);

    // 6. Enviar a WhatsApp API
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(waPayload),
      }
    );

    const result: WhatsAppApiResponse = await response.json();

    if (result.error) {
      console.error('[WhatsApp Send] Error de API:', result.error);
      throw new Error(result.error.message);
    }

    // 7. Registrar mensaje del agente
    await supabase.from('messages').insert({
      conversation_id: conv.id,
      sender_type: 'bot',
      content: content,
      metadata: {
        message_type: waPayload.type,
        interactive_count: waPayload.type === 'interactive'
          ? waPayload.interactive.type === 'button'
            ? waPayload.interactive.action.buttons.length
            : waPayload.interactive.action.sections.reduce((acc, s) => acc + s.rows.length, 0)
          : 0,
      },
    });

    return NextResponse.json({
      success: true,
      messageId: result.messages?.[0]?.id,
      messageType: waPayload.type,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[WhatsApp Send] Error:', err);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
