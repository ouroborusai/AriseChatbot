/**
 * Webhook Handler - Orquestación de handlers
 * Este archivo solo coordina, la lógica está en los handlers separados
 */

import { getSupabaseAdmin } from './supabase-admin';
import { sendWhatsAppMessage } from './whatsapp-service';
import { 
  getOrCreateContact, 
  getOrCreateConversation, 
  listCompaniesForContact, 
  getActiveCompanyForConversation,
  saveMessage 
} from './database-service';

// Handlers separados
import { handleClassification, autoClassifyAsProspect } from './handlers/classification-handler';
import { sendWelcomeMenu, handleMenuButton, isGreeting } from './handlers/menu-handler';
import { handleDocumentButton, handlePeriodText, handleDocCategoryButton } from './handlers/documents-handler';
import { handleCompanyButton, handleCompanyText, autoSelectCompany } from './handlers/company-handler';
import { handleAI } from './handlers/ai-handler';
import { HandlerContext } from './handlers/types';

/**
 * Procesa mensaje entrante de WhatsApp
 */
export async function handleInboundUserMessage(messageData: {
  from?: string;
  text?: { body?: string };
  interactive?: { button_reply?: { id?: string }; list_reply?: { id?: string } };
}): Promise<void> {
  const phoneNumber = messageData.from;
  const text = messageData.text?.body?.trim();
  const interactive = 
    messageData.interactive?.button_reply?.id || 
    messageData.interactive?.list_reply?.id;

  console.log('🚀 WEBHOOK:', phoneNumber, '- Texto:', text?.slice(0, 30));

  if (!phoneNumber) {
    console.log('❌ Ignorado: falta teléfono');
    return;
  }

  // Ignorar números del sistema
  const ignoreFrom = process.env.WHATSAPP_IGNORE_INBOUND_FROM?.trim();
  if (ignoreFrom && phoneNumber.includes(ignoreFrom)) {
    console.log('❌ Ignorado: número del sistema');
    return;
  }

  try {
    // 1. Obtener contacto y conversación
    const contact = await getOrCreateContact(phoneNumber);
    const conversationId = await getOrCreateConversation(phoneNumber, contact.id);

    // Empresas vinculadas
    const companies = await listCompaniesForContact(contact.id);
    let activeCompanyId = await getActiveCompanyForConversation(conversationId);

    // 2. Verificar si chatbot está habilitado
    const { data: conversationData } = await getSupabaseAdmin()
      .from('conversations')
      .select('chatbot_enabled')
      .eq('id', conversationId)
      .maybeSingle();

    const chatbotEnabled = conversationData?.chatbot_enabled !== false;
    if (!chatbotEnabled) {
      console.log('[Webhook] Chatbot deshabilitado - modo manual');
      await saveMessage(conversationId, 'assistant', 'Modo manual activo.');
      return;
    }

    // 3. Guardar mensaje del usuario
    if (text) {
      await saveMessage(conversationId, 'user', text);
    } else if (interactive) {
      await saveMessage(conversationId, 'user', `[button:${interactive}]`);
    } else {
      console.log('❌ Ignorado: mensaje sin texto ni interacción');
      return;
    }

    // 4. Si es interactive, procesar con handlers específicos
    if (interactive) {
      // Clasificación cliente/prospecto
      const classResult = await handleClassification(interactive, contact);
      if (classResult.handled && classResult.response) {
        await sendWhatsAppMessage(phoneNumber, classResult.response);
        await sendWelcomeMenu(phoneNumber, contact);
        return;
      }

      // Botones de empresa
      const companyResult = await handleCompanyButton(interactive, phoneNumber, conversationId, companies);
      if (companyResult.handled) return;

      // Botones de menú
      const menuResult = await handleMenuButton(interactive, phoneNumber, contact, companies, activeCompanyId);
      if (menuResult.handled) return;

      // Botones de documentos específicos (iva_xxx, renta_xxx)
      const docResult = await handleDocumentButton(interactive, phoneNumber, conversationId);
      if (docResult.handled) return;

      // Botones de categorías de documentos
      const catResult = await handleDocCategoryButton(interactive, phoneNumber, contact.id, activeCompanyId);
      if (catResult.handled) return;
    }

    // 5. Si no tiene segment, asignar prospecto automáticamente
    if (!contact.segment) {
      await autoClassifyAsProspect(contact);
      contact.segment = 'prospect';
      await sendWelcomeMenu(phoneNumber, contact);
      return;
    }

    // 6. Si es saludo, enviar menú
    if (text && isGreeting(text)) {
      await sendWelcomeMenu(phoneNumber, contact);
      return;
    }

    // 7. Auto-seleccionar empresa si solo tiene una
    if (!activeCompanyId && companies.length === 1) {
      activeCompanyId = await autoSelectCompany(conversationId, companies);
    }

    // 8. Si es cliente con múltiples empresas y no tiene selección, pedir empresa
    if (contact.segment === 'cliente' && companies.length > 1 && !activeCompanyId) {
      // Por ahora derivar a IA que pregunte
    }

    // 9. Verificar última acción para procesar períodos (IVA, Renta, etc.)
    if (text) {
      const history = await getConversationHistory(phoneNumber);
      const lastBtn = getLastButtonFromHistory(history);

      if (lastBtn) {
        const periodResult = await handlePeriodText(
          text, lastBtn, phoneNumber, conversationId, contact.id, activeCompanyId
        );
        if (periodResult.handled) return;
      }
    }

    // 10. Fallback a IA (Gemini)
    await handleAI(phoneNumber, conversationId, contact, companies, activeCompanyId, text || '');

  } catch (error) {
    console.error('💥 ERROR en webhook:', error);
    throw error;
  }
}

/**
 * Obtiene historial de conversación
 */
async function getConversationHistory(phoneNumber: string): Promise<Array<{ role: string; content: string }>> {
  const { getSupabaseAdmin } = await import('./supabase-admin');
  const { normalizePhoneNumber } = await import('./utils');

  const normalized = normalizePhoneNumber(phoneNumber);
  
  const { data: conv } = await getSupabaseAdmin()
    .from('conversations')
    .select('id')
    .eq('phone_number', normalized)
    .maybeSingle();

  if (!conv) return [];

  const { data: msgs } = await getSupabaseAdmin()
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conv.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return (msgs || []).reverse().map(m => ({
    role: m.role,
    content: m.content || '',
  }));
}

/**
 * Obtiene el último botón de la historia
 */
function getLastButtonFromHistory(history: Array<{ role: string; content: string }>): string | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const c = history[i]?.content || '';
    if (c.startsWith('[button:') && c.endsWith(']')) {
      return c.slice('[button:'.length, -1);
    }
  }
  return null;
}