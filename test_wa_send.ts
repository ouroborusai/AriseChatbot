import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

import { sendWhatsAppMessage } from './src/lib/neural-engine/whatsapp';

async function test() {
  const targetPhone = '56990062213';
  const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!whatsappToken || !phoneNumberId) {
    console.error('Error: Faltan credenciales de WhatsApp en el .env');
    process.exit(1);
  }

  console.log(`Enviando mensaje de prueba a ${targetPhone}...`);

  try {
    const res = await sendWhatsAppMessage({
      to: targetPhone,
      text: '🤖 *Prueba de Sistema Arise v9.8*\nEste es un mensaje de prueba para verificar la arquitectura de mensajería interactiva. Todo funciona correctamente.',
      options: ['Generar Inventario', 'Revisar Finanzas', 'Opción sin mapeo'],
      phoneNumberId,
      whatsappToken,
      companyId: 'test-company-id' // ID dummy para el audit log en caso de error
    });

    if (res.ok) {
      console.log('✅ Mensaje enviado exitosamente!');
    } else {
      console.error('❌ Error al enviar el mensaje:', await res.text());
    }
  } catch (error) {
    console.error('❌ Error de ejecución:', error);
  }
}

test();
