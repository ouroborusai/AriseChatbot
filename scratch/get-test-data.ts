import { getSupabaseAdmin } from './lib/supabase-admin';

async function getTestData() {
  const { data, error } = await getSupabaseAdmin()
    .from('contacts')
    .select('phone_number, id, segment, contact_companies(company_id, companies(legal_name))')
    .eq('segment', 'cliente')
    .limit(1)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('--- DATOS PARA EL TEST ---');
  console.log(JSON.stringify(data, null, 2));
}

getTestData();
