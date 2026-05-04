import { SupabaseClient } from '@supabase/supabase-js';
import { NeuralActionResult, NeuralActionPayload } from '@/lib/whatsapp/types';
import { logEvent } from '@/lib/webhook/utils';

// ⚠️ TIPADO SSOT IMPORTADO DIRECTAMENTE DE LA BASE DE DATOS
import type { InventoryItem } from '@/types/database';

/**
 *  INVENTORY HANDLER v12.0 (Diamond Resilience - Ouroborus Engine)
 *  Procesa acciones de inventario: create, add, remove, log, scan.
 *  Aislamiento Tenant Estricto y Cero 'any'.
 */
export async function handleInventoryAction(
  supabase: SupabaseClient,
  actionData: NeuralActionPayload,
  companyId: string,
  messageId: string
): Promise<NeuralActionResult[]> {
  const results: NeuralActionResult[] = [];

  // Protocolo de Extracción Diamond v12.0
  const targetSku = actionData.sku || actionData.params?.sku;
  const targetName = actionData.name;
  const targetQuantity = Number(actionData.current_stock || actionData.params?.current_stock || 0);

  try {
    if (actionData.action === 'inventory_create') {
      if (!targetName && !targetSku) {
        return [{ action: actionData.action, status: 'validation_failed', error: 'Falta nombre o SKU para crear el nodo logístico.' }];
      }
      
      const finalSku = targetSku || `SKU-${Date.now().toString().slice(-6)}`;
      const finalName = targetName || `NODO_UNNAMED_${finalSku}`;

      const { data, error } = await supabase
        .from('inventory_items')
        .insert({
          company_id: companyId, // 🛡️ AISLAMIENTO TENANT OBLIGATORIO
          sku: finalSku,
          name: finalName,
          current_stock: targetQuantity,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      const item = data as InventoryItem;

      results.push({
        action: actionData.action,
        status: 'success',
        sku: item.sku,
        name: item.name,
        stock: item.current_stock ?? 0
      });

    } else if (['inventory_add', 'inventory_remove', 'inventory_log'].includes(actionData.action)) {
      if (!targetSku && !targetName) {
        return [{ action: actionData.action, status: 'validation_failed', error: 'Se requiere SKU o nombre visual para modificar inventario.' }];
      }

      // 🛡️ Búsqueda con Aislamiento Tenant RLS Mandatorio
      let query = supabase.from('inventory_items')
        .select('*')
        .eq('company_id', companyId);
      
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

      const item = items[0] as InventoryItem;
      let newStock = Number(item.current_stock || 0);
      const isOut = actionData.action === 'inventory_remove' || actionData.params?.type === 'out';

      newStock = isOut ? newStock - targetQuantity : newStock + targetQuantity;

      const { data: updatedRaw, error: updateError } = await supabase
        .from('inventory_items')
        .update({ current_stock: newStock })
        .eq('id', item.id)
        .eq('company_id', companyId) // 🛡️ Doble Verificación Tenant
        .select()
        .single();

      if (updateError) throw updateError;

      const updated = updatedRaw as InventoryItem;

      // Alerta de stock bajo proactiva (Telemetría Integrada)
      if ((updated.current_stock ?? 0) <= (updated.min_stock_alert || 5)) {
        await logEvent({
          companyId,
          action: 'LOW_STOCK_ALERT',
          tableName: 'inventory_items',
          details: { sku: updated.sku, stock: updated.current_stock }
        });
      }

      // Shadow PDF Trigger (Centralización de Auditoría)
      await logEvent({
        companyId,
        action: 'TRIGGER_REPORT_REFRESH',
        tableName: 'inventory_items',
        details: { type: 'inventory' }
      });

      results.push({
        action: actionData.action,
        status: 'success',
        sku: updated.sku,
        name: updated.name,
        stock: updated.current_stock ?? 0,
        suggested_options: [
            { id: 'inventory_view', title: '📦 Ver Stock' },
            { id: 'pdf_inventory', title: '📊 Generar PDF' }
        ]
      });

    } else if (actionData.action === 'inventory_scan') {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('sku, name, current_stock')
        .eq('company_id', companyId) // 🛡️ Aislamiento Tenant
        .order('current_stock', { ascending: true })
        .limit(10);

      if (error) throw error;
      
      results.push({
        action: actionData.action,
        status: 'success',
        instruction_for_ai: `Resumen de inventario: ${JSON.stringify(data)}`
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
