import { SupabaseClient } from '@supabase/supabase-js';
import { SYSTEM_STRINGS } from '../constants';
import { NeuralActionResult, NeuralActionPayload } from '@/lib/whatsapp/types';

// ⚠️ TIPADO SSOT IMPORTADO DIRECTAMENTE DE LA BASE DE DATOS
import type { ServiceRequest, Reminder } from '@/types/database';

/**
 *  TASK & REMINDER HANDLER v12.0 (Diamond Resilience)
 *  Procesa acciones de tareas y recordatorios con aislamiento tenant blindado.
 *  Cero 'any'.
 */
export async function handleTaskAction(
  supabase: SupabaseClient,
  actionData: NeuralActionPayload,
  companyId: string,
  messageId: string
): Promise<NeuralActionResult[]> {
  const results: NeuralActionResult[] = [];

  try {
    // 1. TASK_CREATE (Service Request)
    if (actionData.action === 'task_create') {
      const title = actionData.title || actionData.parameters?.title || actionData.description || actionData.parameters?.description;
      
      if (!title) {
        return [{
          action: 'task_create',
          status: 'validation_failed',
          error: "Missing_Field: 'title'",
          instruction_for_ai: "Solicita al usuario un título o descripción para procesar la tarea."
        }];
      }

      const { data, error } = await supabase.from('service_requests').insert({
        company_id: companyId, // 🛡️ AISLAMIENTO TENANT OBLIGATORIO
        title: title,
        description: actionData.description || actionData.parameters?.description || SYSTEM_STRINGS.NEURAL_AI_CREATED,
        status: 'pending',
      }).select().single();

      if (error) throw error;

      const newTask = data as ServiceRequest;

      // Telemetría de Auditoría Diamond
      await supabase.from('audit_logs').insert({
        company_id: companyId,
        action: 'TASK_CREATED',
        table_name: 'service_requests',
        record_id: newTask.id,
        new_data: { title: newTask.title, status: 'success' }
      });

      results.push({
        action: 'task_create',
        status: 'success',
        suggested_options: [
          { id: 'lst_ver_pendientes', title: '📋 Ver Mis Pendientes' },
          { id: 'lst_agendar_otra', title: '➕ Agendar Otra' }
        ]
      });
    }

    // 2. REMINDER_CREATE / REMINDER_SET
    if (actionData.action === 'reminder_create' || actionData.action === 'reminder_set') {
      const content = actionData.content || actionData.parameters?.description || actionData.parameters?.content || actionData.description;
      const dueAt = actionData.due_at || actionData.parameters?.time || actionData.parameters?.due_at;
      
      if (!content || !dueAt) {
        return [{
          action: actionData.action,
          status: 'validation_failed',
          error: "Incomplete_Data: 'content' or 'due_at' missing",
          instruction_for_ai: "Solicita el contenido y la fecha/hora específica (ISO 8601) para el recordatorio."
        }];
      }

      // Obtener contexto de contacto desde el mensaje de origen
      const { data: msgData, error: msgError } = await supabase
        .from('messages')
        .select('conversation_id, conversations(contact_id)')
        .eq('id', messageId)
        .single();

      if (msgError) throw msgError;

      const contactId = (msgData as unknown as { conversations: { contact_id: string } })?.conversations?.contact_id;

      const { data, error } = await supabase.from('reminders').insert({
        company_id: companyId, // 🛡️ AISLAMIENTO TENANT OBLIGATORIO
        contact_id: contactId,
        content,
        due_at: dueAt,
        status: 'pending'
      }).select().single();

      if (error) throw error;

      const newReminder = data as Reminder;

      // Telemetría de Auditoría Diamond
      await supabase.from('audit_logs').insert({
        company_id: companyId,
        action: 'REMINDER_CREATED',
        table_name: 'reminders',
        record_id: newReminder.id,
        new_data: { due_at: dueAt, status: 'success' }
      });

      results.push({
        action: actionData.action,
        status: 'success',
        suggested_options: [
          { id: 'lst_ver_pendientes', title: '📋 Ver Pendientes' },
          { id: 'lst_notificaciones_on', title: '🔔 Activar Avisos' }
        ]
      });
    }
  } catch (err: unknown) {
    const error = err as Error;
    results.push({
      action: actionData.action,
      status: 'error',
      error: error.message
    });
  }

  return results;
}
