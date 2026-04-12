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

    // Instrucción final
    lines.push('- FINALMENTE, haz la conversación más interactiva sugiriendo acciones específicas cuando sea apropiado.');
    lines.push('- Mantén respuestas concisas (máximo 400 caracteres) para WhatsApp.');
    lines.push('- Usa emojis moderadamente para hacer la conversación más amigable.');

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

    // Verificar si quiere hablar con humano
    if (this.wantsHumanAgent(userMessage)) {
      const msg = 'Entiendo. Un asesor especializado de MTZ se comunicará contigo desde este número en breve.';
      await sendWhatsAppMessage(phoneNumber, msg);
      console.log('[AIHandler] ✅ Derivado a humano');
      return { handled: true };
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
      await sendWhatsAppMessage(phoneNumber, aiResponse);

      // Invalidar cache del prompt
      invalidateSystemPromptCache();

      console.log('[AIHandler] ✅ Respuesta Gemini enviada');
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
