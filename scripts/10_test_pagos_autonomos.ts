/**
 * TEST 10: VALIDACIÓN DE FLUJO DE PAGO AUTÓNOMO (MERCADOPAGO)
 * Verifica que ARISE pueda generar links de pago vía acción neural y entregarlos por WhatsApp.
 */
import { createClient } from '@supabase/supabase-js'; 
import dotenv from 'dotenv'; 
import chalk from 'chalk';

// Asegurar que usamos las credenciales locales y no las del sistema operativo
dotenv.config({ path: '.env.local', override: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!; 
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabase = createClient(supabaseUrl, supabaseKey);

const WEBHOOK_URL = 'http://localhost:3000/api/webhook/whatsapp'; 
const ADMIN_PHONE = '56900001111'; // Teléfono fresco para evitar historial residual


async function sendWebhook(body: string) { 
    const payload = { 
        object: "whatsapp_business_account", 
        entry: [{ 
            changes: [{ 
                value: { 
                    messages: [{ 
                        from: ADMIN_PHONE, 
                        id: `PAY_${Date.now()}`, 
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
        await new Promise(r => setTimeout(r, 4000)); // 4s por Gemini
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

async function runTest() { 
    console.clear();
    console.log(chalk.yellow.bold('╔══════════════════════════════════════════════════════════╗'));
    console.log(chalk.yellow.bold('║       TEST 10: FLUJO DE PAGO AUTÓNOMO (MERCADOPAGO)      ║'));
    console.log(chalk.yellow.bold('╚══════════════════════════════════════════════════════════╝\n'));
    
    let lastBotId: string | null = null;

    // Paso 1: Solicitar link de suscripción
    const msg = "Hola Arise, me gustaría suscribirme al plan PRO para mi empresa. ¿Me das un link de pago?";
    console.log(chalk.white(`▶ [Paso 1/2] Usuario: `) + chalk.cyan(msg));
    
    await sendWebhook(msg);
    process.stdout.write(chalk.gray('   ... Arise generando link de MercadoPago '));
    
    const botResponse = await waitAndGetBotResponse(lastBotId);
    
    if (botResponse) {
        console.log(chalk.green(` [OK]`));
        console.log(chalk.gray(`   🤖 Arise: `) + chalk.italic(botResponse.content.split('---')[0].trim()));
        
        // Verificación de la acción en logs
        console.log(chalk.blue('\n   🔍 Verificando Acción Neural en audit_logs...'));
        const { data: log } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('action', 'NEURAL_PROCESSOR_EXECUTE')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (log && JSON.stringify(log.new_data).includes('payment_link_generate')) {
            console.log(chalk.green(`   ✅ ÉXITO: La acción payment_link_generate se ejecutó correctamente.`));
        } else {
            console.log(chalk.red(`   ❌ ERROR: No se encontró la acción en los logs.`));
        }

        // Paso 2: Verificar si hay link en la respuesta (si Gemini es proactivo)
        if (botResponse.content.includes('http')) {
            console.log(chalk.green(`   ✅ ÉXITO: Arise entregó un link de pago.`));
        } else {
            console.log(chalk.yellow(`   ⚠️  Arise no incluyó el link explícito, revisando procesamiento...`));
        }

    } else {
        console.log(chalk.red(` [TIMEOUT] El motor neural no respondió a tiempo.`));
    }
    
    console.log(chalk.yellow.bold('\n🏁 Test 10 Finalizado.\n')); 
}

runTest();
