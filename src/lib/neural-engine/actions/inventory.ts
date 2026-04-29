import { SupabaseClient } from '@supabase/supabase-js';
import { InventoryActionParams, NeuralActionResult } from '../interfaces/actions';

/**
 * INVENTORY HANDLER v10.4 Platinum
 * Procesa acciones de inventario: create, add, remove, log, scan.
 */
export async function handleInventoryAction(
  supabase: SupabaseClient,
  actionData: InventoryActionParams,
  companyId: string,
  messageId: string
): Promise<NeuralActionResult[]> {
  const results: NeuralActionResult[] = [];

  // Flexibilidad de Propiedades: Lógica polimórfica (acepta sku, item, name, item_name y product).
  const targetSku = actionData.sku || actionData.params?.sku;
  const targetName = actionData.name || actionData.item_name || actionData.item || actionData.product;
  const targetQuantity = Number(actionData.quantity || actionData.stock || actionData.params?.quantity || 0);

  try {
    if (actionData.action === 'inventory_create') {
      if (!targetName && !targetSku) {
        return [{ action: actionData.action, status: 'validation_failed', error: 'Falta nombre o SKU para crear el item.' }];
      }
      
      const finalSku = targetSku || `SKU-${Date.now().toString().slice(-6)}`;
      const finalName = targetName || `NODO_UNNAMED_${finalSku}`;

      const { data, error } = await supabase
        .from('inventory_items')
        .insert({
          company_id: companyId,
          sku: finalSku,
          name: finalName,
          current_stock: targetQuantity,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      results.push({
        action: actionData.action,
        status: 'success',
        sku: data.sku,
        name: data.name,
        stock: data.current_stock
      });

    } else if (['inventory_add', 'inventory_remove', 'inventory_log'].includes(actionData.action)) {
      if (!targetSku && !targetName) {
        return [{ action: actionData.action, status: 'validation_failed', error: 'Se requiere SKU o nombre visual para modificar inventario.' }];
      }

      // Búsqueda inteligente SKU primero, luego Nombre visual.
      let query = supabase.from('inventory_items').select('*').eq('company_id', companyId);
      
      if (targetSku) {
        query = query.eq('sku', targetSku);
      } else if (targetName) {
        query = query.ilike('name', `%${targetName}%`);
      }

      const { data: items, error: searchError } = await query.limit(1);

      if (searchError) throw searchError;
      
      if (!items || items.length === 0) {
        return [{ action: actionData.action, status: 'item_not_found', error: `No se encontró el nodo logístico ${targetSku || targetName}.` }];
      }

      const item = items[0];
      let newStock = Number(item.current_stock);
      const isOut = actionData.action === 'inventory_remove' || actionData.params?.type === 'out';

      newStock = isOut ? newStock - targetQuantity : newStock + targetQuantity;

      const { data: updated, error: updateError } = await supabase
        .from('inventory_items')
        .update({ current_stock: newStock })
        .eq('id', item.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Alerta de stock bajo proactiva.
      if (updated.current_stock <= (updated.min_stock_alert || 5)) {
        await supabase.from('audit_logs').insert({
          company_id: companyId,
          action: 'LOW_STOCK_ALERT',
          new_data: { sku: updated.sku, stock: updated.current_stock }
        });
      }

      // Shadow PDF Trigger.
      await supabase.from('audit_logs').insert({
        company_id: companyId,
        action: 'TRIGGER_REPORT_REFRESH',
        new_data: { type: 'inventory' }
      });

      results.push({
        action: actionData.action,
        status: 'success',
        sku: updated.sku,
        name: updated.name,
        stock: updated.current_stock,
        suggested_options: [
            { id: 'inventory_view', title: '📦 Ver Stock' },
            { id: 'pdf_inventory', title: '📊 Generar PDF' }
        ]
      });

    } else if (actionData.action === 'inventory_scan') {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('sku, name, current_stock')
        .eq('company_id', companyId)
        .order('current_stock', { ascending: true })
        .limit(10);

      if (error) throw error;
      
      results.push({
        action: actionData.action,
        status: 'success',
        instruction_for_ai: `Resumen de inventario: ${JSON.stringify(data)}`
      });
    }
  } catch (error: any) {
    results.push({
      action: actionData.action,
      status: 'error',
      error: error.message
    });
  }

  return results;
}
