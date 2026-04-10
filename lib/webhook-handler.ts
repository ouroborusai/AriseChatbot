/**
 * Webhook Handler - Orquestación de handlers con sistema de condicionales
 */

import { getSupabaseAdmin } from './supabase-admin';
import { 
  sendWhatsAppMessage, 
} from './whatsapp-service';
import {
  getOrCreateContact,
  getOrCreateConversation,
  listCompaniesForContact,
  getActiveCompanyForConversation,
  saveMessage
} from './database-service';
import {
  Template,
  TemplateContext,
  Action,
} from '../app/components/templates/types';
import {
  evaluateTemplateRules,
  getFinalActions,
} from './handlers/condition-engine';

import { TemplateService } from './services/template-service';
import { NavigationService } from './services/navigation-service';
import { ContextService } from './services/context-service';
import { ActionService } from './services/action-service';

import { handleClassification, autoClassifyAsProspect } from './handlers/classification-handler';
import { handleDocumentButton, handlePeriodText, handleDocCategoryButton } from './handlers/documents-handler';
import { handleCompanyButton, handleCompanyText, autoSelectCompany } from './handlers/company-handler';
import { handleAI } from './handlers/ai-handler';

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

  console.log('🚀 WEBHOOK:', phoneNumber, '- Texto:', text?.slice(0, 30), '- Interactive:', interactive);

  if (!phoneNumber) return;

  const ignoreFrom = process.env.WHATSAPP_IGNORE_INBOUND_FROM?.trim();
  if (ignoreFrom && phoneNumber.includes(ignoreFrom)) return;

  try {
    const contact = await getOrCreateContact(phoneNumber);
    const conversationId = await getOrCreateConversation(phoneNumber, contact.id);
    const companies = await listCompaniesForContact(contact.id);
    let activeCompanyId = await getActiveCompanyForConversation(conversationId);

    const { data: conversationData } = await getSupabaseAdmin()
      .from('conversations')
      .select('chatbot_enabled')
      .eq('id', conversationId)
      .maybeSingle();

    if (conversationData?.chatbot_enabled === false) {
      console.log('[Webhook] Chatbot deshabilitado - modo manual');
      await saveMessage(conversationId, 'assistant', 'Modo manual activo.');
      return;
    }

    if (interactive) {
      await saveMessage(conversationId, 'user', `[button:${interactive}]`);
    } else if (text) {
      await saveMessage(conversationId, 'user', text);
    } else {
      return;
    }

    const context = await ContextService.buildContext(contact, companies, activeCompanyId, conversationId);
    const navState = NavigationService.createInitialState();

    if (interactive) {
      console.log('[Webhook] Procesando interactive button:', interactive);

      const handlers = [
        async () => {
          const res = await handleClassification(interactive, contact);
          if (res.handled && res.response) {
            await sendWhatsAppMessage(phoneNumber, res.response);
            const menuTemplate = await TemplateService.findTemplateById('menu_principal_cliente', contact.segment);
            if (menuTemplate) {
              await sendTemplateWithConditions(phoneNumber, menuTemplate, context, navState);
            } else {
              await sendWhatsAppMessage(phoneNumber, `¡Hola, ${contact.name || 'cliente'}! 👋 Soy el asistente virtual de MTZ Consultores. ¿En qué puedo ayudarte?`);
            }
            return true;
          }
          return false;
        },
        async () => (await handleCompanyButton(interactive, phoneNumber, conversationId, companies)).handled,
        async () => (await handleDocumentButton(interactive, phoneNumber, conversationId)).handled,
        async () => (await handleDocCategoryButton(interactive, phoneNumber, contact.id, activeCompanyId)).handled,
      ];

      for (const handler of handlers) {
        if (await handler()) return;
      }

      const nextTemplate = await TemplateService.findTemplateByActionId(interactive, contact.segment);
      if (nextTemplate) {
        await sendTemplateWithConditions(phoneNumber, nextTemplate, context, navState);
        return;
      }

      console.log('[Webhook] Interactive no manejado:', interactive, '- Evitando fallback de IA');
      return;
    }

    if (!contact.segment) {
      await autoClassifyAsProspect(contact);
      const prospectTemplate = await TemplateService.findTemplateById('bienvenida_prospecto', 'prospecto');
      if (prospectTemplate) {
        await sendTemplateWithConditions(phoneNumber, prospectTemplate, context, navState);
      } else {
        await sendWhatsAppMessage(phoneNumber, '¡Hola! 👋 Bienvenido a MTZ Consultores. ¿En qué podemos ayudarte?');
      }
      return;
    }

    if (text && isGreeting(text)) {
      const templateId = contact.segment === 'cliente' ? 'menu_principal_cliente' : 'bienvenida_prospecto';
      const greetingTemplate = await TemplateService.findTemplateById(templateId, contact.segment);
      if (greetingTemplate) {
        await sendTemplateWithConditions(phoneNumber, greetingTemplate, context, navState);
      } else {
        await sendWhatsAppMessage(phoneNumber, `¡Hola, ${contact.name || 'cliente'}! 👋 Soy el asistente virtual de MTZ Consultores. ¿En qué puedo ayudarte?`);
      }
      return;
    }

    if (text) {
      const matchedTemplate = await TemplateService.findTemplateByTrigger(text, contact.segment);
      if (matchedTemplate) {
        await sendTemplateWithConditions(phoneNumber, matchedTemplate, context, navState);
        return;
      }
    }

    if (!activeCompanyId && companies.length === 1) {
      activeCompanyId = await autoSelectCompany(conversationId, companies);
    }

    if (text) {
      const history = await ContextService.getConversationHistory(conversationId);
      const lastBtn = ContextService.getLastButtonFromHistory(history);

      if (lastBtn) {
        const periodResult = await handlePeriodText(
          text, lastBtn, phoneNumber, conversationId, contact.id, activeCompanyId
        );
        if (periodResult.handled) return;
      }
    }

    if (text && !interactive) {
      await handleAI(phoneNumber, conversationId, contact, companies, activeCompanyId, text);
    }

  } catch (error) {
    console.error('💥 ERROR en webhook:', error);
    throw error;
  }
}

async function sendTemplateWithConditions(
  phoneNumber: string,
  template: Template,
  context: TemplateContext,
  navState: any
): Promise<void> {
  console.log('[Webhook] Enviando template:', template.id);

  const { hasLoop } = NavigationService.recordVisit(template.id, navState);
  if (hasLoop) {
    console.warn('[Webhook] Loop detectado en template:', template.id);
    await sendWhatsAppMessage(phoneNumber, 'Parece que hay un problema con la navegación. Un asesor te contactará pronto.');
    return;
  }

  const ruleResult = evaluateTemplateRules(template, context);
  if (!ruleResult.isValid) {
    if (ruleResult.fallbackTemplateId) {
      const { exceededLimit } = NavigationService.incrementRedirect(navState);
      if (exceededLimit) {
        await sendWhatsAppMessage(phoneNumber, 'Hubo un problema. Un asesor te contactará pronto.');
        return;
      }

      const fallbackTemplate = await TemplateService.findTemplateById(ruleResult.fallbackTemplateId, context.contact.segment);
      if (fallbackTemplate) {
        await sendTemplateWithConditions(phoneNumber, fallbackTemplate, context, navState);
        return;
      }
    }
    await sendWhatsAppMessage(phoneNumber, template.content);
    return;
  }

  const content = TemplateService.replaceVariables(template.content, context);
  
  if (template.actions && template.actions.length > 0) {
    const handled = await sendTemplateActionsWithConditions(phoneNumber, template.actions, context, content);
    if (handled) return;
  }

  // Fallback: si no se ejecutó ninguna acción interactiva o prioritaria, enviar como texto plano
  await sendWhatsAppMessage(phoneNumber, content);
}

async function sendTemplateActionsWithConditions(
  phoneNumber: string,
  actions: Action[],
  context: TemplateContext,
  content: string
): Promise<boolean> {
  // 1. Intentar ejecutar acciones prioritarias (como show_document)
  const actionHandled = await ActionService.executeActions(phoneNumber, actions, context);
  if (actionHandled) return true;

  // 2. Obtener acciones finales filtradas por condiciones
  const { buttons, listAction, elseActions } = getFinalActions(actions, context);

  // 3. Si hay botones o listas, enviar respuesta interactiva y marcar como manejado
  if (buttons.length > 0 || listAction || elseActions.length > 0) {
    await ActionService.sendInteractiveResponse(phoneNumber, content, buttons, listAction, elseActions, context);
    return true;
  }

  return false;
}
