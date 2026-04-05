// Test de modelos de Gemini disponibles
const https = require('https');

const GEMINI_API_KEY = 'AIzaSyCv5xDJJ3NQgMGN7QFB-I37tMPwhnwkdNY';

const modelsToTest = [
  'gemini-2.0-flash',        // Versión anterior
  'gemini-2.0-flash-lite',   // Versión anterior lite
  'gemini-1.5-flash-8b',     // Versión ligera 1.5
  'gemini-2.5-flash-lite',   // Actual (más barata)
  'gemini-2.5-flash',        // Actual (balanceada)
  'gemini-nano',             // Ultra ligera (si existe)
];

console.log('🧪 Probando modelos de Gemini disponibles...\n');

const testModel = (modelName) => {
  return new Promise((resolve) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

    const payload = JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: 'Hola'
            }
          ]
        }
      ]
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ model: modelName, status: '✅ FUNCIONA', code: 200 });
        } else {
          try {
            const error = JSON.parse(data);
            resolve({ 
              model: modelName, 
              status: `❌ ${error.error?.code} ${error.error?.status}`, 
              code: res.statusCode 
            });
          } catch {
            resolve({ model: modelName, status: `❌ Error ${res.statusCode}`, code: res.statusCode });
          }
        }
      });
    });

    req.on('error', (error) => {
      resolve({ model: modelName, status: '❌ Error de conexión', code: 0 });
    });

    req.write(payload);
    req.end();
  });
};

(async () => {
  const results = [];
  
  for (const model of modelsToTest) {
    process.stdout.write(`Probando ${model}... `);
    const result = await testModel(model);
    results.push(result);
    console.log(result.status);
  }

  console.log('\n═════════════════════════════════════════');
  console.log('RESUMEN DE MODELOS DISPONIBLES:');
  console.log('═════════════════════════════════════════\n');

  const working = results.filter(r => r.status.includes('✅'));
  
  if (working.length > 0) {
    console.log('✅ Modelos que FUNCIONAN:\n');
    working.forEach(r => {
      console.log(`  • ${r.model}`);
    });
    console.log('\n📊 RECOMENDACIÓN:');
    console.log(`  Usa: ${working[0].model} (Más barato/rápido disponible)`);
  } else {
    console.log('❌ Ningún modelo alternativo funciona');
    console.log('   Mantén: gemini-2.5-flash-lite (actual)');
  }

  console.log('\n═════════════════════════════════════════');
})();
