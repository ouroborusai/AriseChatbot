/**
 * Webhook Handler - Orquestación de lógica para WhatsApp
 * Agente MTZ - Consultores Tributarios
 */

import { getSupabaseAdmin } from './supabase-admin';
import { sendWhatsAppMessage } from './whatsapp-service';
import {
  getOrCreateContact,
  getOrCreateConversation,
  listCompaniesForContact,
  getActiveCompanyForConversation,
  saveMessage,
} from './database-service';

import { TemplateContext, Template } from '@/app/components/templates/types';
import { evaluateTemplateRules, getFinalActions } from '@/lib/services/condition-engine';
import { TemplateService } from '@/lib/services/template-service';
import { NavigationService } from '@/lib/services/navigation-service';
import { ContextService } from '@/lib/services/context-service';
import { ActionService } from '@/lib/services/action-service';

import { handleClassification, autoClassifyAsProspect } from './handlers/classification-handler';
import { handleDocumentButton, handlePeriodText, handleDocCategoryButton } from './handlers/documents-handler';
import { handleCompanyButton, handleCompanyText, autoSelectCompany } from './handlers/company-handler';
import { handleAI } from './handlers/ai-handler';
import { MenuHandler } from './handlers/menu-handler';

/**
 * Procesa mensaje entrante de WhatsApp
 */
export async function handleInboundUserMessage(messageData: {
  from?: string;
  text?: { body?: string };
  interactive?: { 
    button_reply?: { id?: string }; 
    list_reply?: { id?: string } 
  };
}): Promise<void> {
  const phoneNumber = messageData.from;
  const text = messageData.text?.body?.trim();
  const interactive = messageData.interactive?.button_reply?.id || messageData.interactive?.list_reply?.id;

  if (!phoneNumber) return;

  // 1. Filtrar números ignorados (ej: el del propio bot si hay eco)
  const ignoreFrom = process.env.WHATSAPP_IGNORE_INBOUND_FROM?.trim();
  if (ignoreFrom && phoneNumber.includes(ignoreFrom)) return;

  try {
    // 2. Obtener Contexto Inicial
    const contact = await getOrCreateContact(phoneNumber);
    const conversationId = await getOrCreateConversation(phoneNumber, contact.id);
    const companies = await listCompaniesForContact(contact.id);
    let activeCompanyId = await getActiveCompanyForConversation(conversationId);

    // 3. Verificar si el Chatbot está habilitado
    const { data: conversationData } = await getSupabaseAdmin()
      .from('conversations')
      .select('chatbot_enabled')
      .eq('id', conversationId)
      .maybeSingle();

    if (conversationData?.chatbot_enabled === false) {
      console.log(`[Webhook] Chatbot desactivado para ${phoneNumber} (Modo Manual)`);
      return;
    }

    // 4. Registrar Mensaje del Usuario
    if (interactive) {
      const tag = messageData.interactive?.button_reply ? 'button' : 'list';
      await saveMessage(conversationId, 'user', `[${tag}:${interactive}]`);
    } else if (text) {
      await saveMessage(conversationId, 'user', text);
    } else {
      return; 
    }

    // 5. Construir Contexto para Handlers y Plantillas
    const context = await ContextService.buildContext(contact, companies, activeCompanyId, conversationId);
    const navState = NavigationService.createInitialState();

    // 6. FLUJO DE PROCESAMIENTO
    
    // 6a. Manejo de Botones/Listas Interactivas
    if (interactive) {
      console.log(`[Webhook] 🖱️ Interactive: ${interactive}`);

      // Handlers de prioridad (Clasificación, Empresas, Documentos)
      const classification = await handleClassification(interactive, contact);
      if (classification.handled) {
        if (classification.response) await sendWhatsAppMessage(phoneNumber, classification.response);
        await sendDefaultMenu(phoneNumber, contact.id, conversationId);
        return;
      }

      if ((await handleCompanyButton(interactive, phoneNumber, conversationId, companies)).handled) return;
      if ((await handleDocumentButton(interactive, phoneNumber, conversationId)).handled) return;
      if ((await handleDocCategoryButton(interactive, phoneNumber, contact.id, activeCompanyId)).handled) return;

      // Buscar si el ID del botón corresponde a una plantilla específica
      const nextTemplate = await TemplateService.findTemplateByActionId(interactive, contact.segment || 'prospecto');
      if (nextTemplate) {
        await processTemplateResponse(phoneNumber, nextTemplate, context, navState);
        return;
      }
      
      console.warn(`[Webhook] ⚠️ Botón no reconocido: ${interactive}`);
      // FALLBACK: Enviar menú principal para evitar que el usuario quede sin respuesta
      await sendDefaultMenu(phoneNumber, contact.id, conversationId);
      return;
    }

    // 6b. Manejo de Nuevos Usuarios (Auto-clasificación)
    if (!contact.segment) {
      console.log('[Webhook] 📌 Nuevo usuario detectado, clasificando como prospecto');
      await autoClassifyAsProspect(contact);
      contact.segment = 'prospecto'; // Actualizar en memoria
      const welcome = await TemplateService.findTemplateById('bienvenida_prospecto', 'prospecto');
      console.log('[Webhook] 📌 Plantilla bienvenida_prospecto encontrada:', !!welcome);
      if (welcome) {
        await processTemplateResponse(phoneNumber, welcome, context, navState);
        return;
      }
      console.log('[Webhook] ⚠️ NO se encontró plantilla bienvenida_prospecto');
    }

    // 6c. Manejo de Saludos y Triggers de Texto
    if (text) {
      console.log('[Webhook] 📝 Mensaje texto:', text.substring(0, 50));
      const greetingHandler = new MenuHandler(context);
      if (greetingHandler.isGreeting(text)) {
        console.log('[Webhook] 👋 Es saludo, enviando menú por defecto');
        await sendDefaultMenu(phoneNumber, contact.id, conversationId);
        return;
      }

      // Buscar triggers (palabras clave)
      const matchedTemplate = await TemplateService.findTemplateByTrigger(text, contact.segment || 'prospecto');
      if (matchedTemplate) {
        await processTemplateResponse(phoneNumber, matchedTemplate, context, navState);
        return;
      }

      // Manejo de entrada de datos (ej: RUTs, Períodos) basado en el contexto previo
      const history = await ContextService.getConversationHistory(conversationId);
      const lastBtn = ContextService.getLastButtonFromHistory(history);
      if (lastBtn) {
        const periodResult = await handlePeriodText(text, lastBtn, phoneNumber, conversationId, contact.id, activeCompanyId);
        if (periodResult.handled) return;
      }
      
      const companyTextResult = await handleCompanyText(text, phoneNumber, conversationId, companies);
      if (companyTextResult.handled) return;
    }

    // 6d. ÚLTIMO RECURSO: IA (Gemini)
    if (text && !interactive) {
      await handleAI(phoneNumber, conversationId, contact, companies, activeCompanyId, text);
    } else if (interactive) {
      // Si el botón no fue reconocido y no hay texto, enviar menú principal por seguridad
      await sendDefaultMenu(phoneNumber, contact.id, conversationId);
    }

  } catch (error) {
    console.error('💥 ERROR en WebhookHandler:', error);
    // Intentar informar al usuario en caso de error crítico
    if (phoneNumber) {
      await sendWhatsAppMessage(phoneNumber, 'Lo siento, tuve un problema interno. Un asesor de MTZ te contactará en breve para ayudarte. 📞');
    }
  }
}

/**
 * Helper para enviar el menú por defecto según el segmento
 */
async function sendDefaultMenu(phoneNumber: string, contactId: string, conversationId: string) {
  console.log('[Webhook] sendDefaultMenu llamado para:', phoneNumber);
  const { data: contact } = await getSupabaseAdmin().from('contacts').select('segment').eq('id', contactId).single();
  const segment = contact?.segment || 'prospecto';
  console.log('[Webhook] Segmento del contacto:', segment);
  const templateId = segment === 'cliente' ? 'menu_principal_cliente' : 'bienvenida_prospecto';
  console.log('[Webhook] Buscando plantilla:', templateId);
  
  const template = await TemplateService.findTemplateById(templateId, segment);
  console.log('[Webhook] Plantilla encontrada:', !!template);
  if (template) {
    const freshContext = await ContextService.buildContext({id: contactId, segment} as any, [], null, conversationId);
    await processTemplateResponse(phoneNumber, template, freshContext, NavigationService.createInitialState());
  } else {
    console.log('[Webhook] ❌ NO se encontró plantilla con ID:', templateId);
  }
}

/**
 * Procesa la respuesta de una plantilla evaluando reglas y acciones
 */
async function processTemplateResponse(
  phoneNumber: string,
  template: Template,
  context: TemplateContext,
  navState: any
): Promise<void> {
  // Evitar bucles infinitos
  const { hasLoop } = NavigationService.recordVisit(template.id, navState);
  if (hasLoop) {
    await sendWhatsAppMessage(phoneNumber, 'Para darte una mejor atención, te derivaré con un asesor humano. 📞');
    return;
  }

  // Evaluar reglas del template (ej: requiere segmento cliente)
  const ruleResult = evaluateTemplateRules(template, context);
  if (!ruleResult.isValid) {
    if (ruleResult.fallbackTemplateId) {
      const fallback = await TemplateService.findTemplateById(ruleResult.fallbackTemplateId, context.contact.segment || 'prospecto');
      if (fallback) return processTemplateResponse(phoneNumber, fallback, context, navState);
    }
    // Si no hay fallback, enviar contenido como texto simple
    await sendWhatsAppMessage(phoneNumber, template.content);
    return;
  }

  // Reemplazar variables {{nombre}}, etc.
  const content = TemplateService.replaceVariables(template.content, context);
  
  // Procesar acciones interactivas
  if (template.actions && template.actions.length > 0) {
    const handled = await ActionService.executeActions(phoneNumber, template.actions, context);
    if (handled) return;

    // Obtener botones/listas filtrados por condiciones
    const { buttons, listAction, elseActions } = getFinalActions(template.actions, context);
    
    if (buttons.length > 0 || listAction || elseActions.length > 0) {
      await ActionService.sendInteractiveResponse(phoneNumber, content, buttons, listAction, elseActions, context);
      return;
    }
  }

  // Fallback final: Enviar solo texto
  await sendWhatsAppMessage(phoneNumber, content);
}
