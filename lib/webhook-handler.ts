/**
 * Webhook Handler - Versión Simplificada con Gemini
 * La IA maneja las respuestas directamente, solo mantenemos saludos y detección de ayuda humana
 */

import { generateAssistantReply, getSystemPromptCached } from './ai-service';
import { sendWhatsAppMessage } from './whatsapp-service';
import { getOrCreateContact, getOrCreateConversation, saveMessage, getConversationHistory } from './database-service';

type InboundMessage = {
  id?: string;
  from?: string;
  type?: string;
  text?: { body?: string };
  interactive?: {
    type?: string;
    button_reply?: { id?: string; title?: string };
    list_reply?: { id?: string; title?: string };
  };
};

const WELCOME_KEYWORDS = ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'buenas', 'saludos'];
const HUMAN_KEYWORDS = ['humano', 'asesor', 'urgente', 'multa', 'fiscalización', 'fiscalizacion', 'sii', 'demanda', 'reclamo'];

function normalizeMessage(message: string): string {
  return message.trim().toLowerCase();
}

function isGreeting(message: string): boolean {
  const normalized = normalizeMessage(message);
  return WELCOME_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function wantsHumanAgent(message: string): boolean {
  const normalized = normalizeMessage(message);
  return HUMAN_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

/**
 * Procesa un mensaje inbound de WhatsApp - Gemini maneja casi todo
 */
export async function handleInboundUserMessage(messageData: InboundMessage): Promise<void> {
  const phoneNumber = messageData.from;
  const text = messageData.text?.body?.trim();

  console.log('🚀 WEBHOOK: Mensaje de', phoneNumber, '- Texto:', text?.slice(0, 50));

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
    // 1. Contacto y conversación
    const contact = await getOrCreateContact(phoneNumber);
    const conversationId = await getOrCreateConversation(phoneNumber, contact.id);

    // 2. Guardar mensaje del usuario
    await saveMessage(conversationId, 'user', text);

    // 3. ¿Quiere hablar con humano?
    if (wantsHumanAgent(text)) {
      const humanMessage = 'Entiendo. Un asesor de MTZ te contactará pronto. ¿Cuál es tu número de contacto?';
      await saveMessage(conversationId, 'assistant', humanMessage);
      await sendWhatsAppMessage(phoneNumber, humanMessage);
      console.log('✅ Derivado a humano');
      return;
    }

    // 4. Saludo inicial - Gemini responde con bienvenida personalizada
    if (isGreeting(text)) {
      const systemPrompt = await getSystemPromptCached();
      const history = await getConversationHistory(phoneNumber);
      const aiResponse = await generateAssistantReply(systemPrompt, history, text);
      await saveMessage(conversationId, 'assistant', aiResponse);
      await sendWhatsAppMessage(phoneNumber, aiResponse);
      console.log('✅ Saludo respondido por Gemini');
      return;
    }

    // 5. Respuesta normal con Gemini (usa historial para contexto)
    const systemPrompt = await getSystemPromptCached();
    const history = await getConversationHistory(phoneNumber);
    const aiResponse = await generateAssistantReply(systemPrompt, history, text);

    await saveMessage(conversationId, 'assistant', aiResponse);
    await sendWhatsAppMessage(phoneNumber, aiResponse);

    console.log('✅ Respuesta Gemini enviada');

  } catch (error) {
    console.error('💥 ERROR:', error);
    throw error;
  }
}
