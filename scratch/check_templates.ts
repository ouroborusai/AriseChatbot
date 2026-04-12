
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getSupabaseAdmin } from '../lib/supabase-admin';

async function listTemplates() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('templates')
    .select('id, name, segment, trigger, is_active');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Templates in DB:');
  console.table(data);
}

listTemplates();
