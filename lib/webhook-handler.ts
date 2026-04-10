/**
 * Webhook Handler - Orquestación de handlers con sistema de condicionales
 *
 * Este archivo coordina todos los handlers e integra el motor de evaluación
 * de condiciones para navegación dinámica en templates.
 *
 * Flujo principal:
 * 1. Recepción de mensaje
 * 2. Obtención de contexto (contacto, empresas, documentos)
 * 3. Evaluación de condiciones para acciones
 * 4. Envío de respuesta con acciones filtradas
 * 5. Fallback a IA si no hay coincidencias
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
import {
  Template,
  TemplateContext,
  Action,
  TemplateRule,
} from '../app/components/templates/types';
import {
  evaluateTemplateRules,
  getFinalActions,
  detectLoop,
} from './handlers/condition-engine';
import { buildContext } from './handlers/base-handler';

// Handlers separados
import { handleClassification, autoClassifyAsProspect } from './handlers/classification-handler';
import { sendWelcomeMenu, handleMenuButton, isGreeting } from './handlers/menu-handler';
import { handleDocumentButton, handlePeriodText, handleDocCategoryButton } from './handlers/documents-handler';
import { handleCompanyButton, handleCompanyText, autoSelectCompany } from './handlers/company-handler';
import { handleAI } from './handlers/ai-handler';
import { HandlerContext } from './handlers/types';

/**
 * Estado de navegación para tracking de loops
 */
interface NavigationState {
  visitedTemplates: string[];
  redirectCount: number;
  lastTemplateId?: string;
}

/**
 * Procesa mensaje entrante de WhatsApp
 *
 * Este es el punto de entrada principal del webhook.
 * Sigue el siguiente flujo:
 *
 * 1. Validación inicial (teléfono, ignore list)
 * 2. Obtención de contacto y conversación
 * 3. Verificación de chatbot enabled
 * 4. Guardado de mensaje en DB
 * 5. Procesamiento de interactive buttons
 * 6. Clasificación automática
 * 7. Búsqueda de templates por trigger
 * 8. Navegación por next_template_id
 * 9. Auto-selección de empresa
 * 10. Procesamiento de períodos (IVA, Renta)
 * 11. Fallback a IA
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

    // 4. Construir contexto completo para evaluación de condiciones
    const context = await buildContext(phoneNumber, contact.id, conversationId);

    // Estado de navegación para detectar loops
    const navState: NavigationState = {
      visitedTemplates: [],
      redirectCount: 0,
    };

    // 5. Si es interactive, procesar con handlers específicos
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

      // Si el interactive es un next_template_id, navegar con evaluación de condiciones
      const nextTemplate = await findTemplateById(interactive, contact.segment);
      if (nextTemplate) {
        await sendTemplateWithConditions(phoneNumber, nextTemplate, context, navState);
        return;
      }
    }

    // 6. Si no tiene segment, asignar prospecto automáticamente
    if (!contact.segment) {
      await autoClassifyAsProspect(contact);
      contact.segment = 'prospecto';
      await sendWelcomeMenu(phoneNumber, contact);
      return;
    }

    // 7. Si es saludo, enviar menú
    if (text && isGreeting(text)) {
      await sendWelcomeMenu(phoneNumber, contact);
      return;
    }

    // 8. Buscar plantilla por trigger
    if (text) {
      const matchedTemplate = await findTemplateByTrigger(text, contact.segment);
      if (matchedTemplate) {
        await sendTemplateWithConditions(phoneNumber, matchedTemplate, context, navState);
        return;
      }
    }

    // 9. Auto-seleccionar empresa si solo tiene una
    if (!activeCompanyId && companies.length === 1) {
      activeCompanyId = await autoSelectCompany(conversationId, companies);
      context.activeCompanyId = activeCompanyId;
    }

    // 10. Si es cliente con múltiples empresas y no tiene selección, pedir empresa
    if (contact.segment === 'cliente' && companies.length > 1 && !activeCompanyId) {
      // Por ahora derivar a IA que pregunte
    }

    // 11. Verificar última acción para procesar períodos (IVA, Renta, etc.)
    if (text) {
      const history = await getConversationHistory(conversationId);
      const lastBtn = getLastButtonFromHistory(history);

      if (lastBtn) {
        const periodResult = await handlePeriodText(
          text, lastBtn, phoneNumber, conversationId, contact.id, activeCompanyId
        );
        if (periodResult.handled) return;
      }
    }

    // 12. Fallback a IA (Gemini)
    await handleAI(phoneNumber, conversationId, contact, companies, activeCompanyId, text || '');

  } catch (error) {
    console.error('💥 ERROR en webhook:', error);
    throw error;
  }
}

/**
 * Envía un template evaluando condiciones y reglas
 *
 * @param phoneNumber - Número de destino
 * @param template - Template a enviar
 * @param context - Contexto del usuario
 * @param navState - Estado de navegación para detectar loops
 */
async function sendTemplateWithConditions(
  phoneNumber: string,
  template: Template,
  context: TemplateContext,
  navState: NavigationState
): Promise<void> {
  console.log('[Webhook] Enviando template:', template.id);

  // Actualizar estado de navegación
  navState.visitedTemplates.push(template.id);
  navState.lastTemplateId = template.id;

  // Detectar loop infinito
  if (detectLoop(template.id, navState.visitedTemplates, 3)) {
    console.warn('[Webhook] Loop detectado en template:', template.id);
    // Enviar mensaje de error amigable
    await sendWhatsAppMessage(
      phoneNumber,
      'Parece que hay un problema con la navegación. Un asesor te contactará pronto.'
    );
    return;
  }

  // Evaluar reglas del template
  const ruleResult = evaluateTemplateRules(template, context);

  if (!ruleResult.isValid) {
    console.log('[Webhook] Template no válido:', ruleResult.reason);

    // Si hay fallback, usar ese template
    if (ruleResult.fallbackTemplateId) {
      navState.redirectCount++;

      // Límite de redirecciones
      if (navState.redirectCount > 5) {
        console.error('[Webhook] Máximo de redirecciones alcanzado');
        await sendWhatsAppMessage(
          phoneNumber,
          'Hubo un problema. Un asesor te contactará pronto.'
        );
        return;
      }

      const fallbackTemplate = await findTemplateById(ruleResult.fallbackTemplateId, context.contact.segment);
      if (fallbackTemplate) {
        await sendTemplateWithConditions(phoneNumber, fallbackTemplate, context, navState);
        return;
      }
    }

    // Sin fallback - enviar mensaje por defecto
    await sendWhatsAppMessage(phoneNumber, template.content);
    return;
  }

  // Enviar contenido del template
  await sendWhatsAppMessage(phoneNumber, template.content);

  // Procesar acciones con condiciones
  if (template.actions && template.actions.length > 0) {
    await sendTemplateActionsWithConditions(phoneNumber, template.actions, context);
  }
}

/**
 * Envía acciones de template evaluando condiciones
 *
 * @param phoneNumber - Número de destino
 * @param actions - Acciones del template
 * @param context - Contexto del usuario
 */
async function sendTemplateActionsWithConditions(
  phoneNumber: string,
  actions: Action[],
  context: TemplateContext
): Promise<void> {
  console.log('[Webhook] Procesando', actions.length, 'acciones con condiciones');

  // Obtener acciones finales (filtradas y convertidas)
  const { buttons, listAction, elseActions, redirectTemplateId } = getFinalActions(actions, context);

  // Manejar redirecciones por else_action
  if (redirectTemplateId) {
    console.log('[Webhook] Redirigiendo por else_action:', redirectTemplateId);
    // La redirección se maneja en el nivel superior
    return;
  }

  // Procesar else_actions de tipo show_message
  for (const elseAction of elseActions) {
    if (elseAction.type === 'show_message' && elseAction.message) {
      console.log('[Webhook] Enviando mensaje alternativo:', elseAction.message);
      // No enviar inmediatamente, solo loguear
    }
  }

  // Enviar lista si existe
  if (listAction) {
    try {
      const options = JSON.parse(listAction.description || '[]');
      await sendWhatsAppListMessage(phoneNumber, {
        body: 'Selecciona una opción:',
        buttonText: listAction.title,
        sections: [{
          title: 'Opciones',
          rows: options.map((o: any) => ({
            id: o.id,
            title: o.title,
            description: o.description
          }))
        }]
      });
      return;
    } catch (error) {
      console.error('[Webhook] Error al parsear lista:', error);
    }
  }

  // Enviar botones
  if (buttons.length > 0) {
    const buttonPayloads = buttons.slice(0, 3).map(b => ({
      id: b.id,
      title: b.title
    }));

    await sendWhatsAppInteractiveButtons(
      phoneNumber,
      'Selecciona una opción:',
      buttonPayloads
    );
  } else if (buttons.length === 0 && actions.length > 0) {
    console.log('[Webhook] Todas las acciones fueron ocultadas por condiciones');
  }
}

/**
 * Obtiene historial de conversación
 */
async function getConversationHistory(conversationId: string): Promise<Array<{ role: string; content: string }>> {
  const { data: msgs } = await getSupabaseAdmin()
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
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
 * Busca plantilla por ID
 */
async function findTemplateById(
  templateId: string,
  segment?: string | null
): Promise<Template | null> {
  const { data: template } = await getSupabaseAdmin()
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .eq('is_active', true)
    .maybeSingle();

  if (!template) return null;

  // Verificar segmento
  if (template.segment && template.segment !== 'todos' && template.segment !== segment) {
    return null;
  }

  return template as Template;
}

/**
 * Busca plantilla que coincida con el trigger
 */
async function findTemplateByTrigger(text: string, segment?: string | null): Promise<Template | null> {
  const lowerText = text.toLowerCase().trim();

  const { data: templates } = await getSupabaseAdmin()
    .from('templates')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .limit(10);

  if (!templates) return null;

  for (const t of templates) {
    if (!t.trigger) continue;

    const triggers = t.trigger.split(',').map((s: string) => s.trim().toLowerCase());
    if (triggers.some((tr: string) => lowerText.includes(tr))) {
      if (t.segment && t.segment !== 'todos' && t.segment !== segment) continue;
      return t as Template;
    }
  }
  return null;
}

/**
 * Busca plantilla que tenga una acción con el ID dado
 * Esta función se usa para navegación por next_template_id
 */
export async function findTemplateByActionId(
  actionId: string,
  segment?: string | null
): Promise<Template | null> {
  const { data: templates } = await getSupabaseAdmin()
    .from('templates')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .limit(20);

  if (!templates) return null;

  for (const t of templates) {
    if (!t.actions || t.actions.length === 0) continue;
    if (t.segment && t.segment !== 'todos' && t.segment !== segment) continue;

    const matchedAction = t.actions.find((a: any) => a.id === actionId);
    if (matchedAction && matchedAction.next_template_id) {
      return await findTemplateById(matchedAction.next_template_id, segment);
    }
  }
  return null;
}
