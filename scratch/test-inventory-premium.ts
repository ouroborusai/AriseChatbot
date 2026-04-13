import { handleInboundUserMessage } from '../lib/webhook-handler';
import { getSupabaseAdmin } from '../lib/supabase-admin';
import { saveMessage } from '../lib/database-service';

async function testInventoryPremium() {
  console.log('--- 💎 TEST DE ESTRÉS: INVENTARIO PREMIUM ---');
  
  const phoneNumber = '56990062213';
  const conversationId = '0c7a01f2-a013-4bd9-8d20-f56a25ea962a';

  // 1. Limpiar historial
  await getSupabaseAdmin().from('messages').delete().eq('conversation_id', conversationId);
  const companyId = '75988be0-b472-4638-89fa-071a93e3d9aa'; // MTZ SPA

  // 2. Crear un producto crítico (Sal)
  console.log('\n[1/2] Preparando producto crítico...');
  await getSupabaseAdmin().from('inventory_items').upsert({
    company_id: companyId,
    name: 'Sal Industrial',
    unit: 'kg',
    current_stock: 3,
    min_stock_alert: 5
  });

  // 3. Test de Búsqueda Semántica
  console.log('\n[2/2] Probando Búsqueda Semántica: "¿Cuanto tenemos de sal?"');
  await handleInboundUserMessage({
    from: phoneNumber,
    text: { body: '¿Cuanto queda de sal?' }
  });

  console.log('\n--- 🔥 TEST FINALIZADO ---');
}

testInventoryPremium();
