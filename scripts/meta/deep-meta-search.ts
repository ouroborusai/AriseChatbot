
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WABA_ID = process.env.WABA_ID || '930946633057624';
const BUSINESS_ID = process.env.META_BUSINESS_ID;
const API_VERSION = 'v23.0';

async function deepMetaSearch() {
  if (!ACCESS_TOKEN) return;

  console.log('🔍 DEEP META SEARCH - BUSCANDO ACTIVOS PERDIDOS\n');

  // 1. Buscar Catálogos por múltiples vías
  console.log('📦 Buscando Catálogos...');
  
  // Vía Business ID (Owned)
  const ownedRes = await fetch(`https://graph.facebook.com/${API_VERSION}/${BUSINESS_ID}/owned_product_catalogs`, {
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
  });
  const owned = await ownedRes.json();
  console.log('   - Owned by Business:', owned.data?.length || 0);

  // Vía Business ID (Client/Shared)
  const clientRes = await fetch(`https://graph.facebook.com/${API_VERSION}/${BUSINESS_ID}/client_product_catalogs`, {
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
  });
  const client = await clientRes.json();
  console.log('   - Shared with Business:', client.data?.length || 0);

  // Vía WABA
  const wabaCatRes = await fetch(`https://graph.facebook.com/${API_VERSION}/${WABA_ID}/product_catalogs`, {
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
  });
  const wabaCat = await wabaCatRes.json();
  console.log('   - Linked to WABA:', wabaCat.data?.length || 0);
  if (wabaCat.data) wabaCat.data.forEach((c: any) => console.log(`     -> ID: ${c.id} (${c.name || 'Sin nombre'})`));

  // 2. Analizar Flows (Detalle de errores o por qué no están publicados)
  console.log('\n🌊 Analizando Flows...');
  const flowsRes = await fetch(`https://graph.facebook.com/${API_VERSION}/${WABA_ID}/flows?fields=id,name,status,validation_errors`, {
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
  });
  const flows = await flowsRes.json();
  if (flows.data) {
    for (const flow of flows.data) {
      console.log(`   - Flow: ${flow.name} [${flow.status}]`);
      if (flow.validation_errors) {
        console.log('     ❌ Errores:', JSON.stringify(flow.validation_errors, null, 2));
      } else {
        console.log('     ✅ Sin errores de validación.');
      }
    }
  }

  // 3. Buscar Commerce Accounts
  console.log('\n💼 Buscando Commerce Accounts...');
  const commRes = await fetch(`https://graph.facebook.com/${API_VERSION}/${BUSINESS_ID}/commerce_accounts`, {
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
  });
  const comm = await commRes.json();
  console.log('   - Commerce Accounts:', comm.data?.length || 0);
  if (comm.data) {
      comm.data.forEach((a: any) => console.log(`     -> ID: ${a.id} (${a.name})`));
  }
}

deepMetaSearch();
