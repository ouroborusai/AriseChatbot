
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const DOCS_PATH = 'c:\\Users\\s_pk_\\Desktop\\MTZ RENTAS\\artifacts\\chatbot_docs';

async function ingest() {
  console.log('🚀 Iniciando ingesta de resúmenes financieros...');
  
  const files = fs.readdirSync(DOCS_PATH).filter(f => f.endsWith('.md'));
  console.log(`Encontrados ${files.length} archivos.`);

  for (const file of files) {
    const filePath = path.join(DOCS_PATH, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Parseo rústico pero efectivo del Markdown
    const lines = content.split('\n');
    const legalName = lines[0].replace('# Resumen Financiero: ', '').trim();
    const rut = lines[1].replace('RUT: ', '').trim();
    const period = lines[2].replace('Periodo: ', '').trim();

    // Extraer valores numéricos
    const ventasBruto = content.match(/\*\*Total Ventas \(Bruto\):\*\* \$([\d.]+)/)?.[1] || '0';
    const comprasBruto = content.match(/\*\*Total Compras \(Bruto\):\*\* \$([\d.]+)/)?.[1] || '0';
    const resultadoNeto = content.match(/\*\*Tu resultado neto estimado .* es de \$(-?[\d.]+)\./)?.[1] || '0';
    
    // Extraer propuesta WhatsApp (todo entre las líneas 18 y 27 aprox)
    const whatsappProposalMatch = content.match(/## 💡 Propuesta de Respuesta WhatsApp\n([\s\S]*?)\n---/);
    const whatsappProposal = whatsappProposalMatch ? whatsappProposalMatch[1].trim() : '';

    const financialData = {
      period,
      ventas_bruto: ventasBruto,
      compras_bruto: comprasBruto,
      resultado_neto: resultadoNeto,
      whatsapp_proposal: whatsappProposal,
      updated_at: new Date().toISOString()
    };

    console.log(`Procesando: ${legalName} (${rut})`);

    // Actualizar Supabase
    const { data: company, error: selectError } = await supabase
      .from('companies')
      .select('id, metadata')
      .eq('rut', rut)
      .maybeSingle();

    if (selectError) {
      console.warn(`Error buscando empresa ${rut}:`, selectError.message);
      continue;
    }

    if (company) {
      const newMetadata = {
        ...(company.metadata || {}),
        financial_summary: financialData
      };

      const { error: updateError } = await supabase
        .from('companies')
        .update({ metadata: newMetadata })
        .eq('id', company.id);

      if (updateError) {
        console.error(`Error actualizando empresa ${rut}:`, updateError.message);
      } else {
        console.log(`✅ ${legalName} actualizado.`);
      }
    } else {
      console.warn(`⚠️ Empresa con RUT ${rut} no encontrada en la base de datos.`);
    }
  }

  console.log('✨ Ingesta completada.');
}

ingest();
