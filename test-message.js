// Script para probar el endpoint de test-message
const http = require('http');

const TEST_PHONE = '5491234567890'; // Número de prueba
const TEST_MESSAGE = 'Hola, soy un mensaje de prueba';

console.log('🧪 Probando endpoint de mensajes...\n');

const payload = JSON.stringify({
  phoneNumber: TEST_PHONE,
  message: TEST_MESSAGE
});

const options = {
  hostname: 'localhost',
  port: 3002, // Puerto que está usando el servidor
  path: '/api/test-message',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log(`📤 Enviando: ${TEST_MESSAGE}`);
console.log(`📞 A número: ${TEST_PHONE}\n`);

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`📨 Respuesta (${res.statusCode}):`);
    console.log('─'.repeat(50));

    try {
      const response = JSON.parse(data);
      console.log(JSON.stringify(response, null, 2));
    } catch {
      console.log(data);
    }

    console.log('─'.repeat(50));
    console.log('\n💡 Revisa los logs del servidor para ver el procesamiento completo');
  });
});

req.on('error', (error) => {
  console.error('❌ Error de conexión:', error.message);
  console.log('\n💡 Asegúrate de que el servidor esté corriendo: npm run dev');
});

req.write(payload);
req.end();