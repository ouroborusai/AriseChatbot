import { handleInboundUserMessage } from '../lib/webhook-handler';

async function testAppointment() {
  console.log('--- TEST: Agendamiento de Cita ---');
  
  const phoneNumber = '56990062213';
  const mockWebhookPayload = {
    entry: [{
      changes: [{
        value: {
          contacts: [{ profile: { name: 'Carlos Test' }, wa_id: phoneNumber }],
          messages: [{
            from: phoneNumber,
            id: 'msg_' + Date.now(),
            timestamp: Math.floor(Date.now() / 1000).toString(),
            type: 'interactive',
            interactive: {
              type: 'button_reply',
              button_reply: {
                id: 'reunion_tarde',
                title: 'Tarde (PM)'
              }
            }
          }]
        }
      }]
    }]
  };

  try {
    const result = await handleInboundUserMessage(mockWebhookPayload);
    console.log('Resultado:', result);
  } catch (err) {
    console.error('Error en test:', err);
  }
}

testAppointment();
