
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const WEBHOOK_URL = 'http://localhost:3000/api/webhook/whatsapp';
const TEST_SENDER = '56990062213';
const PH_ID = '1066879279838439';

async function sendWebhook(body: string) {
    const payload = {
        object: "whatsapp_business_account",
        entry: [{
            id: "WHATSAPP_BUSINESS_ACCOUNT_ID",
            changes: [{
                value: {
                    messaging_product: "whatsapp",
                    metadata: { display_phone_number: "569XXXXXXXX", phone_number_id: PH_ID },
                    contacts: [{ profile: { name: "Carlos" }, wa_id: TEST_SENDER }],
                    messages: [{
                        from: TEST_SENDER,
                        id: `E2E_${Date.now()}`,
                        timestamp: Math.floor(Date.now() / 1000).toString(),
                        text: { body },
                        type: "text"
                    }]
                },
                field: "messages"
            }]
        }]
    };

    const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    return res.ok;
}

const CONV_ID = 'f4efb55c-d6af-4947-a9ec-9c6f48824bec';

async function waitAndGetBotResponse(prevCount: number) {
    console.log("   ... Esperando respuesta del bot");
    for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 4000));
        const { data: messages, count } = await supabase
            .from('messages')
            .select('*', { count: 'exact' })
            .eq('conversation_id', CONV_ID)
            .eq('sender_type', 'bot')
            .order('created_at', { ascending: false });
        
        if (count! > prevCount) {
            return messages![0];
        }
    }
    return null;
}

async function runE2E() {
    console.log("🚀 INICIANDO TEST FLUJO COMPLETO - ARISE NEURAL v9.0");
    
    const { count: initialCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', CONV_ID)
        .eq('sender_type', 'bot');
    let currentBotCount = initialCount || 0;

    // STEP 1: SALUDO
    console.log("\n1️⃣  Enviando SALUDO: 'Hola'");
    await sendWebhook("Hola");
    const resp1 = await waitAndGetBotResponse(currentBotCount);
    if (resp1) {
        console.log("✅ Bot respondió: ", resp1.content.substring(0, 100) + "...");
        currentBotCount++;
    } else {
        console.log("❌ Error: No hubo respuesta al saludo.");
    }

    // STEP 2: AGREGAR PRODUCTO
    console.log("\n2️⃣  Agregando PRODUCTO: 'Agregar 10 unidades de Ladrillo Arise'");
    await sendWebhook("Agregar 10 unidades de Ladrillo Arise");
    const resp2 = await waitAndGetBotResponse(currentBotCount);
    if (resp2) {
        console.log("✅ Bot procesó: ", resp2.content.substring(0, 100) + "...");
        currentBotCount++;
        // Validar en DB
        const { data: item } = await supabase.from('inventory_items').select('*').ilike('name', '%Ladrillo Arise%').maybeSingle();
        if (item) {
            console.log(`📊 Stock actual en DB para '${item.name}': ${item.current_stock}`);
        }
    }

    // STEP 3: PEDIR REPORTE
    console.log("\n3️⃣  Solicitando REPORTE: 'Dame el reporte de inventario'");
    await sendWebhook("Dame el reporte de inventario");
    const resp3 = await waitAndGetBotResponse(currentBotCount);
    if (resp3) {
        console.log("✅ Bot emitió reporte: ", resp3.content.substring(0, 100) + "...");
        currentBotCount++;
    }

    // STEP 4: MENÚ
    console.log("\n4️⃣  Finalizando a MENÚ: 'Volver al menú'");
    await sendWebhook("Volver al menú");
    const resp4 = await waitAndGetBotResponse(currentBotCount);
    if (resp4) {
        console.log("✅ Bot volvió al menú: ", resp4.content.substring(0, 100) + "...");
    }

    console.log("\n🏁 TEST E2E FINALIZADO.");
}

runE2E();
