import * as dotenv from 'dotenv';
import path from 'path';
import { handleInboundUserMessage } from '../lib/webhook-handler';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runFullStressTest() {
  console.log('--- 🔥 INICIANDO STRESS TEST DE TODAS LAS OPCIONES DEL MENÚ ---');
  const CLIENT_PHONE = '56990062213';
  const PROSPECT_PHONE = '56900000000';

  const ACTIONS_TO_TEST = [
    // FLUJO CLIENTE (Menú Principal)
    { phone: CLIENT_PHONE, id: 'btn_mis_documentos', label: 'Docs' },
    { phone: CLIENT_PHONE, id: 'tipo_iva', label: 'IVA' },
    { phone: CLIENT_PHONE, id: 'tipo_renta', label: 'Renta' },
    { phone: CLIENT_PHONE, id: 'tipo_nomina', label: 'Nómina' },
    { phone: CLIENT_PHONE, id: 'btn_subir_archivos', label: 'Buzón' },
    { phone: CLIENT_PHONE, id: 'btn_tramites', label: 'Trámites' },
    { phone: CLIENT_PHONE, id: 'btn_estado_cuenta', label: 'Cobranza' },
    { phone: CLIENT_PHONE, id: 'btn_ver_cuentas', label: 'Datos Banco' },
    { phone: CLIENT_PHONE, id: 'btn_asesor_principal', label: 'Soporte' },
    { phone: CLIENT_PHONE, id: 'menu_principal_cliente', label: 'Volver Inicio Cli' },

    // CICLO FINAL TRANSACCIONAL (Deep Flows)
    { phone: CLIENT_PHONE, id: 'btn_agendar_cita', label: 'Inicia Cita' },
    { phone: CLIENT_PHONE, id: 'reunion_tarde', label: 'Escoge Tarde' },
    { phone: CLIENT_PHONE, id: 'btn_volver_home_cita', label: 'Home post Cita' },
    
    { phone: CLIENT_PHONE, id: 'btn_tramites', label: 'Inicia Trámite' },
    { phone: CLIENT_PHONE, text: 'Adjunto solicitud de ampliación de giro para el SII', label: 'Captura Trámite' },
    
    { phone: CLIENT_PHONE, id: 'btn_subir_archivos', label: 'Inicia Buzón' },
    { phone: CLIENT_PHONE, document: { id: 'media_valida_99', filename: 'iva_abril.pdf' }, label: 'Envío Archivo' },

    // FLUJO PROSPECTO (Menú Onboarding)
    { phone: PROSPECT_PHONE, id: 'btn_cotizar', label: 'Cotizar' },
    { phone: PROSPECT_PHONE, id: 'btn_especialidades', label: 'FAQ' },
    { phone: PROSPECT_PHONE, id: 'btn_asesor_ventas', label: 'Ventas' },
    { phone: PROSPECT_PHONE, id: 'btn_inicio_actividades', label: 'Inicio Activ' },
    { phone: PROSPECT_PHONE, id: 'bienvenida_prospecto', label: 'Volver Inicio Pros' }
  ];


  for (const action of ACTIONS_TO_TEST) {
    console.log(`\n🧪 PROBANDO: ${action.label} (ID: ${action.id || 'TEXT'})`);
    
    const messageData: any = { from: action.phone };
    if ((action as any).id) {
       messageData.interactive = { button_reply: { id: (action as any).id } };
    } else if ((action as any).text) {
       messageData.text = { body: (action as any).text };
    } else if ((action as any).document) {
       messageData.document = (action as any).document;
    } else if ((action as any).image) {
       messageData.image = (action as any).image;
    }

    await handleInboundUserMessage(messageData);

  }


  console.log('\n--- 🔥 STRESS TEST FINALIZADO CON ÉXITO ---');
}

runFullStressTest();
