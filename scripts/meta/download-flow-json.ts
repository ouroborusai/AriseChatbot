
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const API_VERSION = 'v23.0';
const FLOW_ID = '1679867603465733'; // arise_sii_access_v1

async function downloadFlowJson() {
  if (!ACCESS_TOKEN) return;

  console.log(`📥 OBTENIENDO JSON DEL FLOW: ${FLOW_ID}\n`);

  // 1. Obtener la lista de assets para encontrar el ID del flow.json
  const assetsRes = await fetch(`https://graph.facebook.com/${API_VERSION}/${FLOW_ID}/assets`, {
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
  });
  const assets = await assetsRes.json();
  console.log('DEBUG Assets:', JSON.stringify(assets, null, 2));
  
  const flowJsonAsset = assets.data?.find((a: any) => a.asset_type === 'FLOW_JSON');
  if (!flowJsonAsset) {
    console.error('❌ No se encontró flow.json en los assets.');
    return;
  }

  console.log(`✅ Asset encontrado: ${flowJsonAsset.id}`);

  // 2. Obtener el link de descarga (usando el asset ID)
  // Nota: Para flows, a veces hay que usar un endpoint específico o el asset ID directamente.
  const downloadRes = await fetch(`https://graph.facebook.com/${API_VERSION}/${flowJsonAsset.id}?fields=download_url`, {
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
  });
  const downloadData = await downloadRes.json();
  
  if (downloadData.download_url) {
    console.log('🔗 Link de descarga:', downloadData.download_url);
    const contentRes = await fetch(downloadData.download_url);
    const content = await contentRes.text();
    console.log('\n📄 CONTENIDO DEL JSON:\n');
    console.log(content);
  } else {
    console.log('❌ No se pudo obtener el download_url:', downloadData);
  }
}

downloadFlowJson();
