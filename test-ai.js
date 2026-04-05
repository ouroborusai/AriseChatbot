// Script para probar solo la IA sin WhatsApp
const http = require('http');

const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('Uso: node test-ai.js "tu mensaje" [numero]');
  console.log('Ejemplo: node test-ai.js "Hola" 5491234567890');
  process.exit(1);
}

const TEST_MESSAGE = args[0];
const TEST_PHONE = args[1] || '5491234567890';

console.log('🤖 Probando solo IA (sin WhatsApp)\n');

const payload = JSON.stringify({
  phoneNumber: TEST_PHONE,
  message: TEST_MESSAGE
});

const options = {
  hostname: 'localhost',
  port: 3003,
  path: '/api/test-ai',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log(`📤 Enviando: "${TEST_MESSAGE}"`);
console.log(`📞 A: ${TEST_PHONE}\n`);

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`📨 Status: ${res.statusCode}`);

    if (res.statusCode === 200) {
      try {
        const response = JSON.parse(data);
        console.log('✅ ¡IA funcionando!');
        console.log(`📚 Historial: ${response.historyLength} mensajes`);
        console.log('💬 Respuesta IA:');
        console.log('─'.repeat(50));
        console.log(response.aiResponse);
        console.log('─'.repeat(50));
      } catch (e) {
        console.log('Respuesta:', data);
      }
    } else {
      try {
        const error = JSON.parse(data);
        console.log('❌ Error:', error.error);
        if (error.details) {
          console.log('Detalles:', error.details);
        }
      } catch {
        console.log('Respuesta:', data);
      }
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error de conexión:', error.message);
});

req.write(payload);
req.end();