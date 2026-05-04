
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
        { name: "Servicios Profesionales & Consultoría ⚖️", match: "mtz_pro_services" },
        { name: "Destilerias", match: "mtz_distillery" },
        { name: "Educacion", match: "mtz_education" },
        { name: "Automotriz", match: "mtz_automotive" },
        { name: "Comercio", match: "mtz_retail" }
    ];

    console.log(`🏗️ Actualizando Colecciones a Nomenclatura Técnica (_) en Meta...`);

    for (const cat of categories) {
        // Meta Graph API doesn't like emojis or special chars in names sometimes
        const cleanName = cat.name.replace(/[\u{1F300}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu, '').trim();
        console.log(`Creating set for: ${cat.name} (ID: ${cat.match}, Clean Name: ${cleanName})...`);
        
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
                name: cleanName,
                filter: JSON.stringify(filter)
            })
        });

        const data = await res.json();
        if (data.id) {
            console.log(`✅ Set '${cat.name}' vinculado a ID técnico: ${cat.match} (ID META: ${data.id})`);
        } else {
            console.log(`❌ Error: ${data.error?.message}`);
        }
    }
}

async function listSets() {
    const token = process.env.META_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
    const catalogId = process.env.CATALOG_ID || '998467769274169';
    
    if (!token) return;

    const res = await fetch(`https://graph.facebook.com/v23.0/${catalogId}/product_sets?fields=id,name,filter`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

createSets();
// listSets();
// deleteSets([]);

async function deleteSets(ids: string[]) {
    const token = process.env.META_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
    if (!token) return;

    for (const id of ids) {
        console.log(`Deleting product set ${id}...`);
        const res = await fetch(`https://graph.facebook.com/v23.0/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await res.json();
        console.log(`Result for ${id}:`, JSON.stringify(data));
    }
}

// deleteSets(['1947286505896384', '4550670381820787']);
