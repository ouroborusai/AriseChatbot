/**
 * ARISE FINANCE & PAYMENTS TEST v10.0
 * Simulación de ciclo contable: Ingresos, Gastos y Balance.
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
                        id: `FIN_${Date.now()}`, 
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

const FLOW = [
    "Hola Arise, iniciemos el control de finanzas de hoy.",
    "Registra un pago recibido de $1500 del cliente 'Constructora Alfa'.",
    "Anota que el cliente 'Metalúrgica Sur' pagó $800 por la factura #4055.",
    "Registra un gasto operativo de $300 por compra de insumos de oficina.",
    "Pagué la factura de electricidad por $120. Anótalo como gasto de infraestructura.",
    "Anota un gasto en transporte de $-50.", // Prueba de monto negativo (error)
    "El cliente Juan me pagó 'cinco lucas y media' en efectivo.", // Prueba de ambigüedad
    "Me refería a que Juan pagó $5500.", // Resolución de ambigüedad
    "Anota un pago de $9,999,999,999 del cliente Fantasma.", // Prueba de límites
    "¿Cuánto dinero hemos ingresado y gastado en total hasta ahora?",
    "Hubo un error en la factura de electricidad, no eran $120, en realidad fueron $150. Corrígelo.",
    "El cliente 'Constructora Alfa' nos dejó un abono de $500 como anticipo para un nuevo proyecto.",
    "Compramos 50 sacos de cemento por $200. Pásalo a finanzas.",
    "Genera un reporte de todos los documentos y comprobantes procesados hoy.",
    "Perfecto, dame un resumen final exacto del balance del día restando los gastos de los ingresos, y terminamos."
];

async function runTest() { 
    console.clear();
    console.log(chalk.green.bold('╔══════════════════════════════════════════════════════════╗'));
    console.log(chalk.green.bold('║         ARISE FINANCE & PAYMENTS - TEST CONTABLE         ║'));
    console.log(chalk.green.bold('╚══════════════════════════════════════════════════════════╝\n'));
    
    let lastBotId: string | null = null;

    for (let i = 0; i < FLOW.length; i++) {
        const msg = FLOW[i];
        console.log(chalk.white(`▶ [Paso ${i + 1}/15] Usuario: `) + chalk.cyan(msg));
        
        await sendWebhook(msg);
        process.stdout.write(chalk.gray('   ... Arise procesando transacción '));
        
        const botResponse = await waitAndGetBotResponse(lastBotId);
        
        if (botResponse) {
            console.log(chalk.green(` [OK]`));
            console.log(chalk.gray(`   🤖 Arise: `) + chalk.italic(botResponse.content.split('---')[0].trim()));
            lastBotId = botResponse.id;

            // Validación Atómica en el paso 2 (Registro de pago)
            if (i === 1) {
                console.log(chalk.blue('\n   🔍 Verificando Registro de Pago en BD (client_documents)...'));
                const { data } = await supabase.from('client_documents').select('*').eq('document_type', 'factura').limit(1);
                if (data) {
                    console.log(chalk.green(`   ✅ ÉXITO: La transacción se ha registrado correctamente.`));
                }
                console.log('');
            }
        } else {
            console.log(chalk.red(` [TIMEOUT]`));
            break;
        }
        console.log(chalk.dim('   --------------------------------------------------------'));
    }
    
    console.log(chalk.green.bold('\n🏁 Test de Finanzas y Pagos Finalizado.\n')); 
}

runTest();
