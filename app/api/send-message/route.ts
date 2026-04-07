import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage, sendWhatsAppDocument, sendWhatsAppImage } from '@/lib/whatsapp-service';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { digitsOnly } from '@/lib/utils';

/**
 * POST /api/send-message
 * Envía un mensaje manual por WhatsApp y lo registra en la base de datos
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone_number, message, document_url, document_name, image_url, image_caption } = body;

    if (!phone_number || (!message && !document_url && !image_url)) {
      return NextResponse.json(
        { error: 'phone_number y message o document_url o image_url son requeridos' },
        { status: 400 }
      );
    }

    const normalizedPhone = digitsOnly(phone_number);

    // 1. Buscar o crear contacto
    const { data: existingContact } = await getSupabaseAdmin()
      .from('contacts')
      .select('id')
      .eq('phone_number', normalizedPhone)
      .maybeSingle();

    let contactId: string;
    if (existingContact) {
      contactId = existingContact.id;
      await getSupabaseAdmin()
        .from('contacts')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', existingContact.id);
    } else {
      const { data: newContact, error: contactError } = await getSupabaseAdmin()
        .from('contacts')
        .insert({
          phone_number: normalizedPhone,
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (contactError) {
        console.error('[SendMessage] Error creando contacto:', contactError);
        return NextResponse.json(
          { error: 'Failed to create contact' },
          { status: 500 }
        );
      }
      contactId = newContact.id;
    }

    // 2. Buscar o crear conversación
    const { data: existingConversation } = await getSupabaseAdmin()
      .from('conversations')
      .select('id')
      .eq('phone_number', normalizedPhone)
      .maybeSingle();

    let conversationId: string;
    if (existingConversation) {
      conversationId = existingConversation.id;
    } else {
      const { data: newConv, error: convError } = await getSupabaseAdmin()
        .from('conversations')
        .insert({
          phone_number: normalizedPhone,
          contact_id: contactId,
          is_open: true,
          first_response_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (convError) {
        console.error('[SendMessage] Error creando conversación:', convError);
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 }
        );
      }
      conversationId = newConv.id;
    }

    // 3. Enviar mensaje por WhatsApp
    let messageContent = message || 'Documento adjunto';

    if (image_url) {
      console.log('[SendMessage] Enviando imagen...');
      await sendWhatsAppImage(
        normalizedPhone,
        image_url,
        image_caption || message || 'Imagen enviada'
      );
      messageContent = message || image_caption || 'Imagen enviada';
    } else if (document_url) {
      console.log('[SendMessage] Enviando documento...');
      await sendWhatsAppDocument(
        normalizedPhone,
        document_url,
        document_name || 'documento.pdf',
        message || 'Documento solicitado'
      );
    } else {
      console.log('[SendMessage] Enviando mensaje de texto...');
      await sendWhatsAppMessage(normalizedPhone, message);
    }

    // 4. Guardar mensaje en base de datos
    const { error: msgError } = await getSupabaseAdmin()
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: messageContent,
      });

    if (msgError) {
      console.warn('[SendMessage] Error guardando mensaje:', msgError);
    }

    // 5. Actualizar conversación
    await getSupabaseAdmin()
      .from('conversations')
      .update({
        last_response_at: new Date().toISOString(),
        is_open: true,
      })
      .eq('id', conversationId);

    return NextResponse.json({
      success: true,
      conversation_id: conversationId,
      contact_id: contactId,
      sent_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[SendMessage] Error general:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
      { status: 500 }
    );
  }
}
