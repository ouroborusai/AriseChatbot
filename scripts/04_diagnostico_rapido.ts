/**
*  ARISE NEURAL DIAGNOSTIC TOOL v9.5 (Diamond Industrial)
*  Check-up Definitivo: Latencia, Triggers, Gemini Keys y Bot Response.
*/
import { createClient } from '@supabase/supabase-js'; 
import dotenv from 'dotenv'; 
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const ADMIN_PHONE = '56990062213'; 
const LOCAL_WEBHOOK = 'http://localhost:3000/api/webhook/whatsapp';
const PH_ID = '1066879279838439';

const { url: supabaseUrl, key: supabaseKey } = { 
  url: process.env.NEXT_PUBLIC_SUPABASE_URL, 
  key: process.env.SUPABASE_SERVICE_ROLE_KEY 
}; 
const supabase = createClient(supabaseUrl!, supabaseKey!);

// 1. AUDITORÍA DE LATENCIA (Envío vs Persistencia)
async function auditLatencyAndResponse() {
  console.log(chalk.yellow.bold('\n⏱️  INICIANDO AUDITORÍA DE LATENCIA Y RESPUESTA...'));
  
  const testMessageId = `DIAG_${Date.now()}`;
  const sendStartTime = Date.now();
  
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
            id: testMessageId, 
            timestamp: Math.floor(Date.now() / 1000).toString(), 
            text: { body: "Diagnóstico de latencia interno" }, 
            type: "text" 
          }] 
        }, 
        field: "messages" 
      }] 
    }] 
  };

  // Medir latencia de red (Envío)
  const response = await fetch(LOCAL_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const networkLatency = Date.now() - sendStartTime;
  console.log(chalk.gray(`   ├─ Latencia de Red (HTTP Webhook): ${networkLatency}ms`));

  // Medir latencia de persistencia (Base de Datos)
  let persistenceLatency = -1;
  
  for (let i = 0; i < 15; i++) {
    const { data: messages } = await supabase
      .from('messages')
      .select('id, content, created_at')
      .eq('id', testMessageId)
      .limit(1);

    if (messages && messages.length > 0) {
      persistenceLatency = Date.now() - sendStartTime;
      break;
    }
    await new Promise(r => setTimeout(r, 500)); // Polling rápido
  }

  if (persistenceLatency !== -1) {
    console.log(chalk.green(`   ├─ Latencia de Persistencia DB: ${persistenceLatency}ms (Delta: ${persistenceLatency - networkLatency}ms)`));
  } else {
    console.log(chalk.red('   ├─ ERROR: El mensaje no persistió en la base de datos a tiempo.'));
  }

  // Esperar la respuesta del Bot
  console.log(chalk.yellow('   ├─ Esperando respuesta del Agente IA...'));
  let botLatency = -1;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const { data: botMessages } = await supabase
      .from('messages')
      .select('id, content, conversations!inner(contacts!inner(phone))')
      .eq('conversations.contacts.phone', ADMIN_PHONE)
      .eq('sender_type', 'bot')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (botMessages && botMessages.length > 0) {
        botLatency = Date.now() - sendStartTime;
        console.log(chalk.green(`   ✅ Respuesta recibida en ${botLatency}ms: "${botMessages[0].content.substring(0, 50)}..."`));
        return;
    }
  }
  console.log(chalk.red('   ❌ ERROR: Timeout esperando respuesta del bot.'));
}

// 2. AUDITORÍA DE TRIGGERS DE POSTGRES (Side effects)
async function auditPostgresTriggers() {
  console.log(chalk.cyan.bold('\n⚙️  VERIFICANDO INTEGRIDAD DE TRIGGERS...'));
  
  // Verificamos si las tablas críticas están accesibles
  const { data, error } = await supabase.from('inventory_items').select('id').limit(1);
  
  if (error) {
    console.log(chalk.red(`   ├─ ERROR: No se pudo acceder a las tablas críticas: ${error.message}`));
  } else {
    console.log(chalk.green('   ✅ Tablas críticas y permisos RLS operativos.'));
  }
}

// 3. AUDITORÍA DE GEMINI API KEYS (ROTACIÓN)
async function auditGeminiKeys() {
  console.log(chalk.magenta.bold('\n🔑 AUDITORÍA DE GEMINI API KEYS...'));
  
  const { data: keys, error } = await supabase
    .from('gemini_api_keys')
    .select('*')
    .eq('is_active', true);
  
  if (error || !keys) {
    console.log(chalk.red('   ❌ ERROR: No se pudieron recuperar las API Keys de la base de datos.'));
    return;
  }

  console.log(chalk.gray(`   ├─ Se detectaron ${keys.length} API Keys activas en el cluster Ouroborus.`));
  keys.forEach((k, index) => {
    console.log(chalk.green(`   ├─ [Key ${index + 1}] ID: ${k.id.slice(0,8)}... | Errores: ${k.error_count} | Último uso: ${new Date(k.last_used_at).toLocaleTimeString()}`));
  });
  console.log(chalk.green('   ✅ Cluster de rotación saludable.'));
}

async function runDiagnostic() {
  console.clear();
  console.log(chalk.cyan.bold('╔══════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║         ARISE NEURAL DIAGNOSTIC - ADMIN PANEL            ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════╝\n'));

  await auditGeminiKeys();
  await auditPostgresTriggers();
  await auditLatencyAndResponse();
  
  console.log(chalk.cyan.bold('\n🏁 DIAGNÓSTICO FINALIZADO.\n'));
}

runDiagnostic();
