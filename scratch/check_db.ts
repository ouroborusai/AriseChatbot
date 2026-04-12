import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function check() {
  const { data, error } = await supabase.from('templates').select('*');
  console.log('Error:', error?.message);
  console.log('Data count:', data?.length);
  if (data?.length) {
    console.log('First mapped id:', data[0].id);
  }
}

check();
