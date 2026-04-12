import { getSupabaseAdmin } from '../supabase-admin';
import { sendWhatsAppMessage, sendWhatsAppListMessage } from '../whatsapp-service';
import { HandlerResponse } from '../types';
import { BaseHandler } from './base-handler';
import { TemplateContext } from '../../app/components/templates/types';

export class ServiceRequestHandler extends BaseHandler {
  constructor(context: TemplateContext) {
    super(context);
  }

  /**
   * Muestra la lista de solicitudes activas del cliente
   */
  async listActiveRequests(phoneNumber: string): Promise<HandlerResponse> {
    const requests = this.context.serviceRequests || [];
    
    if (requests.length === 0) {
      await sendWhatsAppMessage(phoneNumber, "Actualmente no tienes solicitudes activas. ✨ ¿Deseas abrir una nueva gestión?");
      // Aquí podríamos disparar el menú de nueva solicitud
      return { handled: true };
    }

    const rows = requests.map(req => ({
      id: `req_detail_${req.id}`,
      title: `🎫 Folio: ${String(req.id).split('-')[0].toUpperCase()}`,
      description: `Estado: ${req.status} | Asunto: ${req.title || 'Sin título'}`
    }));

    await sendWhatsAppListMessage(phoneNumber, {
      body: `🔎 *Tus Solicitudes en curso*\nEncontré ${requests.length} gestiones activas para ti. Pulsa una para ver el detalle:`,
      buttonText: "Ver Solicitudes",
      sections: [{
        title: "Historial Reciente",
        rows: rows
      }]
    });

    return { handled: true };
  }

  /**
   * Muestra el detalle de una solicitud específica
   */
  async showRequestDetail(phoneNumber: string, requestId: string): Promise<HandlerResponse> {
    const { data: request, error } = await getSupabaseAdmin()
      .from('service_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error || !request) {
      await sendWhatsAppMessage(phoneNumber, "No logré encontrar el detalle de esa solicitud. 😕");
      return { handled: true };
    }

    const statusMap: any = {
      'pending': '⏳ Pendiente de Inicio',
      'in_progress': '🛠️ En Procesamiento',
      'waiting_client': '👤 Esperando tu respuesta',
      'completed': '✅ Completada',
      'cancelled': '❌ Cancelada'
    };

    const detail = `🎫 *Detalle de Solicitud*\n\n` +
      `📌 *Estado:* ${statusMap[request.status] || request.status}\n` +
      `📌 *Asunto:* ${request.title || 'N/A'}\n` +
      `📌 *Creada:* ${new Date(request.created_at).toLocaleDateString('es-CL')}\n\n` +
      `📝 *Último Comentario:* ${request.description || 'Sin comentarios adicionales.'}\n\n` +
      `¿Deseas hablar con el asesor a cargo de este trámite?`;

    const { sendWhatsAppInteractiveButtons } = await import('../whatsapp-service');
    await sendWhatsAppInteractiveButtons(phoneNumber, detail, [
      { id: 'btn_humano', title: '📞 Hablar con Asesor' },
      { id: 'ver_solicitudes', title: '⬅️ Volver a Lista' }
    ]);

    return { handled: true };
  }
}
