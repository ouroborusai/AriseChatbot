import { getSupabaseAdmin } from '../lib/supabase-admin';

async function debugHistory() {
  const conversationId = '0c7a01f2-a013-4bd9-8d20-f56a25ea962a';
  const { data: messages } = await getSupabaseAdmin()
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(5);

  console.table(messages);
}

debugHistory();
