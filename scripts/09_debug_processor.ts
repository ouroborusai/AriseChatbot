import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });
console.log('--- AUDITORÍA DE ENTORNO ---');
Object.keys(process.env).forEach(key => {
  if (key.includes('SUPABASE') || key.includes('ARISE') || key.includes('GEMINI')) {
    console.log(`${key}=${process.env[key]?.substring(0, 15)}...`);
  }
});
console.log('---------------------------');

async function debugProcessor() {
  const messageId = '611c407b-2281-4278-9b14-c52dd518a9cc'; // Mensaje de inventario detectado
  const companyId = 'ca69f43b-7b11-4dd3-abe8-8338580b2d84';
  const internalKey = process.env.INTERNAL_API_KEY || 'arise_internal_v9_secret';

  console.log('🔍 Iniciando Sonda de Depuración...');
  
  // Verificación directa de DB
  const client = (await import('@supabase/supabase-js')).createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { data: check, error: dbErr } = await client.from('messages').select('id, content').order('created_at', { ascending: false }).limit(5);
  
  if (dbErr) {
    console.error('❌ Error de Base de Datos:', dbErr.message);
  } else {
    console.log('📝 Mensajes recientes en la DB:', check?.map(m => m.id));
  }

  console.log(`📡 Llamando a: http://localhost:3000/api/neural-processor`);
  
  try {
    const res = await fetch('http://localhost:3000/api/neural-processor', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': internalKey 
      },
      body: JSON.stringify({ messageId, companyId })
    });

    const data = await res.json();
    console.log('\n📊 RESULTADO DEL PROCESADOR:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (err: any) {
    console.error('❌ Error en la sonda:', err.message);
  }
}

debugProcessor();
