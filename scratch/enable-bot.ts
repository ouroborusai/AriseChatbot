import { getSupabaseAdmin } from '../lib/supabase-admin';

async function enableChatbot() {
  const phoneNumber = '56990062213';
  console.log(`🚀 Habilitando Chatbot para ${phoneNumber}...`);
  const { data: conversation } = await getSupabaseAdmin()
    .from('conversations')
    .update({ chatbot_enabled: true })
    .eq('id', '0c7a01f2-a013-4bd9-8d20-f56a25ea962a') // ID del log
    .select();
  
  console.log('✅ Bot habilitado:', conversation);
}

enableChatbot();
