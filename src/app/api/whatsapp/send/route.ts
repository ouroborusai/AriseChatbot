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
      .maybeSingle();

    if (!conv) {
       return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
    }

    // 3. DIAMOND V7.9 UI SCALING (Advanced Parser for Agents)
    let payload: any = {
      messaging_product: "whatsapp",
      to: contact.phone,
      type: "text",
      text: { body: content }
    };

    if (content.includes('---') && content.includes('|')) {
      const lines = content.split('\n');
      const buttonLineIndex = lines.findIndex((l: any) => l.includes('|'));
      
      if (buttonLineIndex !== -1) {
        const rawOptions = lines[buttonLineIndex].replace(/---/g, '').trim();
        const options = rawOptions.split('|').map((o: string) => o.trim()).filter(o => o.length > 0);
        const bodyText = lines.filter((_: any, i: number) => i !== buttonLineIndex).join('\n').trim() || 'Elige una opción:';

        if (options.length > 0) {
          if (options.length <= 3) {
            payload = {
              messaging_product: 'whatsapp', to: contact.phone, type: 'interactive',
              interactive: {
                type: 'button',
                body: { text: bodyText.substring(0, 1024) },
                action: {
                  buttons: options.slice(0, 3).map((o, i) => ({
                    type: 'reply',
                    reply: { id: `agent_btn_${i}_${Date.now()}`, title: o.substring(0, 20).trim() }
                  }))
                }
              }
            };
          } else {
            payload = {
              messaging_product: 'whatsapp', to: contact.phone, type: 'interactive',
              interactive: {
                type: 'list',
                header: { type: 'text', text: 'Arise Operations' },
                body: { text: bodyText.substring(0, 1024) },
                footer: { text: 'Arise Agent Dispatch' },
                action: {
                  button: 'Ver Opciones',
                  sections: [{
                    title: 'Comandos Disponibles',
                    rows: options.slice(0, 10).map((o, i) => ({
                      id: `agent_act_${i}_${Date.now()}`,
                      title: o.substring(0, 20).trim(),
                      description: 'Acción de Agente'
                    }))
                  }]
                }
              }
            };
          }
        }
      }
    }

    // 4. Enviar a WhatsApp API
    const response = await fetch(`https://graph.facebook.com/v19.0/${phone_number_id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (result.error) throw new Error(result.error.message);

    // 5. Registrar mensaje del agente
    await supabase.from('messages').insert({
      conversation_id: conv.id,
      sender_type: 'agent',
      content: content
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
