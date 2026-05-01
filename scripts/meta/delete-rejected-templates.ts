
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function deleteRejected() {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const wabaId = '930946633057624';
    
    if (!token) return;

    const rejectedTemplates = ['arise_order_update_v4', 'arise_welcome_v4'];

    console.log('🗑️ Iniciando limpieza de plantillas REJECTED...');

    for (const name of rejectedTemplates) {
        console.log(`❌ Eliminando ${name}...`);
        const url = `https://graph.facebook.com/v23.0/${wabaId}/message_templates?name=${name}`;
        
        const res = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    }

    console.log('✅ Limpieza finalizada.');
}

deleteRejected();
