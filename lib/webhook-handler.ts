/**
 * Webhook Handler Simplificado
 * Procesa mensajes de WhatsApp de forma básica
 */

import { generateAssistantReply, getSystemPromptCached } from './ai-service';
import { sendWhatsAppMessage } from './whatsapp-service';
import {
  getOrCreateContact,
  getOrCreateConversation,
  saveMessage,
  getConversationHistory,
} from './database-service';

type InboundMessage = {
  id?: string;
  from?: string;
  type?: string;
  text?: { body?: string };
};

/**
 * Procesa un mensaje inbound de WhatsApp (versión simplificada)
 */
export async function handleInboundUserMessage(messageData: InboundMessage): Promise<void> {
  const msgId = messageData.id?.slice(0, 20) || 'sin-id';
  const msgType = messageData.type;
  const phoneNumber = messageData.from;
  const text = messageData.text?.body?.trim();

  console.log('🚀 WEBHOOK: Mensaje recibido:', { msgId, msgType, phoneNumber, textLen: text?.length });

  // Validaciones básicas
  if (msgType !== 'text') {
    console.log('❌ Ignorado: no es texto');
    return;
  }

  if (!text || !phoneNumber) {
    console.log('❌ Ignorado: falta texto o teléfono');
    return;
  }

  // Ignorar números del sistema
  const ignoreFrom = process.env.WHATSAPP_IGNORE_INBOUND_FROM?.trim();
  if (ignoreFrom && phoneNumber.includes(ignoreFrom)) {
    console.log('❌ Ignorado: número del sistema');
    return;
  }

  try {
    // 1. Contacto
    console.log('📞 Paso 1: Buscando/creando contacto...');
    const contact = await getOrCreateContact(phoneNumber);
    console.log('✅ Contacto OK:', contact.id);

    // 2. Conversación
    console.log('💬 Paso 2: Buscando/creando conversación...');
    const conversationId = await getOrCreateConversation(phoneNumber, contact.id);
    console.log('✅ Conversación OK:', conversationId);

    // 3. Guardar mensaje usuario
    console.log('💾 Paso 3: Guardando mensaje usuario...');
    await saveMessage(conversationId, 'user', text);
    console.log('✅ Mensaje usuario guardado');

    // 4. Obtener historial
    console.log('📚 Paso 4: Obteniendo historial...');
    const history = await getConversationHistory(phoneNumber);
    console.log('✅ Historial obtenido:', history.length, 'mensajes');

    // 5. Generar respuesta IA
    console.log('🤖 Paso 5: Generando respuesta IA...');
    const systemPrompt = await getSystemPromptCached();
    const aiResponse = await generateAssistantReply(systemPrompt, history, text);
    console.log('✅ Respuesta IA generada');

    // 6. Guardar respuesta bot
    console.log('💾 Paso 6: Guardando respuesta bot...');
    await saveMessage(conversationId, 'assistant', aiResponse);
    console.log('✅ Respuesta bot guardada');

    // 7. Enviar por WhatsApp (opcional - puede fallar)
    console.log('📤 Paso 7: Enviando por WhatsApp...');
    try {
      await sendWhatsAppMessage(phoneNumber, aiResponse);
      console.log('✅ WhatsApp enviado');
    } catch (whatsappError) {
      console.error('❌ Error WhatsApp (continuando):', whatsappError instanceof Error ? whatsappError.message : String(whatsappError));
    }

    console.log('🎉 PROCESAMIENTO COMPLETADO');

  } catch (error) {
    console.error('💥 ERROR GENERAL:', error);
    throw error;
  }
}
