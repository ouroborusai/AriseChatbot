
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WABA_ID = process.env.WABA_ID;
const BUSINESS_ID = process.env.META_BUSINESS_ID;
const API_VERSION = 'v23.0';

if (!WABA_ID) {
  throw new Error('❌ [DIAMOND_FATAL] WABA_ID no definido en .env.local. Ejecución bloqueada.');
}

async function auditMeta() {
  if (!ACCESS_TOKEN) {
    console.error('❌ WHATSAPP_ACCESS_TOKEN missing');
    return;
  }

  console.log('🏛️  MASTER META AUDIT - LOOP v10.4\n');

  // 1. WhatsApp Business Account (WABA) Info
  console.log('📡 [1/4] Consultando WABA Info...');
  const wabaRes = await fetch(`https://graph.facebook.com/${API_VERSION}/${WABA_ID}?fields=name,currency,timezone_id,message_template_namespace`, {
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
  });
  console.log('   WABA:', await wabaRes.json());

  // 2. Templates Status
  console.log('\n💬 [2/4] Consultando Plantillas (HSM)...');
  const templatesRes = await fetch(`https://graph.facebook.com/${API_VERSION}/${WABA_ID}/message_templates?limit=100`, {
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
  });
  const templatesData = await templatesRes.json();
  const templates = templatesData.data || [];
  console.log(`   Total: ${templates.length}`);
  templates.slice(0, 5).forEach((t: any) => console.log(`   - [${t.status}] ${t.name}`));

  // 3. WhatsApp Flows
  console.log('\n🌊 [3/4] Consultando WhatsApp Flows...');
  const flowsRes = await fetch(`https://graph.facebook.com/${API_VERSION}/${WABA_ID}/flows`, {
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
  });
  const flowsData = await flowsRes.json();
  const flows = flowsData.data || [];
  console.log(`   Total: ${flows.length}`);
  flows.forEach((f: any) => console.log(`   - [${f.status}] ${f.name} (ID: ${f.id})`));

  // 4. Catalogs & Products
  console.log('\n📦 [4/4] Consultando Catálogos y Cuentas de Comercio...');
  if (BUSINESS_ID) {
    const catalogsRes = await fetch(`https://graph.facebook.com/${API_VERSION}/${BUSINESS_ID}/owned_product_catalogs`, {
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
    });
    const catalogsData = await catalogsRes.json();
    const catalogs = catalogsData.data || [];
    console.log(`   Catálogos (Owned): ${catalogs.length}`);

    const commRes = await fetch(`https://graph.facebook.com/${API_VERSION}/${WABA_ID}/commerce_accounts`, {
        headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
    });
    const commData = await commRes.json();
    const commerceAccounts = commData.data || [];
    console.log(`   Cuentas de Comercio: ${commerceAccounts.length}`);
    
    for (const cat of catalogs) {
      console.log(`   - Catálogo: ${cat.name} (ID: ${cat.id})`);
    }
    for (const acc of commerceAccounts) {
        console.log(`   - Comercio: ${acc.name} (ID: ${acc.id})`);
    }
  } else {
    console.log('   ⚠️ No se puede consultar sin META_BUSINESS_ID');
  }

  console.log('\n✅ Auditoría completada.');
}

auditMeta();
