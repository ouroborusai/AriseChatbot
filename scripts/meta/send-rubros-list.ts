
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function sendList() {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    const targetPhone = '56990062213'; // Tu teléfono

    if (!token || !phoneId) return;

    console.log('🚀 Enviando Menú de Rubros Minimalista (v11.9.1)...');

    const res = await fetch(`https://graph.facebook.com/v23.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: targetPhone,
            type: "interactive",
            interactive: {
                type: "list",
                header: { type: "text", text: "Red MTZ - Proveedores" },
                body: { text: "Seleccione un rubro para explorar el catálogo especializado." },
                footer: { text: "Directorio Oficial v11.9.1" },
                action: {
                    button: "Ver Rubros",
                    sections: [
                        {
                            title: "Sectores Disponibles",
                            rows: [
                                { id: "mtz_food", title: "Gastronomía & Alimentos 🍣", description: "Restaurantes, insumos y catering." },
                                { id: "mtz_construction", title: "Construcción & Hogar 🛠️", description: "Ferretería, maderas y servicios." },
                                { id: "mtz_logistics", title: "Transporte & Logística 🚛", description: "Fletes, grúas y despacho." },
                                { id: "mtz_health", title: "Salud & Bienestar 💅", description: "Estética y servicios médicos." },
                                { id: "mtz_pro_services", title: "Servicios Profesionales ⚖️", description: "Contabilidad, legal y consultoría." },
                                { id: "mtz_industrial", title: "Seguridad & Industrial 🛡️", description: "EPP y servicios industriales." }
                            ]
                        }
                    ]
                }
            }
        })
    });

    const data = await res.json();
    console.log('🏁 Resultado:', JSON.stringify(data, null, 2));
}

sendList();
