import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function debugRouting() {
  const { data: contacts } = await supabase.from('contacts').select('*');
  console.log('Todos los contactos:');
  contacts?.forEach(c => console.log(`Phone: ${c.phone_number}, Segment: ${c.segment}, Name: ${c.name}`));
  
  const { data: t } = await supabase.from('templates').select('id, segment, is_active, trigger');
  console.log('\nTodos los templates activos:');
  t?.forEach(tt => console.log(tt));
}
debugRouting();
