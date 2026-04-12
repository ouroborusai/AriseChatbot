import { getSupabaseAdmin } from '../lib/supabase-admin';

async function seedLinks() {
  console.log('--- 🔗 SEEDEANDO ENLACES DE AUTOGESTIÓN MTZ ---');

  const links = [
    { id: 'link_libros_cv', name: 'SII: Libros Compra/Venta', link: 'https://www4.sii.cl/consdcvinternetui/#/index' },
    { id: 'link_carpeta', name: 'SII: Carpeta Tributaria', link: 'https://www.sii.cl/servicios_online/1047-1702.html' },
    { id: 'link_renta_estado', name: 'SII: Estado de Renta', link: 'https://www4.sii.cl/consultaestadof22ui/#!/default' },
    { id: 'link_f29_integral', name: 'SII: Consulta Integral F29', link: 'https://www4.sii.cl/sifmConsultaInternet/index.html?dest=cifxx&form=29' },
    { id: 'link_boletas_rec', name: 'SII: Boletas Recibidas', link: 'https://loa.sii.cl/cgi_IMT/TMBCOC_MenuConsultasContribRec.cgi' },
    { id: 'link_facturacion', name: 'SII: Facturas Emitidas', link: 'https://www1.sii.cl/cgi-bin/Portal001/mipeAdminDocsEmi.cgi' },
    { id: 'link_previred', name: 'Previred (Cotizaciones)', link: 'https://www.previred.com/web/previred/' },
    { id: 'link_dt', name: 'Dirección del Trabajo', link: 'https://midt.dirtrab.cl/welcome' },
    { id: 'link_transbank', name: 'Ventas Transbank', link: 'https://privado.transbank.cl/' }
  ];

  for (const l of links) {
    await getSupabaseAdmin().from('templates').upsert({
      id: l.id,
      name: l.name,
      category: 'link',
      content: `Aquí tienes el enlace directo solicitado:\n\n🔗 *${l.name}*\n${l.link}\n\n¿Necesitas algún otro acceso?`,
      actions: [
        { id: 'menu_enlaces_sii', title: '⬅️ Volver a Enlaces' },
        { id: 'menu_principal_cliente', title: '🏠 Inicio' }
      ]
    }, { onConflict: 'id' });
  }

  // Crear el menú de enlaces
  await getSupabaseAdmin().from('templates').upsert({
    id: 'menu_enlaces_sii',
    name: 'Sub-menú Enlaces SII',
    category: 'menu',
    content: '🌐 *Portal de Trámites Directos*\n\nHe seleccionado los accesos más utilizados para tu comodidad. Selecciona uno para obtener el link oficial:',
    actions: [
      {
        type: 'list',
        title: 'Ver Trámites',
        sections: [
          {
            title: 'SII y Otros',
            rows: links.map(l => ({
              id: l.id,
              title: l.name.length > 24 ? l.name.substring(0, 21) + '...' : l.name,
              description: 'Link oficial directo'
            }))
          }
        ]
      },
      { id: 'menu_principal_cliente', title: '🏠 Inicio' }
    ]
  }, { onConflict: 'id' });

  // 2. ACTUALIZAR EL MENÚ PRINCIPAL PARA INCLUIR ESTA OPCIÓN
  const { data: mainMenu } = await getSupabaseAdmin().from('templates').select('*').eq('id', 'menu_principal_cliente').single();
  if (mainMenu) {
    const actions = mainMenu.actions || [];
    // Buscar la lista de acciones
    const listAction = actions.find((a: any) => a.type === 'list');
    if (listAction && listAction.sections && listAction.sections[0]) {
       // Añadir a la sección de ayuda/soporte o crear una nueva
       listAction.sections[0].rows.push({
         id: 'menu_enlaces_sii',
         title: '🌐 ENLACES: Trámites SII',
         description: 'Accesos directos a portales'
       });
       
       await getSupabaseAdmin().from('templates').update({ actions }).eq('id', 'menu_principal_cliente');
    }
  }

  console.log('✅ Menú de enlaces y enlaces individuales creados.');
  console.log('✅ Menú Principal actualizado con la opción de enlaces.');
}

seedLinks();
