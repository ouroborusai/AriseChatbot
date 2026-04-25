import { SupabaseClient } from '@supabase/supabase-js';

export async function handleInventoryAction(
  supabase: SupabaseClient,
  actionData: any,
  companyId: string,
  messageId: string
) {
  const results: any[] = [];

  // 1. INVENTORY_CREATE
  if (actionData.action === 'inventory_create' && actionData.name) {
    // SKU único: timestamp + random para evitar colisiones
    const sku = actionData.sku || `SKU-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const currentStock = parseFloat(actionData.stock) || 0;

    const { data: newItem, error: insertError } = await supabase
      .from('inventory_items')
      .insert({
        company_id: companyId,
        name: actionData.name,
        sku,
        current_stock: currentStock,
        category: actionData.category || 'Varios',
        unit: actionData.unit || 'uds',
      })
      .select()
      .single();

    if (!insertError && newItem) {
      await supabase.from('audit_logs').insert({
        company_id: companyId,
        action: 'NEURAL_INVENTORY_CREATE',
        table_name: 'inventory_items',
        record_id: newItem.id,
        new_data: actionData
      });

      if (currentStock > 0) {
        await supabase.from('inventory_transactions').insert({
          company_id: companyId,
          item_id: newItem.id,
          quantity: currentStock,
          type: 'in',
        });
      }
    }

    results.push({
      action: 'inventory_create',
      status: insertError ? 'failed' : 'success',
      name: actionData.name,
      sku,
      error: insertError?.message
    });
  }

  // 2. INVENTORY_ADD / REMOVE / LOG (SSOT Sync)
  if (
    (actionData.action === 'inventory_add' || 
     actionData.action === 'inventory_remove' || 
     actionData.action === 'inventory_log') &&
    (actionData.sku || actionData.params?.item_id || actionData.item_id)
  ) {
    const sku = actionData.sku || actionData.params?.item_id || actionData.item_id;
    const { data: item } = await supabase
      .from('inventory_items')
      .select('id')
      .or(`sku.ilike.${sku},id.eq.${sku}`)
      .eq('company_id', companyId)
      .maybeSingle();

    if (!item) {
      results.push({ action: actionData.action, status: 'item_not_found', sku });
    } else {
      const quantity = parseFloat(actionData.quantity || actionData.params?.quantity) || 1;
      let type = 'in';
      
      if (actionData.action === 'inventory_remove') type = 'out';
      if (actionData.action === 'inventory_log') {
        type = actionData.params?.type || 'in';
      }

      const { error: transactionError } = await supabase
        .from('inventory_transactions')
        .insert({
          company_id: companyId,
          item_id: item.id,
          quantity,
          type,
        });

      results.push({
        action: actionData.action,
        status: transactionError ? 'failed' : 'success',
        sku,
        error: transactionError?.message,
      });
    }
  }

  // 3. INVENTORY_SCAN
  if (actionData.action === 'inventory_scan' && (actionData.sku || actionData.name)) {
    // Sanitizar input para prevenir SQL injection
    const safeSku = String(actionData.sku || '').replace(/[%_]/g, '');
    const safeName = String(actionData.name || '').replace(/[%_]/g, '');

    const { data: items } = await supabase
      .from('inventory_items')
      .select('id, name, sku, current_stock')
      .eq('company_id', companyId)
      .or(`sku.ilike.%${safeSku}%,name.ilike.%${safeName}%`)
      .limit(10);

    if (items && items.length > 0) {
      // Feedback via WhatsApp (Reutilizando lógica del motor)
      // Nota: Aquí se asume que el webhook ya maneja el feedback o el processor lo gatilla.
      // Por brevedad, solo retornamos los resultados para el log.
      for (const item of items) {
        results.push({ action: 'inventory_scan', status: 'success', sku: item.sku, name: item.name, stock: item.current_stock });
      }
    } else {
      results.push({ action: 'inventory_scan', status: 'not_found', query: actionData.sku || actionData.name });
    }
  }

  return results;
}
