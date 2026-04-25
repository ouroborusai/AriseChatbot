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

/**
 * PHASE 1: PERCEPTION - Simulación de Webhook Industrial
 */
async function sendWebhook(text: string, messageId: string) {
  const payload = {
    entry: [{
      changes: [{
        value: {
          messages: [{
            from: ADMIN_PHONE,
            text: { body: text },
            timestamp: Math.floor(Date.now() / 1000).toString(),
            id: messageId
          }],
          metadata: { phone_number_id: PH_ID }
        },
        field: "messages"
      }]
    }],
    object: "whatsapp_business_account"
  };

  const response = await fetch(`${WEBHOOK_URL}?source=trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return response.ok;
}

/**
 * PHASE 2: INFERENCE - Captura de Neural Pulse
 */
async function waitAndGetBotResponse(startTime: string) {
  const timeout = 25000;
  const interval = 2000;
  let elapsed = 0;

    while (elapsed < 45000) {
    const { data } = await supabase
      .from('messages')
      .select('*, conversations!inner(contacts!inner(phone))')
      .eq('conversations.contacts.phone', ADMIN_PHONE)
      .eq('sender_type', 'bot')
      .gt('created_at', startTime)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) return data;
    
    await new Promise(resolve => setTimeout(resolve, interval));
    elapsed += interval;
  }
  return null;
}

/**
 * PHASE 3: TELEMETRY - Auditoría de Rendimiento Ouroborus
 */
async function logTelemetry() {
  const { data: tel } = await supabase
    .from('ai_api_telemetry')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (tel) {
    console.log(chalk.gray(`   [TELEMETRÍA] Latencia: ${tel.latency_ms}ms | Costo: $${tel.cost_estimated}`));
    console.log(chalk.gray(`   [TOKENS] Entrada: ${tel.tokens_input} | Salida: ${tel.tokens_output} | Modelo: ${tel.model || 'Gemini 2.5'}`));
  }
}

/**
 * ESCENARIOS DIAMOND v10.0
 */
const FLOW = [
  {
    name: "Protocolo de Reseteo y Menú Central (Visual SSOT)",
    input: "hola",
    validate: (res: any) => {
      const coreCategories = [
        "📦 Inventario", 
        "💰 Finanzas", 
        "👥 Personal", 
        "📊 Reportes", 
        "⚙️ Ajustes"
      ];
      const match = coreCategories.every(cat => res.content.includes(cat));
      if (!match) {
        console.log(chalk.yellow(`      ⚠️ Alerta: Faltan categorías o emojis oficiales.`));
      }
      return match;
    }
  },
  {
    name: "Validación de Límites WhatsApp (24 Chars)",
    input: "Dame opciones de inventario con nombres descriptivos",
    validate: (res: any) => {
      const parts = res.content.split('---');
      if (parts.length < 2) return true;
      const options = parts[1].split('|').map((o: any) => o.trim());
      const tooLong = options.filter((o: string) => o.length > 24);
      if (tooLong.length > 0) {
        console.log(chalk.red(`      ✘ ERROR: Opciones exceden 24 chars: ${tooLong.join(', ')}`));
        return false;
      }
      return true;
    }
  },
  {
    name: "Neural Bridge: Acción 'reminder_set' (SSOT Sync)",
    input: "Recuérdame llamar al cliente en 1 hora",
    validate: (res: any) => {
      const hasAction = res.content.includes('reminder_set') && res.content.includes('params');
      return hasAction;
    }
  }
];

async function run() {
  console.clear();
  console.log(chalk.bold.blue('╔══════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.blue('║      LOOP DIAMOND CORE - PROTOCOLO DE VALIDACIÓN v10.0    ║'));
  console.log(chalk.bold.blue('╚══════════════════════════════════════════════════════════╝\n'));

  for (const step of FLOW) {
    const startTime = new Date().toISOString();
    const wamid = `wamid.test_${Math.random().toString(36).substring(7)}`;

    console.log(chalk.white(`▶ Ejecutando: `) + chalk.bold(step.name));
    
    const sent = await sendWebhook(step.input, wamid);
    if (!sent) { 
        console.log(chalk.red('   ✘ Error al enviar Webhook')); 
        continue; 
    }

    process.stdout.write(chalk.gray('   ... Neural Pulse en progreso '));
    try {
      const response = await waitAndGetBotResponse(startTime);
      if (!response) {
        console.log(chalk.red(' [TIMEOUT]'));
        continue;
      }

      console.log(chalk.green(' [OK]'));
      const isValid = step.validate(response);
      
      if (isValid) {
        console.log(chalk.green(`   ✔ PASADO: Protocolo Diamond cumplido.`));
      } else {
        console.log(chalk.red(`   ✘ FALLIDO: La respuesta no cumple el estándar técnico.`));
      }

      console.log(chalk.gray(`   🤖 Bot: ${response.content.split('---')[0].trim().substring(0, 100)}...`));
      await logTelemetry();

    } catch (e: any) {
      console.log(chalk.red(`   ✘ Error: ${e.message}`));
    }
    console.log(chalk.dim('   --------------------------------------------------------'));
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(chalk.bold.green('\n🏁 CICLO DE VALIDACIÓN DIAMOND COMPLETADO.\n'));
}

run();
