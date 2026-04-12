import { getSupabaseAdmin } from '../lib/supabase-admin';

async function finalLink() {
  console.log('--- 🏗️ DEPLOY DE ENLACES DE SOPORTE FINAL ---');
  
  const templates = [
    {
      id: 'btn_humano',
      name: 'DERIVACIÓN A HUMANO',
      content: 'Entiendo perfectamente. 📞 He notificado a uno de nuestros asesores especializados de MTZ.\n\nSe pondrán en contacto contigo a través de este chat en los próximos minutos para ayudarte personalmente.\n\nGracias por tu paciencia. 🙏',
      category: 'soporte',
      segment: 'todos',
      is_active: true,
      actions: [
        { type: 'button', id: 'menu_principal_cliente', title: '🏠 Volver al Inicio' }
      ]
    },
    {
      id: 'btn_datos_empresa',
      name: 'DATOS TRIBUTARIOS EMPRESA',
      content: '🏢 *Datos de tu Empresa*\n\n📌 *Razón Social:* {{legal_name}}\n📌 *RUT:* {{rut}}\n📌 *Documentos en sistema:* {{document_count}}\n\nSi necesitas actualizar alguno de estos datos, por favor solicita una gestión.',
      category: 'info',
      segment: 'cliente',
      is_active: true,
      actions: [
        { type: 'button', id: 'btn_nueva_solicitud', title: '📋 Actualizar Datos' },
        { type: 'button', id: 'menu_empresas', title: '⬅️ Volver' }
      ]
    },
    {
      id: 'cat_otros',
      name: 'DOCUMENTOS OTROS',
      content: '📁 En esta sección encontrarás certificados, contratos y otros documentos misceláneos.\n\n¿Deseas solicitarnos un documento nuevo que no ves en el sistema?',
      category: 'servicios',
      segment: 'cliente',
      is_active: true,
      actions: [
        { type: 'button', id: 'btn_nueva_solicitud', title: '📋 Solicitar Documento' },
        { type: 'button', id: 'menu_archivo', title: '⬅️ Volver' }
      ]
    }
  ];

  for (const t of templates) {
    await getSupabaseAdmin().from('templates').upsert(t);
    console.log(`✅ Pieza ${t.name} instalada.`);
  }
}

finalLink();
