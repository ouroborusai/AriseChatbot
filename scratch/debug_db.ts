import { getSupabaseAdmin } from '../lib/supabase-admin';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debugDB() {
  const supabase = getSupabaseAdmin();
  
  const { data: contacts, error: errC } = await supabase.from('contacts').select('*').limit(1);
  const { data: companies, error: errK } = await supabase.from('companies').select('*').limit(1);
  
  if (errC) console.error('Error Contacts:', errC.message);
  if (errK) console.error('Error Companies:', errK.message);

  console.log('--- DATABASE DATA CHECK (SERVICE ROLE) ---');
  console.log('Contacts Data:', contacts);
}

debugDB();
