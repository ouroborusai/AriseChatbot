import * as dotenv from 'dotenv';
import path from 'path';
import { getSupabaseAdmin } from '../lib/supabase-admin';
import { handleInboundUserMessage } from '../lib/webhook-handler';
import { listCompaniesForContact } from '../lib/database-service';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * SIMULADOR MAESTRO DE FLUJOS
 * Prueba diferentes escenarios sin enviar mensajes reales (usando logs)
 */
async function simulateFlows() {
  console.log('--- 🤖 INICIANDO SIMULADOR MAESTRO DE SITUACIONES ---');

  // ESCENARIO 1: Prospecto Desconocido
  console.log('\n🚀 ESCENARIO 1: Nuevo Prospecto (Texto libre)');
  await simulateMessage('56911112222', 'Hola, quiero información', 'Cliente Invitado');

  // ESCENARIO 2: Cliente con 1 Empresa (Reconocimiento automático)
  console.log('\n🚀 ESCENARIO 2: Cliente Recurrente (1 Empresa)');
  await simulateMessage('56990062213', 'Hola bot', 'Carlos Villagra');

  // ESCENARIO 3: Identificación Proactiva por RUT
  console.log('\n🚀 ESCENARIO 3: Prospecto se identifica con RUT');
  await simulateMessage('56911112222', 'Mi rut es 77259318-K', 'Prospecto Anon');

  // ESCENARIO 4: Mensaje de Voz (Simulación de Transcripción)
  console.log('\n🚀 ESCENARIO 4: Mensaje de Voz -> "Necesito mis documentos"');
  // Aquí simulamos que el webhook recibe un audio que transcribimos como "documentos"
  await simulateMessage('56990062213', 'documentos', 'Carlos Villagra', true);

  // ESCENARIO 5: Derivación a Humano (Desactivación del Bot)
  console.log('\n🚀 ESCENARIO 5: Solicitud de Soporte Humano');
  await simulateMessage('56990062213', '[interactive:btn_asesor_principal]', 'Carlos Villagra');

  // ESCENARIO 6: REGRESO AL MENÚ TRAS SOPORTE (Reactivación Automática)
  console.log('\n🚀 ESCENARIO 6: Regreso al Menú tras Soporte (Reactivación)');
  await simulateMessage('56990062213', '[interactive:menu_principal_cliente]', 'Carlos Villagra');

  // ESCENARIO 7: Navegación Profunda a Documentos (Filtro por Tipo)
  console.log('\n🚀 ESCENARIO 7: Navegación Profunda (Mis Documentos -> IVA)');
  await simulateMessage('56990062213', '[interactive:btn_mis_documentos]', 'Carlos Villagra');
  await simulateMessage('56990062213', '[interactive:tipo_iva]', 'Carlos Villagra');

  // ESCENARIO 8: Flujo de Cobranza (Estado de Cuenta)
  console.log('\n🚀 ESCENARIO 8: Consulta de Estado de Cuenta y Pagos');
  await simulateMessage('56990062213', '[interactive:btn_estado_cuenta]', 'Carlos Villagra');
  await simulateMessage('56990062213', '[interactive:btn_ver_cuentas]', 'Carlos Villagra');


  // ESCENARIO 9: Cambio de Empresa (Contexto Múltiple)
  console.log('\n🚀 ESCENARIO 9: Cambio de Empresa Activa');
  await simulateMessage('56990062213', 'cambiar empresa', 'Carlos Villagra');
  // Simulamos selección de una empresa de la lista (ID ficticio para el test)
  await simulateMessage('56990062213', '[interactive:company_8c8163de-6753-4bbc-9087-c8db85502043]', 'Carlos Villagra');

  // ESCENARIO 10: Flujo de Trámites e IA Legal
  console.log('\n🚀 ESCENARIO 10: Solicitud de Trámite Nuevo');
  await simulateMessage('56990062213', '[interactive:btn_tramites]', 'Carlos Villagra');



  console.log('\n--- 🏁 SIMULACIÓN FINALIZADA ---');
}

/**
 * Simula la entrada de un mensaje y registra el flujo lógico
 */
async function simulateMessage(phone: string, text: string, name: string, isAudio = false) {
  console.log(`[Sim] 📥 De: ${name} (${phone}) -> "${text}" ${isAudio ? '(🎤 Audio)' : ''}`);
  
  try {
    const messageData: any = {
      from: phone,
      profileName: name,
    };

    if (text.startsWith('[interactive:')) {
      const id = text.slice(13, -1);
      messageData.interactive = { button_reply: { id } };
    } else {
      messageData.text = { body: text };
    }

    // Ejecutar el orquestador real
    // Nota: El orquestador enviará mensajes reales si el número es real, 
    // pero para este test observamos principalmente la lógica en consola
    await handleInboundUserMessage(messageData);
    
    // Verificar estado de la conversación tras el mensaje
    const { data: conv } = await getSupabaseAdmin()
      .from('conversations')
      .select('chatbot_enabled, last_response_at')
      .eq('phone_number', phone)
      .single();
      
    console.log(`[Sim] 🛡️ Estado Bot: ${conv?.chatbot_enabled ? 'ACTIVADO' : 'DESACTIVADO (Humano al mando)'}`);
  } catch (err) {
    console.error(`[Sim] ❌ Error en simulación:`, err);
  }
}

simulateFlows();
