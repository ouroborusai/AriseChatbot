
import { HandlerResponse, Company, Contact } from '../types';
import { TemplateContext } from '../../app/components/templates/types';
import { handleClassification } from './classification-handler';
import { handleCompanyButton } from './company-handler';
import { handleDocumentButton } from './documents-handler';
import { AppointmentHandler } from './appointment-handler';
import { ServiceRequestHandler } from './service-request-handler';
import { TemplateService } from '../services/template-service';
import { sendWhatsAppMessage, sendWhatsAppInteractiveButtons } from '../whatsapp-service';

/**
 * Enrutador especializado para interacciones (Botones y Listas)
 */
export class InteractiveHandler {
  /**
   * Procesa cualquier interacción ID de WhatsApp
   */
  static async handle(
    interactiveId: string, 
    phoneNumber: string, 
    context: TemplateContext, 
    conversationId: string
  ): Promise<boolean> {
    const { contact, companies, activeCompanyId } = context;

    // 1. Clasificación / Etiquetas
    const classification = await handleClassification(interactiveId, contact as Contact);
    if (classification.handled) {
      if (classification.response) await sendWhatsAppMessage(phoneNumber, classification.response);
      return true;
    }

    // 2. Gestión de Empresas
    if ((await handleCompanyButton(interactiveId, phoneNumber, conversationId, companies as Company[])).handled) return true;

    // 3. Gestión de Documentos
    if ((await handleDocumentButton(interactiveId, phoneNumber, conversationId, contact as Contact, companies as Company[], activeCompanyId)).handled) return true;

    // 4. Gestión de Citas (Appointments)
    const apptHandler = new AppointmentHandler(context);
    if (interactiveId === 'reunion_manana' || interactiveId === 'reunion_tarde') {
      await apptHandler.handleQuickAppointment(phoneNumber, interactiveId, conversationId);
      return true;
    }
    if (interactiveId === 'agendar_cita' || interactiveId === 'appt_start') {
      await apptHandler.startBooking(phoneNumber);
      return true;
    }
    if (interactiveId.startsWith('appt_date_')) {
      await apptHandler.handleDateSelection(phoneNumber, interactiveId);
      return true;
    }
    if (interactiveId.startsWith('appt_time_')) {
      await apptHandler.confirmAppointment(phoneNumber, interactiveId, conversationId);
      return true;
    }
    if (['cita_presencial', 'cita_virtual', 'cita_llamada'].includes(interactiveId)) {
      const names: any = { 'cita_presencial': 'Presencial 🏢', 'cita_virtual': 'Videollamada 💻', 'cita_llamada': 'Llamada 📞' };
      await sendWhatsAppMessage(phoneNumber, `Has seleccionado la modalidad: *${names[interactiveId]}*.\n\nAhora busquemos un cupo disponible...`);
      await apptHandler.startBooking(phoneNumber);
      return true;
    }

    // 5. Gestión de Solicitudes (Service Requests)
    const serviceHandler = new ServiceRequestHandler(context);
    if (interactiveId === 'ver_solicitudes') {
      await serviceHandler.listActiveRequests(phoneNumber);
      return true;
    }
    if (interactiveId.startsWith('req_detail_')) {
      await serviceHandler.showRequestDetail(phoneNumber, interactiveId.replace('req_detail_', ''));
      return true;
    }

    // 6. Gestión de Inventarios
    const { InventoryHandler } = await import('./inventory-handler');
    const invHandler = new InventoryHandler(context);
    if (interactiveId === 'inv_report') {
      await invHandler.showStockSummary(phoneNumber);
      await sendWhatsAppInteractiveButtons(phoneNumber, "¿Deseas realizar otra gestión?", [
        { id: 'gestion_inventario', title: '📦 Volver Inventario' },
        { id: 'menu_principal_cliente', title: '🏠 Menú Inicio' }
      ]);
      return true;
    }
    if (interactiveId === 'inv_add') {
      await invHandler.showAddOptions(phoneNumber);
      return true;
    }
    if (interactiveId === 'inv_new') {
      await sendWhatsAppMessage(phoneNumber, '✨ *CREAR PRODUCTO*\n\nPor favor, responde con el nombre y unidad de medida.\n\nEjemplo: *Harina Especial 25kg*');
      return true;
    }
    if (interactiveId === 'inv_withdraw') {
      await invHandler.showWithdrawOptions(phoneNumber);
      return true;
    }
    if (interactiveId.startsWith('inv_in_')) {
      await sendWhatsAppMessage(phoneNumber, `Has seleccionado el producto. Por favor, escribe la *cantidad a SUMAR* (ej: 10).`);
      return true;
    }
    if (interactiveId.startsWith('inv_out_')) {
      await sendWhatsAppMessage(phoneNumber, `Has seleccionado el producto. Por favor, escribe la *cantidad a DESCONTAR* (ej: 5).`);
      return true;
    }

    // 7. Fallback a Plantillas Dinámicas
    const nextTemplate = await TemplateService.findTemplateByActionId(interactiveId, contact.segment || 'prospecto');
    if (nextTemplate) {
      const { processTemplateResponse } = await import('../webhook-handler');
      const { NavigationService } = await import('../services/navigation-service');
      await processTemplateResponse(phoneNumber, nextTemplate, context, NavigationService.createInitialState(), conversationId);
      return true;
    }

    return false;
  }
}
