// Test directo de Gemini API
const https = require('https');

const GEMINI_API_KEY = 'AIzaSyCv5xDJJ3NQgMGN7QFB-I37tMPwhnwkdNY';
const MODEL = 'gemini-2.5-flash';

console.log('🧪 Test de Gemini API');
console.log('═════════════════════════════════════════');
console.log('API Key:', GEMINI_API_KEY.slice(0, 20) + '...');
console.log('Modelo:', MODEL);
console.log('═════════════════════════════════════════\n');

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const payload = {
  contents: [
    {
      parts: [
        {
          text: 'Hola, ¿cómo estás? Responde en español de forma amigable.'
        }
      ]
    }
  ]
};

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('📤 Enviando solicitud a Gemini...\n');

const req = https.request(url, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📨 Respuesta recibida con status:', res.statusCode);
    console.log('═════════════════════════════════════════\n');

    if (res.statusCode === 200) {
      const response = JSON.parse(data);
      console.log('✅ ÉXITO - Gemini funcionando correctamente\n');
      
      if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
        const responseText = response.candidates[0].content.parts[0].text;
        console.log('💬 Respuesta de Gemini:');
        console.log('───────────────────────────────────────');
        console.log(responseText);
        console.log('═════════════════════════════════════════');
      }
    } else {
      console.log('❌ ERROR - Status:', res.statusCode);
      console.log('Respuesta:');
      try {
        const errorData = JSON.parse(data);
        console.log(JSON.stringify(errorData, null, 2));
      } catch {
        console.log(data);
      }
      console.log('═════════════════════════════════════════');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error en la solicitud:', error.message);
});

req.write(JSON.stringify(payload));
req.end();
