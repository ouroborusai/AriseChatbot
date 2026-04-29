import { SupabaseClient } from '@supabase/supabase-js';
import { SYSTEM_STRINGS } from '../constants';
import { TaskActionParams, NeuralActionResult } from '../interfaces/actions';
import { logEvent } from '@/lib/webhook/utils';

export async function handleTaskAction(
  supabase: SupabaseClient,
  actionData: TaskActionParams,
  companyId: string,
  messageId: string
): Promise<NeuralActionResult[]> {
  const results: NeuralActionResult[] = [];

  // 1. TASK_CREATE (Service Request)
  if (actionData.action === 'task_create') {
    const title = actionData.title || actionData.parameters?.title || actionData.description || actionData.parameters?.description;
    
    // Validación Estricta (NotebookLM Step 3.2)
    if (!title) {
      results.push({
        action: 'task_create',
        status: 'validation_failed',
        error: "Missing 'title'",
        instruction_for_ai: "Pide al usuario un título o descripción para la tarea."
      });
      return results;
    }

    const { data: newTask, error } = await supabase.from('service_requests').insert({
      company_id: companyId,
      title: title,
      description: actionData.description || actionData.parameters?.description || SYSTEM_STRINGS.NEURAL_AI_CREATED,
      status: 'pending',
    }).select().single();

    if (newTask && !error) {
      await logEvent({
        companyId,
        action: 'TASK_CREATED',
        details: { record_id: newTask.id, title, status: 'success' }
      });
    }

    results.push({
      action: 'task_create',
      status: error ? 'failed' : 'success',
      error: error?.message,
      suggested_options: error ? undefined : [
        { id: 'lst_ver_pendientes', title: '📋 Ver Mis Pendientes' },
        { id: 'lst_agendar_otra', title: '➕ Agendar Otra' }
      ]
    });
  }

  // 2. REMINDER_CREATE / REMINDER_SET (SSOT Sync)
  if (actionData.action === 'reminder_create' || actionData.action === 'reminder_set') {
    const content = actionData.content || actionData.parameters?.description || actionData.parameters?.content || actionData.description;
    const dueAt = actionData.due_at || actionData.parameters?.time || actionData.parameters?.due_at;
    
    // Validación Estricta de Fecha (NotebookLM Step 3.2)
    if (!content || !dueAt) {
      results.push({
        action: actionData.action,
        status: 'validation_failed',
        error: "Missing 'content' or 'due_at'",
        instruction_for_ai: "Pide al usuario el contenido y la fecha/hora específica para el recordatorio."
      });
      return results;
    }

    const { data: currentMsg } = await supabase.from('messages').select('conversation_id').eq('id', messageId).single();
    const { data: conv } = await supabase.from('conversations').select('contact_id').eq('id', currentMsg?.conversation_id).single();

    const { data: newReminder, error } = await supabase.from('reminders').insert({
      company_id: companyId,
      contact_id: conv?.contact_id,
      content,
      due_at: dueAt,
      status: 'pending'
    }).select().single();

    if (newReminder && !error) {
      await logEvent({
        companyId,
        action: 'REMINDER_CREATED',
        details: { record_id: newReminder.id, due_at: dueAt, status: 'success' }
      });
    }

    results.push({
      action: actionData.action,
      status: error ? 'failed' : 'success',
      error: error?.message,
      suggested_options: error ? undefined : [
        { id: 'lst_ver_pendientes', title: '📋 Ver Pendientes' },
        { id: 'lst_notificaciones_on', title: '🔔 Activar Avisos' }
      ]
    });
  }

  return results;
}
