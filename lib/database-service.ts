/**
 * Database Service
 * Maneja todas las operaciones CRUD y deduplicación de WhatsApp
 */

import { getSupabaseAdmin } from './supabase-admin';

export interface Contact {
  id: string;
  name?: string;
  email?: string;
  segment?: string;
  location?: string;
  last_message_at: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Obtiene o crea un contacto
 */
export async function getOrCreateContact(phoneNumber: string): Promise<Contact> {
  const { data: existing, error: selectError } = await getSupabaseAdmin()
    .from('contacts')
    .select('id, name, email, segment, location, last_message_at')
    .eq('phone_number', phoneNumber)
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
      phone_number: phoneNumber,
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
  const { data: existing, error: selectError } = await getSupabaseAdmin()
    .from('conversations')
    .select('id')
    .eq('phone_number', phoneNumber)
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
      phone_number: phoneNumber,
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
 * Obtiene el historial de conversación (últimos 20 mensajes)
 */
export async function getConversationHistory(phoneNumber: string): Promise<ConversationMessage[]> {
  const { data: conversation } = await getSupabaseAdmin()
    .from('conversations')
    .select('id')
    .eq('phone_number', phoneNumber)
    .single();

  if (!conversation) return [];

  const { data: messages } = await getSupabaseAdmin()
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true })
    .limit(20);

  return (messages || []).map((m) => ({
    role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
    content: m.content ?? '',
  }));
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
 * Detecta si un inbound es un eco de un mensaje saliente reciente
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
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  
  const { data: recentMessages } = await getSupabaseAdmin()
    .from('messages')
    .select('content, created_at')
    .eq('conversation_id', conversationId)
    .eq('role', 'assistant')
    .gte('created_at', tenMinutesAgo)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!recentMessages || recentMessages.length === 0) {
    return false;
  }

  const inboundNormalized = inboundText.trim().toLowerCase();
  for (const msg of recentMessages) {
    const contentNormalized = (msg.content ?? '').trim().toLowerCase();
    if (contentNormalized === inboundNormalized) {
      console.log('[DB] Echo detectado: inbound coincide con mensaje asistente reciente');
      return true;
    }
  }

  return false;
}

/**
 * Limpia registros antiguos de deduplicación (>7 días)
 */
export async function cleanupOldDedupeRecords(): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .rpc('exec_sql', {
      sql: `DELETE FROM processed_whatsapp_messages WHERE created_at < NOW() - INTERVAL '7 days'`,
    });

  if (error) {
    console.log('[DB] Cleanup dedupe failed (normal):', error.message);
  }
}
