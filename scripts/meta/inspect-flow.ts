
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const API_VERSION = 'v23.0';
const FLOW_ID = process.argv[2] || '3141848516022930'; // Default to inventory flow

async function inspectFlow() {
  if (!ACCESS_TOKEN) return;

  console.log(`🧐 INSPECCIONANDO FLOW: ${FLOW_ID}\n`);

  const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${FLOW_ID}/assets`, {
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
  });
  const data = await res.json();
  console.log('📦 Assets del Flow:', JSON.stringify(data, null, 2));

  if (data.data && data.data.length > 0) {
    const asset = data.data.find((a: any) => a.asset_type === 'FLOW_JSON');
    if (asset && asset.download_url) {
        console.log(`\n📥 Descargando FLOW_JSON desde: ${asset.download_url.substring(0, 50)}...`);
        const jsonRes = await fetch(asset.download_url);
        const flowJson = await jsonRes.json();
        console.log('\n📄 CONTENIDO DEL FLOW JSON:\n');
        console.log(JSON.stringify(flowJson, null, 2));
    }
  }
}

inspectFlow();
