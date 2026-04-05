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

  console.log('═══════════════════════════════════════════════════════');
  console.log('[Handler] ▶️ INICIANDO PROCESAMIENTO DE MENSAJE');
  console.log('[Handler] Mensaje recibido:', {
    id: msgId,
    type: msgType,
    from: phoneNumber?.slice(0, 8),
    textLen: text?.length ?? 0,
  });
  console.log('═══════════════════════════════════════════════════════');

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
    console.log('[Handler] PASO 1: Obteniendo/creando contacto...');
    const contact = await getOrCreateContact(phoneNumber);
    console.log('[Handler] ✓ PASO 1 OK:', contact.id);
    
    // 2. Obtener o crear conversación
    console.log('[Handler] PASO 2: Obteniendo/creando conversación...');
    const conversationId = await getOrCreateConversation(phoneNumber, contact.id);
    console.log('[Handler] ✓ PASO 2 OK:', conversationId);
    
    // 3. Guardar mensaje del usuario
    console.log('[Handler] PASO 3: Guardando mensaje del usuario...');
    await saveMessage(conversationId, 'user', text);
    console.log('[Handler] ✓ PASO 3 OK');
    
    // 4. Obtener historial
    console.log('[Handler] PASO 4: Obteniendo historial...');
    const history = await getConversationHistory(phoneNumber);
    console.log('[Handler] ✓ PASO 4 OK: ' + history.length + ' mensajes');
    
    // 5. Generar respuesta con IA
    console.log('[Handler] PASO 5: Generando respuesta de IA...');
    const systemPrompt = getSystemPromptCached();
    const aiProvider = getAIProvider();
    
    console.log(`[Handler] Llamando ${aiProvider} con ${history.length} mensajes previos`);
    const assistantResponse = await generateAssistantReply(systemPrompt, history, text);
    console.log('[Handler] ✓ PASO 5 OK: respuesta generada');
    
    // 6. Enviar respuesta por WhatsApp
    console.log('[Handler] PASO 6: Enviando a WhatsApp...');
    let messageSent = false;
    try {
      await sendWhatsAppMessage(phoneNumber, assistantResponse);
      messageSent = true;
      console.log('[Handler] ✓ PASO 6 OK: Mensaje enviado a WhatsApp');
    } catch (whatsappErr) {
      console.error('[Handler] ✗ PASO 6 FALLO: Error enviando a WhatsApp:', whatsappErr);
      throw whatsappErr;
    }
    
    // 7. Guardar si se envió exitosamente
    console.log('[Handler] PASO 7: Registrando mensaje de salida...');
    if (messageSent) {
      try {
        await registerOutboundMessage(conversationId, assistantResponse);
        console.log('[Handler] ✓ PASO 7 OK: Respuesta guardada en BD');
      } catch (dbErr) {
        console.warn('[Handler] ⚠️ PASO 7 PARCIAL: Enviado pero no guardado en BD:', dbErr);
      }
    }
    
    console.log('[Handler] ✓ PROCESADO EXITOSAMENTE');
  } catch (err) {
    console.error('[Handler] ❌ ERROR PROCESANDO MENSAJE:', err);
    if (err instanceof Error) {
      console.error('[Handler] Error message:', err.message);
      console.error('[Handler] Error stack:', err.stack);
    }
    throw err;
  }
}
