/**
 * AI Handler - Manejo de conversación con Gemini (IA)
 *
 * Maneja el fallback a Gemini para conversaciones abiertas y respuestas
 * contextuales. Extiende de BaseHandler para acceder a información del
 * contexto y mejorar las respuestas de la IA.
 */

import { generateAssistantReply, getSystemPromptCached, invalidateSystemPromptCache } from '../ai-service';
import { sendWhatsAppMessage } from '../whatsapp-service';
import { getSupabaseAdmin } from '../supabase-admin';
import { BaseHandler, buildContext } from './base-handler';
import { TemplateContext } from '../../app/components/templates/types';
import { Contact, Company, HandlerResponse } from '../types';
import { ContextService } from '../services/context-service';

const HUMAN_KEYWORDS = [
  'humano', 'asesor', 'urgente', 'multa', 'fiscalización', 'fiscalizacion',
  'sii', 'demanda', 'reclamo', 'hablar con persona', 'persona real',
  'atención humana', 'operador'
];

/**
 * Handler especializado para IA con contexto
 */
export class AIHandler extends BaseHandler {
  constructor(context: TemplateContext) {
    super(context);
  }

  /**
   * Verifica si el usuario quiere hablar con un humano
   */
  wantsHumanAgent(text: string): boolean {
    const normalized = text.trim().toLowerCase();
    return HUMAN_KEYWORDS.some((keyword) => normalized.includes(keyword));
  }

  /**
   * Construye prompt del sistema con contexto enriquecido
   *
   * Este método agrega información específica del usuario al prompt
   * para que la IA pueda dar respuestas más personalizadas.
   */
  buildSystemPrompt(basePrompt: string): string {
    const lines = [basePrompt.trim(), '\n\n### Contexto de usuario:'];

    // Nombre del contacto
    if (this.context.contact.name) {
      lines.push(`- Nombre del contacto: ${this.context.contact.name}`);
    }

    // MEMORIA ADAPTATIVA: Estilo de comunicación aprendido
    const metadata = (this.context.contact as any).metadata || {};
    if (metadata.communication_style) {
      lines.push(`- PERFIL APRENDIDO: El usuario prefiere un estilo ${metadata.communication_style}. Respóndele de acuerdo a esta preferencia.`);
    }

    // Segmento y recomendaciones de estilo
    if (this.context.contact.segment === 'cliente') {
      lines.push('- Este usuario es un CLIENTE ACTIVO de MTZ. Atiende con prioridad y claridad.');
      lines.push('- Ofrece opciones útiles como: "Si necesitas tus documentos, puedo mostrarte el menú 📄"');
    } else if (this.context.contact.segment === 'prospecto') {
      lines.push('- Este usuario es un PROSPECTO nuevo. Explica los servicios de MTZ de manera atractiva.');
      lines.push('- Incluye llamado a acción: "¿Quieres una cotización? Responde con 💼"');
    } else {
      lines.push('- No se tiene segmento definido. Pregunta de manera amigable para clasificar.');
    }

    // Empresa activa
    const activeCompany = this.getActiveCompany();
    if (activeCompany) {
      lines.push(`- Empresa activa: ${activeCompany.legal_name}`);
    }

    // Empresas vinculadas
    if (this.context.companies.length > 0) {
      const names = this.context.companies.map(c => c.legal_name).join(', ');
      lines.push(`- Empresas vinculadas (${this.context.companies.length}): ${names}`);
    }

    // Documentos disponibles
    if (this.context.documents.length > 0) {
      const docCount = this.context.documents.length;
      const types = new Set(this.context.documents.map(d => d.document_type));
      lines.push(`- Documentos disponibles: ${docCount} en ${types.size} categorías (${Array.from(types).join(', ')})`);
      lines.push('- Cuando sea relevante, ofrece mostrar documentos: "¿Quieres ver tus documentos disponibles? 📄"');
    }

    // Última acción
    if (this.context.lastAction) {
      lines.push(`- Última acción del usuario: ${this.context.lastAction}`);
    }

    // Instrucciones de Navegación (IDs de Plantillas Disponibles)
    lines.push('\n### Navegación Disponible (Sugiérelas si el usuario las necesita):');
    lines.push('- 📂 ARCHIVO (menu_archivo): Para IVAs, Renta, Documentos.');
    lines.push('- 📊 NEGOCIO (menu_finanzas): Para Balances y Estados Financieros.');
    lines.push('- 👥 PERSONAL (menu_nomina): Para Liquidaciones y RRHH.');
    lines.push('- 📅 CITAS (agendar_cita): Para agendar reuniones.');
    lines.push('- 📋 GESTIÓN (btn_nueva_solicitud): Para trámites nuevos o cambios.');
    lines.push('- 🏢 EMPRESAS (menu_empresas): Para cambiar de empresa.');
    lines.push('\n### REGLA DE ORO DE NAVEGACIÓN:');
    lines.push('- Si el usuario pide explícitamente ver uno de estos menús o realizar esa acción, DEBES incluir al final de tu respuesta el tag: [TRIGGER:id_del_menu]');
    lines.push('- Ejemplo: "Claro, aquí tienes el menú de archivos: [TRIGGER:menu_archivo]"');
    lines.push('\n### INSTRUCCIÓN DE APRENDIZAJE:');
    lines.push('- Analiza continuamente el estilo del usuario. Si detectas una preferencia clara (ej: responde muy corto, es muy formal, usa muchos tecnicismos), incluye al final del mensaje: [LEARN:Breve descripción del estilo]');

    // Instrucción final
    lines.push('\n- FINALMENTE: Si el usuario quiere ver un menú, dile algo como "Puedo mostrarte el menú de [X], ¿quieres verlo?"');
    lines.push('- Mantén respuestas concisas (máximo 400 caracteres). Usa emojis moderadamente.');

    return lines.join('\n');
  }

  /**
   * Obtiene historial de conversación formateado para Gemini
   */
  async getConversationHistory(conversationId: string): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    const { data: messages } = await getSupabaseAdmin()
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20);

    if (!messages) return [];

    return messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content || '',
    }));
  }

  /**
   * Maneja conversación con Gemini
   *
   * @param phoneNumber - Número de WhatsApp del usuario
   * @param conversationId - ID de la conversación en DB
   * @param userMessage - Mensaje del usuario
   */
  async handleAI(
    phoneNumber: string,
    conversationId: string,
    userMessage: string
  ): Promise<HandlerResponse> {
    console.log('[AIHandler] Procesando con Gemini...');

    // DETECCIÓN DE INTENCIÓN: Agendar Cita
    const citaKeywords = ['agendar', 'cita', 'reunion', 'reunión', 'calendario', 'hablar con contador'];
    if (citaKeywords.some(kw => userMessage.toLowerCase().includes(kw)) && !userMessage.includes('[interactive:')) {
       console.log('[AIHandler] 📅 Intención de cita detectada');
       const { TemplateService } = await import('../services/template-service');
       const { processTemplateResponse } = await import('../webhook-handler');
       const template = await TemplateService.findTemplateById('agendar_cita', this.context.contact.segment);
       if (template) {
          await processTemplateResponse(phoneNumber, template, this.context, { currentPath: [], history: [] }, conversationId);
          return { handled: true };
       }
    }

    // Verificar si quiere hablar con humano

    if (this.wantsHumanAgent(userMessage)) {
      console.log('[AIHandler] ✅ Derivación a humano solicitada');
      const { TemplateService } = await import('../services/template-service');
      const { processTemplateResponse } = await import('../webhook-handler');
      const template = await TemplateService.findTemplateById('soporte_ejecutivo', this.context.contact.segment);
      if (template) {
         await processTemplateResponse(phoneNumber, template, this.context, { currentPath: [], history: [] }, conversationId);
         return { handled: true };
      }
    }


    try {
      // Enriquecer contexto con datos frescos
      await this.enrichContext();

      // Obtener prompt base y construir prompt enriquecido
      const basePrompt = getSystemPromptCached();
      const systemPrompt = this.buildSystemPrompt(basePrompt);

      // Obtener historial
      const history = await this.getConversationHistory(conversationId);
      console.log('[AIHandler] Historial:', history.length, 'mensajes');

      // Generar respuesta con Gemini
      const aiResponse = await generateAssistantReply(systemPrompt, history, userMessage);

      // Guardar respuesta en DB
      await getSupabaseAdmin()
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: aiResponse,
        });

      // Enviar respuesta por WhatsApp
      let cleanResponse = aiResponse;
      let triggerId = null;

      // Detectar si la IA quiere disparar un menú
      const triggerMatch = aiResponse.match(/\[TRIGGER:([a-z0-9_]+)\]/i);
      if (triggerMatch) {
        triggerId = triggerMatch[1];
        cleanResponse = aiResponse.replace(/\[TRIGGER:[a-z0-9_]+\]/i, '').trim();
      }

      // Detectar si la IA aprendió algo nuevo (Memoria Adaptativa)
      const learnMatch = aiResponse.match(/\[LEARN:([^\]]+)\]/i);
      if (learnMatch) {
        const trait = learnMatch[1];
        cleanResponse = cleanResponse.replace(/\[LEARN:[^\]]+\]/i, '').trim();
        console.log(`[AIHandler] 🧠 Aprendiendo rasgo: ${trait}`);
        
        // Guardar en Metadata del contacto (Background)
        const currentMetadata = (this.context.contact as any).metadata || {};
        await getSupabaseAdmin()
          .from('contacts')
          .update({ 
            metadata: { ...currentMetadata, communication_style: trait } 
          })
          .eq('id', this.context.contact.id);
      }

      await sendWhatsAppMessage(phoneNumber, cleanResponse);

      // Si hay un trigger, disparar la plantilla correspondiente
      if (triggerId) {
        console.log(`[AIHandler] 🚀 Auto-Trigger detectado: ${triggerId}`);
        const { TemplateService } = await import('../services/template-service');
        const { processTemplateResponse } = await import('../webhook-handler');
        const template = await TemplateService.findTemplateById(triggerId, this.context.contact.segment);
        if (template) {
           await processTemplateResponse(phoneNumber, template, this.context, { currentPath: [], history: [] });
           return { handled: true };
        }
      }

      // --- NAVEGACIÓN PROACTIVA (Botón de cierre si no hay trigger) ---
      // Si la IA no sugirió ya un menú, añadir botón de menú principal
      const lowerResp = aiResponse.toLowerCase();
      const suggestedMenu = lowerResp.includes('menú') || lowerResp.includes('menu') || lowerResp.includes('opciones');
      
      if (!suggestedMenu) {
        const { sendWhatsAppInteractiveButtons } = await import('../whatsapp-service');
        const isProspect = this.context.contact.segment === 'prospecto';
        const backId = isProspect ? 'bienvenida_prospecto' : 'menu_principal_cliente';
        const backTitle = isProspect ? '🏠 Volver al Inicio' : '🏠 Menú Principal';
        const backText = isProspect ? '¿Te gustaría ver nuestros servicios? 💼' : '¿Deseas volver al menú principal de gestiones? 🏢';

        await sendWhatsAppInteractiveButtons(
          phoneNumber,
          backText,
          [{ id: backId, title: backTitle }]
        );
      }

      return { handled: true };
    } catch (error) {
      console.error('[AIHandler] 💥 Error en AI handler:', error);
      const msg = 'Disculpa, tuve un problema. Un asesor te contactará pronto.';
      await sendWhatsAppMessage(phoneNumber, msg);
      return { handled: true };
    }
  }

  /**
   * Genera respuesta contextual basada en el estado actual
   * Útil para sugerencias proactivas
   */
  async generateProactiveSuggestion(): Promise<string | null> {
    // Si es cliente sin empresa activa y tiene múltiples empresas
    if (this.isClient() && this.getCompanyCount() > 1 && !this.hasActiveCompany()) {
      return 'Veo que tienes varias empresas. ¿Para cuál necesitas la gestión hoy?';
    }

    // Si es cliente con documentos nuevos
    const docCount = await this.getDocumentCount();
    if (this.isClient() && docCount > 0 && !this.wasActionPerformed('btn_docs', 3)) {
      return `Tienes ${docCount} documentos disponibles. ¿Quieres verlos? 📄`;
    }

    // Si es prospecto
    if (this.isProspect() && !this.wasActionPerformed('btn_cotizar', 2)) {
      return '¿Te gustaría recibir una cotización de nuestros servicios? 💼';
    }

    return null;
  }
}

// Funciones exportadas para compatibilidad con código existente
export function wantsHumanAgent(text: string): boolean {
  const handler = new AIHandler({
    contact: { id: '', phone_number: '' },
    companies: [],
    activeCompanyId: null,
    documents: [],
    serviceRequests: [],
    lastAction: null,
    conversationHistory: [],
    redirectCount: 0,
  });
  return handler.wantsHumanAgent(text);
}

export async function handleAI(
  phoneNumber: string,
  conversationId: string,
  contact: Contact,
  companies: Company[],
  activeCompanyId: string | null,
  userMessage: string
): Promise<void> {
  // USAR EL NUEVO MOTOR DE CONTEXTO UNIFICADO
  const context = await ContextService.buildContext(contact, companies, activeCompanyId, conversationId);

  const handler = new AIHandler(context);
  await handler.handleAI(phoneNumber, conversationId, userMessage);
}
