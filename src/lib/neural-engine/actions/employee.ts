
import { SupabaseClient } from '@supabase/supabase-js';
import { NeuralActionResult, NeuralActionPayload } from '@/lib/whatsapp/types';

/**
 *  EMPLOYEE & HR HANDLER v12.0 (Diamond Resilience)
 *  Procesa acciones de Recursos Humanos con aislamiento tenant blindado.
 *  Cero 'any'.
 */
export async function handleEmployeeAction(
  supabase: SupabaseClient,
  actionData: NeuralActionPayload,
  companyId: string,
  messageId: string
): Promise<NeuralActionResult[]> {
  const results: NeuralActionResult[] = [];

  try {
    // 1. EMPLOYEE_CREATE
    if (actionData.action === 'employee_create') {
      const { full_name, position, contract_type } = actionData;

      if (!full_name) {
        return [{
          action: 'employee_create',
          status: 'validation_failed',
          error: "Missing_Field: 'full_name'",
          instruction_for_ai: "Solicita el nombre completo del trabajador para completar el registro."
        }];
      }

      const { data, error } = await supabase.from('employees').insert({
        company_id: companyId, // 🛡️ AISLAMIENTO TENANT OBLIGATORIO
        full_name,
        position: position || 'Sin especificar',
        contract_type: contract_type || 'Plazo Fijo'
      }).select().single();

      if (error) throw error;

      // Telemetría de Auditoría Diamond
      await supabase.from('audit_logs').insert({
        company_id: companyId,
        action: 'EMPLOYEE_CREATED',
        table_name: 'employees',
        record_id: data.id,
        new_data: { full_name, position, status: 'success' }
      });

      results.push({
        action: 'employee_create',
        status: 'success',
        full_name,
        position,
        suggested_options: [
          { id: 'lst_ver_personal', title: '📋 Ver Nómina' },
          { id: 'lst_nueva_ficha', title: '➕ Nueva Ficha' }
        ]
      });
    }

    // 2. Otros casos (employee_update, employee_terminate) pueden añadirse aquí
    
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
