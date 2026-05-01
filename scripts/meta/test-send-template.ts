
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testSend() {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = '1066879279838439';
    const to = '56990062213'; // NÚMERO OFICIAL ADMINISTRADOR (CORRECTO)

    if (!token) return;

    console.log('🚀 Enviando Test de Plantilla APROBADA (std_confirmation_v1)...');

    const url = `https://graph.facebook.com/v23.0/${phoneId}/messages`;
    
    const payload = {
        messaging_product: "whatsapp",
        to: to,
        type: "template",
        template: {
            name: "std_confirmation_v1",
            language: { code: "es" },
            components: [
                {
                    type: "body",
                    parameters: [
                        { type: "text", text: "Usuario Arise" }
                    ]
                }
            ]
        }
    };

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

testSend();
