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
  saveMessage, 
} from './database-service';

import { TemplateContext, Template } from '@/app/components/templates/types';
import { evaluateTemplateRules } from './services/condition-engine';
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

  // 1. Filtrar números ignorados (ej: el del propio bot si hay eco)
  const ignoreFrom = process.env.WHATSAPP_IGNORE_INBOUND_FROM?.trim();
  if (ignoreFrom && phoneNumber.includes(ignoreFrom)) return;

  try {
    // 2. Obtener Contexto Inicial
    const contact = await getOrCreateContact(phoneNumber, profileName);
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

      // MANEJO DE MAIL
      if (interactive.startsWith(BUTTON_IDS.SEND_BY_EMAIL)) {
        const docId = interactive.replace(`${BUTTON_IDS.SEND_BY_EMAIL}_`, '');
        if (contact.email) {
          await sendWhatsAppMessage(phoneNumber, `📧 ¡Entendido! Enviando documento a *${contact.email}*...`);
          const docHandler = new DocumentsHandler(context);
          const { data: doc } = await getSupabaseAdmin().from('client_documents').select('*').eq('id', docId).single();
          if (doc) {
            await EmailService.sendDocumentToClient(contact.email, contact.name || 'Cliente', doc.title, doc.file_url);
            await sendWhatsAppMessage(phoneNumber, '✓ ¡Email enviado! Revisa tu bandeja de entrada (y la de SPAM por si acaso). 🚀');
          }
        } else {
          await saveMessage(conversationId, 'assistant', 'SOLICITUD_EMAIL'); // Flag interno en historial
          await sendWhatsAppMessage(phoneNumber, 'No tengo registrado tu correo electrónico. 📧\n\nPor favor, *escríbelo aquí abajo* para enviarte este documento y dejarlo guardado para el futuro.');
        }
        return;
      }

      // DETECCIÓN DE ASISTENCIA HUMANA
      if (interactive === 'btn_existing_human' || interactive === 'btn_contactar') {
        await handleHumanHandoff(phoneNumber, conversationId, contact.name || 'Usuario');
        return;
      }

      // Buscar si el ID del botón corresponde a una plantilla específica
      const nextTemplate = await TemplateService.findTemplateByActionId(interactive, contact.segment || 'prospecto');
      if (nextTemplate) {
        await processTemplateResponse(phoneNumber, nextTemplate, context, navState);
        return;
      }

      // MANEJO DE CITAS
      const apptHandler = new AppointmentHandler(context);
      if (interactive === BUTTON_IDS.BOOK_APPT) {
        await apptHandler.startBooking(phoneNumber);
        return;
      }
      if (interactive.startsWith('appt_date_')) {
        await apptHandler.handleDateSelection(phoneNumber, interactive);
        return;
      }
      if (interactive.startsWith('appt_time_')) {
        await apptHandler.confirmAppointment(phoneNumber, interactive, conversationId);
        return;
      }

      console.warn(`[Webhook] ⚠️ Botón no reconocido: ${interactive}`);
      // FALLBACK: Enviar menú principal para evitar que el usuario quede sin respuesta
      await sendDefaultMenu(phoneNumber, contact.id, conversationId);
      return;
    }

    // 6b. Manejo de Nuevos Usuarios o sin segmento (Auto-clasificación)
    const currentSegment = (contact.segment || '').toLowerCase().trim();
    if (!currentSegment || currentSegment === 'todos') {
      console.log('[Webhook] 📌 Usuario sin segmento detectado, clasificando como prospecto');
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
      
      // Captura de email si venimos de un prompt
      const history = await ContextService.getConversationHistory(conversationId);
      const lastBotMsg = history.reverse().find(m => m.role === 'assistant')?.content;
      
      if (lastBotMsg === 'SOLICITUD_EMAIL' || text.includes('@')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const potentialEmail = text.trim().toLowerCase();
        
        if (emailRegex.test(potentialEmail)) {
          await getSupabaseAdmin().from('contacts').update({ email: potentialEmail }).eq('id', contact.id);
          await sendWhatsAppMessage(phoneNumber, `¡Excelente! He guardado tu correo: *${potentialEmail}* ✅`);
          await sendWhatsAppMessage(phoneNumber, 'Ya puedes solicitar el envío de tus documentos por email cuando quieras.');
          await sendDefaultMenu(phoneNumber, contact.id, conversationId);
          return;
        }
      }

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
      const appHistory = await ContextService.getConversationHistory(conversationId);
      const lastBtn = ContextService.getLastButtonFromHistory(appHistory);
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
  const segment = (contact?.segment || 'prospecto').toLowerCase();
  console.log('[Webhook] Segmento del contacto:', segment);
  const templateId = segment === 'cliente' ? 'menu_principal_cliente' : 'bienvenida_prospecto';
  console.log('[Webhook] Buscando plantilla:', templateId);
  
  let template = await TemplateService.findTemplateById(templateId, segment);
  
  if (!template) {
    console.log(`[Webhook] ⚠️ No se encontró por ID (${templateId}). Intentando buscar por trigger "hola"...`);
    template = await TemplateService.findTemplateByTrigger('hola', segment);
  }

  console.log('[Webhook] Plantilla encontrada finalmente:', !!template);
  if (template) {
    const freshContext = await ContextService.buildContext({id: contactId, segment} as any, [], null, conversationId);
    await processTemplateResponse(phoneNumber, template, freshContext, NavigationService.createInitialState());
  } else {
    console.log('[Webhook] ❌ NO se encontró plantilla con ID:', templateId);
    // Fallback absoluto si hasta la plantilla de bienvenida falla
    await sendWhatsAppMessage(phoneNumber, '¡Hola! ☕ Soy tu asistente de MTZ. ¿En qué puedo ayudarte hoy? Escribe "Menú" para ver mis opciones.');
  }
}

/**
 * Desactiva el chatbot e informa al usuario del paso a humano
 */
async function handleHumanHandoff(phoneNumber: string, conversationId: string, name: string) {
  console.log(`[Webhook] 📞 Activando pase a humano para ${phoneNumber}`);
  
  await getSupabaseAdmin()
    .from('conversations')
    .update({ chatbot_enabled: false })
    .eq('id', conversationId);

  await saveMessage(conversationId, 'assistant', 'Un asesor de MTZ se pondrá en contacto contigo pronto.');
  
  await sendWhatsAppMessage(phoneNumber, 
    `Perfecto ${name.split(' ')[0]}, he notificado a nuestro equipo. 👨‍💼\n\nHe desactivado mi respuesta automática para que un asesor pueda hablar contigo directamente en este chat en breve. ¡Gracias por tu paciencia!`
  );
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
