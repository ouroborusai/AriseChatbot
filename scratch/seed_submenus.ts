import { getSupabaseAdmin } from '../lib/supabase-admin';

async function seed() {
  console.log('--- 🏗️ DEPLOY DE SUB-MENÚS NIVEL 2 ---');
  
  const templates = [
    {
      id: 'menu_finanzas',
      name: 'SUB-MENU FINANZAS',
      content: '📊 Sección de Finanzas y Balances.\n\n¿Qué informe necesitas revisar de tu empresa?',
      category: 'finanzas',
      segment: 'cliente',
      is_active: true,
      actions: [
        { type: 'list', title: 'Ver Informes', content: JSON.stringify([
          { id: 'show_balance_anual', title: '📈 Balance Anual 2024' },
          { id: 'show_balance_mensual', title: '📅 Balance Mensual' },
          { id: 'show_estado_resultado', title: '📊 Estado de Resultados' },
          { id: 'menu_principal_cliente', title: '⬅️ Volver' }
        ]), next_template_id: 'redirect_logic' }
      ]
    },
    {
      id: 'menu_nomina',
      name: 'SUB-MENU NÓMINA',
      content: '👥 Centro de Gestión de Personal.\n\n¿Qué documentos del equipo necesitas?',
      category: 'rrhh',
      segment: 'cliente',
      is_active: true,
      actions: [
        { type: 'list', title: 'Ver Documentos', content: JSON.stringify([
          { id: 'show_liquidacion', title: '💰 Liquidaciones de Sueldo' },
          { id: 'show_contrato', title: '📄 Contratos de Trabajo' },
          { id: 'show_previred', title: '🏥 Pago Leyes Sociales' },
          { id: 'btn_nueva_solicitud', title: '📋 Solicitar Nueva Gestión' },
          { id: 'menu_principal_cliente', title: '⬅️ Volver' }
        ]), next_template_id: 'redirect_logic' }
      ]
    },
    {
      id: 'menu_empresas',
      name: 'SUB-MENU EMPRESAS',
      content: '🏢 Gestión de Entidades.\n\nActualmente estás viendo información de: *{{empresa_activa}}*.\n\n¿Qué deseas hacer?',
      category: 'empresas',
      segment: 'cliente',
      is_active: true,
      actions: [
        { type: 'list', title: 'Empresas', content: JSON.stringify([
          { id: 'btn_ver_empresas', title: '🔄 Cambiar de Empresa' },
          { id: 'btn_datos_empresa', title: '🔎 Ver Datos Tributarios' },
          { id: 'menu_principal_cliente', title: '⬅️ Volver' }
        ]), next_template_id: 'redirect_logic' }
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
      console.log(`✅ Sub-menú ${t.name} activado.`);
    }
  }

  // Actualizar también el Menú Principal para apuntar a estos nuevos sub-menús si es necesario
  console.log('--- 🔄 ACTUALIZANDO VÍNCULOS DEL MENÚ PRINCIPAL ---');
  // (El menú ya tiene IDs que coinciden con estos nuevos templates o handlers)
}

seed();
