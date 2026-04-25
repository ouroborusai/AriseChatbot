import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.ARISE_MASTER_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runInventoryTest() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║      ARISE INVENTORY TEST - DIAMOND PROTOCOL v10.0       ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  // 1. Usar la conversación de test de admin
  const companyId = 'ca69f43b-7b11-4dd3-abe8-8338580b2d84'; // Empresa Real
  
  const { data: conv } = await supabase
    .from('conversations')
    .select('id')
    .eq('company_id', companyId)
    .limit(1)
    .single();

  if (!conv) {
    console.error('No se encontró conversación de test.');
    return;
  }

  console.log(`▶ Iniciando Test de Inventario en Conversación: ${conv.id}`);

  // 2. Enviar pregunta de stock
  const { data: userMsg } = await supabase.from('messages').insert({
    conversation_id: conv.id,
    sender_type: 'user',
    content: 'Hola Arise, ¿qué tenemos en stock de productos industriales?'
  }).select().single();

  console.log('✅ Mensaje de Usuario enviado: "¿qué tenemos en stock...?"');

  // 3. Monitorear la respuesta (Polling)
  console.log('⏳ Esperando razonamiento de la IA...');
  
  let attempts = 0;
  let botActionFound = false;
  let systemResultFound = false;
  let finalResponseFound = false;

  while (attempts < 20) {
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (messages) {
      // Buscar acción del bot
      const botAction = messages.find(m => m.sender_type === 'bot' && m.content.includes('[['));
      if (botAction && !botActionFound) {
        console.log('📦 IA ha generado Acción de Inventario: inventory_scan');
        botActionFound = true;
      }

      // Buscar resultado del sistema
      const systemMsg = messages.find(m => m.sender_type === 'system' && m.content.includes('[SYSTEM_RESULT]'));
      if (systemMsg && !systemResultFound) {
        console.log('🔍 Procesador de Inventario ha devuelto resultados a la conversación.');
        systemResultFound = true;
      }

      // Buscar respuesta final
      const finalMsg = messages.find(m => m.sender_type === 'bot' && !m.content.includes('[[') && (m.created_at > userMsg!.created_at));
      if (finalMsg && systemResultFound && !finalResponseFound) {
        console.log('\n✨ RESPUESTA FINAL DE ARISE:');
        console.log('------------------------------------------------------------');
        console.log(finalMsg.content);
        console.log('------------------------------------------------------------');
        finalResponseFound = true;
        break;
      }
    }

    await new Promise(r => setTimeout(r, 4000));
    attempts++;
  }

  if (finalResponseFound) {
    console.log('\n🏆 TEST DE INVENTARIO: [COMPLETADO CON ÉXITO]');
  } else {
    console.log('\n❌ TEST DE INVENTARIO: [TIMEOUT]');
  }
}

runInventoryTest();
