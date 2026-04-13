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
} from './database-service';

import { TemplateContext, Template } from '@/app/components/templates/types';
import { Contact } from './types';
import { MediaHandler } from './handlers/media-handler';
import { InteractiveHandler } from './handlers/interactive-handler';
import { TextRouter } from './handlers/text-router';
import { TemplateService } from './services/template-service';
import { NavigationService } from './services/navigation-service';
import { ContextService } from './services/context-service';
import { ActionService } from './services/action-service';
import { getFinalActions } from './services/condition-engine';

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
  const phoneNumber = messageData.from;
  const profileName = messageData.profileName;
  let text = messageData.text?.body?.trim();
  const interactiveId = messageData.interactive?.button_reply?.id || messageData.interactive?.list_reply?.id;

  if (!phoneNumber) return;

  // 1. Filtrar números ignorados
  const ignoreFrom = process.env.WHATSAPP_IGNORE_INBOUND_FROM?.trim();
  if (ignoreFrom && phoneNumber.includes(ignoreFrom)) return;

  try {
    // 2. Gestión de Media (Audios/Documentos)
    if (messageData.audio) {
      text = await MediaHandler.handleAudio(messageData.audio);
    }
    if (messageData.document || messageData.image) {
      const handled = await MediaHandler.handleMediaUpload(phoneNumber, profileName, { 
        id: (messageData.document?.id || messageData.image?.id)!, 
        type: messageData.document ? 'document' : 'image' 
      });
      if (handled) return;
    }

    // 3. Obtención de Identidad y Contexto
    let contact = await getOrCreateContact(phoneNumber, profileName);
    
    // Auto-actualizar nombre si es necesario
    if ((!contact.name || contact.name.toLowerCase() === 'cliente') && profileName && profileName.toLowerCase() !== 'cliente') {
      const { data: updated } = await getSupabaseAdmin().from('contacts').update({ name: profileName }).eq('id', contact.id).select().single();
      if (updated) contact = updated as Contact;
    }

    const conversationId = await getOrCreateConversation(phoneNumber, contact.id);
    const companies = await listCompaniesForContact(contact.id);
    const activeCompanyId = await getActiveCompanyForConversation(conversationId);

    // 4. Verificar Estado del Bot (Modo Manual vs Automático)
    const { data: convData } = await getSupabaseAdmin().from('conversations').select('chatbot_enabled').eq('id', conversationId).maybeSingle();
    let isBotEnabled = convData ? convData.chatbot_enabled !== false : true;

    // Reactivación por navegación
    const RE_ACTIVATION_BUTTONS = ['menu_principal_cliente', 'btn_volver_home', 'bienvenida_prospecto', 'btn_cancelar_soporte'];
    if (interactiveId && RE_ACTIVATION_BUTTONS.includes(interactiveId)) {
      await getSupabaseAdmin().from('conversations').update({ chatbot_enabled: true }).eq('id', conversationId);
      isBotEnabled = true;
    }

    if (!isBotEnabled) return;

    // 5. Registro de Mensaje
    const { saveMessage } = await import('./database-service');
    if (interactiveId) await saveMessage(conversationId, 'user', `[interactive:${interactiveId}]`);
    else if (text) await saveMessage(conversationId, 'user', text);

    if (!text && !interactiveId) return;

    // 6. ENRUTAMIENTO INDUSTRIAL
    const context = await ContextService.buildContext(contact, companies, activeCompanyId, conversationId);

    // Flujo Interactivo (Botones/Listas)
    if (interactiveId) {
      const handled = await InteractiveHandler.handle(interactiveId, phoneNumber, context, conversationId);
      if (handled) return;
    }

    // Flujo de Texto
    if (text) {
      await TextRouter.handle(text, phoneNumber, context, conversationId);
    }

  } catch (error: any) {
    console.error('[WebhookHandler] ❌ ERROR CRÍTICO:', error);
    await sendWhatsAppMessage(phoneNumber, "¡Ups! Tuvimos un problema técnico. 🔄 Te devuelvo al menú principal para ayudarte mejor.");
    await sendDefaultMenu(phoneNumber, (await getOrCreateContact(phoneNumber)).id, (await getOrCreateConversation(phoneNumber, (await getOrCreateContact(phoneNumber)).id)));
  }
}

/**
 * Helper para enviar el menú por defecto
 */
export async function sendDefaultMenu(phoneNumber: string, contactId: string, conversationId: string) {
  const { data: contact } = await getSupabaseAdmin().from('contacts').select('segment').eq('id', contactId).single();
  const segment = (contact?.segment || 'prospecto').toLowerCase();
  const templateId = segment === 'cliente' ? 'menu_principal_cliente' : 'bienvenida_prospecto';
  
  const template = await TemplateService.findTemplateById(templateId, segment);
  if (template) {
    const freshContext = await ContextService.buildContext({ id: contactId, segment } as any, [], null, conversationId);
    await processTemplateResponse(phoneNumber, template, freshContext, NavigationService.createInitialState(), conversationId);
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
    if (template.id === 'soporte_ejecutivo' && conversationId) {
      await getSupabaseAdmin().from('conversations').update({ chatbot_enabled: false }).eq('id', conversationId);
    }

    const content = TemplateService.replaceVariables(template.content, context);

    if (template.actions && template.actions.length > 0) {
      const handled = await ActionService.executeActions(phoneNumber, template.actions, context);
      if (handled) return;

      const { buttons, listAction, elseActions } = getFinalActions(template.actions, context);
      if (buttons.length > 0 || listAction || elseActions.length > 0) {
        await ActionService.sendInteractiveResponse(phoneNumber, content, buttons, listAction, elseActions, context);
        return;
      }
    }
    await sendWhatsAppMessage(phoneNumber, content);
  } catch (err) {
    console.error('[TemplateResponse] Error:', err);
    await sendWhatsAppMessage(phoneNumber, '¿En qué puedo ayudarte hoy?');
  }
}
