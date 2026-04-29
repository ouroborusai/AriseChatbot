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

  if (error || !data?.settings) {
    return { token: process.env.WHATSAPP_ACCESS_TOKEN, phoneId: process.env.WHATSAPP_PHONE_NUMBER_ID };
  }

  return {
    token: data.settings.whatsapp?.access_token || process.env.WHATSAPP_ACCESS_TOKEN,
    phoneId: data.settings.whatsapp?.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID
  };

}

export async function resolveIdentity(sender: string) {
  // 1. Buscar contacto por teléfono
  const { data: contact } = await supabase
    .from('contacts')
    .select('id, company_id, name')
    .eq('phone', sender)
    .maybeSingle();

  if (contact) return contact;

  // 2. Fallback: Directorio Interno
  const { data: internal } = await supabase
    .from('internal_directory')
    .select('company_id, name')
    .eq('phone', sender)
    .maybeSingle();

  if (internal) return { id: null, company_id: internal.company_id, name: internal.name };

  // 3. SuperAdmin Fallback
  return { 
    id: null, 
    company_id: '77777777-7777-7777-7777-777777777777', // Arise Demo
    name: 'Usuario Nuevo' 
  };
}

/**
 * LOGGER INDUSTRIAL Diamond v10.2
 * Guarda eventos de depuración en la tabla audit_logs
 */
export async function logEvent(params: {
  companyId: string;
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
