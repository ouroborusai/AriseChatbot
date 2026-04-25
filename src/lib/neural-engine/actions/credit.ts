import { SupabaseClient } from '@supabase/supabase-js';

/**
 * CREDIT ACTION HANDLER v1.0
 * Gestiona la asignación y actualización de límites de crédito
 * en la tabla internal_directory.
 *
 * Acciones soportadas:
 * - credit_limit_set: Establece o actualiza el límite de crédito de un cliente.
 *
 * Formato de acción neural esperado:
 * [[ { "action": "credit_limit_set", "phone": "56911112222", "amount": 500000 } ]]
 */
export async function handleCreditAction(
  supabase: SupabaseClient,
  actionData: any,
  companyId: string,
  messageId: string
) {
  const results: any[] = [];

  if (actionData.action === 'credit_limit_set') {
    const phone = actionData.phone || actionData.params?.phone;
    const amount = actionData.amount ?? actionData.params?.amount;

    // Validación de parámetros requeridos
    if (!phone) {
      results.push({
        action: 'credit_limit_set',
        status: 'failed',
        error: 'Missing required parameter: "phone"',
      });
      return results;
    }

    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      results.push({
        action: 'credit_limit_set',
        status: 'failed',
        error: 'Missing or invalid required parameter: "amount" (must be a number)',
      });
      return results;
    }

    const creditAmount = Number(amount);

    // Verificar que el contacto existe en el directorio de la empresa
    const { data: existingContact, error: lookupError } = await supabase
      .from('internal_directory')
      .select('id, name, role')
      .eq('phone', phone)
      .eq('company_id', companyId)
      .single();

    if (lookupError || !existingContact) {
      results.push({
        action: 'credit_limit_set',
        status: 'failed',
        error: `Contact with phone ${phone} not found in directory. Register the client first using directory_register.`,
      });
      return results;
    }

    // Actualizar el límite de crédito
    const { data, error } = await supabase
      .from('internal_directory')
      .update({
        credit_limit: creditAmount,
        credit_limit_updated_at: new Date().toISOString(),
      })
      .eq('phone', phone)
      .eq('company_id', companyId)
      .select()
      .single();

    if (data) {
      // Registrar en audit_logs para trazabilidad
      await supabase.from('audit_logs').insert({
        company_id: companyId,
        action: 'NEURAL_CREDIT_LIMIT_SET',
        table_name: 'internal_directory',
        record_id: data.id,
        new_data: {
          phone,
          credit_limit: creditAmount,
          updated_by_message: messageId,
        },
      });
    }

    results.push({
      action: 'credit_limit_set',
      status: error ? 'failed' : 'success',
      data: data
        ? { phone, name: data.name, credit_limit: data.credit_limit }
        : undefined,
      error: error?.message,
    });
  }

  return results;
}
