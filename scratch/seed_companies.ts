
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const DOCS_PATH = 'c:\\Users\\s_pk_\\Desktop\\MTZ RENTAS\\artifacts\\chatbot_docs';

async function seedCompanies() {
  console.log('🌱 Iniciando sembrado de Empresas desde Chatbot Docs...');

  try {
    const files = fs.readdirSync(DOCS_PATH).filter(f => f.endsWith('.md'));
    console.log(`Encontrados ${files.length} archivos de resumen.`);

    for (const file of files) {
      const filePath = path.join(DOCS_PATH, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      const lines = content.split('\n');
      const legalName = (lines[0] || '').replace('# Resumen Financiero: ', '').trim();
      const rut = (lines[1] || '').replace('RUT: ', '').trim();

      if (!legalName || !rut) {
        console.warn(`⚠️ Saltando archivo mal formateado: ${file}`);
        continue;
      }

      console.log(`  🏢 Insertando: ${legalName} (${rut})...`);

      // Buscar si existe
      const { data: existing } = await supabase
        .from('companies')
        .select('id')
        .eq('rut', rut)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('companies')
          .update({ legal_name: legalName, segment: 'cliente' })
          .eq('id', existing.id);
        if (error) console.error(`  ❌ Error update: ${error.message}`);
      } else {
        const { error } = await supabase
          .from('companies')
          .insert({ legal_name: legalName, rut: rut, segment: 'cliente' });
        if (error) console.error(`  ❌ Error insert: ${error.message}`);
      }
    }

    console.log('\n✨ Sembrado de empresas finalizado.');
  } catch (err: any) {
    console.error('💥 Error fatal:', err.message);
  }
}

seedCompanies();
