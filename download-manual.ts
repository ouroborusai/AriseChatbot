
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const API_VERSION = 'v23.0';
const ASSET_ID = '1123471015694200'; // ID obtenido del log anterior

async function downloadManual() {
  if (!ACCESS_TOKEN) return;

  console.log(`📥 DESCARGA MANUAL DEL ASSET: ${ASSET_ID}\n`);

  const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${ASSET_ID}?fields=download_url`, {
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
  });
  const data = await res.json();
  
  if (data.download_url) {
    const contentRes = await fetch(data.download_url);
    const content = await contentRes.text();
    console.log(content);
  } else {
    console.log('❌ Error:', data);
  }
}

downloadManual();
