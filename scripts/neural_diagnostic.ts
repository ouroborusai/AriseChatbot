// @ts-nocheck
/**
 * ARISE NEURAL DIAGNOSTIC TOOL v1.0 (Diamond Industrial)
 * Este script simula una interacción completa de WhatsApp para validar:
 * 1. Webhook Ingestion (Next.js/Edge)
 * 2. Identity Resolution (Company Routing)
 * 3. Database Persistence (Messages/Contacts)
 * 4. Neural Pulse Trigger (Postgres -> pg_net)
 * 5. Gemini AI Response Delivery
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const WEBHOOK_URL = `${supabaseUrl}/functions/v1/whatsapp-webhook`; 
const TEST_SENDER = '56990062213'; // Teléfono de prueba
const PH_ID = '1066879279838439'; // Phone ID (MTZ/Sede Central)

async function runDiagnostic() {
    console.log('🚀 Iniciando Auditoría Neural Arise...');
    const startTime = Date.now();

    // 1. Simular Mensaje de WhatsApp
    const payload = {
        object: "whatsapp_business_account",
        entry: [{
            id: "WHATSAPP_BUSINESS_ACCOUNT_ID",
            changes: [{
                value: {
                    messaging_product: "whatsapp",
                    metadata: { display_phone_number: "569XXXXXXXX", phone_number_id: PH_ID },
                    contacts: [{ profile: { name: "DIAGNOSTIC_USER" }, wa_id: TEST_SENDER }],
                    messages: [{
                        from: TEST_SENDER,
                        id: `TEST_MSG_${Date.now()}`,
                        timestamp: Math.floor(Date.now() / 1000).toString(),
                        text: { body: "Audit: ¿Cuál es el estado del inventario?" },
                        type: "text"
                    }]
                },
                field: "messages"
            }]
        }]
    };

    console.log('📡 Enviando Pulso de Ingesta al Webhook...');
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
        console.log('✅ Ingesta Aceptada (Status 200)');

        // 2. Esperar Persistencia y Respuesta Neural
        console.log('🧠 Esperando Procesamiento Neural (Max 15s)...');
        let attempts = 0;
        let foundResponse = false;

        while (attempts < 5) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Obtener company_id primero para filtrar correctamente
            const { data: company } = await supabase
                .from('companies')
                .select('id')
                .eq('name', 'MTZ Test')
                .single();

            if (!company) {
                console.error('❌ Company "MTZ Test" no encontrada');
                break;
            }

            const { data: messages, error } = await supabase
                .from('messages')
                .select('*, conversations!inner(company_id)')
                .eq('conversations.company_id', company.id)
                .order('created_at', { ascending: false })
                .limit(2);

            if (messages && messages.some(m => m.sender_type === 'bot')) {
                const botMsg = messages.find(m => m.sender_type === 'bot');
                console.log('💎 RESPUESTA NEURAL DETECTADA:');
                console.log(`| ID: ${botMsg.id}`);
                console.log(`| Content: ${botMsg.content.substring(0, 100)}...`);
                foundResponse = true;
                break;
            }
            attempts++;
            console.log(`... Escaneo ${attempts}/5`);
        }

        if (!foundResponse) {
             console.error('❌ FALLO: El sistema no generó una respuesta AI en el tiempo esperado.');
             // Diagnóstico de Fallas Comunes
             const { data: queue } = await supabase.from('net.http_request_queue').select('*').order('id', { ascending: false }).limit(5);
             console.log('🔎 Revisando Cola de Triggers (pg_net):', queue);
        } else {
            console.log(`🎉 TEST EXITOSO en ${(Date.now() - startTime) / 1000}s`);
        }

    } catch (error) {
        console.error('❌ ERROR CRÍTICO EN EL TEST:', error);
    }
}

runDiagnostic();

