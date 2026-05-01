
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listSets() {
    const token = process.env.META_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
    const catalogId = '998467769274169';
    
    if (!token) return;

    try {
        const res = await fetch(`https://graph.facebook.com/v23.0/${catalogId}/product_sets?fields=name,id`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        console.log('📦 PRODUCT SETS ENCONTRADOS:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

listSets();
