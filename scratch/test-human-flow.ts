import { handleInboundUserMessage } from '../lib/webhook-handler';
import { getSupabaseAdmin } from '../lib/supabase-admin';

/**
 * Suite de Pruebas de Lenguaje Natural "Humano"
 * Simula interacciones reales con el cluster de 8 llaves
 */
async function runHumanTests() {
  const testPhone = '56990062213';
  const supabase = getSupabaseAdmin();
  
  console.log('🚀 PREPARANDO ESCENARIO REAL...');
  
  // 1. Asegurar contacto y segmento
  const { data: contact } = await supabase.from('contacts').update({ segment: 'cliente' }).eq('phone_number', testPhone).select().single();
  
  // 2. Usar la empresa específica que el bot tiene vinculada para este test (MTZ Consultores)
  const targetId = '687278c6-88d1-4172-a8e2-a6775adbb073';
  const { data: company } = await supabase.from('companies').select('id, legal_name').eq('id', targetId).single();
  
  if (company && contact) {
    const companyId = company.id;
    console.log(`🔍 Empresa objetivo SINCRONIZADA: ${company.legal_name} (${companyId})`);

    // Vincular empresa y marcar PRIMARIA
    await supabase.from('contact_companies').upsert({ contact_id: contact.id, company_id: companyId, is_primary: true });
    
    // Forzar ACTIVE_COMPANY en la conversación
    await supabase.from('conversations').upsert({ 
      phone_number: testPhone, 
      contact_id: contact.id, 
      active_company_id: companyId,
      is_open: true 
    }, { onConflict: 'phone_number' });
    
    // CREAR PRODUCTO CON STOCK VERIFICADO
    await supabase.from('inventory_items').delete().eq('company_id', companyId).eq('name', 'Harina Flor'); // Limpiar
    const { data: newItem } = await supabase.from('inventory_items').insert({
        company_id: companyId,
        name: 'Harina Flor',
        unit: 'unidad',
        current_stock: 45,
        min_stock_alert: 10
    }).select().single();
    
    // VERIFICACIÓN MANUAL ANTES DEL TEST
    const { count } = await supabase.from('inventory_items').select('*', { count: 'exact', head: true }).eq('company_id', companyId);
    console.log(`✅ Escenario listo: Empresa "${company.legal_name}" tiene ${count} productos en DB.`);
  }

  console.log('\n🚀 INICIANDO TEST DE FLUJO HUMANO (MTZ v2.0)\n');

  const scenarios = [
    {
      name: '1. CONSULTA DE ASESORÍA',
      text: 'Hola, me llegó una notificación del SII sobre una multa pendiente. ¿Ustedes ven eso?'
    },
    {
      name: '2. REGISTRO DE STOCK NATURAL',
      text: 'Oye anota que llegaron 15 sacos de Harina Flor del proveedor Molino Central (RUT 76.123.456-7). La factura es la 885 y el neto fue 150.000.'
    },
    {
      name: '3. CONSULTA DE INVENTARIO BODEGA',
      text: '¿Cuanto queda de Harina?'
    }
  ];

  for (const scenario of scenarios) {
    console.log(`\n------------------------------------------------`);
    console.log(`TEST: ${scenario.name}`);
    console.log(`USUARIO: "${scenario.text}"`);
    console.log(`------------------------------------------------`);
    
    try {
      const payload = {
        from: testPhone,
        profileName: 'Carlos Test',
        text: { body: scenario.text }
      };

      await handleInboundUserMessage(payload);
      
      // ESPERAR MÁS TIEMPO PARA QUE LA IA RESPONDA Y GUARDE EN DB
      await new Promise(r => setTimeout(r, 4000));
      
      // BUSCAR RESPUESTA EN DB PARA MOSTRARLA
      const { data: conv } = await supabase.from('conversations').select('id').eq('phone_number', testPhone).single();
      if (conv) {
        const { data: msg } = await supabase.from('messages')
          .select('content')
          .eq('conversation_id', conv.id)
          .eq('role', 'assistant')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        console.log(`\n🤖 BOT: "${msg?.content}"`);
      }
      
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.error(`❌ Error en ${scenario.name}:`, err);
    }
  }

  console.log('\n🏁 PRUEBAS FINALIZADAS.');
}

runHumanTests();
