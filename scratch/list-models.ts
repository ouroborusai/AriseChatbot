import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: '.env.local' });

/**
 * Script para LISTAR modelos reales disponibles por llave
 */
async function listAvailableModels() {
  const keys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);

  console.log(`📡 INTERROGANDO ${keys.length} LLAVES...`);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    console.log(`\n🔑 LLAVE #${i + 1} [${key.substring(0, 5)}...${key.substring(key.length - 4)}]:`);
    
    try {
      // Usar fetch directo a la API de Google para evitar abstracciones del SDK
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      const data = await response.json();
      
      if (data.models) {
        const modelNames = data.models.map((m: any) => m.name.replace('models/', ''));
        console.log(`  ✅ MODELOS ENCONTRADOS (${modelNames.length}):`);
        console.log(`     ${modelNames.slice(0, 10).join(', ')}...`);
      } else if (data.error) {
        console.log(`  ❌ ERROR API: ${data.error.message}`);
      }
    } catch (err: any) {
      console.log(`  ❌ ERROR CONEXIÓN: ${err.message}`);
    }
  }
}

listAvailableModels().catch(console.error);
