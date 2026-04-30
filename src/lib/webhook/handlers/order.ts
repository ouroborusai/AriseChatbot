
import { supabase, logEvent } from '@/lib/webhook/utils';
import { sendWhatsAppMessage } from '@/lib/neural-engine/whatsapp';

/**
 * ARISE NEURAL INVENTORY LOOP (v10.4 Platinum)
 * Sincronización certificada por NotebookLM.
 */
export async function handleOrderMessage(params: {
  order: any;
  sender: string;
  companyId: string;
  whatsappToken: string;
  phoneNumberId: string;
}) {
  const { order, sender, companyId, whatsappToken, phoneNumberId } = params;
  
  try {
    await logEvent({
      companyId,
      action: 'ORDER_RECEIVED_V10_4',
      details: { order, sender }
    });

    const items = order.product_items || [];
    const processedItems = [];

    for (const item of items) {
      const sku = item.product_retailer_id;
      const quantity = parseInt(item.quantity);
      
      // 1. Validación de Inventario en Supabase
      const { data: invItem } = await supabase
        .from('inventory_items')
        .select('id, name, current_stock')
        .eq('company_id', companyId)
        .eq('sku', sku)
        .maybeSingle();

      if (invItem) {
        // 2. Registro de Transacción de Salida
        await supabase.from('inventory_transactions').insert({
          company_id: companyId,
          item_id: invItem.id,
          type: 'out',
          quantity: quantity
        });

        processedItems.push({ name: invItem.name, quantity });
      }
    }

    if (processedItems.length === 0) return false;

    // 3. Respuesta de Confirmación
    const summary = processedItems.map(i => `• ${i.quantity}x ${i.name}`).join('\n');
    await sendWhatsAppMessage({
      to: sender,
      text: `✅ *Pedido Procesado*\n\nSe ha descontado el stock de:\n${summary}\n\nGracias por confiar en LOOP 🟢.`,
      phoneNumberId,
      whatsappToken,
      companyId
    });

    return true;
  } catch (error: any) {
    console.error('[ORDER_HANDLER_ERROR]', error.message);
    await logEvent({
        companyId,
        action: 'ORDER_HANDLER_FATAL',
        details: { error: error.message, order }
    });
    return false;
  }
}
