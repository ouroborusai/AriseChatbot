import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../logger';

// 🛡️ CONFIGURACIÓN DE INFRAESTRUCTURA DIAMOND v12.0
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
    .eq('id', companyId.trim())
    .single();

  if (error) {
    throw new Error(`[WHATSAPP_CONFIG_ERROR] Error de base de datos para empresa ${companyId}: ${error.message}`);
  }

  if (!data?.settings) {
    throw new Error(`[WHATSAPP_CONFIG_ERROR] El campo 'settings' está vacío para la empresa: ${companyId}`);
  }

  const settings = data.settings as { whatsapp?: { access_token?: string, phone_number_id?: string } }; // Cast local controlado para settings JSON
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
export async function resolveIdentity(sender: string, bsuid: string | undefined, companyId: string): Promise<{
  contact_id: string;
  company_id: string;
  name: string;
  conversation_id: string;
}> {
  // Helper function para obtener o crear la conversación
  const getOrCreateConversation = async (contactId: string, compId: string) => {
    let { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_id', contactId)
      .eq('company_id', compId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (conv) return conv.id;
    
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({ contact_id: contactId, company_id: compId, status: 'open' })
      .select('id')
      .single();
      
    return newConv?.id || '00000000-0000-0000-0000-000000000000';
  };

  // 1. Prioridad: Buscar contacto por BSUID (Protocolo Meta 2026) con Tenant Isolation
  if (bsuid) {
    const { data: contactBsuid } = await supabase
      .from('contacts')
      .select('id, company_id, full_name')
      .eq('bsuid', bsuid)
      .eq('company_id', companyId)
      .maybeSingle();

    if (contactBsuid) {
      return {
        contact_id: contactBsuid.id,
        company_id: contactBsuid.company_id,
        name: contactBsuid.full_name,
        conversation_id: await getOrCreateConversation(contactBsuid.id, contactBsuid.company_id)
      };
    }
  }

  // 2. Fallback: Buscar contacto por teléfono (Legacy Identify)
  const { data: contact } = await supabase
    .from('contacts')
    .select('id, company_id, full_name, bsuid')
    .eq('phone', sender)
    .eq('company_id', companyId)
    .maybeSingle();

  if (contact) {
    // 🛡️ CRUCE NEURONAL META 2026: Guardar el BSUID nuevo en el perfil viejo si falta
    if (bsuid && !contact.bsuid) {
      await supabase.from('contacts').update({ bsuid }).eq('id', contact.id).eq('company_id', companyId);
      await logEvent({
        companyId,
        action: 'META_2026_BSUID_MERGE',
        details: { phone: sender, bsuid }
      });
    }

    return {
        contact_id: contact.id,
        company_id: contact.company_id,
        name: contact.full_name,
        conversation_id: await getOrCreateConversation(contact.id, contact.company_id)
    };
  }

  // 3. Fallback: Directorio Interno (Internal Team)
  const { data: internal } = await (bsuid 
    ? supabase.from('internal_directory').select('company_id, name').eq('bsuid', bsuid).eq('company_id', companyId).maybeSingle()
    : supabase.from('internal_directory').select('company_id, name').eq('phone', sender).eq('company_id', companyId).maybeSingle()
  );

  if (internal) {
    return { 
        contact_id: 'internal', 
        company_id: internal.company_id, 
        name: internal.name,
        conversation_id: await getOrCreateConversation('internal', internal.company_id)
    };
  }

  // 4. Auto-Creación de Lead (Eliminación de la vulnerabilidad Guest UUID)
  const { data: newLead } = await supabase
    .from('contacts')
    .insert({
      phone: sender,
      bsuid: bsuid || null,
      full_name: 'Nuevo Prospecto',
      company_id: companyId
    })
    .select('id')
    .single();

  if (newLead) {
    await logEvent({
      companyId,
      action: 'LEAD_AUTO_CREATED',
      details: { phone: sender, bsuid }
    });

    return { 
      contact_id: newLead.id, 
      company_id: companyId, 
      name: 'Nuevo Prospecto',
      conversation_id: await getOrCreateConversation(newLead.id, companyId)
    };
  }

  // Fallback absoluto si falla la inserción (No debería ocurrir)
  throw new Error('No se pudo crear el contacto en Supabase');
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
  logger.info(`[EVENT] ${params.action}`, 'TELEMETRY', params.details);
  
  try {
    await supabase.from('audit_logs').insert({
      company_id: params.companyId,
      action: params.action,
      new_data: params.details || {},
      table_name: params.tableName || 'system_telemetry'
    });
  } catch (err: unknown) {
    const error = err as Error;
    logger.error(`[LOG_EVENT_FAILURE] ${error.message}`, 'TELEMETRY');
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
  const apiVersion = process.env.META_API_VERSION || 'v23.0';
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
