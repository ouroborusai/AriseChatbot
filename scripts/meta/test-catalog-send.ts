
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testCatalogSend() {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.PHONE_NUMBER_ID || '1066879279838439';
    const to = '56961474241'; // El número del usuario para la prueba
    const catalogId = '1294701418783862';

    if (!token) return;

    console.log(`🧪 Enviando mensaje de catálogo de prueba a ${to}...`);

    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "interactive",
        interactive: {
            type: "catalog_message",
            body: {
                text: "Explora nuestro inventario ARISE v11.9.1"
            },
            footer: {
                text: "Ouroborus Neural Engine"
            },
            action: {
                name: "catalog_message"
            }
        }
    };

    const url = `https://graph.facebook.com/v23.0/${phoneId}/messages`;
    const res = await fetch(url, {
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

testCatalogSend();
