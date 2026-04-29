import { sendWhatsAppMessage } from './src/lib/neural-engine/whatsapp';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const targetPhone = '56990062213';
  const companyId = 'ca69f43b-7b11-4dd3-abe8-8338580b2d84'; // Tu empresa real
  
  const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN!;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;

  console.log(`[TEST_STEP_1] Sending real-context menu to ${targetPhone}...`);

  try {
    const res = await sendWhatsAppMessage({
      to: targetPhone,
      text: "🛡️ *Prueba de Sistema Arise v10.2*\n\nHe corregido los protocolos de identidad. Por favor, selecciona el reporte para validar la generación nativa:",
      options: [
        { id: 'pdf_8columnas', title: '📊 Balance 8 Columnas', description: 'Ejecución nativa sin Puppeteer' },
        { id: 'pdf_inventory', title: '📦 Inventario Maestro', description: 'Validación de stock en tiempo real' }
      ],
      phoneNumberId,
      whatsappToken,
      companyId
    });

    if (res.ok) {
      console.log('✅ Paso 1 completado: Menú enviado.');
    } else {
      const err = await res.json();
      console.error('❌ Error en Paso 1:', err);
    }
  } catch (err) {
    console.error('❌ Error fatal:', err);
  }
}

main();
