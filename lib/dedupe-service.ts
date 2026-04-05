/**
 * Deduplication Service
 * Maneja la lógica de deduplicación de mensajes de WhatsApp
 */

import { getSupabaseAdmin } from './supabase-admin';

export interface InboundMessage {
  id?: string;
  from?: string;
  type?: string;
  timestamp?: string;
  text?: { body?: string };
}

/**
 * Construye una clave única para el mensaje basada en ID, timestamp y contenido
 */
export function buildInboundDedupeKey(
  messageData: InboundMessage,
  phoneNumber: string,
  text: string
): string {
  const id = messageData.id?.trim();
  if (id) return id;
  
  const ts = messageData.timestamp?.trim() || '0';
  const slice = text.trim().slice(0, 240);
  return `fb:${digitsOnly(phoneNumber)}:${ts}:${slice}`;
}

/**
 * Intenta reclamar un mensaje inbound vía RPC atómico o INSERT fallback
 * true = nuevo mensaje (procesar), false = duplicado (ignorar)
 */
export async function tryClaimInboundDedupe(dedupeKey: string): Promise<boolean> {
  const key = dedupeKey.trim();
  if (!key) {
    console.warn('[Dedupe] Clave de deduplicación vacía, permitiendo procesamiento');
    return true;
  }

  const admin = getSupabaseAdmin();

  // Intento 1: RPC atómico (recomendado, sin race conditions)
  const { data: claimed, error: rpcError } = await admin.rpc('claim_whatsapp_inbound', {
    p_wa_id: key,
  });

  if (!rpcError && typeof claimed === 'boolean') {
    if (!claimed) {
      console.log('[Dedupe] DUPLICADO DETECTADO (RPC):', key.slice(0, 60) + '...');
    } else {
      console.log('[Dedupe] Mensaje nuevo (RPC):', key.slice(0, 60) + '...');
    }
    return claimed;
  }

  console.error('[Dedupe] RPC claim_whatsapp_inbound falló:', {
    message: rpcError?.message,
    code: rpcError?.code,
  });

  // Fallback: INSERT directo con ON CONFLICT
  const { error: insertError } = await admin
    .from('processed_whatsapp_messages')
    .insert({ wa_message_id: key });

  if (!insertError) {
    console.log('[Dedupe] Mensaje nuevo (fallback INSERT):', key.slice(0, 60) + '...');
    return true;
  }

  // Error 23505 = unique violation (duplicado)
  if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
    console.log('[Dedupe] DUPLICADO DETECTADO (fallback):', key.slice(0, 60) + '...');
    return false;
  }

  // Error crítico: tabla no existe o RLS bloquea
  const msg = insertError.message || '';
  if (
    msg.includes('Could not find the table') ||
    msg.includes('does not exist') ||
    msg.includes('permission denied') ||
    msg.includes('RLS')
  ) {
    console.error(
      '[Dedupe] CRÍTICO: processed_whatsapp_messages no disponible.',
      'Ejecuta: supabase/schema.sql'
    );
    return true; // Permitir por seguridad
  }

  console.error('[Dedupe] Error inesperado:', insertError);
  return true; // Permitir por seguridad
}

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}
