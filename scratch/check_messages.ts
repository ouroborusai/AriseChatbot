import { getSupabaseAdmin } from '../lib/supabase-admin';

async function checkDatabaseActivity() {
  console.log('--- 🔍 AUDITORÍA DE RECEPCIÓN: SUPABASE ---');
  
  // 1. Verificar Mensajes
  const { data: msgs, error: mErr } = await getSupabaseAdmin()
    .from('messages')
    .select('*, conversations(phone_number)')
    .order('created_at', { ascending: false })
    .limit(5);

  if (mErr) {
    console.error('❌ Error consultando mensajes:', mErr);
  } else if (!msgs || msgs.length === 0) {
    console.log('⚠️ No hay mensajes registrados en la tabla.');
  } else {
    console.log('\n✅ Últimos 5 mensajes encontrados:');
    msgs.forEach((m: any) => {
      const phone = m.conversations?.phone_number || 'N/A';
      console.log(`[${m.created_at}] | ${phone} | ${m.role}: ${m.content.substring(0, 40)}...`);
    });
  }

  // 2. Verificar Conversaciones
  const { data: convs, error: cErr } = await getSupabaseAdmin()
    .from('conversations')
    .select('phone_number, updated_at, chatbot_enabled')
    .order('updated_at', { ascending: false })
    .limit(3);

  if (cErr) {
    console.error('❌ Error consultando conversaciones:', cErr);
  } else {
    console.log('\nÚltimas 3 conversaciones con actividad:');
    convs.forEach(c => {
      console.log(`${c.phone_number} - Actualizada: ${c.updated_at} [Bot: ${c.chatbot_enabled ? 'AUTO' : 'MANUAL'}]`);
    });
  }

  console.log('\n--- 🏁 FIN DE AUDITORÍA ---');
}

checkDatabaseActivity();
