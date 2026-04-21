/**
 * ARISE NEURAL DIAGNOSTIC TOOL v9.0 (Diamond Industrial)
 * Este script simula una interacción completa de WhatsApp para validar:
 * 1. Webhook Ingestion (Next.js/Edge)
 * 2. Identity Resolution (Company Routing)
 * 3. Database Persistence (Messages/Contacts)
 * 4. Neural Pulse Trigger (Postgres -> pg_net)
 * 5. Gemini AI Response Delivery
 *
 * Uso: npx tsx scripts/neural_diagnostic.ts
 * Requiere: .env.local con variables de Supabase configuradas
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Validación temprana de variables de entorno
function validateEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    console.error('❌ ERROR: NEXT_PUBLIC_SUPABASE_URL no configurada');
    process.exit(1);
  }
  if (!key) {
    console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY no configurada');
    process.exit(1);
  }

  return { url, key };
}

const { url: supabaseUrl, key: supabaseKey } = validateEnv();
const supabase = createClient(supabaseUrl, supabaseKey);

const WEBHOOK_URL = `${supabaseUrl}/functions/v1/whatsapp-webhook`;
const TEST_SENDER = process.env.TEST_WHATSAPP_NUMBER || '56990062213';
const PH_ID = process.env.TEST_PHONE_NUMBER_ID || '1066879279838439';

async function getFirstAvailableCompany(client: SupabaseClient): Promise<{ id: string; name: string } | null> {
  // Intentar con el nombre configurado en .env primero
  const envCompany = process.env.TEST_COMPANY_NAME;

  if (envCompany) {
    const { data } = await client
      .from('companies')
      .select('id, name')
      .ilike('name', envCompany)
      .maybeSingle();

    if (data) return data;
  }

  // Fallback: obtener primera compañía disponible
  const { data, error } = await client
    .from('companies')
    .select('id, name')
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function runDiagnostic() {
    console.log('🚀 Iniciando Auditoría Neural Arise...');
    console.log(`📍 Webhook: ${WEBHOOK_URL}`);
    console.log(`📞 Test Sender: ${TEST_SENDER}`);
    console.log(`📱 Phone ID: ${PH_ID}\n`);

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

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        console.log('✅ Ingesta Aceptada (Status 200)');

        // 2. Esperar Persistencia y Respuesta Neural
        console.log('\n🧠 Esperando Procesamiento Neural (Max 15s)...');

        // Obtener compañía disponible
        console.log('🔍 Buscando compañía disponible...');
        const company = await getFirstAvailableCompany(supabase);

        if (!company) {
            console.error('❌ No se encontraron compañías en la base de datos');
            console.log('💡 Tip: Crea una compañía primero o configura TEST_COMPANY_NAME en .env.local');
            return;
        }

        console.log(`✓ Compañía encontrada: ${company.name} (${company.id})`);

        let attempts = 0;
        let foundResponse = false;

        while (attempts < 5) {
            await new Promise(resolve => setTimeout(resolve, 3000));

            const { data: messages, error } = await supabase
                .from('messages')
                .select('*, conversations!inner(company_id)')
                .eq('conversations.company_id', company.id)
                .order('created_at', { ascending: false })
                .limit(2);

            if (error) {
                console.log(`⚠️  Error consultando mensajes: ${error.message}`);
            }

            if (messages && messages.some(m => m.sender_type === 'bot')) {
                const botMsg = messages.find(m => m.sender_type === 'bot');
                console.log('\n💎 RESPUESTA NEURAL DETECTADA:');
                console.log(`   ID: ${botMsg!.id}`);
                console.log(`   Content: ${botMsg!.content.substring(0, 150)}...`);
                foundResponse = true;
                break;
            }
            attempts++;
            console.log(`   ... Escaneo ${attempts}/5`);
        }

        if (!foundResponse) {
             console.error('\n❌ FALLO: El sistema no generó una respuesta AI en el tiempo esperado.');
             console.log('\n🔎 Diagnóstico de causas posibles:');
             console.log('   1. pg_net no está instalado en Supabase');
             console.log('   2. El trigger neural no está configurado');
             console.log('   3. La cola http_request_queue está vacía');

             // Verificar cola de pg_net
             try {
                 const { data: queue } = await supabase
                     .from('net.http_request_queue')
                     .select('id, method, url, created_at')
                     .order('id', { ascending: false })
                     .limit(3);

                 if (queue && queue.length > 0) {
                     console.log('\n📋 Últimos requests en cola:');
                     queue.forEach(q => {
                         console.log(`   - [${q.id}] ${q.method} ${q.url?.substring(0, 50)}...`);
                     });
                 } else {
                     console.log('   Cola vacía - el trigger no está enqueueando requests');
                 }
             } catch (queueError) {
                 console.log('   No se pudo acceder a net.http_request_queue (pg_net ¿instalado?)');
             }
        } else {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`\n🎉 TEST EXITOSO en ${duration}s`);
        }

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        console.error(`\n❌ ERROR CRÍTICO EN EL TEST: ${errorMsg}`);

        if (errorMsg.includes('404')) {
            console.log('\n💡 El webhook no existe en esta instancia de Supabase');
            console.log('   Deploya la Edge Function: supabase functions deploy whatsapp-webhook');
        }
    }
}

runDiagnostic();

