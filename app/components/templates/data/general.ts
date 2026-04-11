import { Template } from '../types';

export const derivacionAsesor: Template = {
  id: 'derivacion_asesor',
  name: 'Derivación a Asesor',
  content: 'Tu consulta requiere atención especializada. Un asesor de MTZ se comunicará contigo a la brevedad.\n\n📞 ¿Prefieres que te llamemos ahora?',
  category: 'general',
  segment: 'todos',
  is_active: true,
  priority: 60,
  workflow: 'asesor',
  actions: [
    {
      type: 'button',
      id: 'btn_asesor_si',
      title: '📞 Sí, llamar ahora',
      next_template_id: 'derivacion_confirmar'
    },
    {
      type: 'button',
      id: 'btn_asesor_despues',
      title: '⏰ Después',
      next_template_id: 'gracias'
    },
  ],
};

export const derivacionConfirmar: Template = {
  id: 'derivacion_confirmar',
  name: 'Confirmar Derivación',
  content: '✅ Perfecto. Un asesor te contactará en los próximos minutos.\n\nGracias por contactar MTZ.',
  category: 'general',
  segment: 'todos',
  is_active: true,
  priority: 61,
  workflow: 'asesor',
  actions: [
    {
      type: 'button',
      id: 'btn_deriv_ok',
      title: '✅ Aceptar',
      next_template_id: 'gracias'
    },
  ],
};

export const gracias: Template = {
  id: 'gracias',
  name: 'Mensaje de Cierre',
  content: '¡Gracias por contactar MTZ Consultores! 👋\n\nSi tienes más dudas, escríbenos cuando quieras.\n\nEquipo MTZ',
  category: 'general',
  segment: 'todos',
  is_active: true,
  priority: 100,
  workflow: 'general',
  actions: [
    {
      type: 'button',
      id: 'btn_nuevo',
      title: '🔄 Nueva consulta',
      next_template_id: 'menu_principal_cliente'
    },
  ],
};

export const confirmacionRecepcion: Template = {
  id: 'confirmacion_recepcion',
  name: 'Confirmación Recepción',
  content: '✅ Hemos recibido tus documentos correctamente. Los revisaremos y te contactaremos en 24 horas.',
  category: 'general',
  segment: 'todos',
  is_active: true,
  priority: 15,
  workflow: 'documentos',
  actions: [
    {
      type: 'button',
      id: 'btn_conf_ok',
      title: '✅ Aceptar',
      next_template_id: 'gracias'
    },
  ],
};

export const solicitarDocumento: Template = {
  id: 'solicitar_documento',
  name: 'Solicitar Documento',
  content: '📋 Para solicitar un documento, por favor describe:\n\n1. Tipo de documento (IVA, renta, balance, etc.)\n2. Período o fecha\n3. Cualquier detalle adicional\n\nUn asesor procesará tu solicitud.',
  category: 'documentos',
  segment: 'cliente',
  is_active: true,
  priority: 35,
  workflow: 'documentos',
  actions: [
    {
      type: 'button',
      id: 'btn_sol_asesor',
      title: '📞 Hablar con asesor',
      next_template_id: 'derivacion_asesor'
    },
    {
      type: 'button',
      id: 'btn_sol_volver',
      title: '← Volver',
      next_template_id: 'menu_documentos'
    },
  ],
};

export const actualizarEmail: Template = {
  id: 'actualizar_email',
  name: 'Actualizar Email',
  content: '📧 *Actualizar Email*\n\nEnvía tu nuevo correo electrónico y lo actualizaremos en nuestro sistema.',
  category: 'general',
  segment: 'cliente',
  is_active: true,
  priority: 85,
  workflow: 'general',
  actions: [
    {
      type: 'button',
      id: 'btn_email_volver',
      title: '← Volver',
      next_template_id: 'menu_mis_datos'
    },
  ],
};

export const actualizarTelefono: Template = {
  id: 'actualizar_telefono',
  name: 'Actualizar Teléfono',
  content: '📱 *Actualizar Teléfono*\n\nEnvía tu nuevo número de teléfono y lo actualizaremos en nuestro sistema.',
  category: 'general',
  segment: 'cliente',
  is_active: true,
  priority: 84,
  workflow: 'general',
  actions: [
    {
      type: 'button',
      id: 'btn_telefono_volver',
      title: '← Volver',
      next_template_id: 'menu_mis_datos'
    },
  ],
};

export const vincularEmpresa: Template = {
  id: 'vincular_empresa',
  name: 'Vincular Empresa',
  content: '🏢 *Vincular Empresa*\n\nPara vincular una empresa, un asesor necesita verificar tu información.\n\n¿Quieres que te contacten?',
  category: 'general',
  segment: 'cliente',
  is_active: true,
  priority: 83,
  workflow: 'general',
  actions: [
    {
      type: 'button',
      id: 'btn_vincular_si',
      title: '✅ Sí, contactar',
      next_template_id: 'derivacion_asesor'
    },
    {
      type: 'button',
      id: 'btn_vincular_volver',
      title: '← Volver',
      next_template_id: 'menu_empresas'
    },
  ],
};

export const menuDocumentos: Template = {
  id: 'menu_documentos',
  name: '2. Menú Documentos',
  content: '📋 Tienes {{document_count}} documentos. Selecciona uno:',
  category: 'menu',
  segment: 'cliente',
  is_active: true,
  priority: 10,
  workflow: 'documentos',
  rules: {
    required_context: {
      has_documents: true
    },
    fallback_template_id: 'solicitar_documento'
  },
  actions: [
    {
      type: 'list',
      title: 'Ver documentos',
      description: 'Todos',
      content: '{{documents_list}}'
    },
    {
      type: 'button',
      id: 'btn_solicitar',
      title: '📋 Solicitar',
      next_template_id: 'solicitar_documento'
    },
    {
      type: 'button',
      id: 'btn_volver_principal',
      title: '← Volver',
      next_template_id: 'menu_principal_cliente'
    },
  ],
};

export const seleccionarEmpresa: Template = {
  id: 'seleccionar_empresa',
  name: 'Seleccionar Empresa',
  content: '🏢 Por favor, selecciona la empresa que deseas gestionar:',
  category: 'general',
  segment: 'cliente',
  is_active: true,
  priority: 89,
  workflow: 'general',
  actions: [],
};

export const cotizacionInfo: Template = {
  id: 'cotizacion_info',
  name: '2. Información Cotización',
  content: '💼 Para cotizar nuestro servicio necesito algunos datos:\n\n• Tipo de empresa (SA, SpA, LTDA, etc.)\n• Facturación mensual aproximada\n• Cantidad de trabajadores\n• Necesidades específicas\n\n¿Tienes esta información o prefieres que un asesor te llame?',
  category: 'servicios',
  segment: 'prospecto',
  is_active: true,
  priority: 30,
  workflow: 'atencion',
  actions: [
    {
      type: 'button',
      id: 'btn_cot_tengo',
      title: '📝 Tengo la información',
      next_template_id: 'cotizacion_recoger'
    },
    {
      type: 'button',
      id: 'btn_cot_asesor',
      title: '📞 Que me llamen',
      next_template_id: 'derivacion_asesor'
    },
  ],
};

export const cotizacionRecoger: Template = {
  id: 'cotizacion_recoger',
  name: '3. Recoger Datos Cotización',
  content: 'Perfecto. Envíame la información y te prepararé una cotización.\n\nMientras, dime:\n1. ¿Qué tipo de empresa tienes?\n2. ¿Cuántos trabajadores?',
  category: 'servicios',
  segment: 'prospecto',
  is_active: true,
  priority: 31,
  workflow: 'atencion',
  actions: [],
};

export const serviciosGeneral: Template = {
  id: 'servicios_general',
  name: '2. Lista de Servicios',
  content: 'Nuestros servicios:\n\n🚀 *Inicio de Actividades*\nAltas, cambios y bajas\n\n🧾 *IVA*\nDeclaraciones mensuales (F29)\n\n📊 *Renta*\nDeclaración anual (F22)\n\n📈 *Contabilidad*\nBalances y estados financieros\n\n👥 *Nómina*\nLiquidaciones y contratos\n\n✅ *Regularizaciones*\nRectificaciones',
  category: 'servicios',
  segment: 'todos',
  is_active: true,
  priority: 40,
  workflow: 'general',
  actions: [
    {
      type: 'list',
      title: 'Servicios',
      description: 'Selecciona un servicio para más info',
      content: JSON.stringify([
        { id: 'btn_serv_iva', title: '🧾 Más info IVA', description: 'Información sobre declaraciones mensuales' },
        { id: 'btn_serv_renta', title: '📊 Más info Renta', description: 'Información sobre declaración anual' },
        { id: 'btn_serv_cotizar', title: '💼 Cotizar', description: 'Solicitar una cotización formal' },
      ])
    },
  ],
};
