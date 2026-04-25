import { SupabaseClient } from '@supabase/supabase-js';
import { SYSTEM_STRINGS } from '../constants';

export async function handleTaskAction(
  supabase: SupabaseClient,
  actionData: any,
  companyId: string,
  messageId: string
) {
  const results: any[] = [];

  // 1. TASK_CREATE (Service Request)
  if (actionData.action === 'task_create') {
    const title = actionData.title || actionData.parameters?.title || actionData.description || actionData.parameters?.description;
    
    if (title) {
      const { data: newTask, error } = await supabase.from('service_requests').insert({
        company_id: companyId,
        title: title,
        description: actionData.description || actionData.parameters?.description || SYSTEM_STRINGS.NEURAL_AI_CREATED,
        status: 'pending',
      }).select().single();

      if (newTask) {
        await supabase.from('audit_logs').insert({
          company_id: companyId,
          action: 'NEURAL_TASK_CREATE',
          table_name: 'service_requests',
          record_id: newTask.id,
          new_data: actionData
        });
      }

      results.push({
        action: 'task_create',
        status: error ? 'failed' : 'success',
        error: error?.message
      });
    }
  }

  // 2. REMINDER_CREATE / REMINDER_SET (SSOT Sync)
  if (actionData.action === 'reminder_create' || actionData.action === 'reminder_set') {
    const content = actionData.content || actionData.parameters?.description || actionData.parameters?.content || actionData.description;
    
    if (content) {
      const { data: currentMsg } = await supabase.from('messages').select('conversation_id').eq('id', messageId).single();
      const { data: conv } = await supabase.from('conversations').select('contact_id').eq('id', currentMsg?.conversation_id).single();
      
      const dueAt = actionData.due_at || actionData.parameters?.time || actionData.parameters?.due_at || new Date(Date.now() + 86400000).toISOString();

      const { data: newReminder, error } = await supabase.from('reminders').insert({
        company_id: companyId,
        contact_id: conv?.contact_id,
        content,
        due_at: dueAt,
        status: 'pending'
      }).select().single();

      if (newReminder) {
        await supabase.from('audit_logs').insert({
          company_id: companyId,
          action: 'NEURAL_REMINDER_CREATE',
          table_name: 'reminders',
          record_id: newReminder.id,
          new_data: actionData
        });
      }

      results.push({
        action: actionData.action,
        status: error ? 'failed' : 'success',
        error: error?.message
      });
    }
  }

  return results;
}
