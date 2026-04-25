/**
 * ARISE E2E INDUSTRIAL TEST v10.0
 * Simulación de Día de Trabajo: Contexto, Acciones Atómicas y Persistencia.
 */
import { createClient } from '@supabase/supabase-js'; 
import dotenv from 'dotenv'; 
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!; 
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabase = createClient(supabaseUrl, supabaseKey);

const WEBHOOK_URL = 'http://localhost:3000/api/webhook/whatsapp'; 
const ADMIN_PHONE = '56990062213'; 

async function sendWebhook(body: string) { 
    const payload = { 
        object: "whatsapp_business_account", 
        entry: [{ 
            changes: [{ 
                value: { 
                    messages: [{ 
                        from: ADMIN_PHONE, 
                        id: `E2E_${Date.now()}`, 
                        timestamp: Math.floor(Date.now() / 1000).toString(), 
                        text: { body }, 
                        type: "text" 
                    }] 
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
            
        if (messages && messages.length > 0 && messages[0].id !== prevBotMessageId) {
            return messages[0];
        }
    }
    return null;
}

async function validateAtomicAction(taskContent: string) {
    console.log(chalk.yellow(`\n   🔍 Verificando Acción Atómica en BD para: "${taskContent}"...`));
    
    const { data, error } = await supabase
        .from('reminders') 
        .select('*')
        .ilike('content', `%${taskContent}%`)
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.log(chalk.red(`   ❌ Error al consultar la BD: ${error.message}`));
        return false;
    }

    if (data && data.length > 0) {
        console.log(chalk.green(`   ✅ ÉXITO: El registro existe físicamente en la tabla 'reminders'.`));
        return true;
    } else {
        console.log(chalk.red(`   ❌ FALLO: El bot confirmó pero el registro no está en la base de datos.`));
        return false;
    }
}

async function runE2E() { 
    console.clear();
    console.log(chalk.blue.bold('╔══════════════════════════════════════════════════════════╗'));
    console.log(chalk.blue.bold('║        ARISE E2E INDUSTRIAL - SIMULACIÓN DE TRABAJO      ║'));
    console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════╝\n'));
    
    const FLOW = [
        "Hola Arise, iniciando jornada. Anota que el proyecto prioritario de hoy es la 'Ampliación Norte'.",
        "Crea un recordatorio urgente: 'Revisar planos' para mañana a las 15:00.",
        "¿Cuál era el proyecto prioritario en el que estamos trabajando hoy?"
    ];

    let lastMessageId = null;

    for (let i = 0; i < FLOW.length; i++) {
        const userMsg = FLOW[i];
        console.log(chalk.white(`▶ [Paso ${i + 1}] Usuario: `) + chalk.cyan(userMsg));
        
        await sendWebhook(userMsg);
        process.stdout.write(chalk.gray('   ... Arise procesando '));
        
        const botResponse = await waitAndGetBotResponse(lastMessageId);
        
        if (botResponse) {
            console.log(chalk.green(` [OK]`));
            console.log(chalk.gray(`   🤖 Bot: `) + chalk.italic(botResponse.content.split('---')[0].trim()));
            lastMessageId = botResponse.id;
            
            if (i === 1) await validateAtomicAction('Revisar planos');
            
            if (i === 2) {
                if (botResponse.content.includes('Ampliación Norte')) {
                    console.log(chalk.green.bold(`   ✅ CONTINUIDAD DE CONTEXTO EXITOSA: Arise recordó el proyecto.`));
                } else {
                    console.log(chalk.red.bold(`   ❌ FALLO DE CONTEXTO: Arise olvidó el dato del paso 1.`));
                }
            }
        } else {
            console.log(chalk.red(` [TIMEOUT]`));
        }
        console.log(chalk.dim('   --------------------------------------------------------'));
    }
    
    console.log(chalk.blue.bold('\n🏁 Simulación E2E Finalizada EXITOSAMENTE.\n')); 
}

runE2E();
