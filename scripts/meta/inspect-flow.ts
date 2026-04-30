
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const API_VERSION = 'v23.0';
const FLOW_ID = '1679867603465733'; // arise_sii_access_v1

async function inspectFlow() {
  if (!ACCESS_TOKEN) return;

  console.log(`🧐 INSPECCIONANDO FLOW: ${FLOW_ID}\n`);

  const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${FLOW_ID}/assets`, {
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
  });
  const data = await res.json();
  console.log('📦 Assets del Flow:', JSON.stringify(data, null, 2));

  if (data.data && data.data.length > 0) {
    const assetId = data.data[0].id;
    console.log(`\n📥 Descargando asset: ${assetId}...`);
    const assetRes = await fetch(`https://graph.facebook.com/${API_VERSION}/${assetId}`, {
        headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
    });
    // For flow assets, sometimes it's a direct download or a handle.
    // The asset object usually has a 'download_url' or similar if queried specifically.
    console.log('Respuesta Asset:', await assetRes.json());
  }
}

inspectFlow();
