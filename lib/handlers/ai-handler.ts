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
   * Procesa la entrada del usuario mediante IA (Gemini 2.5 Flash)
   */
  async handleAI(
    phoneNumber: string,
    conversationId: string,
    userMessage: string
  ): Promise<HandlerResponse> {
    try {
      // 1. Verificar si quiere humano
      if (this.wantsHumanAgent(userMessage)) {
        const { TemplateService } = await import('../services/template-service');
        const { processTemplateResponse } = await import('../webhook-handler');
        const template = await TemplateService.findTemplateById('soporte_ejecutivo', this.context.contact.segment);
        if (template) {
           await processTemplateResponse(phoneNumber, template, this.context, { currentPath: [], history: [] }, conversationId);
           return { handled: true };
        }
      }

      // 2. Generar respuesta técnica
      const { generateAssistantReply } = await import('../ai-service');
      const { PromptService } = await import('../services/prompt-service');
      
      const systemPrompt = await PromptService.buildSystemPrompt(this.context);
      const history = this.context.conversationHistory || [];

      const aiResponse = await generateAssistantReply(systemPrompt, history, userMessage, 'customer_support');

      // 3. Persistir y responder
      await this.saveAssistantResponse(aiResponse, conversationId);
      await sendWhatsAppMessage(phoneNumber, aiResponse);

      // 4. Ofrecer menú si es respuesta larga
      if (aiResponse.length > 150 && !aiResponse.toLowerCase().includes('menú')) {
        const { sendWhatsAppInteractiveButtons } = await import('../whatsapp-service');
        await sendWhatsAppInteractiveButtons(phoneNumber, "¿Deseas realizar otra gestión?", [{ id: 'menu_principal_cliente', title: '🏠 Menú Principal' }]);
      }

      return { handled: true };
    } catch (error) {
      console.error('[AIHandler] ❌ Error:', error);
      await sendWhatsAppMessage(phoneNumber, "Hubo un error con mi sistema de inteligencia. Escribe *Menú* para continuar manualmente.");
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
