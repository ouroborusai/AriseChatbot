
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = "1066879279838439";
const RECIPIENT = "56990062213";
const API_VERSION = 'v22.0';

async function sendSmokeTest() {
    console.log(`🚀 INICIANDO TEST DE HUMO (Diamond v12.0)...`);
    console.log(`📱 Destinatario: ${RECIPIENT}`);

    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: RECIPIENT,
        type: "template",
        template: {
            name: "loop_v10_welcome_v1",
            language: { code: "es" },
            components: [
                {
                    type: "header",
                    parameters: [
                        {
                            type: "video",
                            video: {
                                link: "https://scontent.whatsapp.net/v/t61.29466-34/659995999_985879650447668_7593602448255786613_n.mp4?ccb=1-7&_nc_sid=8b1bef&_nc_ohc=uyKxxGi9DP0Q7kNvwGjg2QG&_nc_oc=AdqDbzNRC7qzMyIaEUNCgyWOE7_WpmfBHT0pGF5P32gaQ411HJv7q_0CFDEIGKiJ5gA&_nc_zt=28&_nc_ht=scontent.whatsapp.net&edm=AH51TzQEAAAA&_nc_gid=yYg5G19HOo3eH52F3TObJA&_nc_tpa=Q5bMBQGXW6Yv5M-KqmcS9xpBx5rRvWNOyskE0aSdLKd_1WF79vojnK9iQfA8IcCxK3GLLBmw037EPEYT&oh=01_Q5Aa4QFF4tmj-1OKjIWBMbdz3eKptgon34DRRFg_wXTI1pjyvw&oe=6A1D2790"
                            }
                        }
                    ]
                }
            ]
        }
    };

    try {
        const response = await fetch(`https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log(`✅ ¡ÉXITO TOTAL! Mensaje enviado.`);
            console.log(`🆔 Message ID: ${result.messages[0].id}`);
        } else {
            console.error(`❌ FALLO EN LA API:`, JSON.stringify(result, null, 2));
        }
    } catch (error: any) {
        console.error(`💥 ERROR CATASTRÓFICO:`, error.message);
    }
}

sendSmokeTest();
