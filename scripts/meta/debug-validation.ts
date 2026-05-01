
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debugValidation() {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = '1066879279838439';
    const to = '56990062213';

    if (!token) return;

    const send = async (payload: any, label: string) => {
        console.log(`🔍 Debugging ${label}...`);
        const res = await fetch(`https://graph.facebook.com/v23.0/${phoneId}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log(`--- ${label} ---`);
        console.log(JSON.stringify(data, null, 2));
    };

    // Re-test Catálogo
    await send({
        messaging_product: "whatsapp", to, type: "interactive",
        interactive: {
            type: "product",
            body: { text: "Test Catálogo" },
            action: { catalog_id: "998467769274169", product_retailer_id: "ARISE-LINK-002" }
        }
    }, 'Catálogo');

    // Re-test Flow
    await send({
        messaging_product: "whatsapp", to, type: "interactive",
        interactive: {
            type: "flow",
            header: { type: "text", text: "Test Flow" },
            body: { text: "Test Flow" },
            action: {
                name: "flow",
                parameters: {
                    flow_id: "3141848516022930",
                    flow_action: "navigate",
                    flow_token: "debug_token",
                    flow_mode: "draft",
                    flow_message_version: "3",
                    navigate_screen: "DASHBOARD"
                }
            }
        }
    }, 'Flow');
}

debugValidation();
