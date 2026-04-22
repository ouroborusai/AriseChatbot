import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Listando todas las empresas...');
  const { data: allCompanies } = await supabase.from('companies').select('id, name');
  console.log('Empresas:', allCompanies);

  if (allCompanies && allCompanies.length > 0) {
    const mmc = allCompanies.find(c => c.name.toLowerCase().includes('mmc'));
    if (mmc) {
      const mmcId = mmc.id;
      console.log(`\nRevisando prompts para ${mmc.name}...`);
      const { data: prompts } = await supabase.from('ai_prompts').select('system_prompt, is_active').eq('company_id', mmcId);
      console.log('Prompts:', prompts);

      console.log('\nRevisando si tu número 56990062213 está asociado a MMC...');
      const { data: contact } = await supabase.from('contacts').select('id, full_name, company_id').eq('phone', '56990062213');
      console.log('Contactos con tu número:', contact);

      const { data: staff } = await supabase.from('internal_directory').select('id, full_name, company_id, role').eq('phone', '56990062213');
      console.log('Directorio interno con tu número:', staff);
    } else {
      console.log('No se encontro empresa con nombre mmc');
    }
  }
}

check();
