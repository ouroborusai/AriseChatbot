import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
const CATALOG_ID = '998467769274169';

async function checkCatalog() {
    if (!ACCESS_TOKEN) {
        console.error('❌ Token no encontrado');
        return;
    }

    try {
        const res = await fetch(`https://graph.facebook.com/v23.0/${CATALOG_ID}/products?fields=name,retailer_id,product_type,availability&limit=50`, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        const data = await res.json();
        
        console.log('🔍 AUDITORÍA DE PRODUCT_TYPE:');
        if (data.data) {
            data.data.forEach((p: any) => {
                console.log(`- [${p.retailer_id}] ${p.name}: Type=${p.product_type} | Stock=${p.availability}`);
            });
        } else {
            console.log('⚠️ No se encontraron datos:', JSON.stringify(data, null, 2));
        }
    } catch (e: any) {
        console.error('❌ Error:', e.message);
    }
}

checkCatalog();
