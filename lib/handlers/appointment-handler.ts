import { getSupabaseAdmin } from '../supabase-admin';
import { sendWhatsAppMessage, sendWhatsAppInteractiveButtons, sendWhatsAppListMessage } from '../whatsapp-service';
import { BUTTON_IDS, HandlerResponse } from '../types';
import { BaseHandler } from './base-handler';
import { TemplateContext } from '../../app/components/templates/types';

export class AppointmentHandler extends BaseHandler {
  constructor(context: TemplateContext) {
    super(context);
  }

  /**
   * Inicia el flujo de agendamiento
   */
  async startBooking(phoneNumber: string): Promise<HandlerResponse> {
    const buttons = [
      { id: 'appt_date_today', title: 'Hoy' },
      { id: 'appt_date_tomorrow', title: 'Mañana' },
      { id: 'appt_date_other', title: 'Otro día' }
    ];

    await sendWhatsAppInteractiveButtons(
      phoneNumber,
      '¡Genial! Agendemos una cita. 📅\n\n¿Para qué día te gustaría la reunión?',
      buttons
    );

    return { handled: true };
  }

  /**
   * Maneja la selección del día y ofrece horas
   */
  async handleDateSelection(phoneNumber: string, dateId: string): Promise<HandlerResponse> {
    let selectedDate = new Date();
    
    if (dateId === 'appt_date_tomorrow') {
      selectedDate.setDate(selectedDate.getDate() + 1);
    } else if (dateId === 'appt_date_other') {
      await sendWhatsAppMessage(phoneNumber, 'Por favor, dime qué fecha te acomoda en formato *DD-MM* (Ejemplo: 25-04). 🖊️');
      return { handled: true };
    }

    const dateStr = selectedDate.toISOString().split('T')[0];
    
    const timeSlots = [
      { id: `appt_time_${dateStr}_09:00`, title: '09:00 AM', description: 'Bloque Mañana' },
      { id: `appt_time_${dateStr}_11:00`, title: '11:00 AM', description: 'Bloque Mañana' },
      { id: `appt_time_${dateStr}_15:00`, title: '03:00 PM', description: 'Bloque Tarde' },
      { id: `appt_time_${dateStr}_17:00`, title: '05:00 PM', description: 'Bloque Tarde' }
    ];

    await sendWhatsAppListMessage(phoneNumber, {
      body: `Perfecto para el día *${selectedDate.toLocaleDateString('es-CL')}*. 🗓️\n\n¿En qué horario prefieres?`,
      buttonText: 'Ver horarios',
      sections: [{
        title: 'Horarios Disponibles',
        rows: timeSlots
      }]
    });

    return { handled: true };
  }

  /**
   * Guarda la cita final
   */
  async confirmAppointment(phoneNumber: string, timeId: string, conversationId: string): Promise<HandlerResponse> {
    // ID format: appt_time_YYYY-MM-DD_HH:MM
    const parts = timeId.split('_');
    const date = parts[2];
    const time = parts[3];

    const { error } = await getSupabaseAdmin()
      .from('appointments')
      .insert({
        contact_id: this.context.contact.id,
        company_id: this.context.activeCompanyId || null,
        appointment_date: date,
        appointment_time: time,
        status: 'pending',
        notes: `Agendado vía WhatsApp Bot en conversación ${conversationId}`
      });

    if (error) {
      console.error('[AppointmentHandler] Error:', error);
      await sendWhatsAppMessage(phoneNumber, 'Hubo un error al guardar tu cita. Un asesor te contactará para confirmar manualmente. 📞');
    } else {
      await sendWhatsAppMessage(phoneNumber, `¡Cita Agendada! ✅\n\n📅 Fecha: *${date}*\n⏰ Hora: *${time}*\n\nTe hemos enviado un correo de confirmación y un asesor de MTZ revisará los detalles. ¡Nos vemos!`);
    }

    return { handled: true };
  }
}
