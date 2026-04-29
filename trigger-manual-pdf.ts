import 'dotenv/config';
import { executePDFPipeline } from './src/lib/pdf/pipeline';

async function trigger() {
  console.log('🚀 [MANUAL_TRIGGER] Iniciando generación forzada de PDF...');
  
  // Usar las variables del .env directamente para evitar fallos de contexto
  const params = {
    targetPhone: '56990062213',
    whatsappToken: process.env.WHATSAPP_ACCESS_TOKEN!,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '1066879279838439',
    reportType: 'pdf_8columnas',
    companyId: 'ca69f43b-7b11-4dd3-abe8-8338580b2d84'
  };

  if (!params.whatsappToken) {
    console.error('❌ Error: WHATSAPP_ACCESS_TOKEN no encontrado en .env');
    return;
  }

  try {
    const result = await executePDFPipeline(params);
    console.log('✅ [SUCCESS] PDF generado y enviado:', result);
  } catch (error: any) {
    console.error('❌ [FAILURE] Error en el disparo manual:', error.message);
  }
}

trigger();
