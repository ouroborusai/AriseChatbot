
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function massValidation() {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = '1066879279838439';
    const to = '56990062213';
    const catalogId = process.env.CATALOG_ID || '998467769274169';

    if (!token) return;

    const send = async (payload: any, label: string) => {
        console.log(`🚀 Enviando ${label}...`);
        const res = await fetch(`https://graph.facebook.com/v23.0/${phoneId}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.error) {
            console.log(`❌ ERROR en ${label}: ${data.error.message}`);
        } else {
            console.log(`✅ ${label}: ${data.messages?.[0]?.id}`);
        }
    };

    // 1. Plantilla std_alert_v1
    await send({
        messaging_product: "whatsapp", to, type: "template",
        template: { name: "std_alert_v1", language: { code: "es" }, components: [{ type: "body", parameters: [{ type: "text", text: "Sensor Térmico Industrial" }] }] }
    }, 'Plantilla Alerta');

    // 2. Mensaje de Catálogo (Single Product) - USANDO SKU REAL DE ESTA SESION
    await send({
        messaging_product: "whatsapp", to, type: "interactive",
        interactive: {
            type: "product",
            body: { text: "Revisa nuestro producto estrella ARISE." },
            footer: { text: "LOOP v11.9.1" },
            action: { catalog_id: catalogId, product_retailer_id: "ARISE-LINK-002" }
        }
    }, 'Producto Catálogo');

    // 3. WhatsApp Flow (Inventory Flow) - CORREGIDO (Sin flow_mode en params)
    await send({
        messaging_product: "whatsapp", to, type: "interactive",
        interactive: {
            type: "flow",
            header: { type: "text", text: "Gestión de Inventario" },
            body: { text: "Accede al panel de control de stock." },
            footer: { text: "Arise Diamond Engine" },
            action: {
                name: "flow",
                parameters: {
                    flow_id: "3141848516022930",
                    flow_action: "navigate",
                    flow_token: "test_token_123",
                    flow_message_version: "3",
                    navigate_screen: "DASHBOARD"
                }
            }
        }
    }, 'WhatsApp Flow');

    console.log('\n🏁 Envío masivo de validación completado.');
}

massValidation();
