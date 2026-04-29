import { executePDFPipeline } from '../src/lib/pdf/pipeline';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

async function runTest() {
  const targetPhone = '56990062213';
  const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN!;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = (process.env.ARISE_MASTER_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Buscar la primera compañía para el test
  const { data: company } = await supabase.from('companies').select('id, name').limit(1).single();

  if (!company) {
    console.error('No company found in database');
    return;
  }

  console.log(`🚀 Iniciando Test Final de Entrega Industrial...`);
  console.log(`📍 Destino: ${targetPhone}`);
  console.log(`🏢 Compañía: ${company.name} (${company.id})`);

  try {
    const result = await executePDFPipeline({
      targetPhone,
      whatsappToken,
      phoneNumberId,
      reportType: 'pdf_8columnas',
      companyId: company.id
    });

    console.log('✅ TEST EXITOSO:', JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('❌ TEST FALLIDO:', error.message);
  }
}

runTest();
