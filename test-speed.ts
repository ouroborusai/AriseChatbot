import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.ARISE_MASTER_SERVICE_KEY!
);

async function runSpeedTest() {
    console.log('🚀 [SPEED_TEST] Iniciando Auditoría de Latencia v10.2...');
    
    const startTime = Date.now();
    const companyId = '75d1d615-188b-4029-9e8c-396558661603'; // Arise Demo

    // 1. Simular clic en Balance de 8 Columnas
    console.log('⏱️ Paso 1: Consultando caché (Shadow Check)...');
    const { data: cached } = await supabase
        .from('prepared_reports')
        .select('media_id')
        .eq('company_id', companyId)
        .eq('report_type', '8-columnas')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

    if (cached) {
        const latency = Date.now() - startTime;
        console.log(`✅ [HIT] Reporte encontrado en caché. Latencia: ${latency}ms`);
    } else {
        console.log('❌ [MISS] No hay caché. Requiere regeneración completa.');
    }

    const totalTime = Date.now() - startTime;
    console.log(`🏁 Test finalizado. Tiempo total: ${totalTime}ms`);
}

runSpeedTest();
