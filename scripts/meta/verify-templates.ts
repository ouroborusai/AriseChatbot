
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function verifyTemplates() {
  const access_token = process.env.WHATSAPP_ACCESS_TOKEN;
  const waba_id = process.env.WABA_ID || '930946633057624';
  const api_version = process.env.META_API_VERSION || 'v23.0';

  if (!access_token || !waba_id) {
    console.error('❌ Faltan variables de entorno (WHATSAPP_ACCESS_TOKEN o WABA_ID)');
    return;
  }

  console.log(`🔍 Verificando plantillas para WABA: ${waba_id} (API ${api_version})...`);

  try {
    const url = `https://graph.facebook.com/${api_version}/${waba_id}/message_templates?access_token=${access_token}&limit=100`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error('❌ Error de Meta API:', data.error.message);
      return;
    }

    const templates = data.data || [];
    console.log(`📊 Encontradas ${templates.length} plantillas.\n`);

    if (templates.length === 0) {
      console.log('⚠️ No se encontraron plantillas en esta cuenta.');
      return;
    }

    console.log('ESTADO DE LAS PLANTILLAS:');
    console.log('━'.repeat(50));
    
    templates.forEach((t: any) => {
      const statusColor = t.status === 'APPROVED' ? '✅' : t.status === 'PENDING' ? '⏳' : '❌';
      console.log(`${statusColor} [${t.status}] ${t.name} (${t.language} | ${t.category})`);
    });
    
    console.log('━'.repeat(50));

  } catch (error) {
    console.error('❌ Error fatal:', error);
  }
}

verifyTemplates();
