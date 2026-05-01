
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function sendCatalogShop() {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = '1066879279838439';
    const to = '56990062213';

    if (!token) return;

    console.log('🚀 Enviando Botón VER CATÁLOGO (v23.0 syntax)...');

    const payload = {
        messaging_product: "whatsapp",
        to: to,
        type: "interactive",
        interactive: {
            type: "catalog_message",
            body: { text: "Explora todos nuestros productos ARISE." },
            action: {
                name: "catalog_message"
            }
        }
    };

    const res = await fetch(`https://graph.facebook.com/v23.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

sendCatalogShop();
