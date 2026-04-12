import { getSupabaseAdmin } from '../lib/supabase-admin';

async function seed() {
  console.log('--- 🏗️ INYECCIÓN FINAL DE SOLUCIONES MTZ ---');
  
  const templates = [
    {
      id: 'info_impuestos',
      name: 'INFO IMPUESTOS',
      content: 'Olvídate de las multas del SII. En MTZ somos expertos en cumplimiento tributario.\n\n✅ Declaraciones Mensuales (F29)\n✅ Operación Renta (F22)\n✅ Planificación Tributaria\n\n¿Quieres que revisemos tu situación?',
      category: 'info',
      segment: 'prospecto',
      is_active: true,
      actions: [
        { type: 'button', id: 'btn_cotizar', title: '📊 Cotizar Plan' },
        { type: 'button', id: 'agendar_cita', title: '📅 Agendar Reunión' },
        { type: 'button', id: 'bienvenida_prospecto', title: '⬅️ Otros Servicios' }
      ]
    },
    {
      id: 'info_rrhh',
      name: 'INFO RRHH',
      content: 'Gestionamos tu capital más valioso: tus trabajadores.\n\n✅ Liquidaciones de Sueldo\n✅ Leyes Sociales (Previred)\n✅ Contratos y Finiquitos\n\n¿Necesitas apoyo con tu nómina?',
      category: 'info',
      segment: 'prospecto',
      is_active: true,
      actions: [
        { type: 'button', id: 'btn_cotizar', title: '📊 Cotizar Nómina' },
        { type: 'button', id: 'agendar_cita', title: '📅 Agendar Reunión' },
        { type: 'button', id: 'bienvenida_prospecto', title: '⬅️ Otros Servicios' }
      ]
    },
    {
      id: 'btn_nueva_solicitud',
      name: 'NUEVA SOLICITUD CLIENTE',
      content: '¿Qué gestión necesitas que realicemos?\n\nPor favor, describe brevemente tu requerimiento.\n\nEjemplo: "Cambiar dirección social en SII"',
      category: 'gestion',
      segment: 'cliente',
      is_active: true,
      actions: [
        { type: 'button', id: 'btn_humano', title: '📞 Hablar con Asesor' },
        { type: 'button', id: 'menu_principal_cliente', title: '🏠 Volver al Inicio' }
      ]
    }
  ];

  for (const t of templates) {
    const { error } = await getSupabaseAdmin()
      .from('templates')
      .upsert(t);
    
    if (error) {
      console.error(`❌ Error en ${t.name}:`, error.message);
    } else {
      console.log(`✅ ${t.name} operativa.`);
    }
  }
}

seed();
