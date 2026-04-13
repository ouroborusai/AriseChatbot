
import { TemplateContext, Template } from '../../app/components/templates/types';
import { handleCompanyText } from './company-handler';
import { MenuHandler } from './menu-handler';
import { handleAI } from './ai-handler';
import { extractInventoryData } from '../ai-service';
import { TemplateService } from '../services/template-service';
import { getSupabaseAdmin } from '../supabase-admin';
import { sendWhatsAppMessage } from '../whatsapp-service';
import { getActiveCompanyForConversation, createServiceRequest } from '../database-service';

/**
 * Enrutador especializado para mensajes de texto libre
 */
export class TextRouter {
  /**
   * Procesa el flujo de texto de forma secuencial y lógica
   */
  static async handle(
    text: string,
    phoneNumber: string,
    context: TemplateContext,
    conversationId: string
  ): Promise<void> {
    const { contact, companies, activeCompanyId, lastAction } = context;
    const lowerText = text.toLowerCase();

    // 1. Captura de Inventario Estructurado
    if (text.includes(',') && (lastAction === 'inv_add' || lastAction === 'gestion_inventario')) {
      const { InventoryHandler } = await import('./inventory-handler');
      const invHandler = new InventoryHandler(context);
      await invHandler.handleStructuredInput(phoneNumber, text);
      return;
    }

    // 2. Captura de Solicitudes de Trámite
    if (lastAction === 'solicitud_tramite' && text.length > 5 && !lowerText.includes('menu')) {
      const request = await createServiceRequest(contact.id, conversationId, 'general_request', text, activeCompanyId);
      if (request) {
        await sendWhatsAppMessage(phoneNumber, `✅ Solicitud registrada con éxito (Ticket: ${request.request_code}).\n\nHe enviado tu requerimiento al equipo contable.`);
        return;
      }
    }

    // 3. Saludos
    const greetingHandler = new MenuHandler(context);
    if (greetingHandler.isGreeting(text)) {
      const { sendDefaultMenu } = await import('../webhook-handler');
      await sendDefaultMenu(phoneNumber, contact.id, conversationId);
      return;
    }

    // 4. Identificación de Empresa / RUT
    const companySelection = await handleCompanyText(text, phoneNumber, conversationId, companies as any);
    if (companySelection.handled) {
      const { sendDefaultMenu } = await import('../webhook-handler');
      await sendDefaultMenu(phoneNumber, contact.id, conversationId);
      return;
    }

    // 5. Gestión de Inventario (Semántico + IA)
    if (contact.segment === 'cliente') {
      const { InventoryHandler } = await import('./inventory-handler');
      const invHandler = new InventoryHandler(context);
      
      // ¿Cuánto queda?
      const isQuery = lowerText.includes('cuanto queda') || lowerText.includes('stock de') || lowerText.includes('hay de');
      if (isQuery && await invHandler.handleSemanticInquiry(phoneNumber, text)) return;

      // Movimientos naturales
      const inventoryTriggers = ['compramos', 'llegó', 'llegaron', 'anota', 'ingresaron', 'factura', 'compré'];
      if (inventoryTriggers.some(t => lowerText.includes(t)) && text.length > 15) {
        const meta = await extractInventoryData(text);
        if (meta?.producto && meta?.cantidad && await invHandler.handleNaturalInventoryAdd(phoneNumber, meta)) return;
      }
    }

    // 6. Triggers de Plantillas
    const matchedTemplate = await TemplateService.findTemplateByTrigger(text, contact.segment || 'prospecto');
    if (matchedTemplate) {
      const { processTemplateResponse } = await import('../webhook-handler');
      const { NavigationService } = await import('../services/navigation-service');
      await processTemplateResponse(phoneNumber, matchedTemplate, context, NavigationService.createInitialState(), conversationId);
      return;
    }

    // 7. IA Fallback (Asesor Senior)
    await handleAI(phoneNumber, conversationId, contact as any, companies as any, activeCompanyId, text);
  }
}
