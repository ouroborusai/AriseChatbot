/**
 * Webhook Handler - Orquestación de lógica para WhatsApp
 * Agente MTZ - Consultores Tributarios
 */

import { getSupabaseAdmin } from './supabase-admin';
import { 
  sendWhatsAppMessage, 
  sendWhatsAppInteractiveButtons,
  sendWhatsAppDocument,
  sendWhatsAppListMessage 
} from './whatsapp-service';
import { 
  getOrCreateContact,
  getOrCreateConversation,
  listCompaniesForContact,
  getActiveCompanyForConversation,
  saveMessage, 
} from './database-service';

import { TemplateContext, Template } from '@/app/components/templates/types';
import { getFinalActions } from './services/condition-engine';
import { Contact, Company, HandlerResponse, BUTTON_IDS } from './types';
import { handleCompanyButton, handleCompanyText } from './handlers/company-handler';
import { handleDocumentButton, handleDocCategoryButton, handlePeriodText, DocumentsHandler } from './handlers/documents-handler';
import { handleClassification, autoClassifyAsProspect } from './handlers/classification-handler';
import { MenuHandler } from './handlers/menu-handler';
import { handleAI } from './handlers/ai-handler';
import { EmailService } from './services/email-service';
import { AppointmentHandler } from './handlers/appointment-handler';
import { TemplateService } from './services/template-service';
import { NavigationService } from './services/navigation-service';
import { ContextService } from './services/context-service';
import { ActionService } from './services/action-service';

/**
 * Procesa mensaje entrante de WhatsApp
 */
export async function handleInboundUserMessage(messageData: {
  from?: string;
  profileName?: string;
  text?: { body?: string };
  interactive?: { 
    button_reply?: { id?: string }; 
    list_reply?: { id?: string } 
  };
}): Promise<void> {
  const phoneNumber = messageData.from;
  const profileName = messageData.profileName;
  const text = messageData.text?.body?.trim();
  const interactive = messageData.interactive?.button_reply?.id || messageData.interactive?.list_reply?.id;

  if (!phoneNumber) return;

  // 1. Filtrar números ignorados
  const ignoreFrom = process.env.WHATSAPP_IGNORE_INBOUND_FROM?.trim();
  if (ignoreFrom && phoneNumber.includes(ignoreFrom)) return;

  try {
    console.log(`[Webhook] 📥 Entrando mensaje de: ${phoneNumber} (${profileName || 'Sin nombre'})`);
    
    // 2. Obtener Contexto Inicial
    const contact = await getOrCreateContact(phoneNumber, profileName);
    const conversationId = await getOrCreateConversation(phoneNumber, contact.id);
    const companies = await listCompaniesForContact(contact.id);
    let activeCompanyId = await getActiveCompanyForConversation(conversationId);

    // 3. Verificar si el Chatbot está habilitado
    const { data: convData } = await getSupabaseAdmin()
      .from('conversations')
      .select('chatbot_enabled')
      .eq('id', conversationId)
      .maybeSingle();

    const isBotEnabled = convData ? convData.chatbot_enabled !== false : true;
    if (!isBotEnabled) {
      console.log(`[Webhook] 👤 Modo Manual para ${phoneNumber}`);
      return;
    }

    // 4. Registrar Mensaje del Usuario (PRIORIDAD ALTA)
    try {
      if (interactive) {
        await saveMessage(conversationId, 'user', `[interactive:${interactive}]`);
      } else if (text) {
        await saveMessage(conversationId, 'user', text);
      }
      console.log(`[Webhook] ✅ Mensaje guardado en DB.`);
    } catch (saveErr) {
      console.warn('[Webhook] ⚠️ Error guardando en DB, continuando...', saveErr);
    }

    if (!text && !interactive) return;

    // 5. Construir Contexto
    const context = await ContextService.buildContext(contact, companies, activeCompanyId, conversationId);
    const navState = NavigationService.createInitialState();

    // 6. FLUJO DE PROCESAMIENTO
    if (interactive) {
      // Handlers de prioridad
      const classification = await handleClassification(interactive, contact);
      if (classification.handled) {
        if (classification.response) await sendWhatsAppMessage(phoneNumber, classification.response);
        await sendDefaultMenu(phoneNumber, contact.id, conversationId);
        return;
      }

      if ((await handleCompanyButton(interactive, phoneNumber, conversationId, companies)).handled) return;
      if ((await handleDocumentButton(interactive, phoneNumber, conversationId)).handled) return;
      
      const nextTemplate = await TemplateService.findTemplateByActionId(interactive, contact.segment || 'prospecto');
      if (nextTemplate) {
        await processTemplateResponse(phoneNumber, nextTemplate, context, navState);
        return;
      }
    }

    // Manejo de Saludos
    if (text) {
      const greetingHandler = new MenuHandler(context);
      if (greetingHandler.isGreeting(text)) {
        await sendDefaultMenu(phoneNumber, contact.id, conversationId);
        return;
      }

      const matchedTemplate = await TemplateService.findTemplateByTrigger(text, contact.segment || 'prospecto');
      if (matchedTemplate) {
        await processTemplateResponse(phoneNumber, matchedTemplate, context, navState);
        return;
      }

      // IA Fallback
    await handleAI(phoneNumber, conversationId, contact, companies, activeCompanyId, text);

  } catch (error: any) {
    console.error('💥 ERROR en Webhook:', error.message);
    // Enviar un saludo básico como último recurso
    try {
      await sendWhatsAppMessage(phoneNumber, '¡Hola! ☕ Recibí tu mensaje. En un momento te responderé.');
    } catch (e) {
      console.error('No se pudo enviar ni el saludo de error');
    }
  }
}

/**
 * Helper para enviar el menú por defecto
 */
async function sendDefaultMenu(phoneNumber: string, contactId: string, conversationId: string) {
  const { data: contact } = await getSupabaseAdmin().from('contacts').select('segment').eq('id', contactId).single();
  const segment = (contact?.segment || 'prospecto').toLowerCase();
  const templateId = segment === 'cliente' ? 'menu_principal_cliente' : 'bienvenida_prospecto';
  
  const template = await TemplateService.findTemplateById(templateId, segment);
  if (template) {
    const freshContext = await ContextService.buildContext({ id: contactId, segment } as any, [], null, conversationId);
    await processTemplateResponse(phoneNumber, template, freshContext, NavigationService.createInitialState());
  } else {
    await sendWhatsAppMessage(phoneNumber, 'Bienvenido a MTZ. Escribe "Menú" para ver mis opciones.');
  }
}

/**
 * Procesa la respuesta de una plantilla de forma segura
 */
async function processTemplateResponse(
  phoneNumber: string,
  template: Template,
  context: TemplateContext,
  navState: any
): Promise<void> {
  try {
    const content = TemplateService.replaceVariables(template.content, context);
    
    if (template.actions && template.actions.length > 0) {
      try {
        const handled = await ActionService.executeActions(phoneNumber, template.actions, context);
        if (handled) return;

        const { buttons, listAction, elseActions } = getFinalActions(template.actions, context);
        if (buttons.length > 0 || listAction || elseActions.length > 0) {
          await ActionService.sendInteractiveResponse(phoneNumber, content, buttons, listAction, elseActions, context);
          return;
        }
      } catch (e) {
        console.warn('[TemplateResponse] Error en acciones, fallback a texto:', e);
      }
    }
    await sendWhatsAppMessage(phoneNumber, content);
  } catch (err) {
    console.error('[TemplateResponse] Error crítico:', err);
    await sendWhatsAppMessage(phoneNumber, 'Estoy aquí para ayudarte. ¿Qué necesitas revisar hoy?');
  }
}
