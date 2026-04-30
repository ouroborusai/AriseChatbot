import { SupabaseClient } from '@supabase/supabase-js';
import type { NeuralActionResult, DirectoryActionParams } from '../interfaces/actions';

/**
 *  DIRECTORY ACTION HANDLER v11.9.1 (Diamond Resilience)
 *  Gestiona el registro y actualización de roles en internal_directory.
 *  SSOT: Cero 'any', Aislamiento Tenant Estricto.
 */
export async function handleDirectoryAction(
    supabase: SupabaseClient,
    actionData: DirectoryActionParams,
    companyId: string,
    messageId: string
): Promise<NeuralActionResult[]> {
    const results: NeuralActionResult[] = [];

    try {
        if (actionData.action === 'directory_register' || actionData.action === 'directory_update' || actionData.action === 'register_client') {
            const phone = actionData.phone || actionData.params?.phone;
            const name = actionData.name || actionData.params?.name;
            const role = actionData.role || actionData.params?.role || 'CLIENTE';

            if (!phone || !name) {
                results.push({ 
                    action: actionData.action, 
                    status: 'validation_failed', 
                    error: 'Faltan parámetros requeridos (phone, name)' 
                });
                return results;
            }

            if (actionData.action === 'register_client') {
                const { error } = await supabase
                    .from('contacts')
                    .upsert({
                        company_id: companyId,
                        phone: phone,
                        full_name: name,
                        category: 'client',
                        created_at: new Date().toISOString()
                    }, { onConflict: 'phone' });

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('internal_directory')
                    .upsert({
                        company_id: companyId,
                        phone: phone,
                        name: name,
                        role: role as 'ADMIN' | 'MMC' | 'PROVEEDOR' | 'CONTADOR' | 'CLIENTE' | 'PROSPECTO',
                        created_at: new Date().toISOString()
                    }, { onConflict: 'phone' });

                if (error) throw error;
            }

            results.push({ 
                action: actionData.action, 
                status: 'success', 
                name, 
                phone 
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
