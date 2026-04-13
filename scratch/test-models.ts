import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: '.env.local' });

/**
 * Script de Auditoría de Modelos para el Cluster AriseChatbot
 */
async function auditModelCapabilities() {
  const rawKeys = process.env.GEMINI_API_KEY || '';
  const keys = rawKeys.split(',').map(k => k.trim()).filter(Boolean);
  
  const modelsToTest = [
    'models/gemini-2.5-flash',
    'models/gemini-2.5-flash-lite',
    'models/gemini-3.1-flash-lite-preview',
    'models/gemini-2.5-pro'
  ];

  console.log(`🚀 AUDITORÍA DETALLADA: ${keys.length} llaves cargadas.`);
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    console.log(`\n🔑 LLAVE #${i + 1} [${key.substring(0, 5)}...${key.substring(key.length - 4)}]:`);
    
    for (const modelName of modelsToTest) {
      try {
        // Forzar versión estable v1 para evitar 404 de la beta
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1' });
        
        const start = Date.now();
        await model.generateContent('hi');
        const end = Date.now();
        
        console.log(`  ✅ [${modelName}] OK (${end - start}ms)`);
      } catch (err: any) {
        // Mostrar el error real de la API de Google
        let errorMsg = err.message;
        if (err.response?.data) {
          errorMsg += ` - DETAILS: ${JSON.stringify(err.response.data)}`;
        }
        console.log(`  ❌ [${modelName}] ERROR: ${errorMsg}`);
      }
    }
  }

  console.log('\n------------------------------------------------------------');
  console.log('🏁 AUDITORÍA FINALIZADA.');
}

auditModelCapabilities().catch(console.error);
