import { createClient } from '@supabase/supabase-js';
import { ICON_MAP, WHATSAPP_LIMITS, SYSTEM_STRINGS } from './constants';

function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Enriquece el texto con emojis basados en palabras clave.
 */
export function enrichText(text: string): string {
  // Regex más estricto para detectar si ya tiene emojis visuales reales
  const hasEmoji = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u.test(text);
  if (hasEmoji) return text;

  const key = Object.keys(ICON_MAP).find(k => text.toLowerCase().includes(k));
  // Si no hay match en el mapa, poner un rombo de opciones por defecto
  return key ? `${ICON_MAP[key]} ${text}` : `🔹 ${text}`;
}

/**
 * WHATSAPP SENDER v9.8
 * Maneja el envío de mensajes interactivos (Listas) y texto plano.
 */
export async function sendWhatsAppMessage(params: {
  to: string;
  text: string;
  options?: string[];
  phoneNumberId: string;
  whatsappToken: string;
  companyId: string;
}) {
  const supabase = createSupabaseClient();
  const { to, text, options, phoneNumberId, whatsappToken, companyId } = params;

  const textPart = text.substring(0, WHATSAPP_LIMITS.MAX_BODY_LENGTH);
  let payload: any = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: textPart }
  };

  if (options && options.length > 0) {
    // 1. Preparar las filas de la lista (respetando límites de WhatsApp)
    const safeOptions = options.slice(0, WHATSAPP_LIMITS.MAX_OPTIONS);
    const rows = safeOptions.map((o: string) => {
      const enriched = enrichText(o);
      const title = enriched.substring(0, WHATSAPP_LIMITS.MAX_TITLE_LENGTH);
      return {
        id: `lst_${title.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20)}`,
        title,
        description: o.length > WHATSAPP_LIMITS.MAX_TITLE_LENGTH ? o.substring(0, WHATSAPP_LIMITS.MAX_DESCRIPTION_LENGTH) : undefined
      };
    });

    // 2. Construir payload interactivo (Modo Lista Unificado)
    payload = {
      messaging_product: 'whatsapp', 
      to, 
      type: 'interactive',
      interactive: {
        type: 'list',
        header: { type: 'text', text: 'Loop Business OS' },
        body: { text: textPart },
        footer: { text: 'Cierra el ciclo de tus tareas con Loop' },
        action: {
          button: '📋 Ver Opciones',
          sections: [{ title: 'Acciones Sugeridas', rows }]
        }
      }
    };
  }

  const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${whatsappToken}`, 
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json();
    console.error('[WHATSAPP_LIB_ERROR]', errorData);

    // Fallback: Texto plano en caso de error
    await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${whatsappToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: `${textPart}\n\n(Opciones: ${options?.join(', ') || 'No disponibles'})` }
      })
    }).catch(e => console.error('[FALLBACK_LIB_ERROR]', e));

    await supabase.from('audit_logs').insert({
      company_id: companyId,
      action: 'WHATSAPP_DELIVERY_FAILURE',
      new_data: { error: errorData, payload }
    });
  }

  return res;
}
