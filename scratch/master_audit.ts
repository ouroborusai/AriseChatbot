import { getSupabaseAdmin } from '../lib/supabase-admin';

async function finalMasterAudit() {
  console.log('--- 🛡️ AUDITORÍA MAESTRA DE INTEGRIDAD MTZ ---');

  // 1. Actualizar Cotización (RUT + CLAVE)
  const { error: cotErr } = await getSupabaseAdmin()
    .from('templates')
    .update({ 
      content: '¡Excelente decisión! 🚀 Para darte una propuesta exacta y personalizada, por favor envíanos el *RUT de tu empresa* y tu *Clave SII*.\n\nCon esta información, nuestros asesores evaluarán tu perfil comercial y te contactarán con una oferta a tu medida de inmediato. 💼' 
    })
    .eq('id', 'btn_cotizar');

  if (cotErr) console.error('❌ Error actualizando cotización:', cotErr.message);
  else console.log('✅ Flujo de Cotización (RUT + Clave) actualizado.');

  // 2. Lista de todos los IDs de navegación que deben existir
  const paths = [
    'menu_principal_cliente',
    'bienvenida_prospecto',
    'menu_archivo',
    'menu_finanzas',
    'menu_nomina',
    'menu_empresas',
    'btn_nueva_solicitud',
    'ver_solicitudes',
    'agendar_cita',
    'btn_humano',
    'btn_datos_empresa',
    'info_servicios',
    'info_impuestos',
    'info_rrhh',
    'btn_cotizar'
  ];

  console.log('\n--- 🔍 VERIFICANDO ENLACES ---');
  for (const id of paths) {
    const { data, error } = await getSupabaseAdmin()
      .from('templates')
      .select('id, name')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`❌ Error consultando ${id}:`, error.message);
    } else if (data) {
      console.log(`🟢 [OK] ${id} -> "${data.name}"`);
    } else {
      console.warn(`🔴 [MISSING] ${id} - ¡No tiene plantilla asociada!`);
    }
  }

  console.log('\n--- 🏁 FIN DE AUDITORÍA ---');
}

finalMasterAudit();
