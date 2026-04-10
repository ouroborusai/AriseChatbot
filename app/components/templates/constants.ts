import { Category, ServiceType, WORKFLOWS, Template } from './types';

export const SERVICE_TYPES: ServiceType[] = [
  { id: 'inicio_actividades', name: 'Inicio de Actividades', description: 'Altas, cambios y bajas', icon: '🚀' },
  { id: 'iva', name: 'IVA', description: 'Declaraciones mensuales', icon: '🧾' },
  { id: 'renta', name: 'Renta', description: 'Declaración anual', icon: '📊' },
  { id: 'contabilidad', name: 'Contabilidad', description: 'Balances, estados', icon: '📈' },
  { id: 'nomina', name: 'Nómina', description: 'Liquidaciones, contratos', icon: '👥' },
  { id: 'regularizacion', name: 'Regularización', description: 'Rectificaciones', icon: '✅' },
];

export const CATEGORIES: Category[] = [
  { id: 'bienvenida', name: 'Bienvenida', icon: '👋', color: 'bg-green-600', colorHex: '#16a34a', description: 'Saludos y primer contacto' },
  { id: 'menu', name: 'Menú Principal', icon: '📋', color: 'bg-blue-600', colorHex: '#2563eb', description: 'Opciones del menú interactivo' },
  { id: 'servicios', name: 'Servicios', icon: '💼', color: 'bg-indigo-600', colorHex: '#4f46e5', description: 'Información de servicios' },
  { id: 'documentos', name: 'Documentos', icon: '📄', color: 'bg-orange-600', colorHex: '#ea580c', description: 'Solicitud y envío de docs' },
  { id: 'tramites', name: 'Trámites', icon: '🏢', color: 'bg-purple-600', colorHex: '#9333ea', description: 'Trámites específicos' },
  { id: 'cobranza', name: 'Cobranza', icon: '💳', color: 'bg-red-600', colorHex: '#dc2626', description: 'Recordatorios y cobros' },
  { id: 'general', name: 'General', icon: '💬', color: 'bg-slate-600', colorHex: '#475569', description: 'Mensajes generales' },
];

// ============================================
// FLUJO 1: ATENCIÓN INICIAL (Priority 1-19)
// ============================================

export const DEFAULT_TEMPLATES: Template[] = [
  // ---- Entrada principal: Saludo ----
  {
    id: 'bienvenida_cliente',
    name: '1. Saludo Cliente',
    content: 'Hola 👋 Bienvenido a MTZ Consultores Tributarios. ¿En qué podemos ayudarte hoy?',
    category: 'bienvenida',
    segment: 'cliente',
    is_active: true,
    priority: 1,
    trigger: 'hola,hola!,buenos días,buenas',
    workflow: 'atencion',
    actions: [
      { type: 'button', id: 'btn_docs', title: '📄 Ver mis documentos', next_template_id: 'menu_documentos' },
      { type: 'button', id: 'btn_iva', title: '🧾 Mis IVAs', next_template_id: 'menu_iva' },
      { type: 'button', id: 'btn_nomina', title: '👥 Nómina', next_template_id: 'menu_nomina' },
      { type: 'button', id: 'btn_asesor', title: '📞 Hablar con asesor', next_template_id: 'derivacion_asesor' },
    ],
  },
  {
    id: 'bienvenida_prospecto',
    name: '1. Saludo Prospecto',
    content: '¡Hola! 👋 Bienvenido a MTZ Consultores. ¿En qué podemos ayudarte?',
    category: 'bienvenida',
    segment: 'prospecto',
    is_active: true,
    priority: 1,
    trigger: 'hola,hola!,buenos días,buenas',
    workflow: 'atencion',
    actions: [
      { type: 'button', id: 'btn_cotizar', title: '💼 Cotizar servicio', next_template_id: 'cotizacion_info' },
      { type: 'button', id: 'btn_servicios', title: '📝 Ver servicios', next_template_id: 'servicios_general' },
      { type: 'button', id: 'btn_contacto', title: '📞 Contactar asesor', next_template_id: 'derivacion_asesor' },
    ],
  },

  // ---- Menú documentos ----
  {
    id: 'menu_documentos',
    name: '2. Menú Documentos',
    content: '📄 ¿Qué documentos necesitas?',
    category: 'menu',
    segment: 'cliente',
    is_active: true,
    priority: 10,
    workflow: 'documentos',
    actions: [
      { type: 'button', id: 'btn_iva_docs', title: '🧾 IVAs', next_template_id: 'menu_iva' },
      { type: 'button', id: 'btn_renta_docs', title: '📊 Declaración Renta', next_template_id: 'menu_renta' },
      { type: 'button', id: 'btn_balance', title: '📈 Balances', next_template_id: 'menu_balance' },
      { type: 'button', id: 'btn_nomina_docs', title: '👥 Nómina', next_template_id: 'menu_nomina' },
    ],
  },

  // ---- Menú IVA ----
  {
    id: 'menu_iva',
    name: '3. Menú IVA',
    content: '🧾 Aquí están tus declaraciones de IVA. ¿Cuál necesitas ver?',
    category: 'tramites',
    service_type: 'iva',
    segment: 'cliente',
    is_active: true,
    priority: 15,
    workflow: 'iva',
    actions: [
      { type: 'button', id: 'btn_iva_ene', title: 'Enero 2026', next_template_id: 'iva_enviar' },
      { type: 'button', id: 'btn_iva_dic', title: 'Diciembre 2025', next_template_id: 'iva_enviar' },
      { type: 'button', id: 'btn_iva_nov', title: 'Noviembre 2025', next_template_id: 'iva_enviar' },
      { type: 'button', id: 'btn_iva_solicitar', title: '📋 Solicitar otro', next_template_id: 'iva_solicitar' },
    ],
  },
  {
    id: 'iva_enviar',
    name: '4. Enviar IVA',
    content: 'Te envío tu declaración de IVA. ¿Necesitas algo más?',
    category: 'documentos',
    service_type: 'iva',
    segment: 'cliente',
    is_active: true,
    priority: 20,
    workflow: 'iva',
    actions: [
      { type: 'button', id: 'btn_iva_mas', title: 'Ver más IVAs', next_template_id: 'menu_iva' },
      { type: 'button', id: 'btn_volver_docs', title: '← Volver a documentos', next_template_id: 'menu_documentos' },
      { type: 'button', id: 'btn_fin', title: '✅ Terminar', next_template_id: 'gracias' },
    ],
  },
  {
    id: 'iva_solicitar',
    name: '5. Solicitar IVA',
    content: 'Para solicitar una declaración de IVA específica, necesito que un asesor te contacte. ¿Confirmas que quieres que te llamemos?',
    category: 'documentos',
    segment: 'cliente',
    is_active: true,
    priority: 25,
    workflow: 'iva',
    actions: [
      { type: 'button', id: 'btn_iva_si', title: '✅ Sí, contactar', next_template_id: 'derivacion_asesor' },
      { type: 'button', id: 'btn_iva_no', title: '← Volver', next_template_id: 'menu_iva' },
    ],
  },

  // ---- Menú Renta ----
  {
    id: 'menu_renta',
    name: '3. Menú Renta',
    content: '📊 ¿Qué necesitas de tu declaración de renta?',
    category: 'tramites',
    service_type: 'renta',
    segment: 'cliente',
    is_active: true,
    priority: 16,
    workflow: 'renta',
    actions: [
      { type: 'button', id: 'btn_renta_2025', title: '📋 Declaración 2025', next_template_id: 'renta_enviar' },
      { type: 'button', id: 'btn_renta_solicitar', title: '📝 Solicitar declaración', next_template_id: 'renta_solicitar' },
    ],
  },
  {
    id: 'renta_enviar',
    name: '4. Enviar Renta',
    content: 'Te envío tu declaración de renta. ¿Necesitas algo más?',
    category: 'documentos',
    service_type: 'renta',
    segment: 'cliente',
    is_active: true,
    priority: 21,
    workflow: 'renta',
    actions: [
      { type: 'button', id: 'btn_renta_mas', title: 'Ver más documentos', next_template_id: 'menu_documentos' },
      { type: 'button', id: 'btn_fin_renta', title: '✅ Terminar', next_template_id: 'gracias' },
    ],
  },
  {
    id: 'renta_solicitar',
    name: '5. Solicitar Renta',
    content: 'Para solicitar tu declaración de renta, un asesor te contactará. ¿Confirmas?',
    category: 'documentos',
    segment: 'cliente',
    is_active: true,
    priority: 26,
    workflow: 'renta',
    actions: [
      { type: 'button', id: 'btn_renta_si', title: '✅ Sí, contactar', next_template_id: 'derivacion_asesor' },
      { type: 'button', id: 'btn_renta_volver', title: '← Volver', next_template_id: 'menu_renta' },
    ],
  },

  // ---- Menú Nómina ----
  {
    id: 'menu_nomina',
    name: '3. Menú Nómina',
    content: '👥 ¿Qué necesitas de nóminas?',
    category: 'tramites',
    service_type: 'nomina',
    segment: 'cliente',
    is_active: true,
    priority: 17,
    workflow: 'nomina',
    actions: [
      { type: 'button', id: 'btn_nom_liq', title: '💰 Liquidaciones', next_template_id: 'nomina_liquidaciones' },
      { type: 'button', id: 'btn_nom_contratos', title: '📄 Contratos', next_template_id: 'nomina_contratos' },
      { type: 'button', id: 'btn_nom_solicitar', title: '📋 Solicitar', next_template_id: 'nomina_solicitar' },
    ],
  },
  {
    id: 'nomina_liquidaciones',
    name: '4. Liquidaciones',
    content: 'Aquí están tus liquidaciones de sueldo. ¿Cuál necesitas?',
    category: 'documentos',
    service_type: 'nomina',
    segment: 'cliente',
    is_active: true,
    priority: 22,
    workflow: 'nomina',
    actions: [
      { type: 'button', id: 'btn_nom_mar', title: 'Marzo 2026', next_template_id: 'nomina_enviar' },
      { type: 'button', id: 'btn_nom_feb', title: 'Febrero 2026', next_template_id: 'nomina_enviar' },
      { type: 'button', id: 'btn_nom_ene', title: 'Enero 2026', next_template_id: 'nomina_enviar' },
    ],
  },
  {
    id: 'nomina_enviar',
    name: '5. Enviar Liquidación',
    content: 'Te envío tu liquidación. ¿Necesitas algo más?',
    category: 'documentos',
    segment: 'cliente',
    is_active: true,
    priority: 23,
    workflow: 'nomina',
    actions: [
      { type: 'button', id: 'btn_nom_mas', title: 'Ver más', next_template_id: 'menu_nomina' },
      { type: 'button', id: 'btn_fin_nom', title: '✅ Terminar', next_template_id: 'gracias' },
    ],
  },
  {
    id: 'nomina_contratos',
    name: '4. Contratos',
    content: 'Tus contratos laborales. ¿Cuál necesitas?',
    category: 'documentos',
    segment: 'cliente',
    is_active: true,
    priority: 24,
    workflow: 'nomina',
    actions: [
      { type: 'button', id: 'btn_contrato_ver', title: 'Ver contrato', next_template_id: 'nomina_enviar' },
    ],
  },
  {
    id: 'nomina_solicitar',
    name: '5. Solicitar Documento Nómina',
    content: 'Para solicitar documentos de nómina, un asesor te contactará. ¿Confirmas?',
    category: 'documentos',
    segment: 'cliente',
    is_active: true,
    priority: 27,
    workflow: 'nomina',
    actions: [
      { type: 'button', id: 'btn_nom_si', title: '✅ Sí, contactar', next_template_id: 'derivacion_asesor' },
      { type: 'button', id: 'btn_nom_volver', title: '← Volver', next_template_id: 'menu_nomina' },
    ],
  },

  // ---- Menú Balance ----
  {
    id: 'menu_balance',
    name: '3. Menú Balances',
    content: '📈 ¿Qué balances necesitas?',
    category: 'tramites',
    service_type: 'contabilidad',
    segment: 'cliente',
    is_active: true,
    priority: 18,
    workflow: 'documentos',
    actions: [
      { type: 'button', id: 'btn_bal_mensual', title: '📊 Balance Mensual', next_template_id: 'balance_enviar' },
      { type: 'button', id: 'btn_bal_anual', title: '📋 Balance Anual', next_template_id: 'balance_enviar' },
    ],
  },
  {
    id: 'balance_enviar',
    name: '4. Enviar Balance',
    content: 'Te envío el balance solicitado. ¿Necesitas algo más?',
    category: 'documentos',
    segment: 'cliente',
    is_active: true,
    priority: 28,
    workflow: 'documentos',
    actions: [
      { type: 'button', id: 'btn_bal_mas', title: 'Ver más', next_template_id: 'menu_documentos' },
      { type: 'button', id: 'btn_fin_bal', title: '✅ Terminar', next_template_id: 'gracias' },
    ],
  },

  // ============================================
  // FLUJO 2: COTIZACIÓN (Priority 30-39)
  // ============================================
  {
    id: 'cotizacion_info',
    name: '2. Información Cotización',
    content: '💼 Para cotizar nuestro servicio necesito algunos datos:\n\n• Tipo de empresa (SA, SpA, LTDA, etc.)\n• Facturación mensual aproximada\n• Cantidad de trabajadores\n• Necesidades específicas\n\n¿Tienes esta información o prefieres que un asesor te llame?',
    category: 'servicios',
    segment: 'prospecto',
    is_active: true,
    priority: 30,
    workflow: 'atencion',
    actions: [
      { type: 'button', id: 'btn_cot_tengo', title: '📝 Tengo la información', next_template_id: 'cotizacion_recoger' },
      { type: 'button', id: 'btn_cot_asesor', title: '📞 Que me llamen', next_template_id: 'derivacion_asesor' },
    ],
  },
  {
    id: 'cotizacion_recoger',
    name: '3. Recoger Datos Cotización',
    content: 'Perfecto. Envíame la información y te prepararé una cotización.\n\nMientras, dime:\n1. ¿Qué tipo de empresa tienes?\n2. ¿Cuántos trabajadores?',
    category: 'servicios',
    segment: 'prospecto',
    is_active: true,
    priority: 31,
    workflow: 'atencion',
    actions: [], // Este queda esperando respuesta libre, luego IA
  },

  // ============================================
  // FLUJO 3: SERVICIOS (Priority 40-49)
  // ============================================
  {
    id: 'servicios_general',
    name: '2. Lista de Servicios',
    content: 'Nuestros servicios:\n\n🚀 *Inicio de Actividades*\nAltas, cambios y bajas\n\n🧾 *IVA*\nDeclaraciones mensuales (F29)\n\n📊 *Renta*\nDeclaración anual (F22)\n\n📈 *Contabilidad*\nBalances y estados financieros\n\n👥 *Nómina*\nLiquidaciones y contratos\n\n✅ *Regularizaciones*\nRectificaciones',
    category: 'servicios',
    segment: 'todos',
    is_active: true,
    priority: 40,
    workflow: 'general',
    actions: [
      { type: 'button', id: 'btn_serv_iva', title: '🧾 Más info IVA', next_template_id: 'tramite_iva_info' },
      { type: 'button', id: 'btn_serv_renta', title: '📊 Más info Renta', next_template_id: 'tramite_renta_info' },
      { type: 'button', id: 'btn_serv_cotizar', title: '💼 Cotizar', next_template_id: 'cotizacion_info' },
    ],
  },
  {
    id: 'tramite_iva_info',
    name: '3. Info IVA',
    content: '🧾 *Servicio de IVA*\n\n• Declaración mensual (Formulario 29)\n• Recuperación de IVA crédito\n• Asesoramiento personalizado\n• Seguimiento de obligaciones\n\n¿Necesitas algo específico?',
    category: 'tramites',
    service_type: 'iva',
    segment: 'todos',
    is_active: true,
    priority: 41,
    workflow: 'iva',
    actions: [
      { type: 'button', id: 'btn_iva_mas_info', title: '📝 Ver más servicios', next_template_id: 'servicios_general' },
      { type: 'button', id: 'btn_iva_cotizar', title: '💼 Cotizar', next_template_id: 'cotizacion_info' },
    ],
  },
  {
    id: 'tramite_renta_info',
    name: '3. Info Renta',
    content: '📊 *Servicio de Renta*\n\n• Declaración anual (Formulario 22)\n• Optimización fiscal\n• Pérdidas tributarias\n• Asesoramiento personalizado\n\n¿Necesitas algo específico?',
    category: 'tramites',
    service_type: 'renta',
    segment: 'todos',
    is_active: true,
    priority: 42,
    workflow: 'renta',
    actions: [
      { type: 'button', id: 'btn_renta_mas_info', title: '📝 Ver más servicios', next_template_id: 'servicios_general' },
      { type: 'button', id: 'btn_renta_cotizar', title: '💼 Cotizar', next_template_id: 'cotizacion_info' },
    ],
  },

  // ============================================
  // FLUJO 4: COBRANZA (Priority 50-59)
  // ============================================
  {
    id: 'cobranza_recordatorio',
    name: 'Recordatorio Pago',
    content: 'Estimado cliente, te recordamos que tu pago está pendiente. Por favor regularice a la brevedad.',
    category: 'cobranza',
    segment: 'cliente',
    is_active: true,
    priority: 50,
    trigger: 'pago,pendiente,factura',
    workflow: 'cobranza',
    actions: [
      { type: 'button', id: 'btn_cob_info', title: '📋 Ver detalles', next_template_id: 'cobranza_detalles' },
      { type: 'button', id: 'btn_cob_pagar', title: '💳 Ya pagué', next_template_id: 'cobranza_confirmar' },
    ],
  },
  {
    id: 'cobranza_detalles',
    name: 'Detalles Cobranza',
    content: 'Tu estado de cuenta:\n\n• Mes: Marzo 2026\n• Monto: $XXX.XXX\n• Vencimiento: 20/03/2026\n\n¿Tienes alguna consulta?',
    category: 'cobranza',
    segment: 'cliente',
    is_active: true,
    priority: 51,
    workflow: 'cobranza',
    actions: [
      { type: 'button', id: 'btn_cob_asesor', title: '📞 Hablar con asesor', next_template_id: 'derivacion_asesor' },
      { type: 'button', id: 'btn_cob_volver', title: '← Volver', next_template_id: 'gracias' },
    ],
  },
  {
    id: 'cobranza_confirmar',
    name: 'Confirmar Pago',
    content: 'Perfecto. Gracias por tu pago. Un asesor verificará y te contactará si hay algo más.',
    category: 'cobranza',
    segment: 'cliente',
    is_active: true,
    priority: 52,
    workflow: 'cobranza',
    actions: [
      { type: 'button', id: 'btn_cob_ok', title: '✅ Aceptar', next_template_id: 'gracias' },
    ],
  },

  // ============================================
  // FLUJO 5: DERIVACIÓN (Priority 60-69)
  // ============================================
  {
    id: 'derivacion_asesor',
    name: 'Derivación a Asesor',
    content: 'Tu consulta requiere atención especializada. Un asesor de MTZ se comunicará contigo a la brevedad.\n\n📞 ¿Prefieres que te llamemos ahora?',
    category: 'general',
    segment: 'todos',
    is_active: true,
    priority: 60,
    workflow: 'asesor',
    actions: [
      { type: 'button', id: 'btn_asesor_si', title: '📞 Sí, llamar ahora', next_template_id: 'derivacion_confirmar' },
      { type: 'button', id: 'btn_asesor_despues', title: '⏰ Después', next_template_id: 'gracias' },
    ],
  },
  {
    id: 'derivacion_confirmar',
    name: 'Confirmar Derivación',
    content: '✅ Perfecto. Un asesor te contactará en los próximos minutos.\n\nGracias por contactar MTZ Consultores.',
    category: 'general',
    segment: 'todos',
    is_active: true,
    priority: 61,
    workflow: 'asesor',
    actions: [
      { type: 'button', id: 'btn_deriv_ok', title: '✅ Aceptar', next_template_id: 'gracias' },
    ],
  },

  // ============================================
  // FLUJO 6: GENERAL (Priority 70+)
  // ============================================
  {
    id: 'gracias',
    name: 'Mensaje de Cierre',
    content: '¡Gracias por contactar MTZ Consultores! 👋\n\nSi tienes más dudas, escríbenos cuando quieras.\n\nEquipo MTZ',
    category: 'general',
    segment: 'todos',
    is_active: true,
    priority: 100,
    workflow: 'general',
    actions: [
      { type: 'button', id: 'btn_nuevo', title: '🔄 Nueva consulta', next_template_id: 'bienvenida_cliente' },
    ],
  },
  {
    id: 'confirmacion_recepcion',
    name: 'Confirmación Recepción',
    content: '✅ Hemos recibido tus documentos correctamente. Los revisaremos y te contactaremos en 24 horas.',
    category: 'general',
    segment: 'todos',
    is_active: true,
    priority: 15,
    workflow: 'documentos',
    actions: [
      { type: 'button', id: 'btn_conf_ok', title: '✅ Aceptar', next_template_id: 'gracias' },
    ],
  },
  {
    id: 'solicitudes_info',
    name: 'Mis Solicitudes',
    content: 'Para consultar una solicitud, envía el código que te dimos. Ejemplo: DOC-1234',
    category: 'general',
    segment: 'cliente',
    is_active: true,
    priority: 35,
    workflow: 'documentos',
    actions: [],
  },
];

export function getCategoryInfo(catId: string): Category {
  return CATEGORIES.find(c => c.id === catId) || CATEGORIES[6];
}

export function getServiceInfo(serviceId?: string): ServiceType | undefined {
  return SERVICE_TYPES.find(s => s.id === serviceId);
}

export function getWorkflowInfo(workflowId?: string) {
  return WORKFLOWS.find(w => w.id === workflowId);
}