'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTemplates } from '@/lib/hooks/useTemplates';
import { 
  TemplateEditor,
  Template,
  CATEGORIES,
  FlowCanvas
} from '@/app/components/templates';

export default function TemplatesPage() {
  const supabase = useMemo(() => createClient(), []);
  const { templates, loading, fetchTemplates, saveTemplate, deleteTemplate, deleteAllTemplates } = useTemplates();

  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const stats = useMemo(() => ({
    total: templates.length,
    active: templates.filter(t => t.is_active).length,
    byCategory: CATEGORIES.map(c => ({ ...c, count: templates.filter(t => t.category === c.id).length })),
  }), [templates]);

  const handleSaveTemplate = async (form: Partial<Template>) => {
    const templateToSave = { 
      ...form,
      id: editingTemplate?.id || `tpl_${Date.now()}`, 
    } as Template;
    
    await saveTemplate(templateToSave);
    
    setShowEditor(false); 
    setEditingTemplate(null);
  };

  // Restaurar plantillas por defecto - re-insertar en Supabase
  const handleRestoreDefaults = async () => {
    if (!confirm('¿Restaurar plantillas por defecto?\n\nSe recrearán las 40 plantillas en la base de datos.')) return;
    
    const plantillas = [
      { id: 'menu_principal_cliente', name: '1. Menú Principal Cliente', content: '¡Hola, {{nombre}}! 👋 Soy el asistente virtual de MTZ Consultores Tributarios. Para poder guiarte de la mejor manera, por favor selecciona una de las siguientes opciones:', category: 'bienvenida', segment: 'cliente', is_active: true, priority: 100, trigger: 'hola,hola!,buenos días,buenas,bienvenido,start,menu', workflow: 'atencion', actions: [{type:'list',title:'Opciones',description:'Selecciona una opción',content:'[{"id":"btn_mis_documentos","title":"📄 Mis Documentos","description":"Consultar y descargar archivos"},{"id":"btn_mis_datos","title":"👤 Mis Datos","description":"Actualizar información personal"},{"id":"btn_tramites","title":"⚙️ Trámites","description":"Gestiones y servicios"},{"id":"btn_asesor_principal","title":"📞 Hablar con asesor","description":"Atención personalizada"}]'}] },
      { id: 'menu_mis_datos', name: '2. Mis Datos', content: '👤 *Tus datos en MTZ:*\n\nNombre: {{nombre}}\nTeléfono: {{telefono}}\nSegmento: {{segmento}}\n\n¿Qué necesitas actualizar?', category: 'general', segment: 'cliente', is_active: true, priority: 90, workflow: 'general', actions: [{type:'list',title:'Actualizar Datos',description:'Selecciona una opción',content:'[{"id":"btn_actualizar_email","title":"📧 Actualizar email","description":"Cambiar correo electrónico"},{"id":"btn_actualizar_telefono","title":"📱 Actualizar teléfono","description":"Cambiar número de contacto"},{"id":"btn_ver_empresas","title":"🏢 Ver empresas","description":"Gestionar empresas vinculadas"},{"id":"btn_volver_principal","title":"← Volver al menú","description":"Regresar al inicio"}]'}] },
      { id: 'menu_tramites', name: '2. Menú Trámites', content: '⚙️ *Trámites Disponibles*\n\nSelecciona el trámite que necesitas:', category: 'tramites', segment: 'cliente', is_active: true, priority: 95, workflow: 'documentos', actions: [{type:'list',title:'Trámites',description:'Selecciona una categoría',content:'[{"id":"btn_tram_iva","title":"🧾 Declaración IVA","description":"Consultar IVAs"},{"id":"btn_tram_renta","title":"📊 Declaración Renta","description":"Consultar Renta"},{"id":"btn_tram_nomina","title":"👥 Nómina","description":"Consultar liquidaciones"},{"id":"btn_tram_balance","title":"📈 Balances","description":"Consultar balances"},{"id":"btn_volver_tramites","title":"← Volver al menú","description":"Regresar al inicio"}]'}] },
      { id: 'menu_empresas', name: '2. Mis Empresas', content: '🏢 *Tus empresas vinculadas:*\n\nSelecciona una empresa para ver sus documentos:', category: 'general', segment: 'cliente', is_active: true, priority: 88, workflow: 'general', actions: [{type:'list',title:'Gestión de Empresas',description:'Selecciona una opción',content:'[{"id":"btn_empresa_activa","title":"🏢 Empresa activa","description":"Ver documentos de la empresa actual"},{"id":"btn_cambiar_empresa","title":"🔄 Cambiar empresa","description":"Seleccionar otra empresa"},{"id":"btn_volver_datos","title":"← Volver a mis datos","description":"Regresar a Mis Datos"}]'}] },
      { id: 'sin_empresas', name: 'Sin Empresas', content: '🏢 No tienes empresas vinculadas aún.\n\n¿Quieres vincular una empresa o hablar con un asesor?', category: 'general', segment: 'cliente', is_active: true, priority: 87, workflow: 'general', actions: [{type:'button',id:'btn_vincular_empresa',title:'📝 Vincular empresa',next_template_id:'vincular_empresa'},{type:'button',id:'btn_asesor_empresa',title:'📞 Hablar con asesor',next_template_id:'derivacion_asesor'},{type:'button',id:'btn_volver_datos_empresa',title:'← Volver',next_template_id:'menu_mis_datos'}] },
      { id: 'bienvenida_prospecto', name: '1. Saludo Prospecto', content: '¡Hola! 👋 Bienvenido a MTZ Consultores. ¿En qué podemos ayudarte?', category: 'bienvenida', segment: 'prospecto', is_active: true, priority: 1, trigger: 'hola,hola!,buenos días,buenas', workflow: 'atencion', actions: [{type:'button',id:'btn_cotizar',title:'💼 Cotizar servicio',next_template_id:'cotizacion_info'},{type:'button',id:'btn_servicios',title:'📝 Ver servicios',next_template_id:'servicios_general'},{type:'button',id:'btn_contacto',title:'📞 Contactar asesor',next_template_id:'derivacion_asesor'}] },
      { id: 'cotizacion_info', name: '2. Información Cotización', content: '💼 Para cotizar nuestro servicio necesito algunos datos:\n\n• Tipo de empresa (SA, SpA, LTDA, etc.)\n• Facturación mensual aproximada\n• Cantidad de trabajadores\n• Necesidades específicas\n\n¿Tienes esta información o prefieres que un asesor te llame?', category: 'servicios', segment: 'prospecto', is_active: true, priority: 30, workflow: 'atencion', actions: [{type:'button',id:'btn_cot_tengo',title:'📝 Tengo la información',next_template_id:'cotizacion_recoger'},{type:'button',id:'btn_cot_asesor',title:'📞 Que me llamen',next_template_id:'derivacion_asesor'}] },
      { id: 'cotizacion_recoger', name: '3. Recoger Datos Cotización', content: 'Perfecto. Envíame la información y te prepararé una cotización.\n\nMientras, dime:\n1. ¿Qué tipo de empresa tienes?\n2. ¿Cuántos trabajadores?', category: 'servicios', segment: 'prospecto', is_active: true, priority: 31, workflow: 'atencion', actions: [] },
      { id: 'servicios_general', name: '2. Lista de Servicios', content: 'Nuestros servicios:\n\n🚀 *Inicio de Actividades*\nAltas, cambios y bajas\n\n🧾 *IVA*\nDeclaraciones mensuales (F29)\n\n📊 *Renta*\nDeclaración anual (F22)\n\n📈 *Contabilidad*\nBalances y estados financieros\n\n👥 *Nómina*\nLiquidaciones y contratos\n\n✅ *Regularizaciones*\nRectificaciones', category: 'servicios', segment: 'todos', is_active: true, priority: 40, workflow: 'general', actions: [{type:'list',title:'Servicios',description:'Selecciona un servicio para más info',content:'[{"id":"btn_serv_iva","title":"🧾 Más info IVA","description":"Información sobre declaraciones mensuales"},{"id":"btn_serv_renta","title":"📊 Más info Renta","description":"Información sobre declaración anual"},{"id":"btn_serv_cotizar","title":"💼 Cotizar","description":"Solicitar una cotización formal"}]'}] },
      { id: 'derivacion_asesor', name: 'Derivación a Asesor', content: 'Tu consulta requiere atención especializada. Un asesor de MTZ se comunicará contigo a la brevedad.\n\n📞 ¿Prefieres que te llamemos ahora?', category: 'general', segment: 'todos', is_active: true, priority: 60, workflow: 'asesor', actions: [{type:'button',id:'btn_asesor_si',title:'📞 Sí, llamar ahora',next_template_id:'derivacion_confirmar'},{type:'button',id:'btn_asesor_despues',title:'⏰ Después',next_template_id:'gracias'}] },
      { id: 'derivacion_confirmar', name: 'Confirmar Derivación', content: '✅ Perfecto. Un asesor te contactará en los próximos minutos.\n\nGracias por contactar MTZ.', category: 'general', segment: 'todos', is_active: true, priority: 61, workflow: 'asesor', actions: [{type:'button',id:'btn_deriv_ok',title:'✅ Aceptar',next_template_id:'gracias'}] },
      { id: 'gracias', name: 'Mensaje de Cierre', content: '¡Gracias por contactar MTZ Consultores! 👋\n\nSi tienes más dudas, escríbenos cuando quieras.\n\nEquipo MTZ', category: 'general', segment: 'todos', is_active: true, priority: 100, workflow: 'general', actions: [{type:'button',id:'btn_nuevo',title:'🔄 Nueva consulta',next_template_id:'menu_principal_cliente'}] },
      { id: 'menu_documentos', name: '2. Menú Documentos', content: '📋 Tienes {{document_count}} documentos. Selecciona uno:', category: 'menu', segment: 'cliente', is_active: true, priority: 10, workflow: 'documentos', actions: [{type:'list',title:'Ver documentos',description:'Todos',content:'{{documents_list}}'},{type:'button',id:'btn_solicitar',title:'📋 Solicitar',next_template_id:'solicitar_documento'},{type:'button',id:'btn_volver_principal',title:'← Volver',next_template_id:'menu_principal_cliente'}] },
      { id: 'solicitar_documento', name: 'Solicitar Documento', content: '📋 Para solicitar un documento, por favor describe:\n\n1. Tipo de documento (IVA, renta, balance, etc.)\n2. Período o fecha\n3. Cualquier detalle adicional\n\nUn asesor procesará tu solicitud.', category: 'documentos', segment: 'cliente', is_active: true, priority: 35, workflow: 'documentos', actions: [{type:'button',id:'btn_sol_asesor',title:'📞 Hablar con asesor',next_template_id:'derivacion_asesor'},{type:'button',id:'btn_sol_volver',title:'← Volver',next_template_id:'menu_documentos'}] },
      { id: 'confirmacion_recepcion', name: 'Confirmación Recepción', content: '✅ Hemos recibido tus documentos correctamente. Los revisaremos y te contactaremos en 24 horas.', category: 'general', segment: 'todos', is_active: true, priority: 15, workflow: 'documentos', actions: [{type:'button',id:'btn_conf_ok',title:'✅ Aceptar',next_template_id:'gracias'}] },
      { id: 'actualizar_email', name: 'Actualizar Email', content: '📧 *Actualizar Email*\n\nEnvía tu nuevo correo electrónico y lo actualizaremos en nuestro sistema.', category: 'general', segment: 'cliente', is_active: true, priority: 85, workflow: 'general', actions: [{type:'button',id:'btn_email_volver',title:'← Volver',next_template_id:'menu_mis_datos'}] },
      { id: 'actualizar_telefono', name: 'Actualizar Teléfono', content: '📱 *Actualizar Teléfono*\n\nEnvía tu nuevo número de teléfono y lo actualizaremos en nuestro sistema.', category: 'general', segment: 'cliente', is_active: true, priority: 84, workflow: 'general', actions: [{type:'button',id:'btn_telefono_volver',title:'← Volver',next_template_id:'menu_mis_datos'}] },
      { id: 'vincular_empresa', name: 'Vincular Empresa', content: '🏢 *Vincular Empresa*\n\nPara vincular una empresa, un asesor necesita verificar tu información.\n\n¿Quieres que te contacten?', category: 'general', segment: 'cliente', is_active: true, priority: 83, workflow: 'general', actions: [{type:'button',id:'btn_vincular_si',title:'✅ Sí, contactar',next_template_id:'derivacion_asesor'},{type:'button',id:'btn_vincular_volver',title:'← Volver',next_template_id:'menu_empresas'}] },
      { id: 'seleccionar_empresa', name: 'Seleccionar Empresa', content: '🏢 Por favor, selecciona la empresa que deseas gestionar:', category: 'general', segment: 'cliente', is_active: true, priority: 89, workflow: 'general', actions: [] },
      { id: 'menu_iva', name: '3. Menú IVA', content: '🧾 Aquí están tus declaraciones de IVA. ¿Cuál necesitas ver?', category: 'tramites', service_type: 'iva', segment: 'cliente', is_active: true, priority: 15, workflow: 'iva', actions: [{type:'list',title:'IVAs',description:'Tus declaraciones de IVA',content:'{{iva_list}}'},{type:'button',id:'btn_iva_solicitar',title:'📋 Solicitar IVA',next_template_id:'iva_solicitar'},{type:'button',id:'btn_iva_otro',title:'📋 Ver otro IVA',next_template_id:'menu_iva'},{type:'button',id:'btn_iva_volver',title:'← Volver',next_template_id:'menu_tramites'}] },
      { id: 'iva_no_disponible', name: 'IVA No Disponible', content: '🧾 No tengo IVAs declarados cargados aún para tu empresa.\n\n¿Prefieres solicitar uno o hablar con un asesor?', category: 'documentos', service_type: 'iva', segment: 'cliente', is_active: true, priority: 16, workflow: 'iva', actions: [{type:'button',id:'btn_iva_solicitar',title:'📋 Solicitar IVA',next_template_id:'iva_solicitar'},{type:'button',id:'btn_asesor_iva',title:'📞 Hablar con asesor',next_template_id:'derivacion_asesor'}] },
      { id: 'iva_solicitar', name: '5. Solicitar IVA', content: 'Para solicitar una declaración de IVA específica, necesito que un asesor te contacte. ¿Confirmas que quieres que te llamemos?', category: 'documentos', segment: 'cliente', is_active: true, priority: 25, workflow: 'iva', actions: [{type:'button',id:'btn_iva_si',title:'✅ Sí, contactar',next_template_id:'derivacion_asesor'},{type:'button',id:'btn_iva_no',title:'← Volver',next_template_id:'menu_iva'}] },
      { id: 'iva_ver_documento', name: '6. Ver IVA', content: '🧾 *Declaración de IVA*\n\nPeríodo: {{periodo}}\nMonto: {{monto}}\nEstado: {{estado}}\n\nEnviando documento...', category: 'documentos', segment: 'cliente', is_active: true, priority: 20, workflow: 'iva', actions: [{type:'button',id:'btn_iva_otro',title:'📋 Ver otro período',next_template_id:'menu_iva'},{type:'button',id:'btn_iva_volver',title:'← Volver',next_template_id:'menu_tramites'}] },
      { id: 'tramite_iva_info', name: '3. Info IVA', content: '🧾 *Servicio de IVA*\n\n• Declaración mensual (Formulario 29)\n• Recuperación de IVA crédito\n• Asesoramiento personalizado\n• Seguimiento de obligaciones\n\n¿Necesitas algo específico?', category: 'tramites', service_type: 'iva', segment: 'todos', is_active: true, priority: 41, workflow: 'iva', actions: [{type:'button',id:'btn_iva_mas_info',title:'📝 Ver más servicios',next_template_id:'servicios_general'},{type:'button',id:'btn_iva_cotizar',title:'💼 Cotizar',next_template_id:'cotizacion_info'}] },
      { id: 'menu_renta', name: '3. Menú Renta', content: '📊 ¿Qué necesitas de tu declaración de renta?', category: 'tramites', service_type: 'renta', segment: 'cliente', is_active: true, priority: 16, workflow: 'renta', actions: [{type:'button',id:'btn_renta_solicitar',title:'📝 Solicitar',next_template_id:'renta_solicitar'},{type:'button',id:'btn_renta_otro',title:'📋 Ver otra',next_template_id:'menu_renta'},{type:'button',id:'btn_renta_volver',title:'← Volver',next_template_id:'menu_documentos'}] },
      { id: 'renta_solicitar', name: '5. Solicitar Renta', content: 'Para solicitar tu declaración de renta, un asesor te contactará. ¿Confirmas?', category: 'documentos', segment: 'cliente', is_active: true, priority: 26, workflow: 'renta', actions: [{type:'button',id:'btn_renta_si',title:'✅ Sí, contactar',next_template_id:'derivacion_asesor'},{type:'button',id:'btn_renta_volver',title:'← Volver',next_template_id:'menu_renta'}] },
      { id: 'renta_ver_documento', name: '6. Ver Renta', content: '📊 *Declaración de Renta*\n\nAño: {{anio}}\nTipo: {{tipo}}\nEstado: {{estado}}\n\nEnviando documento...', category: 'documentos', segment: 'cliente', is_active: true, priority: 21, workflow: 'renta', actions: [{type:'button',id:'btn_renta_otro',title:'📋 Ver otra declaración',next_template_id:'menu_renta'},{type:'button',id:'btn_renta_volver_menu',title:'← Volver',next_template_id:'menu_tramites'}] },
      { id: 'tramite_renta_info', name: '3. Info Renta', content: '📊 *Servicio de Renta*\n\n• Declaración anual (Formulario 22)\n• Optimización fiscal\n• Pérdidas tributarias\n• Asesoramiento personalizado\n\n¿Necesitas algo específico?', category: 'tramites', service_type: 'renta', segment: 'todos', is_active: true, priority: 42, workflow: 'renta', actions: [{type:'button',id:'btn_renta_mas_info',title:'📝 Ver más servicios',next_template_id:'servicios_general'},{type:'button',id:'btn_renta_cotizar',title:'💼 Cotizar',next_template_id:'cotizacion_info'}] },
      { id: 'menu_nomina', name: '3. Menú Nómina', content: '👥 ¿Qué necesitas de nóminas?', category: 'tramites', service_type: 'nomina', segment: 'cliente', is_active: true, priority: 17, workflow: 'nomina', actions: [{type:'list',title:'Opciones Nómina',description:'Selecciona una opción',content:'[{"id":"btn_nom_liq","title":"💰 Liquidaciones","description":"Ver liquidaciones de sueldo"},{"id":"btn_nom_contratos","title":"📄 Contratos","description":"Ver contratos laborales"},{"id":"btn_nom_solicitar","title":"📋 Solicitar","description":"Pedir documento de nómina"}]'}] },
      { id: 'nomina_liquidaciones', name: '4. Liquidaciones', content: 'Aquí están tus liquidaciones de sueldo. ¿Cuál necesitas?', category: 'documentos', service_type: 'nomina', segment: 'cliente', is_active: true, priority: 22, workflow: 'nomina', actions: [{type:'button',id:'btn_volver_nomina',title:'← Volver',next_template_id:'menu_nomina'}] },
      { id: 'nomina_contratos', name: '4. Contratos', content: 'Tus contratos laborales. ¿Cuál necesitas?', category: 'documentos', segment: 'cliente', is_active: true, priority: 24, workflow: 'nomina', actions: [{type:'button',id:'btn_volver_nomina',title:'← Volver',next_template_id:'menu_nomina'}] },
      { id: 'nomina_solicitar', name: '5. Solicitar Documento Nómina', content: 'Para solicitar documentos de nómina, un asesor te contactará. ¿Confirmas?', category: 'documentos', segment: 'cliente', is_active: true, priority: 27, workflow: 'nomina', actions: [{type:'button',id:'btn_nom_si',title:'✅ Sí, contactar',next_template_id:'derivacion_asesor'},{type:'button',id:'btn_nom_volver',title:'← Volver',next_template_id:'menu_nomina'}] },
      { id: 'nomina_ver_liquidacion', name: '6. Ver Liquidación', content: '👥 *Liquidación de Sueldo*\n\nPeríodo: {{periodo}}\nMonto Líquido: {{monto}}\n\nEnviando documento...', category: 'documentos', segment: 'cliente', is_active: true, priority: 23, workflow: 'nomina', actions: [{type:'button',id:'btn_liq_otra',title:'📋 Ver otra liquidación',next_template_id:'nomina_liquidaciones'},{type:'button',id:'btn_liq_volver',title:'← Volver',next_template_id:'menu_nomina'}] },
      { id: 'nomina_ver_contrato', name: '6. Ver Contrato', content: '📄 *Contrato de Trabajo*\n\nEnviando documento...', category: 'documentos', segment: 'cliente', is_active: true, priority: 25, workflow: 'nomina', actions: [{type:'button',id:'btn_contrato_volver',title:'← Volver',next_template_id:'nomina_contratos'}] },
      { id: 'menu_balance', name: '3. Menú Balances', content: '📈 ¿Qué balances necesitas?', category: 'tramites', service_type: 'contabilidad', segment: 'cliente', is_active: true, priority: 18, workflow: 'documentos', actions: [{type:'list',title:'Opciones Balances',description:'Selecciona una opción',content:'[{"id":"btn_bal_mensual","title":"📊 Balance Mensual","description":"Ver balance mensual"},{"id":"btn_bal_anual","title":"📋 Balance Anual","description":"Ver balance anual"},{"id":"btn_bal_solicitar","title":"📋 Solicitar balance","description":"Pedir nuevo balance"}]'}] },
      { id: 'balance_solicitar', name: '5. Solicitar Balance', content: 'Para solicitar un balance, un asesor te contactará. ¿Confirmas?', category: 'documentos', segment: 'cliente', is_active: true, priority: 28, workflow: 'documentos', actions: [{type:'button',id:'btn_bal_si',title:'✅ Sí, contactar',next_template_id:'derivacion_asesor'},{type:'button',id:'btn_bal_volver',title:'← Volver',next_template_id:'menu_balance'}] },
      { id: 'balance_ver_documento', name: '6. Ver Balance', content: '📈 *Balance General*\n\nPeríodo: {{periodo}}\nTipo: {{tipo}}\n\nEnviando documento...', category: 'documentos', segment: 'cliente', is_active: true, priority: 24, workflow: 'documentos', actions: [{type:'button',id:'btn_bal_otro',title:'📋 Ver otro balance',next_template_id:'menu_balance'},{type:'button',id:'btn_bal_volver_menu',title:'← Volver',next_template_id:'menu_tramites'}] },
      { id: 'cobranza_recordatorio', name: 'Recordatorio Pago', content: 'Estimado cliente, te recordamos que tu pago está pendiente. Por favor regularice a la brevedad.', category: 'cobranza', segment: 'cliente', is_active: true, priority: 50, trigger: 'pago,pendiente,factura', workflow: 'cobranza', actions: [{type:'button',id:'btn_cob_info',title:'📋 Ver detalles',next_template_id:'cobranza_detalles'},{type:'button',id:'btn_cob_pagar',title:'💳 Ya pagué',next_template_id:'cobranza_confirmar'}] },
      { id: 'cobranza_detalles', name: 'Detalles Cobranza', content: 'Tu estado de cuenta:\n\n• Mes: Marzo 2026\n• Monto: $XXX.XXX\n• Vencimiento: 20/03/2026\n\n¿Tienes alguna consulta?', category: 'cobranza', segment: 'cliente', is_active: true, priority: 51, workflow: 'cobranza', actions: [{type:'button',id:'btn_cob_asesor',title:'📞 Hablar con asesor',next_template_id:'derivacion_asesor'},{type:'button',id:'btn_cob_volver',title:'← Volver',next_template_id:'gracias'}] },
      { id: 'cobranza_confirmar', name: 'Confirmar Pago', content: 'Perfecto. Gracias por tu pago. Un asesor verificará y te contactará si hay algo más.', category: 'cobranza', segment: 'cliente', is_active: true, priority: 52, workflow: 'cobranza', actions: [{type:'button',id:'btn_cob_ok',title:'✅ Aceptar',next_template_id:'gracias'}] }
    ];
    
    for (const t of plantillas) {
      await supabase.from('templates').upsert(t);
    }
    
    alert(`✅ Se restauraron ${plantillas.length} plantillas`);
    window.location.reload();
  };

  const handleDeleteAll = async () => {
    if (!confirm('¡ATENCIÓN! ¿Estás seguro de que quieres eliminar TODAS las plantillas del servidor? Esta acción destruirá tu Canvas y no se puede deshacer.')) return;
    await deleteAllTemplates();
  };

  const handleExportTemplates = () => {
    const dataStr = JSON.stringify(templates, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mtz-plantillas-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportTemplates = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as Template[];
        if (!Array.isArray(imported)) {
          alert('⚠️ El archivo no tiene un formato válido');
          return;
        }

        const confirmMsg = `📥 Importar ${imported.length} plantillas:\n\n` +
          `• Se crearán nuevas plantillas con IDs únicos\n` +
          `• Las plantillas existentes no se modificarán\n\n` +
          `¿Continuar?`;

        if (!confirm(confirmMsg)) return;

        // Importar cada plantilla con un nuevo ID
        for (const tpl of imported) {
          const newTemplate = {
            ...tpl,
            id: `imported_${tpl.id}_${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          await saveTemplate(newTemplate);
        }

        alert(`✅ Se importaron ${imported.length} plantillas exitosamente`);
        window.location.reload();
      } catch (error) {
        console.error('Error al importar:', error);
        alert('❌ Error al importar el archivo. Asegúrate de que sea un JSON válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteTemplate = async (id: string) => {
    await deleteTemplate(id);
    setShowEditor(false);
    setEditingTemplate(null);
  };

  const openEdit = (template?: Template) => { 
    setEditingTemplate(template || null);
    setShowEditor(true);
  };

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-50/50">
      <div className="relative">
        <div className="animate-spin h-16 w-16 border-[3px] border-green-500/20 border-t-green-600 rounded-full" />
        <div className="absolute inset-0 flex items-center justify-center text-xl">🤖</div>
      </div>
      <p className="mt-4 text-slate-400 font-bold animate-pulse uppercase tracking-widest text-[10px]">Cargando...</p>
    </div>
  );

  // Estado vacío cuando no hay plantillas
  if (templates.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50/30 p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center text-4xl">
            📋
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">
            No hay plantillas configuradas
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Tu base de datos está vacía. Puedes restaurar las plantillas por defecto o crear nuevas manualmente.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleRestoreDefaults}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-xs shadow-xl shadow-green-600/20 hover:bg-green-500 transition-all"
            >
              🔄 Restaurar Plantillas por Defecto
            </button>
            <button
              onClick={() => openEdit()}
              className="w-full bg-white text-slate-700 border border-slate-200 px-6 py-3 rounded-2xl font-black text-xs hover:bg-slate-50 transition-all"
            >
              ➕ Crear Nueva Plantilla
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full flex overflow-hidden bg-slate-50/30">
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ${showEditor ? 'pr-[450px]' : ''}`}>
        <div className="space-y-6 h-full flex flex-col p-4 md:p-6 overflow-hidden">
          {/* Header Premium */}
          <div className="flex items-center justify-between bg-white/70 backdrop-blur-xl p-5 rounded-[2rem] border border-white shadow-xl shadow-slate-200/50">
            <div className="flex items-center gap-6">
              <div className="p-3 bg-slate-900 rounded-2xl shadow-lg shadow-slate-900/20">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Builder de Flujos</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">WhatsApp Automation Engine</p>
              </div>
              
              <div className="hidden lg:flex items-center gap-6 bg-slate-100/50 px-6 py-2 rounded-2xl border border-slate-100">
                <div className="flex flex-col border-r border-slate-200 pr-4">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nodes</span>
                  <span className="text-base font-black text-slate-800 leading-none">{stats.total}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Active</span>
                  <span className="text-base font-black text-green-600 leading-none">{stats.active}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleExportTemplates} className="px-5 py-2.5 bg-white text-blue-600 border border-blue-200 rounded-2xl text-xs font-black hover:bg-blue-50 hover:border-blue-300 transition-all" title="Exportar plantillas a JSON">💾 Exportar</button>
              <label className="px-5 py-2.5 bg-white text-indigo-600 border border-indigo-200 rounded-2xl text-xs font-black hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer" title="Importar plantillas desde JSON">
                📥 Importar
                <input type="file" accept=".json" onChange={handleImportTemplates} className="hidden" />
              </label>
              <button onClick={handleDeleteAll} className="px-5 py-2.5 bg-white text-rose-600 border border-rose-200 rounded-2xl text-xs font-black hover:bg-rose-50 hover:border-rose-300 transition-all">🗑️ Limpiar Todo</button>
              <button onClick={handleRestoreDefaults} className="px-5 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-2xl text-xs font-black hover:bg-slate-50 transition-all">🔄 Restaurar</button>
              <button onClick={() => openEdit()} className="bg-green-600 text-white px-7 py-3 rounded-2xl font-black text-xs shadow-xl shadow-green-600/20 hover:bg-green-500 transition-all">+ Nueva Plantilla</button>
            </div>
          </div>

          {/* Builder Canvas Area */}
          <div className="flex-1 min-h-0 bg-white/40 backdrop-blur-sm rounded-[2.5rem] border border-white shadow-inner overflow-hidden relative">
             <FlowCanvas 
               templates={templates} 
               selectedTemplateId={editingTemplate?.id || null} 
               onSelectTemplate={(id) => openEdit(templates.find(t => t.id === id))}
             />
          </div>
        </div>
      </div>

      {/* Sidebar Editor (estilo KOMMO) */}
      <TemplateEditor
        template={editingTemplate}
        allTemplates={templates}
        isOpen={showEditor}
        onClose={() => { setShowEditor(false); setEditingTemplate(null); }}
        onSave={handleSaveTemplate}
        onDelete={handleDeleteTemplate}
      />
    </div>
  );
}