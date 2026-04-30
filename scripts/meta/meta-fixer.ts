
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const API_VERSION = 'v23.0';

async function fixMeta() {
  if (!ACCESS_TOKEN) return;

  console.log('🛠️ META FIXER - LOOP v10.4\n');

  // 1. Intentar publicar un Flow
  const FLOW_ID = '1679867603465733';
  console.log(`🚀 [1/2] Publicando Flow: ${FLOW_ID}...`);
  const pubRes = await fetch(`https://graph.facebook.com/${API_VERSION}/${FLOW_ID}/publish`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
  });
  const pubData = await pubRes.json();
  console.log('   Resultado:', JSON.stringify(pubData, null, 2));

  // 2. Buscar catálogos por Ad Accounts (broad search)
  console.log('\n🕵️ [2/2] Búsqueda profunda de catálogos...');
  const adRes = await fetch(`https://graph.facebook.com/${API_VERSION}/me/adaccounts?fields=name,promotable_catalogs`, {
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
  });
  const adData = await adRes.json();
  console.log('   Ad Accounts:', JSON.stringify(adData, null, 2));
}

fixMeta();
