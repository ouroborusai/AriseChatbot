import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = (process.env.ARISE_MASTER_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!;
export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getWhatsAppConfig(companyId: string) {
  const { data, error } = await supabase
    .from('companies')
    .select('settings')
    .eq('id', companyId)
    .single();

  if (error || !data?.settings?.whatsapp) {
    throw new Error(`[WHATSAPP_CONFIG_ERROR] No se encontró configuración válida para la empresa: ${companyId}`);
  }

  const { access_token, phone_number_id } = data.settings.whatsapp;

  if (!access_token || !phone_number_id) {
    throw new Error(`[WHATSAPP_CONFIG_ERROR] Credenciales incompletas en DB para la empresa: ${companyId}`);
  }

  return {
    token: access_token,
    phoneId: phone_number_id
  };

}

export async function resolveIdentity(sender: string) {
  // 1. Buscar contacto por teléfono
  const { data: contact } = await supabase
    .from('contacts')
    .select('id, company_id, full_name')
    .eq('phone', sender)
    .maybeSingle();

  if (contact) {
    return {
        contact_id: contact.id,
        company_id: contact.company_id,
        name: contact.full_name,
        conversation_id: `conv_${sender}` // Trazabilidad dinámica
    };
  }

  // 2. Fallback: Directorio Interno
  const { data: internal } = await supabase
    .from('internal_directory')
    .select('company_id, name')
    .eq('phone', sender)
    .maybeSingle();

  if (internal) {
    return { 
        contact_id: 'internal', 
        company_id: internal.company_id, 
        name: internal.name,
        conversation_id: `conv_${sender}`
    };
  }

  // 3. SuperAdmin Fallback (Seguimiento de Invitados v10.4)
  return { 
    contact_id: 'guest', 
    company_id: process.env.ARISE_MASTER_COMPANY_ID || 'ca69f43b-7b11-4dd3-abe8-8338580b2d84', 
    name: 'Usuario LOOP Nuevo',
    conversation_id: `conv_${sender}`
  };
}

/**
 * LOGGER INDUSTRIAL Diamond v10.2
 * Guarda eventos de depuración en la tabla audit_logs
 */
export async function logEvent(params: {
  companyId?: string;
  action: string;
  details?: any;
}) {

  console.log(`[EVENT] ${params.action}`, params.details || '');
  await supabase.from('audit_logs').insert({
    company_id: params.companyId,
    action: params.action,
    new_data: params.details || {},
    table_name: 'system_telemetry'
  });
}

/**
 * Envía un documento PDF a WhatsApp usando un mediaId existente (Caché/Shadow PDF)
 */
export async function sendWhatsAppDocument(params: {
  to: string;
  mediaId: string;
  filename: string;
  token: string;
  phoneId: string;
}) {
  const { to, mediaId, filename, token, phoneId } = params;
  const apiVersion = process.env.META_API_VERSION || 'v23.0';

  const res = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "document",
      document: {
        id: mediaId,
        filename
      }
    })
  });

  return res;
}
