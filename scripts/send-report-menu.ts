import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

async function sendInteractiveMenu() {
  const targetPhone = '56990062213';
  const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN!;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const apiVersion = process.env.META_API_VERSION || 'v19.0';

  console.log(`🚀 Enviando Menú Interactivo de Reportes a ${targetPhone}...`);

  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: targetPhone,
    type: "interactive",
    interactive: {
      type: "list",
      header: {
        type: "text",
        text: "📊 Reportes Financieros"
      },
      body: {
        text: "Selecciona el reporte que deseas generar. El sistema lo procesará y te lo enviará en unos segundos."
      },
      footer: {
        text: "Arise Business OS Diamond v10.2"
      },
      action: {
        button: "Ver Reportes",
        sections: [
          {
            title: "Contabilidad Central",
            rows: [
              {
                id: "pdf_8columnas",
                title: "Balance 8 Columnas",
                description: "Resumen tributario completo"
              },
              {
                id: "pdf_resultados",
                title: "Estado de Resultados",
                description: "Pérdidas y Ganancias"
              }
            ]
          },
          {
            title: "Operaciones",
            rows: [
              {
                id: "pdf_inventario",
                title: "Inventario Real",
                description: "Stock valorizado actual"
              }
            ]
          }
        ]
      }
    }
  };

  try {
    const res = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    console.log('✅ Menú enviado con éxito:', data.messages[0].id);
  } catch (error: any) {
    console.error('❌ Error al enviar menú:', error.message);
  }
}

sendInteractiveMenu();
