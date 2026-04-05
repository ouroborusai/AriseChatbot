/**
 * Webhook Handler
 * Orquesta la lógica principal de procesamiento de mensajes
 */

import { getAIProvider, generateAssistantReply, getSystemPromptCached } from './ai-service';
import { sendWhatsAppMessage } from './whatsapp-service';
import {
  getOrCreateContact,
  getOrCreateConversation,
  saveMessage,
  getConversationHistory,
  isEchoFromOwnMessage,
  registerOutboundMessage,
} from './database-service';
import {
  InboundMessage,
  buildInboundDedupeKey,
  tryClaimInboundDedupe,
} from './dedupe-service';
import { digitsOnly } from './utils';

/**
 * Procesa un mensaje inbound de WhatsApp
 */
export async function handleInboundUserMessage(messageData: InboundMessage): Promise<void> {
  const msgId = messageData.id?.slice(0, 20) || 'sin-id';
  const msgType = messageData.type;
  const phoneNumber = messageData.from;
  const text = messageData.text?.body?.trim();

  console.log('[Handler] Mensaje recibido:', {
    id: msgId,
    type: msgType,
    from: phoneNumber?.slice(0, 8),
    textLen: text?.length ?? 0,
  });

  // ===== VALIDACIONES INICIALES =====
  
  if (msgType !== 'text') {
    console.log('[Handler] Ignorado: no es texto');
    return;
  }

  // Ignorar mensajes desde el número configurado (evita ecos)
  const ignoreFrom = process.env.WHATSAPP_IGNORE_INBOUND_FROM?.trim();
  if (ignoreFrom && phoneNumber && digitsOnly(phoneNumber) === digitsOnly(ignoreFrom)) {
    console.log('[Handler] Ignorado: es el número de sistema');
    return;
  }

  if (!text || !phoneNumber) {
    console.log('[Handler] Ignorado: falta texto o remitente');
    return;
  }

  // ===== DETECCIÓN DE ECOS =====
  
  const isEcho = await isEchoFromOwnMessage(phoneNumber, text);
  if (isEcho) {
    console.log('[Handler] ⚠️ LOOP EVITADO: Mensaje es eco del bot');
    return;
  }

  // ===== DEDUPLICACIÓN =====
  
  const dedupeKey = buildInboundDedupeKey(messageData, phoneNumber, text);
  const claimed = await tryClaimInboundDedupe(dedupeKey);
  
  if (!claimed) {
    console.log('[Handler] Ignorado: mensaje duplicado');
    return;
  }

  // ===== PROCESAMIENTO DE RESPUESTA =====
  
  console.log(`[Handler] Procesando: ${phoneNumber} → "${text.substring(0, 50)}..."`);

  try {
    // 1. Obtener o crear contacto
    const contact = await getOrCreateContact(phoneNumber);
    
    // 2. Obtener o crear conversación
    const conversationId = await getOrCreateConversation(phoneNumber, contact.id);
    
    // 3. Guardar mensaje del usuario
    await saveMessage(conversationId, 'user', text);
    
    // 4. Obtener historial
    const history = await getConversationHistory(phoneNumber);
    
    // 5. Generar respuesta con IA
    const systemPrompt = getSystemPromptCached();
    const aiProvider = getAIProvider();
    
    console.log(`[Handler] Llamando ${aiProvider} con ${history.length} mensajes previos`);
    const assistantResponse = await generateAssistantReply(systemPrompt, history, text);
    
    // 6. Enviar respuesta por WhatsApp
    await sendWhatsAppMessage(phoneNumber, assistantResponse);
    
    // 7. Guardar respuesta en BD (y registrar para detección de eco)
    await registerOutboundMessage(conversationId, assistantResponse);
    
    console.log('[Handler] ✓ Mensaje procesado exitosamente');
  } catch (err) {
    console.error('[Handler] Error procesando mensaje:', err);
    throw err;
  }
}
