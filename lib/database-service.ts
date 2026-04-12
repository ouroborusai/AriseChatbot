/**
 * Database Service
 * Maneja todas las operaciones CRUD y deduplicación de WhatsApp
 */

import { getSupabaseAdmin } from './supabase-admin';
import { digitsOnly } from './utils';
import { 
  Contact, 
  Company, 
  ClientDocument as ClientDocumentRow,
  ServiceRequest,
  Message,
} from './types';

function normalizePhoneNumber(phone: string): string {
  return digitsOnly(phone);
}

/**
 * Limpia el nombre del perfil de WhatsApp para que no sea excesivamente largo 
 * (ej: "Juan Pérez MTZ TQF" -> "Juan")
 */
function sanitizeName(name?: string): string {
  if (!name || name.trim() === '') return 'cliente';
  
  // Limpiar caracteres especiales y emojis básicos
  const clean = name.trim().split(' ')[0];
  
  // Capitalizar formato (ej: JUAN -> Juan)
  if (clean.length > 0) {
    return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  }
  
  return 'cliente';
}

/**
 * Genera un código de ticket único para seguimientos
 */
function generateRequestCode(type: string): string {
  const prefix = type === 'quote' ? 'COT' : type === 'document' ? 'DOC' : 'REQ';
  const short = Math.random().toString(36).slice(2, 7).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${timestamp}-${short}`;
}

/**
 * Obtiene o crea un contacto
 */
export async function getOrCreateContact(phoneNumber: string, profileName?: string): Promise<Contact> {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const { data: existing, error: selectError } = await getSupabaseAdmin()
    .from('contacts')
    .select('id, name, email, segment, location, last_message_at, phone_number')
    .eq('phone_number', normalizedPhone)
    .maybeSingle();
  
  if (selectError) {
    console.error('[DB] Error selecting contact:', selectError);
    throw selectError;
  }

  if (existing) {
    console.log('[DB] Found existing contact:', existing.id);
    
    // Actualizar last_message_at (y el nombre si no lo tenía)
    const updates: any = { last_message_at: new Date().toISOString() };
    const cleanProfileName = sanitizeName(profileName);
    
    if (profileName && (!existing.name || existing.name === 'cliente' || existing.name === 'prospecto')) {
      updates.name = cleanProfileName;
      existing.name = cleanProfileName;
    }

    const { error: updateError } = await getSupabaseAdmin()
      .from('contacts')
      .update(updates)
      .eq('id', existing.id);
    
    if (updateError) {
      console.warn('[DB] Error updating contact timestamp:', updateError);
    }
    
    return existing;
  }

  const { data: newContact, error } = await getSupabaseAdmin()
    .from('contacts')
    .insert({
      phone_number: normalizedPhone,
      name: sanitizeName(profileName),
      last_message_at: new Date().toISOString(),
    })
    .select('id, name, email, segment, location, last_message_at, phone_number')
    .single();

  if (error) {
    console.error('[DB] Error creating contact:', error);
    throw error;
  }

  console.log('[DB] Created new contact:', newContact.id);
  return newContact;
}

/**
 * Obtiene o crea una conversación
 */
export async function getOrCreateConversation(phoneNumber: string, contactId: string): Promise<string> {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const { data: existing, error: selectError } = await getSupabaseAdmin()
    .from('conversations')
    .select('id')
    .eq('phone_number', normalizedPhone)
    .maybeSingle();
  
  if (selectError) {
    console.error('[DB] Error selecting conversation:', selectError);
    throw selectError;
  }

  if (existing) {
    console.log('[DB] Found existing conversation:', existing.id);
    
    // Actualizar metadatos
    const { data: msgCount } = await getSupabaseAdmin()
      .from('messages')
      .select('id')
      .eq('conversation_id', existing.id);
    
    await getSupabaseAdmin()
      .from('conversations')
      .update({
        contact_id: contactId,
        last_response_at: new Date().toISOString(),
        message_count: (msgCount || []).length,
      })
      .eq('id', existing.id);
    
    return existing.id;
  }

  const { data: newConv, error } = await getSupabaseAdmin()
    .from('conversations')
    .insert({
      phone_number: normalizedPhone,
      contact_id: contactId,
      is_open: true,
      first_response_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('[DB] Error creating conversation:', error);
    throw error;
  }

  console.log('[DB] Created new conversation:', newConv.id);
  return newConv.id;
}

/**
 * Obtiene el historial completo de conversación
 */
export async function getConversationHistory(phoneNumber: string): Promise<Pick<Message, 'role' | 'content'>[]> {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const { data: conversation, error: convError } = await getSupabaseAdmin()
    .from('conversations')
    .select('id')
    .eq('phone_number', normalizedPhone)
    .maybeSingle();
  
  if (convError) {
    console.warn('[DB] Error fetching conversation:', convError);
    return [];
  }

  if (!conversation) return [];

  const { data: messages, error: msgError } = await getSupabaseAdmin()
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: false })
    .limit(25); // Traer últimos 25 para más contexto
  
  if (msgError) {
    console.warn('[DB] Error fetching messages:', msgError);
    return [];
  }

  // Volver a orden cronológico ascendente
  const ordered = (messages || []).slice().reverse();

  return ordered.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content ?? '',
  }));
}

export async function getLatestClientDocuments(contactId: string, limit = 3): Promise<ClientDocumentRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('client_documents')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('[DB] Error fetching client documents:', error);
    return [];
  }

  return (data || []) as ClientDocumentRow[];
}

export async function findLatestClientDocumentByQuery(
  contactId: string,
  query: string,
  companyId?: string | null
): Promise<ClientDocumentRow | null> {
  const q = query.trim();
  if (!q) return null;

  let queryBuilder = getSupabaseAdmin()
    .from('client_documents')
    .select('*')
    .eq('contact_id', contactId);
  
  if (companyId) {
    queryBuilder = queryBuilder.eq('company_id', companyId);
  }

  const { data, error } = await queryBuilder
    .or(`title.ilike.%${q}%,description.ilike.%${q}%,file_name.ilike.%${q}%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('[DB] Error searching client documents:', error);
    return null;
  }

  return (data || null) as ClientDocumentRow | null;
}

export async function listCompaniesForContact(contactId: string): Promise<Company[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('contact_companies')
    .select(`
      companies (
        id,
        legal_name,
        rut,
        segment,
        metadata,
        created_at,
        updated_at
      )
    `)
    .eq('contact_id', contactId);

  if (error) {
    console.warn('[DB] Error listing companies for contact:', error);
    return [];
  }

  return (data || [])
    .map((r: any) => r.companies)
    .filter(Boolean) as Company[];
}

export async function setActiveCompanyForConversation(conversationId: string, companyId: string | null): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('conversations')
    .update({ active_company_id: companyId })
    .eq('id', conversationId);
  if (error) {
    console.warn('[DB] Error setting active_company_id:', error);
  }
}

export async function getActiveCompanyForConversation(conversationId: string): Promise<string | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('conversations')
    .select('active_company_id')
    .eq('id', conversationId)
    .maybeSingle();
  if (error) return null;
  return (data?.active_company_id as string | null) ?? null;
}

export async function setChatbotEnabled(conversationId: string, enabled: boolean): Promise<boolean> {
  const { error } = await getSupabaseAdmin()
    .from('conversations')
    .update({ chatbot_enabled: enabled })
    .eq('id', conversationId);
  
  if (error) {
    console.error('[DB] Error toggling chatbot:', error);
    return false;
  }
  return true;
}

export async function getChatbotEnabled(conversationId: string): Promise<boolean> {
  const { data, error } = await getSupabaseAdmin()
    .from('conversations')
    .select('chatbot_enabled')
    .eq('id', conversationId)
    .maybeSingle();
  
  if (error || !data) return true; // default enabled
  return data.chatbot_enabled !== false;
}

export async function createServiceRequest(
  contactId: string,
  conversationId: string,
  requestType: string,
  description: string,
  companyId?: string | null
): Promise<ServiceRequest | null> {
  const requestCode = generateRequestCode(requestType);
  
  console.log('[DB] Creating service request:', { requestCode, requestType, contactId, conversationId, companyId });
  
  const { data, error } = await getSupabaseAdmin()
    .from('service_requests')
    .insert({
      request_code: requestCode,
      contact_id: contactId,
      conversation_id: conversationId,
      company_id: companyId || null,
      request_type: requestType,
      description,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) {
    console.error('[DB] Error creating service request:', error.message, error.details, error.hint);
    return null;
  }

  console.log('[DB] Service request created:', data?.id);
  return data as ServiceRequest;
}

export async function getServiceRequestsForContact(contactId: string): Promise<ServiceRequest[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('service_requests')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[DB] Error fetching service requests:', error);
    return [];
  }

  return (data || []) as ServiceRequest[];
}

export async function getServiceRequestByCode(requestCode: string): Promise<ServiceRequest | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('service_requests')
    .select('*')
    .eq('request_code', requestCode)
    .maybeSingle();

  if (error) {
    console.warn('[DB] Error fetching service request by code:', error);
    return null;
  }

  return (data || null) as ServiceRequest | null;
}

export async function updateServiceRequestStatus(
  requestCode: string,
  status: ServiceRequest['status'],
  resultUrl?: string | null
): Promise<boolean> {
  const { error } = await getSupabaseAdmin()
    .from('service_requests')
    .update({ status, result_url: resultUrl || null })
    .eq('request_code', requestCode);

  if (error) {
    console.error('[DB] Error updating service request status:', error);
    return false;
  }

  return true;
}

/**
 * Guarda un mensaje en la conversación
 */
export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  whatsappId?: string
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('messages')
    .insert({ 
      conversation_id: conversationId, 
      role, 
      content,
      whatsapp_id: whatsappId || null 
    });

  if (error) {
    console.error('[DB] Error saving message:', error);
    throw error;
  }
  
  console.log(`[DB] Saved ${role} message for conversation ${conversationId}`);
}

/**
 * Intenta registrar un mensaje saliente (para detección de eco)
 */
export async function registerOutboundMessage(
  conversationId: string,
  messageText: string
): Promise<void> {
  try {
    await saveMessage(conversationId, 'assistant', messageText);
    console.log('[DB] Outbound message registered for anti-loop');
  } catch (err) {
    console.warn('[DB] Failed to register outbound message:', err);
    // No fallar si no se puede registrar
  }
}

/**
 * Detecta si un inbound es eco: contenido igual + timestamp reciente (5 segundos)
 */
export async function isEchoFromOwnMessage(phoneNumber: string, inboundText: string): Promise<boolean> {
  const { data: conversationResult, error: selectError } = await getSupabaseAdmin()
    .from('conversations')
    .select('id')
    .eq('phone_number', phoneNumber)
    .maybeSingle();

  if (!conversationResult) return false;
  
  if (selectError) {
    console.warn('[DB] Error checking for echo:', selectError);
    return false;
  }

  const conversationId = conversationResult.id;
  // Solo buscar respuestas muy recientes (30 segundos)
  const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
  
  const { data: recentMessages, error: msgError } = await getSupabaseAdmin()
    .from('messages')
    .select('content, created_at')
    .eq('conversation_id', conversationId)
    .eq('role', 'assistant')
    .gte('created_at', thirtySecondsAgo)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (msgError) {
    console.warn('[DB] Error fetching recent messages for echo:', msgError);
    return false;
  }

  if (!recentMessages || recentMessages.length === 0) {
    return false;
  }

  // Echo = contenido exacto + enviado hace menos de 5 segundos
  const inboundNormalized = inboundText.trim().toLowerCase();
  const nowMs = Date.now();
  const ECHO_THRESHOLD_MS = 5000;
  
  for (const msg of recentMessages) {
    const contentNormalized = (msg.content ?? '').trim().toLowerCase();
    const msgTimeMs = new Date(msg.created_at).getTime();
    const timeDiff = nowMs - msgTimeMs;
    
    if (contentNormalized === inboundNormalized && timeDiff < ECHO_THRESHOLD_MS) {
      console.log(`[DB] Echo detectado: contenido idéntico hace ${timeDiff}ms`);
      return true;
    }
  }

  return false;
}

