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
                        id: `REC_${Date.now()}`,
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
    "Hola Arise, modo agenda activado para el administrador.",
    "Agrega un recordatorio: 'Auditoría de base de datos' para ayer a las 3 PM.", // Caso: Fecha pasada
    "Crea una reunión: 'Sincronización de equipo' para mañana a las 10:00 AM.",
    "Anota otra reunión: 'Entrevista con candidato' también para mañana a las 10:00 AM. ¿Puedes manejar ambas?", // Caso: Colisión
    "Crea un recordatorio urgente para 'Llamar al proveedor de servidores' mañana a las 3.", // Caso: Ambigüedad AM/PM
    "Actualiza el correo y teléfono de mi contacto VIP 'Ignacio Vargas' a +56955556666.", // Caso: Inexistente
    "Vale, asume el error. Crea a 'Ignacio Vargas' con ese número y ponlo como VIP.",
    "Mueve la entrevista de trabajo que choca con la sincronización, para mañana al mediodía.", // Referencia indirecta
    "Agenda 'Revisión trimestral con Ignacio' para el 31 de noviembre a las 11 AM.", // Caso: Fecha imposible
    "Asocia el recordatorio de las '3' al contacto VIP que acabo de crear.",
    "Marca la tarea de 'Auditoría de base de datos' (la de ayer) como completada.",
    "Busca si todavía tengo eventos que se superpongan en mi agenda para esta semana.",
    "¿Quiénes son mis contactos de la categoría 'VIP' actualmente?",
    "Dime qué recordatorios creamos en esta sesión y si quedó algún horario sin aclarar.",
    "Gracias, dame un resumen de mi agenda de mañana omitiendo los eventos cancelados o movidos, y finalizamos."
];

async function run() {
    console.clear();
    console.log(chalk.bold.bgBlue.white(' 📅 TEST 02: AGENDA Y RECORDATORIOS (15 PASOS) '));
    console.log(chalk.dim(' -------------------------------------------------- \n'));

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
        console.log(chalk.dim('   --------------------------------------------------'));
        await new Promise(r => setTimeout(r, 1000));
    }
    console.log(chalk.bold.green('\n✅ FLUJO DE AGENDA FINALIZADO.\n'));
}

run();
