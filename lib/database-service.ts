/**
 * Database Service
 * Maneja todas las operaciones CRUD y deduplicación de WhatsApp
 */

import { getSupabaseAdmin } from './supabase-admin';
import { digitsOnly } from './utils';

export interface Contact {
  id: string;
  name?: string;
  email?: string;
  segment?: string;
  location?: string;
  last_message_at: string;
}

function normalizePhoneNumber(phone: string): string {
  return digitsOnly(phone);
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Obtiene o crea un contacto
 */
export async function getOrCreateContact(phoneNumber: string): Promise<Contact> {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const { data: existing, error: selectError } = await getSupabaseAdmin()
    .from('contacts')
    .select('id, name, email, segment, location, last_message_at')
    .eq('phone_number', normalizedPhone)
    .maybeSingle();
  
  if (selectError) {
    console.error('[DB] Error selecting contact:', selectError);
    throw selectError;
  }

  if (existing) {
    console.log('[DB] Found existing contact:', existing.id);
    
    // Actualizar last_message_at
    const { error: updateError } = await getSupabaseAdmin()
      .from('contacts')
      .update({ last_message_at: new Date().toISOString() })
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
      last_message_at: new Date().toISOString(),
    })
    .select('id, name, email, segment, location, last_message_at')
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
export async function getConversationHistory(phoneNumber: string): Promise<ConversationMessage[]> {
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
    .limit(10); // traer los últimos 10 mensajes (más recientes)
  
  if (msgError) {
    console.warn('[DB] Error fetching messages:', msgError);
    return [];
  }

  // Volver a orden cronológico ascendente para que la IA vea la conversación en orden correcto.
  const ordered = (messages || []).slice().reverse();

  return ordered.map((m) => ({
    role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
    content: m.content ?? '',
  }));
}

export interface ClientDocumentRow {
  id: string;
  contact_id: string;
  company_id?: string | null;
  title: string;
  description?: string | null;
  file_name?: string | null;
  file_url?: string | null;
  storage_bucket?: string | null;
  storage_path?: string | null;
  file_type?: string | null;
  created_at: string;
}

export async function getLatestClientDocuments(contactId: string, limit = 3): Promise<ClientDocumentRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('client_documents')
    .select('id, contact_id, company_id, title, description, file_name, file_url, storage_bucket, storage_path, file_type, created_at')
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

  // Buscar por coincidencia en title / description / file_name / storage_path
  let qb = getSupabaseAdmin()
    .from('client_documents')
    .select('id, contact_id, company_id, title, description, file_name, file_url, storage_bucket, storage_path, file_type, created_at')
    .eq('contact_id', contactId);
  if (companyId) qb = qb.eq('company_id', companyId);

  const { data, error } = await qb
    .or(`title.ilike.%${q}%,description.ilike.%${q}%,file_name.ilike.%${q}%,storage_path.ilike.%${q}%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('[DB] Error searching client documents:', error);
    return null;
  }

  return (data || null) as ClientDocumentRow | null;
}

export async function listCompaniesForContact(contactId: string): Promise<Array<{ id: string; legal_name: string }>> {
  const { data, error } = await getSupabaseAdmin()
    .from('contact_companies')
    .select('companies(id, legal_name)')
    .eq('contact_id', contactId);

  if (error) {
    console.warn('[DB] Error listing companies for contact:', error);
    return [];
  }

  const rows = (data || []) as Array<any>;
  return rows
    .map((r) => {
      const company = r.companies;
      if (Array.isArray(company)) {
        return company[0];
      }
      return company;
    })
    .filter(Boolean) as Array<{ id: string; legal_name: string }>;
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

/**
 * Guarda un mensaje en la conversación
 */
export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('messages')
    .insert({ conversation_id: conversationId, role, content });

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

