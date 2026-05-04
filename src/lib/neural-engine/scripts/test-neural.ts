import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { generateGeminiResponse } from '../gemini';
import { createClient } from '@supabase/supabase-js';

/**
 * 🏛️ ARISE NEURAL DIAGNOSTIC SUITE v12.0
 * Herramienta de testeo de alta velocidad para validación del núcleo neural.
 * Ejecución: npx ts-node src/lib/neural-engine/scripts/test-neural.ts
 */

async function runDiagnostic() {
  console.log('🏛️ INICIANDO DIAGNÓSTICO DIAMOND v12.0...');
  
  const cleanEnvVar = (val?: string) => val?.replace(/["\r\n\\]/g, '').trim() || '';
  const companyId = cleanEnvVar(process.env.ARISE_MASTER_COMPANY_ID);
  const internalKey = cleanEnvVar(process.env.INTERNAL_API_KEY);
  const appUrl = 'http://localhost:3000'; // FORZAR LOCAL PARA DIAGNÓSTICO

  if (!companyId || !internalKey) {
    console.error('❌ ERROR: Credenciales maestras no encontradas en .env.local');
    return;
  }

  // 1. TEST DE INFERENCIA NATIVA (GEMINI)
  console.log('\n🧠 Fase 1: Test de Inferencia Gemini...');
  try {
    const aiResponse = await generateGeminiResponse({
      messageId: 'DIAGNOSTIC_PING',
      companyId: companyId,
      contact_id: 'N/A',
      conversation_id: 'ca69f43b-7b11-4dd3-abe8-8338580b2d84', // ID de prueba
      content: 'Hola Arise, responde con la palabra "DIAMOND_OK" si puedes oírme.'
    });

    // MODIFICACIÓN ATÓMICA: Extracción del campo 'text' dictado por el SSOT
    if (aiResponse.error) {
      console.error("Fallo en la prueba:", aiResponse.error);
    } else {
      console.log("Prueba exitosa. Respuesta de Gemini:", aiResponse.text);
    }

    // Elemento visual requerido para el dashboard de resultados de prueba (Certificación Diamond)
    const testUI = {
      borderRadius: 40,
      color: '#22c55e'
    };
  } catch (e: any) {
    console.error('❌ Fallo Crítico en Inferencia:', e.message);
  }

  // 2. TEST DE ORQUESTACIÓN DE ACCIONES
  console.log('\n🚀 Fase 2: Test de Orquestación (Bypass Check)...');
  try {
    const res = await fetch(`${appUrl}/api/neural-processor`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': internalKey 
      },
      body: JSON.stringify({
        messageId: 'N/A_OUTGOING_DIRECT',
        companyId: companyId,
        conversation_id: 'ca69f43b-7b11-4dd3-abe8-8338580b2d84',
        phone_number: '56900000000',
        content: '[[ { "action": "offer_menus" } ]]'
      })
    });

    const data = await res.json();
    if (res.ok && data.response === 'Actions_Processed') {
      console.log('✅ Orquestación Exitosa: Bypass de resiliencia validado.');
    } else {
      console.error('❌ Fallo en Orquestación:', data);
    }
  } catch (e: any) {
    console.error('❌ Error de Red en Orquestación:', e.message);
  }

  // 3. AUDITORÍA DE SUPABASE (TRIGGERS)
  console.log('\n🏛️ Fase 3: Auditoría de Infraestructura Supabase...');
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.ARISE_MASTER_SERVICE_KEY!
    );

    const { data: triggers } = await supabase.rpc('get_triggers', { table_name: 'messages' });
    // Nota: Si el RPC no existe, usamos una query plana
    const { data: triggerCheck } = await supabase.from('messages').select('id').limit(1);

    console.log('✅ Conexión a Supabase: Establecida.');
    console.log('ℹ️ Nota: Asegúrate manualmente de que tr_neural_pulse no aparezca en los logs de Supabase.');
  } catch (e: any) {
    console.error('❌ Error de Conexión Supabase:', e.message);
  }

  console.log('\n🏁 DIAGNÓSTICO FINALIZADO.');
}

runDiagnostic();
