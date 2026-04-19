const fetch = require('node-fetch');

async function testWebhook() {
  const payload = {
    entry: [{
      id: "1066879279838439",
      changes: [{
        value: {
          messaging_product: "whatsapp",
          metadata: { display_phone_number: "56912345678", phone_number_id: "1066879279838439" },
          contacts: [{ profile: { name: "Cliente VIP" }, wa_id: "56912345678" }],
          messages: [{ 
            from: "56912345678", 
            id: `TEST_${Date.now()}`, 
            timestamp: Math.floor(Date.now() / 1000).toString(), 
            text: { body: "Hola, ¿cuál es el estado de mi facturación?" }, 
            type: "text" 
          }]
        },
        field: "messages"
      }]
    }]
  };

  try {
    const res = await fetch('https://zosravrfpfechanatucx.supabase.co/functions/v1/whatsapp-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log('Status:', res.status);
    console.log('Response:', await res.text());
  } catch (err) {
    console.error('Error:', err);
  }
}

testWebhook();
