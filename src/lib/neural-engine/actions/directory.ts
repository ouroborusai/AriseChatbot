import { SupabaseClient } from '@supabase/supabase-js';

/**
 * DIRECTORY ACTION HANDLER v10.0
 * Gestiona el registro y actualización de roles en internal_directory.
 */
export async function handleDirectoryAction(
  supabase: SupabaseClient,
  actionData: any,
  companyId: string,
  messageId: string
) {
  const results: any[] = [];

  // directory_register / directory_update
  if (actionData.action === 'directory_register' || actionData.action === 'directory_update' || actionData.action === 'register_client') {
    const phone = actionData.phone || actionData.params?.phone;
    const name = actionData.name || actionData.params?.name;
    const role = actionData.role || actionData.params?.role || 'CLIENTE';

    if (!phone) {
        // Intentar recuperar el teléfono del prospecto si no viene en el JSON
        // Buscamos el mensaje anterior en la conversación si es posible
        results.push({ 
            action: actionData.action, 
            status: 'failed', 
            error: 'Missing phone number. Please provide "phone" in the action block.' 
        });
        return results;
    }

    const { data, error } = await supabase.from('internal_directory').upsert({
      company_id: companyId,
      phone,
      name: name || 'Usuario Arise',
      role: role.toUpperCase()
    }, { onConflict: 'phone' }).select().single();

    if (data) {
      await supabase.from('audit_logs').insert({
        company_id: companyId,
        action: `NEURAL_DIRECTORY_${actionData.action.toUpperCase()}`,
        table_name: 'internal_directory',
        record_id: data.id,
        new_data: actionData
      });
    }

    results.push({
      action: actionData.action,
      status: error ? 'failed' : 'success',
      error: error?.message
    });
  }

  return results;
}
