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
import { Contact, Company } from './types';
import { handleCompanyButton, handleCompanyText } from './handlers/company-handler';
import { handleDocumentButton } from './handlers/documents-handler';
import { handleClassification } from './handlers/classification-handler';
import { MenuHandler } from './handlers/menu-handler';
import { handleAI } from './handlers/ai-handler';
import { extractInventoryData } from './ai-service';
import { AppointmentHandler } from './handlers/appointment-handler';
import { ServiceRequestHandler } from './handlers/service-request-handler';
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
  audio?: { id: string; mime_type: string };
  document?: { id: string; filename?: string; mime_type: string };
  image?: { id: string; mime_type: string };
  interactive?: { 
    button_reply?: { id?: string }; 
    list_reply?: { id?: string } 
  };
}): Promise<void> {
  console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! WEBHOOK ENTRY !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  const phoneNumber = messageData.from;
  const profileName = messageData.profileName;
  let text = messageData.text?.body?.trim();
  const audio = messageData.audio;
  const document = messageData.document;
  const image = messageData.image;
  const interactive = messageData.interactive?.button_reply?.id || messageData.interactive?.list_reply?.id;

  if (!phoneNumber) return;

  // Manejo de Documentos e Imágenes (Buzón de Recepción)
  if (document || image) {
    const mediaId = document?.id || image?.id;
    console.log(`[Webhook] 📁 Recibido archivo ID: ${mediaId}`);
    try {
      const contact = await getOrCreateContact(phoneNumber, profileName);
      const conversationId = await getOrCreateConversation(phoneNumber, contact.id);
      const companies = await listCompaniesForContact(contact.id);
      const context = await ContextService.buildContext(contact, companies, null, conversationId);

      if (context.lastAction === 'buzon_recepcion') {
        const typeLabel = document ? 'documento' : 'foto';
        await saveMessage(conversationId, 'user', `[Archivo recibido: ${typeLabel} ID ${mediaId}]`);

        await sendWhatsAppMessage(phoneNumber, `✅ He recibido tu ${typeLabel} correctamente. Lo guardaré en tu expediente para que el contador lo revise. ¿Necesitas enviar algo más?`);
        return;
      }
    } catch (err) {
      console.error('[Webhook] ❌ Error procesando archivo:', err);
    }
  }

  // Manejo Industrial de Audio (Mensajes de Voz)
  if (audio && audio.id) {

    try {
      console.log(`[Webhook] 🎙️ Procesando audio ID: ${audio.id}`);
      const { getWhatsAppMediaUrl, downloadWhatsAppMedia } = await import('./whatsapp-service');
      const { transcribeAudio } = await import('./ai-service');
      
      const audioUrl = await getWhatsAppMediaUrl(audio.id);
      const audioBuffer = await downloadWhatsAppMedia(audioUrl);
      const transcription = await transcribeAudio(audioBuffer, `voice_${audio.id}.ogg`);
      
      console.log(`[Webhook] 📝 Transcripción: "${transcription}"`);
      text = transcription;
    } catch (err) {
      console.error('[Webhook] ❌ Error procesando audio:', err);
      text = 'Mensaje de voz (error de procesamiento)';
    }
  }

  // 1. Filtrar números ignorados
  const ignoreFrom = process.env.WHATSAPP_IGNORE_INBOUND_FROM?.trim();
  if (ignoreFrom && phoneNumber.includes(ignoreFrom)) return;

  try {
    console.log(`[Webhook] 📥 Entrando mensaje de: ${phoneNumber}`);
    
    // 2. Obtener Contexto Inicial (Deducción de Carlos Villagra 111 clientes)
    // 2. Obtener/Actualizar Contacto
    let contact = await getOrCreateContact(phoneNumber, profileName);
    
    // Si el nombre es genérico o nulo y tenemos un profileName real, actualizarlo
    if ((!contact.name || contact.name.toLowerCase() === 'cliente') && profileName && profileName.toLowerCase() !== 'cliente') {
      console.log(`[Webhook] 👤 Actualizando nombre de contacto: ${profileName}`);
      const { data: updatedContact } = await getSupabaseAdmin()
        .from('contacts')
        .update({ name: profileName })
        .eq('id', contact.id)
        .select()
        .single();
      if (updatedContact) contact = updatedContact as Contact;
    }

    const conversationId = await getOrCreateConversation(phoneNumber, contact.id);
    const companies = await listCompaniesForContact(contact.id);
    let activeCompanyId = await getActiveCompanyForConversation(conversationId);

    // 3. Verificar si el Chatbot está habilitado
    const { data: convData } = await getSupabaseAdmin()
      .from('conversations')
      .select('chatbot_enabled')
      .eq('id', conversationId)
      .maybeSingle();

    let isBotEnabled = convData ? convData.chatbot_enabled !== false : true;

    // REACTIVACIÓN AUTOMÁTICA: Si el usuario presiona un botón de menú principal o navegación, re-activamos el bot.
    const RE_ACTIVATION_BUTTONS = ['menu_principal_cliente', 'btn_volver_home', 'bienvenida_prospecto', 'btn_cancelar_soporte'];
    if (interactive && RE_ACTIVATION_BUTTONS.includes(interactive)) {
      console.log(`[Webhook] 🔄 Reactivando bot por interacción de navegación: ${interactive}`);
      await getSupabaseAdmin()
        .from('conversations')
        .update({ chatbot_enabled: true })
        .eq('id', conversationId);
      isBotEnabled = true;
    }

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

    if (!text && !interactive) {
       console.log('[Webhook] ℹ️ Mensaje vacío ignorado');
       return;
    }

    // 5. Construir Contexto
    const context = await ContextService.buildContext(contact, companies, activeCompanyId, conversationId);
    const navState = NavigationService.createInitialState();

    // 6. FLUJO DE PROCESAMIENTO
    if (interactive) {
      // Handlers de prioridad (Etiquetado/Clasificación)
      const classification = await handleClassification(interactive, contact);
      if (classification.handled) {
        if (classification.response) await sendWhatsAppMessage(phoneNumber, classification.response);
        await sendDefaultMenu(phoneNumber, contact.id, conversationId);
        return;
      }

      // Handlers Industriales
      if ((await handleCompanyButton(interactive, phoneNumber, conversationId, companies)).handled) return;
      if ((await handleDocumentButton(interactive, phoneNumber, conversationId, contact, companies, activeCompanyId)).handled) return;
      
      // Manejo de Citas (Nuevo)
      const apptHandler = new AppointmentHandler(context);
      
      // Soporte para botones rápidos de la plantilla industrial
      if (interactive === 'reunion_manana' || interactive === 'reunion_tarde') {
        await apptHandler.handleQuickAppointment(phoneNumber, interactive, conversationId);
        // Dejamos que siga el flujo para mostrar la plantilla de confirmación
      }

      if (interactive === 'agendar_cita' || interactive === 'appt_start') {

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

      // Manejo de Solicitudes (Nivel 5)
      const serviceHandler = new ServiceRequestHandler(context);
      if (interactive === 'ver_solicitudes') {
        await serviceHandler.listActiveRequests(phoneNumber);
        return;
      }
      if (interactive.startsWith('req_detail_')) {
        const requestId = interactive.replace('req_detail_', '');
        await serviceHandler.showRequestDetail(phoneNumber, requestId);
        return;
      }
      
      // Modalidades de cita (venir de la plantilla agendar_cita)
      if (interactive === 'cita_presencial' || interactive === 'cita_virtual' || interactive === 'cita_llamada') {
        const modalityNames: any = { 
          'cita_presencial': 'Presencial 🏢', 
          'cita_virtual': 'Videollamada 💻', 
          'cita_llamada': 'Llamada 📞' 
        };
        await sendWhatsAppMessage(phoneNumber, `Has seleccionado la modalidad: *${modalityNames[interactive]}*.\n\nAhora busquemos un cupo disponible...`);
        await apptHandler.startBooking(phoneNumber);
        return;
      }
      
      const { InventoryHandler } = await import('./handlers/inventory-handler');
      const invHandler = new InventoryHandler(context);

      if (interactive === 'inv_report') {
        await invHandler.showStockSummary(phoneNumber);
        await sendWhatsAppInteractiveButtons(phoneNumber, "¿Deseas realizar otra gestión?", [
          { id: 'gestion_inventario', title: '📦 Volver Inventario' },
          { id: 'menu_principal_cliente', title: '🏠 Menú Inicio' }
        ]);
        return;
      }

      if (interactive === 'inv_add') {
        await invHandler.showAddOptions(phoneNumber);
        return;
      }

      if (interactive === 'inv_new') {
        await sendWhatsAppMessage(phoneNumber, '✨ *CREAR PRODUCTO*\n\nPor favor, responde con el nombre y unidad de medida.\n\nEjemplo: *Harina Especial 25kg*');
        return;
      }
      
      if (interactive === 'inv_withdraw') {
        await invHandler.showWithdrawOptions(phoneNumber);
        return;
      }

      if (interactive.startsWith('inv_in_')) {
        const itemId = interactive.replace('inv_in_', '');
        await sendWhatsAppMessage(phoneNumber, `Has seleccionado el producto. Por favor, escribe la *cantidad a SUMAR* (ej: 10).`);
        return;
      }

      if (interactive.startsWith('inv_out_')) {
        const itemId = interactive.replace('inv_out_', '');
        await sendWhatsAppMessage(phoneNumber, `Has seleccionado el producto. Por favor, escribe la *cantidad a DESCONTAR* (ej: 5).`);
        return;
      }

      const nextTemplate = await TemplateService.findTemplateByActionId(interactive, contact.segment || 'prospecto');
      if (nextTemplate) {
        await processTemplateResponse(phoneNumber, nextTemplate, context, navState, conversationId);
        return;
      }
    }

    // Manejo de Saludos y Triggers de Texto
    if (text) {
      console.log(`[WebhookDebug] PID: ${process.pid} | File: ${__filename}`);
      console.log(`[Webhook] 🧠 Contexto de Acción: "${context.lastAction}" | Texto: "${text.substring(0, 20)}..."`);
      // CAPTURA DE INVENTARIO ESTRUCTURADO
      if (text.includes(',') && (context.lastAction === 'inv_add' || context.lastAction === 'gestion_inventario')) {
        const { InventoryHandler } = await import('./handlers/inventory-handler');
        const invHandler = new InventoryHandler(context);
        await invHandler.handleStructuredInput(phoneNumber, text);
        return;
      }

      if (context.lastAction === 'solicitud_tramite' && text.length > 5 && !text.includes('Menu')) {
         console.log(`[Webhook] ⚙️ Capturando solicitud de trámite: "${text}"`);
         const { createServiceRequest } = await import('./database-service');
         const activeCompanyId = await getActiveCompanyForConversation(conversationId);
         
         const request = await createServiceRequest(
           contact.id,
           conversationId,
           'general_request',
           text,
           activeCompanyId
         );

         if (request) {
           await sendWhatsAppMessage(phoneNumber, `✅ Solicitud registrada con éxito (Ticket: ${request.request_code}).\n\nHe enviado tu requerimiento al equipo contable. Si necesitas algo más, puedes volver al Menú Principal.`);
           return;
         }
      }

      console.log(`[FlowDebug] 1. Saludando?`);
      const greetingHandler = new MenuHandler(context);
      if (greetingHandler.isGreeting(text)) {
        console.log(`[FlowDebug] -> Saludo detectado`);
        await sendDefaultMenu(phoneNumber, contact.id, conversationId);
        return;
      }

      console.log(`[FlowDebug] 2. Empresa?`);
      // Prioridad: Intentar identificar RUT o Empresa por texto
      const companySelection = await handleCompanyText(text, phoneNumber, conversationId, companies);
      if (companySelection.handled) {
        console.log(`[FlowDebug] -> Empresa detectada`);
        // Si el usuario se acaba de identificar, enviamos el menú por defecto correspondiente a su nuevo segmento
        await sendDefaultMenu(phoneNumber, contact.id, conversationId);
        return;
      }
      console.log(`[FlowDebug] 3. Alcanzando bloque Inventario`);

      // INTEGRACIÓN: Gestión Inteligente de Inventario (Nivel Premium)
      const { InventoryHandler } = await import('./handlers/inventory-handler');
      const invHandler = new InventoryHandler(context);
      const lowerText = text.toLowerCase();
      
      // 1. Detección de Consultas Semánticas (¿Cuánto queda?)
      const isInventoryQuery = lowerText.includes('cuanto queda') || 
                               lowerText.includes('stock de') || 
                               lowerText.includes('tienes de') ||
                               lowerText.includes('hay de');
                               
      if (isInventoryQuery && context.contact.segment === 'cliente') {
        const handled = await invHandler.handleSemanticInquiry(phoneNumber, text);
        if (handled) return;
      }

      // 2. Detección de Movimientos Naturales (IA Extraction)
      const inventoryTriggers = ['compramos', 'llegó', 'llegaron', 'anota', 'ingresaron', 'factura', 'guía', 'rut', 'compré'];
      const looksLikeMovement = inventoryTriggers.some(t => lowerText.includes(t)) && text.length > 15;

      if (looksLikeMovement && context.contact.segment === 'cliente') {
        console.log(`[InventoryDebug] 🤖 IA Analizando entrada natural: ${text.substring(0, 30)}...`);
        const meta = await extractInventoryData(text);
        if (meta && meta.producto && meta.cantidad) {
          const handled = await invHandler.handleNaturalInventoryAdd(phoneNumber, meta);
          if (handled) return;
        }
      }

      const matchedTemplate = await TemplateService.findTemplateByTrigger(text, contact.segment || 'prospecto');

      if (matchedTemplate) {
        await processTemplateResponse(phoneNumber, matchedTemplate, context, navState, conversationId);
        return;
      }

      // IA Fallback
      await handleAI(phoneNumber, conversationId, contact, companies, activeCompanyId, text);
    }


  } catch (error: any) {
    console.error('[WebhookHandler] ❌ ERROR CRÍTICO:', error);
    
    // Fallback amigable en lugar de mensaje técnico
    try {
      await sendWhatsAppMessage(phoneNumber, "¡Ups! No pude procesar esa opción. 🔄 Te devuelvo al menú principal para que podamos continuar.");
      await sendDefaultMenu(phoneNumber, (await getOrCreateContact(phoneNumber)).id, (await getOrCreateConversation(phoneNumber, (await getOrCreateContact(phoneNumber)).id)));
    } catch (e) {
      console.error('[WebhookHandler] Fallback fallido:', e);
    }
  }
}

/**
 * Helper para enviar el menú por defecto
 */
async function sendDefaultMenu(phoneNumber: string, contactId: string, conversationId: string) {
  const { data: contact } = await getSupabaseAdmin()
    .from('contacts')
    .select('segment')
    .eq('id', contactId)
    .single();

  const segment = (contact?.segment || 'prospecto').toLowerCase();
  const templateId = segment === 'cliente' ? 'menu_principal_cliente' : 'bienvenida_prospecto';
  
  const template = await TemplateService.findTemplateById(templateId, segment);
  if (template) {
    const freshContext = await ContextService.buildContext({ id: contactId, segment } as any, [], null, conversationId);
    await processTemplateResponse(phoneNumber, template, freshContext, NavigationService.createInitialState(), conversationId);
  } else {
    await sendWhatsAppMessage(phoneNumber, 'Bienvenido a MTZ. Escribe "Menú" para ver mis opciones.');
  }
}

/**
 * Procesa la respuesta de una plantilla de forma segura
 */
export async function processTemplateResponse(
  phoneNumber: string,
  template: Template,
  context: TemplateContext,
  navState: any,
  conversationId?: string
): Promise<void> {
  try {
    // Lógica Industrial: Desactivar bot si es soporte humano
    if (template.id === 'soporte_ejecutivo' && conversationId) {
      console.log(`[Webhook] 📉 Desactivando chatbot para soporte humano en ${conversationId}`);
      await getSupabaseAdmin()
        .from('conversations')
        .update({ chatbot_enabled: false })
        .eq('id', conversationId);
    }

    const content = TemplateService.replaceVariables(template.content, context);

    
    // Procesar acciones interactivas con blindaje
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
