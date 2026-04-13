/**
 * AI Handler - Manejo de conversación con Gemini (IA) con Contexto de Inventario
 */

import { generateAssistantReply, getSystemPromptCached } from '../ai-service';
import { sendWhatsAppMessage } from '../whatsapp-service';
import { getSupabaseAdmin } from '../supabase-admin';
import { BaseHandler } from './base-handler';
import { TemplateContext } from '../../app/components/templates/types';
import { Contact, Company, HandlerResponse } from '../types';
import { ContextService } from '../services/context-service';

const HUMAN_KEYWORDS = [
  'humano', 'asesor', 'urgente', 'multa', 'fiscalización', 'persona real'
];

export class AIHandler extends BaseHandler {
  constructor(context: TemplateContext) {
    super(context);
  }

  wantsHumanAgent(text: string): boolean {
    const normalized = text.trim().toLowerCase();
    return HUMAN_KEYWORDS.some((keyword) => normalized.includes(keyword));
  }

  /**
   * Construye prompt con datos de Inventario, Documentos y Perfil
   */
  async buildSystemPrompt(basePrompt: string): Promise<string> {
    const lines = [basePrompt.trim(), '\n\n### CONTEXTO DINÁMICO DEL USUARIO:'];

    if (this.context.contact.name) {
      lines.push(`- Nombre: ${this.context.contact.name}`);
    }

    const activeCompany = this.getActiveCompany();
    if (activeCompany) {
      lines.push(`- Empresa: ${activeCompany.legal_name}`);
      try {
        const { InventoryService } = await import('../services/inventory-service');
        const stockSummary = await InventoryService.getBriefStockSummary(activeCompany.id);
        lines.push(`- STOCK ACTUAL EN BODEGA: ${stockSummary}`);
        lines.push('- REGLA: Usa estos datos para responder. No inventes stock si no aparece aquí.');
      } catch (e) {
        console.error('[AIHandler/Debug] ❌ Error stock:', e);
      }
    }

    if (this.context.documents.length > 0) {
      const types = new Set(this.context.documents.map(d => d.document_type));
      lines.push(`- Documentos: ${this.context.documents.length} archivos (${Array.from(types).join(', ')})`);
    }

    lines.push('\n### ATAJOS: Escribir "Archivo", "Negocio", "Cita" o "Menú".');
    lines.push('\n### ESTILO: Tono Asesor Senior (3-5 frases). Sé empático y profesional.');

    const finalPrompt = lines.join('\n');
    return finalPrompt;
  }

  async getConversationHistory(conversationId: string): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    const { data: messages } = await getSupabaseAdmin()
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10);

    return (messages || []).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content || '',
    }));
  }

  async handleAI(
    phoneNumber: string,
    conversationId: string,
    userMessage: string
  ): Promise<HandlerResponse> {
    try {
      if (this.wantsHumanAgent(userMessage)) {
        const { TemplateService } = await import('../services/template-service');
        const { processTemplateResponse } = await import('../webhook-handler');
        const template = await TemplateService.findTemplateById('soporte_ejecutivo', this.context.contact.segment);
        if (template) {
           await processTemplateResponse(phoneNumber, template, this.context, { currentPath: [], history: [] }, conversationId);
           return { handled: true };
        }
      }

      await this.enrichContext();
      const basePrompt = getSystemPromptCached();
      const systemPrompt = await this.buildSystemPrompt(basePrompt);
      const history = await this.getConversationHistory(conversationId);

      const aiResponse = await generateAssistantReply(systemPrompt, history, userMessage, 'customer_support');

      await getSupabaseAdmin().from('messages').insert({ conversation_id: conversationId, role: 'assistant', content: aiResponse });
      await sendWhatsAppMessage(phoneNumber, aiResponse);

      if (aiResponse.length > 150 && !aiResponse.toLowerCase().includes('menú')) {
        const { sendWhatsAppInteractiveButtons } = await import('../whatsapp-service');
        await sendWhatsAppInteractiveButtons(phoneNumber, "¿Deseas realizar otra gestión?", [{ id: 'menu_principal_cliente', title: '🏠 Menú Principal' }]);
      }

      return { handled: true };
    } catch (error) {
      console.error('[AIHandler] ❌ Error:', error);
      await sendWhatsAppMessage(phoneNumber, "Hubo un error. Escribe *Menú*.");
      return { handled: true };
    }
  }
}

export async function handleAI(
  phoneNumber: string,
  conversationId: string,
  contact: Contact,
  companies: Company[],
  activeCompanyId: string | null,
  userMessage: string
): Promise<void> {
  const context = await ContextService.buildContext(contact, companies, activeCompanyId, conversationId);
  const handler = new AIHandler(context);
  await handler.handleAI(phoneNumber, conversationId, userMessage);
}
