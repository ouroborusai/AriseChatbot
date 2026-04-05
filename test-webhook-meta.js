// Test del webhook - Simular mensaje de WhatsApp desde Meta
const http = require('http');

const payload = JSON.stringify({
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '123456789',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15551234567',
              phone_number_id: '1066879279838439'
            },
            contacts: [
              {
                profile: {
                  name: 'Test User'
                },
                wa_id: '5491234567890'
              }
            ],
            messages: [
              {
                from: '5491234567890',
                id: 'wamid.D3A23D4E5F6G7H8I9J0K1L2M3N4O5P6Q',
                timestamp: '1234567890',
                type: 'text',
                text: {
                  body: '¡Hola! Este es un mensaje de prueba desde el webhook.'
                }
              }
            ]
          },
          field: 'messages'
        }
      ]
    }
  ]
});

const options = {
  hostname: 'localhost',
  port: 3003,
  path: '/api/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log('📤 Enviando mensaje de prueba al webhook...\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`✅ Status: ${res.statusCode}`);
    console.log(`📨 Respuesta: ${data || 'OK'}\n`);
    
    if (res.statusCode === 200) {
      console.log('✓ Webhook recibió el mensaje exitosamente');
      console.log('Revisa los logs del servidor para ver los detalles del procesamiento');
    } else {
      console.log('❌ Error en el webhook');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error de conexión:', error.message);
});

req.write(payload);
req.end();
