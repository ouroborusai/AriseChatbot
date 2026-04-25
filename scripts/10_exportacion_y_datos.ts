/**
 * ARISE DATA EXPORT & REPORTS TEST v10.0
 * Prueba de capacidades analíticas y exportación de datos.
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
                        id: `EXP_${Date.now()}`, 
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
    "Hola Arise, necesito exportar algunos datos operativos y financieros del sistema.",
    "¿Qué tipos de reportes y formatos de exportación (como PDF, Excel o CSV) tienes disponibles?",
    "Genera un reporte financiero resumido con los ingresos y gastos de este mes.",
    "Perfecto, ahora exporta ese mismo reporte financiero mensual a un archivo PDF.",
    "Agrupa los gastos por categoría y genera un nuevo reporte para descargar en Excel.",
    "Ahora pasemos a los materiales. Dame un resumen rápido de los productos con stock bajo.",
    "Exporta el catálogo completo de inventario actual, incluyendo SKU y stock, en formato CSV.",
    "Genera un reporte de los últimos movimientos que impliquen SÓLO salidas de material y expórtalo a PDF.",
    "Busca en mi agenda y dame un resumen de actividad y tareas con el contacto 'Ignacio Vargas'.",
    "Exporta todo el historial de interacciones y citas de 'Ignacio Vargas' en un archivo Excel.",
    "Genera un reporte de todos los contactos de la categoría 'VIP' y descárgalo como CSV.",
    "Exporta absolutamente todos los datos de mi cuenta en un archivo de Word (.docx).", // Caso de borde: formato no soportado
    "Envíame por correo electrónico el PDF financiero y el CSV de inventario a admin@industrial.com.", // Simulación de email
    "Necesito un enlace de descarga directa para el último Excel de contactos VIP que solicitamos.",
    "Para terminar, dame un resumen final de todos los archivos y reportes que hemos gestionado hoy."
];

async function runTest() { 
    console.clear();
    console.log(chalk.yellow.bold('╔══════════════════════════════════════════════════════════╗'));
    console.log(chalk.yellow.bold('║         ARISE DATA EXPORT - TEST DE REPORTES             ║'));
    console.log(chalk.yellow.bold('╚══════════════════════════════════════════════════════════╝\n'));
    
    let lastBotId: string | null = null;

    for (let i = 0; i < FLOW.length; i++) {
        const msg = FLOW[i];
        console.log(chalk.white(`▶ [Paso ${i + 1}/15] Usuario: `) + chalk.cyan(msg));
        
        await sendWebhook(msg);
        process.stdout.write(chalk.gray('   ... Arise generando reporte '));
        
        const botResponse = await waitAndGetBotResponse(lastBotId);
        
        if (botResponse) {
            console.log(chalk.green(` [OK]`));
            console.log(chalk.gray(`   🤖 Arise: `) + chalk.italic(botResponse.content.split('---')[0].trim()));
            lastBotId = botResponse.id;
        } else {
            console.log(chalk.red(` [TIMEOUT]`));
            break;
        }
        console.log(chalk.dim('   --------------------------------------------------------'));
    }
    
    console.log(chalk.yellow.bold('\n🏁 Test de Exportación y Reportes Finalizado.\n')); 
}

runTest();
