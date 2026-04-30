import * as dotenv from 'dotenv';
dotenv.config();

async function checkMetaWebhook() {
  // Probamos con el WHATSAPP_ACCESS_TOKEN que suele tener más permisos de sistema
  const metaToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!metaToken || !phoneNumberId) {
    console.error('❌ Faltan tokens en .env');
    return;
  }

  console.log('🔍 Consultando configuración de Webhook en Meta con WHATSAPP_ACCESS_TOKEN...');

  try {
    const phoneRes = await fetch(`https://graph.facebook.com/v23.0/${phoneNumberId}?fields=whatsapp_business_account_id`, {
      headers: { 'Authorization': `Bearer ${metaToken}` }
    });
    const phoneData = await phoneRes.json();
    
    if (phoneData.error) {
        console.error('❌ Error de API:', phoneData.error.message);
        return;
    }

    const wabaId = phoneData.whatsapp_business_account_id;
    console.log(`✅ WABA ID encontrado: ${wabaId}`);

    // Intentar ver la configuración del WABA
    const wabaRes = await fetch(`https://graph.facebook.com/v23.0/${wabaId}`, {
        headers: { 'Authorization': `Bearer ${metaToken}` }
    });
    const wabaData = await wabaRes.json();
    console.log('📡 INFO WABA:', JSON.stringify(wabaData, null, 2));

  } catch (err) {
    console.error('❌ Error consultando Meta:', err);
  }
}

checkMetaWebhook();
