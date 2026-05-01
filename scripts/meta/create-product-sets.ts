
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function createSets() {
    const token = process.env.META_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
    const catalogId = process.env.CATALOG_ID || '998467769274169';
    
    if (!token) return;

    // Mapa de Colecciones Técnicas con Guiones Bajos _
    const categories = [
        { name: "Gastronomía & Alimentos 🍣", match: "mtz_food" },
        { name: "Construcción, Ferretería & Maderas 🛠️", match: "mtz_construction" },
        { name: "Transportes, Grúas & Logística 🚛", match: "mtz_logistics" },
        { name: "Estética, Salud & Bienestar 💅", match: "mtz_health" },
        { name: "Seguridad & Servicios Industriales 🛡️", match: "mtz_industrial" },
        { name: "Servicios Profesionales & Consultoría ⚖️", match: "mtz_pro_services" }
    ];

    console.log(`🏗️ Actualizando Colecciones a Nomenclatura Técnica (_) en Meta...`);

    for (const cat of categories) {
        console.log(`Creating set for: ${cat.name} (ID: ${cat.match})...`);
        
        const filter = {
            "product_type": { "i_contains": cat.match }
        };

        const res = await fetch(`https://graph.facebook.com/v23.0/${catalogId}/product_sets`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: cat.name,
                filter: JSON.stringify(filter)
            })
        });

        const data = await res.json();
        if (data.id) {
            console.log(`✅ Set '${cat.name}' vinculado a ID técnico: ${cat.match}`);
        } else {
            console.log(`❌ Error: ${data.error?.message}`);
        }
    }
}

createSets();
