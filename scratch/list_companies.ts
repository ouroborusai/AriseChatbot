
import { getSupabaseAdmin } from '../lib/supabase-admin';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listCompanies() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('companies').select('id, legal_name, rut, metadata').limit(5);
  if (error) {
    console.error(error);
    return;
  }
  console.log('COMPANIES (FIRST 5):', JSON.stringify(data, null, 2));
}

listCompanies();
