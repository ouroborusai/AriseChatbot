/**
 * Webhook Handler Simplificado
 * Procesa mensajes de WhatsApp de forma básica
 */

import { generateAssistantReply, getSystemPromptCached } from './ai-service';
import { sendWhatsAppInteractiveButtons, sendWhatsAppMessage } from './whatsapp-service';
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
  interactive?: {
    type?: string;
    button_reply?: { id?: string; title?: string };
    list_reply?: { id?: string; title?: string };
  };
  button?: {
    text?: string;
    payload?: string;
  };
};

const WELCOME_KEYWORDS = ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'buenas', 'saludos'];

const WELCOME_BUTTONS = [
  { id: 'btn_orders', title: '📋 Ver pedidos' },
  { id: 'btn_support', title: '🆘 Soporte técnico' },
  { id: 'btn_promotions', title: '💰 Promociones' },
];

const PREDEFINED_RESPONSES: Array<{ keywords: string[]; response: string }> = [
  {
    keywords: ['horario', 'horarios', 'horas', 'abre', 'abierto'],
    response: 'Estamos abiertos de lunes a viernes de 9AM a 6PM, y sábados de 10AM a 2PM.',
  },
  {
    keywords: ['ubicación', 'donde', 'dirección', 'direccion', 'localización', 'localizacion'],
    response: 'Nos ubicamos en Calle Principal 123. ¿Quieres que te envíe la ubicación exacta?',
  },
  {
    keywords: ['precio', 'costo', 'tarifa', 'valor'],
    response: 'Nuestros precios comienzan en $10 y varían según el servicio. ¿Qué tipo de consulta necesitas?',
  },
  {
    keywords: ['promoción', 'promocion', 'oferta', 'descuento'],
    response: 'Tenemos promociones especiales esta semana. ¿Deseas ver las ofertas disponibles?',
  },
];

const HELP_KEYWORDS = ['ayuda', 'soporte', 'problema', 'reclamo', 'atención', 'humano'];

const BUTTON_REPLY_RESPONSES: Record<string, string> = {
  btn_orders: 'Para ver el estado de tu pedido, envíame el número de pedido o el nombre del producto.',
  btn_support: 'Cuéntame brevemente tu problema y te ayudo a resolverlo, o escribe "humano" para hablar con alguien.',
  btn_promotions: 'Estas son las promociones actuales: 20% de descuento en productos seleccionados. ¿Te interesa recibir el enlace?',
};

const HELP_BUTTONS = [
  { id: 'btn_orders', title: '📋 Ver pedidos' },
  { id: 'btn_support', title: '🆘 Soporte técnico' },
  { id: 'btn_promotions', title: '💰 Promociones' },
];

function normalizeMessage(message: string): string {
  return message.trim().toLowerCase();
}

function getPredefinedResponse(message: string): string | null {
  const normalized = normalizeMessage(message);
  for (const item of PREDEFINED_RESPONSES) {
    if (item.keywords.some((keyword) => normalized.includes(keyword))) {
      return item.response;
    }
  }
  return null;
}

function isHelpRequest(message: string): boolean {
  const normalized = normalizeMessage(message);
  return HELP_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function isGreeting(message: string): boolean {
  const normalized = normalizeMessage(message);
  return WELCOME_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function getButtonReplyResponse(buttonId?: string): string | null {
  if (!buttonId) return null;
  return BUTTON_REPLY_RESPONSES[buttonId] ?? null;
}

/**
 * Procesa un mensaje inbound de WhatsApp (versión simplificada)
 */
export async function handleInboundUserMessage(messageData: InboundMessage): Promise<void> {
  const msgId = messageData.id?.slice(0, 20) || 'sin-id';
  const msgType = messageData.type;
  const phoneNumber = messageData.from;
  const text = messageData.text?.body?.trim()
    || messageData.interactive?.button_reply?.title?.trim()
    || messageData.interactive?.list_reply?.title?.trim()
    || messageData.button?.text?.trim();
  const buttonReplyId = messageData.interactive?.button_reply?.id || messageData.interactive?.list_reply?.id || messageData.button?.payload;

  console.log('🚀 WEBHOOK: Mensaje recibido:', {
    msgId,
    msgType,
    phoneNumber,
    textLen: text?.length,
    buttonReplyId,
  });

  // Validaciones básicas
  if (!['text', 'interactive', 'button', 'list'].includes(msgType || '')) {
    console.log('❌ Ignorado: tipo de mensaje no soportado', msgType);
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

    const buttonReplyResponse = getButtonReplyResponse(buttonReplyId);
    if (buttonReplyResponse) {
      console.log('✨ Respuesta por botón detectada, evitando IA');
      await saveMessage(conversationId, 'assistant', buttonReplyResponse);
      console.log('✅ Mensaje asistente por botón guardado');
      try {
        await sendWhatsAppMessage(phoneNumber, buttonReplyResponse);
        console.log('✅ WhatsApp enviado (respuesta por botón)');
      } catch (whatsappError) {
        console.error('❌ Error WhatsApp botón:', whatsappError instanceof Error ? whatsappError.message : String(whatsappError));
      }
      return;
    }

    if (text && isGreeting(text)) {
      const welcomeMessage = 'Hola 👋 Bienvenido. Elige una opción rápida para comenzar:';
      console.log('✨ Saludo detectado, enviando bienvenida con botones');
      await saveMessage(conversationId, 'assistant', welcomeMessage);
      console.log('✅ Mensaje asistente de bienvenida guardado');
      try {
        await sendWhatsAppInteractiveButtons(phoneNumber, welcomeMessage, WELCOME_BUTTONS);
        console.log('✅ WhatsApp enviado (bienvenida con botones)');
      } catch (whatsappError) {
        console.error('❌ Error WhatsApp bienvenida con botones:', whatsappError instanceof Error ? whatsappError.message : String(whatsappError));
        const fallbackMessage = 'Hola 👋 Gracias por escribirnos. ¿En qué podemos ayudarte hoy?';
        await sendWhatsAppMessage(phoneNumber, fallbackMessage);
      }
      return;
    }

    if (text && isHelpRequest(text)) {
      const helpMessage = 'Elige una opción rápida:';
      console.log('✨ Respuesta de ayuda detectada, enviando menú de botones');
      await saveMessage(conversationId, 'assistant', helpMessage);
      console.log('✅ Mensaje asistente de ayuda guardado');
      try {
        await sendWhatsAppInteractiveButtons(phoneNumber, helpMessage, HELP_BUTTONS);
        console.log('✅ WhatsApp enviado (menú de botones)');
      } catch (whatsappError) {
        console.error('❌ Error WhatsApp menú de botones:', whatsappError instanceof Error ? whatsappError.message : String(whatsappError));
      }
      return;
    }

    const predefinedResponse = text ? getPredefinedResponse(text) : null;
    if (predefinedResponse) {
      console.log('✨ Respuesta predefinida detectada, evitando IA');
      await saveMessage(conversationId, 'assistant', predefinedResponse);
      console.log('✅ Mensaje asistente predefinido guardado');
      try {
        await sendWhatsAppMessage(phoneNumber, predefinedResponse);
        console.log('✅ WhatsApp enviado (respuesta predefinida)');
      } catch (whatsappError) {
        console.error('❌ Error WhatsApp predefinido:', whatsappError instanceof Error ? whatsappError.message : String(whatsappError));
      }
      return;
    }

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
