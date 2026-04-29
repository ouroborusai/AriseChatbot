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
 * LOOP WHATSAPP SEND API v10.0
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
      return NextResponse.json(
        { error: 'Configuración de WhatsApp no encontrada' },
        { status: 404 }
      );
    }

    const { access_token, phone_number_id, catalog_id } = company.settings.whatsapp;
    const apiVersion = process.env.META_API_VERSION || 'v23.0';

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

    // Validar contenido antes de enviar
    const validation = validateMessage(content);
    if (!validation.valid && process.env.NODE_ENV === 'development') {
      debugParse(content);
    }

    // 5. Construir mensaje con parser inteligente
    const waPayload = buildWhatsAppMessage(contact.phone, content, catalog_id);

    // 6. Enviar a WhatsApp API
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

    const result: WhatsAppApiResponse = await response.json();

    if (result.error) {
      throw new Error(result.error.message);
    }

    // 7. Registrar mensaje del agente
    let interactiveCount = 0;
    if (waPayload.type === 'interactive') {
      if (waPayload.interactive.type === 'button') {
        interactiveCount = waPayload.interactive.action.buttons.length;
      } else if (waPayload.interactive.type === 'list') {
        interactiveCount = waPayload.interactive.action.sections.reduce((acc, s) => acc + s.rows.length, 0);
      } else {
        // Para catálogos o productos, el conteo es 1 o basado en los items
        interactiveCount = 1;
      }
    }

    await supabase.from('messages').insert({
      conversation_id: conv.id,
      sender_type: 'bot',
      content: content,
      metadata: {
        message_type: waPayload.type,
        interactive_count: interactiveCount,
      },
    });

    return NextResponse.json({
      success: true,
      messageId: result.messages?.[0]?.id,
      messageType: waPayload.type,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
