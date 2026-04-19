import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { contactId, content } = await req.json();

  try {
    // 1. Obtener datos de empresa y contacto
    const { data: contact } = await supabase
      .from('contacts')
      .select('*, companies(id, settings)')
      .eq('id', contactId)
      .single();

    if (!contact || !contact.companies?.settings?.whatsapp) {
      return NextResponse.json({ error: 'Configuración de WhatsApp no encontrada' }, { status: 404 });
    }

    const { access_token, phone_number_id } = contact.companies.settings.whatsapp;

    // 2. Buscar conversación activa
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_id', contactId)
      .eq('status', 'waiting_human')
      .single();

    if (!conv) {
       return NextResponse.json({ error: 'La conversación no está en modo Handoff Manual' }, { status: 403 });
    }

    // 3. Enviar a WhatsApp API
    const response = await fetch(`https://graph.facebook.com/v17.0/${phone_number_id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: contact.phone,
        type: "text",
        text: { body: content }
      })
    });

    const result = await response.json();
    if (result.error) throw new Error(result.error.message);

    // 4. Registrar mensaje del agente
    await supabase.from('messages').insert({
      conversation_id: conv.id,
      sender_type: 'agent',
      content: content
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
