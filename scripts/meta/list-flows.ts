import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WABA_ID = '930946633057624';

async function listFlows() {
    if (!ACCESS_TOKEN) return;
    try {
        const res = await fetch(`https://graph.facebook.com/v19.0/${WABA_ID}/flows`, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        const data = await res.json();
        console.log('🌊 Flujos Detectados en Meta:', JSON.stringify(data, null, 2));
    } catch (e: any) {
        console.error('❌ Error:', e.message);
    }
}

listFlows();
