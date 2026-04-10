/**
 * Templates por defecto con sistema de condicionales
 * MTZ Consultores Tributarios
 *
 * Este archivo contiene las plantillas predeterminadas para el sistema
 * de WhatsApp Business API. Cada template incluye:
 * - Contenido del mensaje
 * - Acciones con condiciones para mostrar/ocultar
 * - Reglas de contexto requerido
 * - Fallbacks para navegación
 *
 * NOTA: Las acciones se filtran dinámicamente según:
 * - Segmento del cliente (cliente vs prospecto)
 * - Documentos disponibles
 * - Empresa activa seleccionada
 * - Historial de acciones
 */

import { Template, Action } from './types';

// ============================================
// PLANTILLAS DE BIENVENIDA
// ============================================

/**
 * Template de bienvenida para CLIENTES
 * Muestra botones diferentes según si tiene documentos o no
 */
export const bienvenidaCliente: Template = {
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
    {
      type: 'button',
      id: 'btn_docs',
      title: '📄 Ver mis documentos',
      next_template_id: 'menu_documentos',
      conditions: {
        show_if: [
          { field: 'has_documents', operator: 'exists', value: true }
        ],
        else_action: { type: 'hide_button' }
      }
    },
    {
      type: 'button',
      id: 'btn_solicitar_doc',
      title: '📋 Solicitar documento',
      next_template_id: 'solicitar_documento',
      conditions: {
        show_if: [
          { field: 'has_documents', operator: 'exists', value: false }
        ],
        else_action: { type: 'hide_button' }
      }
    },
    {
      type: 'button',
      id: 'btn_iva',
      title: '🧾 Mis IVAs',
      next_template_id: 'menu_iva'
    },
    {
      type: 'button',
      id: 'btn_asesor',
      title: '📞 Hablar con asesor',
      next_template_id: 'derivacion_asesor'
    },
  ],
};

/**
 * Template de bienvenida para PROSPECTOS
 */
export const bienvenidaProspecto: Template = {
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
    {
      type: 'button',
      id: 'btn_cotizar',
      title: '💼 Cotizar servicio',
      next_template_id: 'cotizacion_info'
    },
    {
      type: 'button',
      id: 'btn_servicios',
      title: '📝 Ver servicios',
      next_template_id: 'servicios_general'
    },
    {
      type: 'button',
      id: 'btn_contacto',
      title: '📞 Contactar asesor',
      next_template_id: 'derivacion_asesor'
    },
  ],
};

// ============================================
// MENÚ DE DOCUMENTOS
// ============================================

/**
 * Menú principal de documentos
 * Muestra opciones según tipos de documentos disponibles
 */
export const menuDocumentos: Template = {
  id: 'menu_documentos',
  name: '2. Menú Documentos',
  content: '📄 ¿Qué documentos necesitas?',
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
      type: 'button',
      id: 'btn_iva_docs',
      title: '🧾 IVAs',
      next_template_id: 'menu_iva',
      conditions: {
        show_if: [
          { field: 'document_type', operator: 'includes', value: 'iva' }
        ],
        else_action: { type: 'hide_button' }
      }
    },
    {
      type: 'button',
      id: 'btn_renta_docs',
      title: '📊 Declaración Renta',
      next_template_id: 'menu_renta',
      conditions: {
        show_if: [
          { field: 'document_type', operator: 'includes', value: 'renta' }
        ],
        else_action: { type: 'hide_button' }
      }
    },
    {
      type: 'button',
      id: 'btn_balance',
      title: '📈 Balances',
      next_template_id: 'menu_balance',
      conditions: {
        show_if: [
          { field: 'document_type', operator: 'includes', value: 'balance' }
        ],
        else_action: { type: 'hide_button' }
      }
    },
    {
      type: 'button',
      id: 'btn_nomina_docs',
      title: '👥 Nómina',
      next_template_id: 'menu_nomina',
      conditions: {
        show_if: [
          { field: 'document_type', operator: 'includes', value: 'liquidacion' }
        ],
        else_action: { type: 'hide_button' }
      }
    },
    {
      type: 'button',
      id: 'btn_solicitar_otro',
      title: '📋 Solicitar otro',
      next_template_id: 'solicitar_documento'
    },
  ],
};

// ============================================
// MENÚ IVA
// ============================================

/**
 * Menú de IVAs con lista dinámica de documentos
 * Usa lista si hay más de 3 IVAs disponibles
 */
export const menuIva: Template = {
  id: 'menu_iva',
  name: '3. Menú IVA',
  content: '🧾 Aquí están tus declaraciones de IVA. ¿Cuál necesitas ver?',
  category: 'tramites',
  service_type: 'iva',
  segment: 'cliente',
  is_active: true,
  priority: 15,
  workflow: 'iva',
  rules: {
    required_context: {
      min_document_count: 1,
      required_document_type: 'iva'
    },
    fallback_template_id: 'iva_no_disponible'
  },
  actions: [
    {
      type: 'button',
      id: 'btn_iva_ultimo',
      title: '📄 Último IVA',
      conditions: {
        show_if: [
          { field: 'document_count', operator: 'greater_than', value: 0 }
        ]
      }
    },
    {
      type: 'button',
      id: 'btn_iva_lista',
      title: '📋 Ver todos los IVAs',
      conditions: {
        show_if: [
          { field: 'document_count', operator: 'greater_than', value: 3 }
        ]
      }
    },
    {
      type: 'button',
      id: 'btn_iva_solicitar',
      title: '📋 Solicitar IVA',
      next_template_id: 'iva_solicitar'
    },
    {
      type: 'button',
      id: 'btn_volver_docs',
      title: '← Volver a documentos',
      next_template_id: 'menu_documentos'
    },
  ],
};

/**
 * Template cuando no hay IVAs disponibles
 */
export const ivaNoDisponible: Template = {
  id: 'iva_no_disponible',
  name: 'IVA No Disponible',
  content: '🧾 No tengo IVAs declarados cargados aún para tu empresa.\n\n¿Prefieres solicitar uno o hablar con un asesor?',
  category: 'documentos',
  service_type: 'iva',
  segment: 'cliente',
  is_active: true,
  priority: 16,
  workflow: 'iva',
  actions: [
    {
      type: 'button',
      id: 'btn_iva_solicitar',
      title: '📋 Solicitar IVA',
      next_template_id: 'iva_solicitar'
    },
    {
      type: 'button',
      id: 'btn_asesor_iva',
      title: '📞 Hablar con asesor',
      next_template_id: 'derivacion_asesor'
    },
  ],
};

/**
 * Template para solicitar IVA
 */
export const ivaSolicitar: Template = {
  id: 'iva_solicitar',
  name: '5. Solicitar IVA',
  content: 'Para solicitar una declaración de IVA específica, necesito que un asesor te contacte. ¿Confirmas que quieres que te llamemos?',
  category: 'documentos',
  segment: 'cliente',
  is_active: true,
  priority: 25,
  workflow: 'iva',
  actions: [
    {
      type: 'button',
      id: 'btn_iva_si',
      title: '✅ Sí, contactar',
      next_template_id: 'derivacion_asesor'
    },
    {
      type: 'button',
      id: 'btn_iva_no',
      title: '← Volver',
      next_template_id: 'menu_iva'
    },
  ],
};

// ============================================
// MENÚ RENTA
// ============================================

export const menuRenta: Template = {
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
    {
      type: 'button',
      id: 'btn_renta_ultimo',
      title: '📄 Última declaración',
      conditions: {
        show_if: [
          { field: 'document_type', operator: 'includes', value: 'renta' }
        ],
        else_action: { type: 'hide_button' }
      }
    },
    {
      type: 'button',
      id: 'btn_renta_solicitar',
      title: '📝 Solicitar declaración',
      next_template_id: 'renta_solicitar'
    },
    {
      type: 'button',
      id: 'btn_volver_renta',
      title: '← Volver',
      next_template_id: 'menu_documentos'
    },
  ],
};

export const rentaSolicitar: Template = {
  id: 'renta_solicitar',
  name: '5. Solicitar Renta',
  content: 'Para solicitar tu declaración de renta, un asesor te contactará. ¿Confirmas?',
  category: 'documentos',
  segment: 'cliente',
  is_active: true,
  priority: 26,
  workflow: 'renta',
  actions: [
    {
      type: 'button',
      id: 'btn_renta_si',
      title: '✅ Sí, contactar',
      next_template_id: 'derivacion_asesor'
    },
    {
      type: 'button',
      id: 'btn_renta_volver',
      title: '← Volver',
      next_template_id: 'menu_renta'
    },
  ],
};

// ============================================
// MENÚ NOMINA
// ============================================

export const menuNomina: Template = {
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
    {
      type: 'button',
      id: 'btn_nom_liq',
      title: '💰 Liquidaciones',
      next_template_id: 'nomina_liquidaciones',
      conditions: {
        show_if: [
          { field: 'document_type', operator: 'includes', value: 'liquidacion' }
        ],
        else_action: { type: 'hide_button' }
      }
    },
    {
      type: 'button',
      id: 'btn_nom_contratos',
      title: '📄 Contratos',
      next_template_id: 'nomina_contratos'
    },
    {
      type: 'button',
      id: 'btn_nom_solicitar',
      title: '📋 Solicitar',
      next_template_id: 'nomina_solicitar'
    },
  ],
};

export const nominaLiquidaciones: Template = {
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
    {
      type: 'button',
      id: 'btn_nom_ultima',
      title: '📄 Última liquidación',
      conditions: {
        show_if: [
          { field: 'document_count', operator: 'greater_than', value: 0 }
        ]
      }
    },
    {
      type: 'button',
      id: 'btn_nom_lista',
      title: '📋 Ver todas',
      conditions: {
        show_if: [
          { field: 'document_count', operator: 'greater_than', value: 3 }
        ],
        else_action: { type: 'hide_button' }
      }
    },
    {
      type: 'button',
      id: 'btn_volver_nomina',
      title: '← Volver',
      next_template_id: 'menu_nomina'
    },
  ],
};

export const nominaContratos: Template = {
  id: 'nomina_contratos',
  name: '4. Contratos',
  content: 'Tus contratos laborales. ¿Cuál necesitas?',
  category: 'documentos',
  segment: 'cliente',
  is_active: true,
  priority: 24,
  workflow: 'nomina',
  actions: [
    {
      type: 'button',
      id: 'btn_contrato_ver',
      title: 'Ver contrato',
      conditions: {
        show_if: [
          { field: 'document_type', operator: 'includes', value: 'contrato' }
        ],
        else_action: { type: 'hide_button' }
      }
    },
    {
      type: 'button',
      id: 'btn_volver_nomina',
      title: '← Volver',
      next_template_id: 'menu_nomina'
    },
  ],
};

export const nominaSolicitar: Template = {
  id: 'nomina_solicitar',
  name: '5. Solicitar Documento Nómina',
  content: 'Para solicitar documentos de nómina, un asesor te contactará. ¿Confirmas?',
  category: 'documentos',
  segment: 'cliente',
  is_active: true,
  priority: 27,
  workflow: 'nomina',
  actions: [
    {
      type: 'button',
      id: 'btn_nom_si',
      title: '✅ Sí, contactar',
      next_template_id: 'derivacion_asesor'
    },
    {
      type: 'button',
      id: 'btn_nom_volver',
      title: '← Volver',
      next_template_id: 'menu_nomina'
    },
  ],
};

// ============================================
// MENÚ BALANCE
// ============================================

export const menuBalance: Template = {
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
    {
      type: 'button',
      id: 'btn_bal_mensual',
      title: '📊 Balance Mensual',
      conditions: {
        show_if: [
          { field: 'document_type', operator: 'includes', value: 'balance' }
        ],
        else_action: { type: 'hide_button' }
      }
    },
    {
      type: 'button',
      id: 'btn_bal_anual',
      title: '📋 Balance Anual',
      conditions: {
        show_if: [
          { field: 'document_type', operator: 'includes', value: 'balance' }
        ],
        else_action: { type: 'hide_button' }
      }
    },
    {
      type: 'button',
      id: 'btn_bal_solicitar',
      title: '📋 Solicitar balance',
      next_template_id: 'balance_solicitar'
    },
  ],
};

export const balanceSolicitar: Template = {
  id: 'balance_solicitar',
  name: '5. Solicitar Balance',
  content: 'Para solicitar un balance, un asesor te contactará. ¿Confirmas?',
  category: 'documentos',
  segment: 'cliente',
  is_active: true,
  priority: 28,
  workflow: 'documentos',
  actions: [
    {
      type: 'button',
      id: 'btn_bal_si',
      title: '✅ Sí, contactar',
      next_template_id: 'derivacion_asesor'
    },
    {
      type: 'button',
      id: 'btn_bal_volver',
      title: '← Volver',
      next_template_id: 'menu_balance'
    },
  ],
};

// ============================================
// FLUJO DE COTIZACIÓN (PROSPECTOS)
// ============================================

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
  actions: [], // Espera respuesta libre, luego IA
};

// ============================================
// SERVICIOS GENERALES
// ============================================

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
      type: 'button',
      id: 'btn_serv_iva',
      title: '🧾 Más info IVA',
      next_template_id: 'tramite_iva_info'
    },
    {
      type: 'button',
      id: 'btn_serv_renta',
      title: '📊 Más info Renta',
      next_template_id: 'tramite_renta_info'
    },
    {
      type: 'button',
      id: 'btn_serv_cotizar',
      title: '💼 Cotizar',
      next_template_id: 'cotizacion_info'
    },
  ],
};

export const tramiteIvaInfo: Template = {
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
    {
      type: 'button',
      id: 'btn_iva_mas_info',
      title: '📝 Ver más servicios',
      next_template_id: 'servicios_general'
    },
    {
      type: 'button',
      id: 'btn_iva_cotizar',
      title: '💼 Cotizar',
      next_template_id: 'cotizacion_info'
    },
  ],
};

export const tramiteRentaInfo: Template = {
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
    {
      type: 'button',
      id: 'btn_renta_mas_info',
      title: '📝 Ver más servicios',
      next_template_id: 'servicios_general'
    },
    {
      type: 'button',
      id: 'btn_renta_cotizar',
      title: '💼 Cotizar',
      next_template_id: 'cotizacion_info'
    },
  ],
};

// ============================================
// COBRANZA
// ============================================

export const cobranzaRecordatorio: Template = {
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
    {
      type: 'button',
      id: 'btn_cob_info',
      title: '📋 Ver detalles',
      next_template_id: 'cobranza_detalles'
    },
    {
      type: 'button',
      id: 'btn_cob_pagar',
      title: '💳 Ya pagué',
      next_template_id: 'cobranza_confirmar'
    },
  ],
};

export const cobranzaDetalles: Template = {
  id: 'cobranza_detalles',
  name: 'Detalles Cobranza',
  content: 'Tu estado de cuenta:\n\n• Mes: Marzo 2026\n• Monto: $XXX.XXX\n• Vencimiento: 20/03/2026\n\n¿Tienes alguna consulta?',
  category: 'cobranza',
  segment: 'cliente',
  is_active: true,
  priority: 51,
  workflow: 'cobranza',
  actions: [
    {
      type: 'button',
      id: 'btn_cob_asesor',
      title: '📞 Hablar con asesor',
      next_template_id: 'derivacion_asesor'
    },
    {
      type: 'button',
      id: 'btn_cob_volver',
      title: '← Volver',
      next_template_id: 'gracias'
    },
  ],
};

export const cobranzaConfirmar: Template = {
  id: 'cobranza_confirmar',
  name: 'Confirmar Pago',
  content: 'Perfecto. Gracias por tu pago. Un asesor verificará y te contactará si hay algo más.',
  category: 'cobranza',
  segment: 'cliente',
  is_active: true,
  priority: 52,
  workflow: 'cobranza',
  actions: [
    {
      type: 'button',
      id: 'btn_cob_ok',
      title: '✅ Aceptar',
      next_template_id: 'gracias'
    },
  ],
};

// ============================================
// DERIVACIÓN A ASESOR
// ============================================

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

// ============================================
// MENSAJES GENERALES
// ============================================

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
      next_template_id: 'bienvenida_cliente'
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

// ============================================
// ARRAY DE TODOS LOS TEMPLATES
// ============================================

export const DEFAULT_TEMPLATES: Template[] = [
  // Bienvenida
  bienvenidaCliente,
  bienvenidaProspecto,

  // Documentos
  menuDocumentos,
  menuIva,
  ivaNoDisponible,
  ivaSolicitar,
  menuRenta,
  rentaSolicitar,
  menuNomina,
  nominaLiquidaciones,
  nominaContratos,
  nominaSolicitar,
  menuBalance,
  balanceSolicitar,
  solicitarDocumento,

  // Cotización
  cotizacionInfo,
  cotizacionRecoger,

  // Servicios
  serviciosGeneral,
  tramiteIvaInfo,
  tramiteRentaInfo,

  // Cobranza
  cobranzaRecordatorio,
  cobranzaDetalles,
  cobranzaConfirmar,

  // Derivación
  derivacionAsesor,
  derivacionConfirmar,

  // General
  gracias,
  confirmacionRecepcion,
];

// ============================================
// FUNCIONES AUXILIARES
// ============================================

import { Category, ServiceType, WORKFLOWS } from './types';

export const CATEGORIES: Category[] = [
  { id: 'bienvenida', name: 'Bienvenida', icon: '👋', color: 'bg-green-600', colorHex: '#16a34a', description: 'Saludos y primer contacto' },
  { id: 'menu', name: 'Menú Principal', icon: '📋', color: 'bg-blue-600', colorHex: '#2563eb', description: 'Opciones del menú interactivo' },
  { id: 'servicios', name: 'Servicios', icon: '💼', color: 'bg-indigo-600', colorHex: '#4f46e5', description: 'Información de servicios' },
  { id: 'documentos', name: 'Documentos', icon: '📄', color: 'bg-orange-600', colorHex: '#ea580c', description: 'Solicitud y envío de docs' },
  { id: 'tramites', name: 'Trámites', icon: '🏢', color: 'bg-purple-600', colorHex: '#9333ea', description: 'Trámites específicos' },
  { id: 'cobranza', name: 'Cobranza', icon: '💳', color: 'bg-red-600', colorHex: '#dc2626', description: 'Recordatorios y cobros' },
  { id: 'general', name: 'General', icon: '💬', color: 'bg-slate-600', colorHex: '#475569', description: 'Mensajes generales' },
];

export const SERVICE_TYPES: ServiceType[] = [
  { id: 'inicio_actividades', name: 'Inicio de Actividades', description: 'Altas, cambios y bajas', icon: '🚀' },
  { id: 'iva', name: 'IVA', description: 'Declaraciones mensuales', icon: '🧾' },
  { id: 'renta', name: 'Renta', description: 'Declaración anual', icon: '📊' },
  { id: 'contabilidad', name: 'Contabilidad', description: 'Balances, estados', icon: '📈' },
  { id: 'nomina', name: 'Nómina', description: 'Liquidaciones, contratos', icon: '👥' },
  { id: 'regularizacion', name: 'Regularización', description: 'Rectificaciones', icon: '✅' },
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
