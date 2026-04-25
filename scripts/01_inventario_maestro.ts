import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const WEBHOOK_URL = 'http://localhost:3000/api/webhook/whatsapp';
const ADMIN_PHONE = '56990062213';
const PH_ID = '1066879279838439';

async function sendWebhook(body: string) {
    const payload = {
        object: "whatsapp_business_account",
        entry: [{
            id: "WHATSAPP_BUSINESS_ACCOUNT_ID",
            changes: [{
                value: {
                    messaging_product: "whatsapp",
                    metadata: { display_phone_number: "569XXXXXXXX", phone_number_id: PH_ID },
                    contacts: [{ profile: { name: "Admin Industrial" }, wa_id: ADMIN_PHONE }],
                    messages: [{
                        from: ADMIN_PHONE,
                        id: `INV_${Date.now()}`,
                        timestamp: Math.floor(Date.now() / 1000).toString(),
                        text: { body },
                        type: "text"
                    }]
                },
                field: "messages"
            }]
        }]
    };

    const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    return res.ok;
}

async function waitAndGetBotResponse(prevBotMessageId: string | null) {
    for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const { data: messages } = await supabase
            .from('messages')
            .select('id, content, conversations!inner(contacts!inner(phone))')
            .eq('conversations.contacts.phone', ADMIN_PHONE)
            .eq('sender_type', 'bot')
            .order('created_at', { ascending: false })
            .limit(1);

        const currentMsg = messages?.[0];
        if (currentMsg && currentMsg.id !== prevBotMessageId) {
            return { id: currentMsg.id, content: currentMsg.content };
        }
    }
    return null;
}

const FLOW = [
    "Hola Arise, iniciemos el control de inventario de hoy.",
    "¿Qué productos tengo actualmente en el sistema?",
    "Agrega 100 unidades de 'Ladrillo Arise Premium'. Luego, intenta crear nuevamente el SKU 'Ladrillo Arise Premium' con 20 unidades para ver cómo lo procesas.",
    "Ahora busca si existe 'Cemento BioBio' (sin tilde). Si no está, créalo con 50 sacos.",
    "Hubo un quiebre de stock enorme, descuenta 200 sacos de Cemento Bío Bío.", // Prueba de stock negativo
    "Agrega 30 unidades de ladrillos, descuenta 5 de cemento y dime cuál es el stock total de ambos sumados.",
    "¿Cuál es el stock actual de Cemento?", // Prueba de ambigüedad
    "Asigna la categoría 'Construcción Pesada' a TODOS los productos que sean Ladrillo o Cemento.",
    "Pon una alerta de stock bajo para el cemento en -10 unidades.", // Prueba de lógica
    "¿Tengo algún producto que necesite reposición urgente según las alertas que acabamos de configurar?",
    "Agrega 20 unidades de 'Fierro Corrugado 10mm' (SKU inexistente).",
    "Dime los últimos movimientos de este chat que impliquen SÓLO salidas o mermas de material.",
    "¿Quién es nuestro proveedor de ladrillos? Si no sabes, anota que es 'Cantera Central'. Si ya tiene proveedor, reemplázalo.",
    "Genera un reporte de inventario ahora mismo, pero agrupado por categorías.",
    "Perfecto, dame un resumen final exacto de los niveles de stock actualizados y terminamos."
];

async function run() {
    console.clear();
    console.log(chalk.bold.bgGreen.white(' 📦 TEST 01: INVENTARIO MAESTRO (15 PASOS) '));
    console.log(chalk.dim(' ---------------------------------------------- \n'));

    let lastBotId: string | null = null;

    for (let i = 0; i < FLOW.length; i++) {
        const msg = FLOW[i];
        console.log(chalk.white(`${i + 1}/15 👤 Usuario: `) + chalk.cyan(msg));
        
        await sendWebhook(msg);
        process.stdout.write(chalk.gray('   ... Arise procesando '));
        
        const response = await waitAndGetBotResponse(lastBotId);
        if (response) {
            console.log(chalk.green(' [OK]'));
            console.log(chalk.gray('   🤖 Bot: ') + chalk.italic(response.content.split('---')[0].trim()));
            if (response.content.includes('[[')) {
                console.log(chalk.yellow('   ⚙️  Acción: ') + chalk.dim(response.content.match(/\[\[(.*?)\]\]/)?.[0]));
            }
            lastBotId = response.id;
        } else {
            console.log(chalk.red(' [TIMEOUT]'));
            break;
        }
        console.log(chalk.dim('   --------------------------------------------'));
        await new Promise(r => setTimeout(r, 1000));
    }
    console.log(chalk.bold.green('\n✅ FLUJO DE INVENTARIO FINALIZADO.\n'));
}

run();
