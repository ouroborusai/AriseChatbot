import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

async function getAppId() {
    if (!ACCESS_TOKEN) return;
    
    try {
        const res = await fetch(`https://graph.facebook.com/v19.0/debug_token?input_token=${ACCESS_TOKEN}&access_token=${ACCESS_TOKEN}`);
        const data = await res.json();
        console.log('📊 Información del Token:', JSON.stringify(data, null, 2));
    } catch (e: any) {
        console.error('❌ Error:', e.message);
    }
}

getAppId();
