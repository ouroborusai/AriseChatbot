import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 🛡️ CONFIGURACIÓN DE INFRAESTRUCTURA DIAMOND v11.9.1
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = (process.env.ARISE_MASTER_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('[WEBHOOK_UTILS] Missing Supabase Infrastructure Keys');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

/**
 * Recupera la configuración de WhatsApp con Aislamiento Tenant Mandatorio.
 */
export async function getWhatsAppConfig(companyId: string): Promise<{ token: string; phoneId: string }> {
  const { data, error } = await supabase
    .from('companies')
    .select('settings')
    .eq('id', companyId)
    .single();

  if (error || !data?.settings) {
    throw new Error(`[WHATSAPP_CONFIG_ERROR] No se encontró configuración para la empresa: ${companyId}`);
  }

  const settings = data.settings as any; // Cast local controlado para settings JSON
  const whatsapp = settings.whatsapp;

  if (!whatsapp?.access_token || !whatsapp?.phone_number_id) {
    throw new Error(`[WHATSAPP_CONFIG_ERROR] Credenciales incompletas para la empresa: ${companyId}`);
  }

  return {
    token: whatsapp.access_token,
    phoneId: whatsapp.phone_number_id
  };
}

/**
 * Resuelve la identidad del remitente con Aislamiento Tenant y trazabilidad de conversación.
 */
export async function resolveIdentity(sender: string): Promise<{
  contact_id: string;
  company_id: string;
  name: string;
  conversation_id: string;
}> {
  // 1. Buscar contacto por teléfono (SSOT Contacts)
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
        conversation_id: `conv_${sender}`
    };
  }

  // 2. Fallback: Directorio Interno (Internal Team)
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

  // 3. SuperAdmin Fallback (Protocolo Guest v11.9.1)
  const masterCompany = process.env.ARISE_MASTER_COMPANY_ID || '';
  
  return { 
    contact_id: 'guest', 
    company_id: masterCompany, 
    name: 'Usuario Nuevo',
    conversation_id: `conv_${sender}`
  };
}

/**
 * LOGGER DE TELEMETRÍA DIAMOND
 * Registra eventos en audit_logs para auditoría centralizada.
 */
export async function logEvent(params: {
  companyId?: string;
  action: string;
  details?: Record<string, unknown>;
  tableName?: string;
}): Promise<void> {
  console.log(`[EVENT] ${params.action}`, params.details || '');
  
  try {
    await supabase.from('audit_logs').insert({
      company_id: params.companyId,
      action: params.action,
      new_data: params.details || {},
      table_name: params.tableName || 'system_telemetry'
    });
  } catch (err: unknown) {
    console.error('[LOG_EVENT_FAILURE]', (err as Error).message);
  }
}

/**
 * Envía un documento PDF a WhatsApp usando un mediaId existente.
 */
export async function sendWhatsAppDocument(params: {
  to: string;
  mediaId: string;
  filename: string;
  token: string;
  phoneId: string;
}): Promise<Response> {
  const { to, mediaId, filename, token, phoneId } = params;
  const apiVersion = process.env.META_API_VERSION || 'v21.0';
  const catalog_id = process.env.META_CATALOG_ID || '';

  return fetch(`https://graph.facebook.com/${apiVersion}/${phoneId}/messages`, {
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
}
