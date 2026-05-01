import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const API_VERSION = 'v23.0';

async function publishFlow(flowId: string) {
  if (!ACCESS_TOKEN) {
    console.error('❌ Falta WHATSAPP_ACCESS_TOKEN');
    return;
  }

  console.log(`🚀 INTENTANDO PUBLICAR FLOW: ${flowId}`);

  const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${flowId}/publish`, {
    method: 'POST',
    headers: { 
        'Authorization': `Bearer ${ACCESS_TOKEN}`
    }
  });

  const result = await res.json();
  console.log('🏁 Resultado Meta:', JSON.stringify(result, null, 2));

  if (result.success) {
    console.log('✨ ¡ÉXITO! El Flow ahora es PÚBLICO y operativo.');
  } else {
    console.error('❌ Error al publicar. Asegúrate de que el Flow no tenga errores de validación.');
  }
}

const flowId = process.argv[2] || '3141848516022930';
publishFlow(flowId);
