import { handleInboundUserMessage } from '../lib/webhook-handler';
import { getSupabaseAdmin } from '../lib/supabase-admin';
import { saveMessage } from '../lib/database-service';

async function testInventoryERP() {
  console.log('--- 🧪 TEST DE ESTRÉS: INVENTARIO CONTABLE (CLEAN STATE) ---');
  
  const phoneNumber = '56990062213';
  const conversationId = '0c7a01f2-a013-4bd9-8d20-f56a25ea962a';
  const structuredMessage = 'Harina Especial 25kg, 10, 77374419-K, 150000, 5024, Molinos del Sur S.A.';

  // 1. Limpiar historial para esta prueba
  console.log('\n[1/4] Limpiando historial previo...');
  await getSupabaseAdmin()
    .from('messages')
    .delete()
    .eq('conversation_id', conversationId);

  // 2. Simular interacción de menú
  console.log('\n[2/4] Simulando navegación a Inventario...');
  await saveMessage(conversationId, 'user', '[interactive:inv_add]');

  // 3. Enviar datos estructurados
  console.log('\n[3/4] Enviando carga masiva de stock...');
  await handleInboundUserMessage({
    from: phoneNumber,
    text: { body: structuredMessage }
  });

  // 4. Verificación en Base de Datos
  console.log('\n--- 📊 VERIFICACIÓN EN BASE DE DATOS ---');
  
  const { data: item } = await getSupabaseAdmin()
    .from('inventory_items')
    .select('*')
    .ilike('name', '%Harina%')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (item) {
    console.log('✅ Producto creado/encontrado:', item.name);
    console.log('📈 Stock actual:', item.current_stock);
    
    const { data: trans } = await getSupabaseAdmin()
      .from('inventory_transactions')
      .select('*, inventory_providers(name)')
      .eq('item_id', item.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (trans) {
      console.log('✅ Transacción registrada con éxito');
      console.log('💰 Monto Neto:', trans.net_amount);
      console.log('🧾 IVA (19%):', trans.iva_amount);
      console.log('💵 Total:', trans.total_amount);
      console.log('🏭 Proveedor:', trans.inventory_providers?.name);
      console.log('📄 Factura:', trans.doc_number);
    }
  } else {
    console.error('❌ No se registró el ítem en la base de datos.');
  }

  console.log('\n--- 🔥 TEST FINALIZADO ---');
}

testInventoryERP();
