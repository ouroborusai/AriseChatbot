/**
 * ARISE ONBOARDING & ROLES TEST v10.0
 * Simulación de ciclo de vida: Prospecto -> Cliente.
 * Actores: STRANGER (56911112222) y ADMIN (56990062213).
 */
import { createClient } from '@supabase/supabase-js'; 
import dotenv from 'dotenv'; 
import chalk from 'chalk';

dotenv.config({ path: '.env.local', override: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!; 
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabase = createClient(supabaseUrl, supabaseKey);

const WEBHOOK_URL = 'http://localhost:3000/api/webhook/whatsapp'; 
const ADMIN_PHONE = '56990062213'; 
const STRANGER_PHONE = '56911112222';

/**
 * Función mejorada para enviar mensajes de diferentes actores
 */
async function sendWebhook(body: string, fromPhone: string) { 
    const payload = { 
        object: "whatsapp_business_account", 
        entry: [{ 
            changes: [{ 
                value: { 
                    messages: [{ 
                        from: fromPhone, 
                        id: `ONB_${Date.now()}`, 
                        timestamp: Math.floor(Date.now() / 1000).toString(), 
                        text: { body }, 
                        type: "text" 
                    }],
                    contacts: [{ profile: { name: fromPhone === ADMIN_PHONE ? "Admin" : "Juan Perez" }, wa_id: fromPhone }]
                }, 
                field: "messages" 
            }] 
        }] 
    };
    
    await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
}

async function waitAndGetBotResponse(prevBotMessageId: string | null, targetUserPhone: string, startTime: Date) { 
    for (let i = 0; i < 30; i++) { 
        console.log(`[DEBUG] Polling for bot response for ${targetUserPhone} since ${startTime.toISOString()}...`);
        const { data: messages, error } = await supabase 
            .from('messages') 
            .select('id, content, created_at, conversations!inner(contacts!inner(phone))') 
            .eq('conversations.contacts.phone', targetUserPhone) 
            .eq('sender_type', 'bot') 
            .gt('created_at', startTime.toISOString())
            .order('created_at', { ascending: false }) 
            .limit(1);
            
        if (error) console.error(`[DEBUG] Error: ${error.message}`);
        if (messages && messages.length > 0 && messages[0].id !== prevBotMessageId) {
            console.log(`[DEBUG] Found: ${messages[0].id}`);
            return messages[0];
        }
        await new Promise(r => setTimeout(r, 4000)); 
    }
    return null;
}

const FLOW = [
    { actor: STRANGER_PHONE, msg: "Hola, me interesa comprar ladrillos, ¿cuál es el precio?" },
    { actor: STRANGER_PHONE, msg: "Quisiera registrarme como cliente para obtener descuentos." },
    { actor: ADMIN_PHONE, msg: `Hola Arise, ¿quién es el prospecto ${STRANGER_PHONE} que está preguntando?` },
    { actor: ADMIN_PHONE, msg: `Regístralo como 'Juan Perez' y dale el rol de CLIENTE ahora mismo.` },
    { actor: ADMIN_PHONE, msg: `Establécele un límite de crédito de $500.000.` },
    { actor: STRANGER_PHONE, msg: "¿Ya estoy registrado? ¿Cuál es mi precio de cliente ahora?" },
    { actor: ADMIN_PHONE, msg: "Dame un resumen del perfil de Juan Perez y su rol actual en DB." }
];

async function runTest() { 
    console.clear();
    console.log(chalk.magenta.bold('╔══════════════════════════════════════════════════════════╗'));
    console.log(chalk.magenta.bold('║       ARISE ONBOARDING & ROLES - TEST MULTI-USUARIO      ║'));
    console.log(chalk.magenta.bold('╚══════════════════════════════════════════════════════════╝\n'));
    
    let lastBotId: string | null = null;

    for (let i = 0; i < FLOW.length; i++) {
        const step = FLOW[i];
        const actorName = step.actor === ADMIN_PHONE ? chalk.red('ADMIN') : chalk.yellow('EXTRAÑO');
        
        console.log(chalk.white(`▶ [Paso ${i + 1}] ${actorName}: `) + chalk.cyan(step.msg));
        
        const startTime = new Date();
        await sendWebhook(step.msg, step.actor);
        process.stdout.write(chalk.gray('   ... Arise procesando '));
        
        const botResponse = await waitAndGetBotResponse(lastBotId, step.actor, startTime);
        
        if (botResponse) {
            console.log(chalk.green(` [OK]`));
            console.log(chalk.gray(`   🤖 Arise -> ${actorName}: `) + chalk.italic(botResponse.content.split('---')[0].trim()));
            lastBotId = botResponse.id;

            // Validación Atómica en el paso 4 (Upgrade de rol)
            if (i === 3) {
                console.log(chalk.blue('\n   🔍 Verificando Upgrade de Rol en Supabase...'));
                const { data } = await supabase.from('internal_directory').select('role').eq('phone', STRANGER_PHONE).single();
                if (data?.role === 'CLIENTE') {
                    console.log(chalk.green(`   ✅ ÉXITO: El rol ha sido actualizado a CLIENTE en la tabla 'internal_directory'.`));
                } else {
                    console.log(chalk.red(`   ❌ FALLO: El rol sigue siendo ${data?.role || 'desconocido'}.`));
                }
                console.log('');
            }
        } else {
            console.log(chalk.red(` [TIMEOUT]`));
        }
        console.log(chalk.dim('   --------------------------------------------------------'));
    }
    
    console.log(chalk.magenta.bold('\n🏁 Test de Onboarding y Roles Finalizado.\n')); 
}

runTest();
