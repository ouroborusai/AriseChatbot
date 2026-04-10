/**
 * Webhook Handler - Orquestación de handlers
 * Este archivo solo coordina, la lógica está en los handlers separados
 */

import { getSupabaseAdmin } from './supabase-admin';
import { sendWhatsAppMessage, sendWhatsAppInteractiveButtons, sendWhatsAppListMessage } from './whatsapp-service';
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

    // 6b. Buscar plantilla por trigger
    if (text) {
      const matchedTemplate = await findTemplateByTrigger(text, contact.segment);
      if (matchedTemplate && matchedTemplate.actions && matchedTemplate.actions.length > 0) {
        await sendWhatsAppMessage(phoneNumber, matchedTemplate.content);
        await sendTemplateActions(phoneNumber, matchedTemplate.actions);
        return;
      }
    }

    // 6c. Si es interactive (button o list) y tiene next_template, navegar
    if (interactive) {
      const nextTemplate = await findTemplateByActionId(interactive, contact.segment);
      if (nextTemplate) {
        await sendWhatsAppMessage(phoneNumber, nextTemplate.content);
        if (nextTemplate.actions && nextTemplate.actions.length > 0) {
          await sendTemplateActions(phoneNumber, nextTemplate.actions);
        }
        return;
      }
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

/**
 * Busca plantilla que coincida con el trigger
 */
async function findTemplateByTrigger(text: string, segment?: string | null): Promise<{
  id: string;
  content: string;
  actions: Array<{ type: string; id: string; title: string; description?: string }>;
} | null> {
  const lowerText = text.toLowerCase().trim();
  
  const { data: templates } = await getSupabaseAdmin()
    .from('templates')
    .select('id, content, actions, trigger, segment, is_active, priority')
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .limit(10);

  if (!templates) return null;

  for (const t of templates) {
    if (!t.trigger) continue;
    
    const triggers = t.trigger.split(',').map((s: string) => s.trim().toLowerCase());
    if (triggers.some((tr: string) => lowerText.includes(tr))) {
      if (t.segment && t.segment !== 'todos' && t.segment !== segment) continue;
      return { id: t.id, content: t.content, actions: t.actions || [] };
    }
  }
  return null;
}

/**
 * Envía las acciones de una plantilla (buttons o list)
 */
async function sendTemplateActions(
  phoneNumber: string,
  actions: Array<{ type: string; id: string; title: string; description?: string }>
): Promise<void> {
  if (actions.length === 0) return;

  const listAction = actions.find(a => a.type === 'list');
  if (listAction) {
    let options: Array<{ id: string; title: string; description?: string }> = [];
    try {
      if (listAction.description) {
        options = JSON.parse(listAction.description);
      }
    } catch {
      options = [];
    }
    
    if (options.length > 0) {
      await sendWhatsAppListMessage(phoneNumber, {
        body: 'Selecciona una opción:',
        buttonText: listAction.title || 'Ver opciones',
        sections: [{
          title: 'Opciones',
          rows: options.map(o => ({
            id: o.id,
            title: o.title,
            description: o.description
          }))
        }]
      });
      return;
    }
  }

  const buttonActions = actions.filter(a => a.type === 'button');
  if (buttonActions.length > 0) {
    const buttons = buttonActions.map(a => ({
      id: a.id,
      title: a.title
    }));
    await sendWhatsAppInteractiveButtons(phoneNumber, 'Selecciona una opción:', buttons);
  }
}

/**
 * Busca plantilla que tenga una acción con el ID dado
 */
async function findTemplateByActionId(actionId: string, segment?: string | null): Promise<{
  id: string;
  content: string;
  actions: Array<{ type: string; id: string; title: string; description?: string; next_template_id?: string }>;
} | null> {
  const { data: templates } = await getSupabaseAdmin()
    .from('templates')
    .select('id, content, actions, segment, is_active, priority')
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .limit(20);

  if (!templates) return null;

  for (const t of templates) {
    if (!t.actions || t.actions.length === 0) continue;
    if (t.segment && t.segment !== 'todos' && t.segment !== segment) continue;

    const matchedAction = t.actions.find((a: any) => a.id === actionId);
    if (matchedAction && matchedAction.next_template_id) {
      const { data: nextTemplate } = await getSupabaseAdmin()
        .from('templates')
        .select('id, content, actions')
        .eq('id', matchedAction.next_template_id)
        .eq('is_active', true)
        .maybeSingle();

      if (nextTemplate) {
        return { id: nextTemplate.id, content: nextTemplate.content, actions: nextTemplate.actions || [] };
      }
    }
  }
  return null;
}