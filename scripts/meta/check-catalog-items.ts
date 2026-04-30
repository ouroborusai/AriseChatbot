import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const CATALOG_ID = '998467769274169';

async function checkCatalog() {
    if (!ACCESS_TOKEN) return;

    try {
        const res = await fetch(`https://graph.facebook.com/v19.0/${CATALOG_ID}/products?fields=name,price,currency,retailer_id&limit=10`, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        const data = await res.json();
        console.log('📦 Productos en Catálogo Meta:', JSON.stringify(data, null, 2));
    } catch (e: any) {
        console.error('❌ Error:', e.message);
    }
}

checkCatalog();
