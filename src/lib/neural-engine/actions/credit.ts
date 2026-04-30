import { SupabaseClient } from '@supabase/supabase-js';
import type { NeuralActionResult, CreditActionParams } from '../interfaces/actions';

/**
 *  CREDIT ACTION HANDLER v11.9.1 (Diamond Resilience)
 *  Gestiona la asignación y actualización de límites de crédito.
 *  SSOT: Cero 'any', Aislamiento Tenant Inquebrantable vía .eq('company_id', companyId).
 */
export async function handleCreditAction(
    supabase: SupabaseClient,
    actionData: CreditActionParams,
    companyId: string,
    messageId: string
): Promise<NeuralActionResult[]> {
    const results: NeuralActionResult[] = [];

    try {
        if (actionData.action === 'credit_limit_set') {
            const phone = actionData.phone || actionData.params?.phone;
            const amount = Number(actionData.amount ?? actionData.params?.amount);

            if (!phone || isNaN(amount)) {
                results.push({ 
                    action: actionData.action, 
                    status: 'validation_failed', 
                    error: 'Faltan parámetros requeridos (phone, amount)' 
                });
                return results;
            }

            const { data, error } = await supabase
                .from('internal_directory')
                .update({ credit_limit: amount, credit_limit_updated_at: new Date().toISOString() })
                .eq('company_id', companyId)
                .eq('phone', phone)
                .select()
                .single();

            if (error) throw error;

            if (!data) {
                results.push({ 
                    action: actionData.action, 
                    status: 'item_not_found', 
                    error: 'Directorio interno no encontrado para este número en esta empresa.' 
                });
                return results;
            }

            results.push({ 
                action: actionData.action, 
                status: 'success'
            });
        }
    } catch (error: unknown) {
        const err = error as Error;
        results.push({ 
            action: actionData.action, 
            status: 'error', 
            error: err.message 
        });
    }

    return results;
}
