/**
 * ARISE WHATSAPP CONSTANTS v9.0
 * Límites y plantillas predefinidas para WhatsApp Business API
 */

// ════════════════════════════════════════════════════════════════════════════
// LÍMITES DE WHATSAPP API
// ════════════════════════════════════════════════════════════════════════════

export const WHATSAPP_LIMITS = {
  // Botones interactivos
  MAX_BUTTONS: 3,
  MAX_BUTTON_TITLE_LENGTH: 20,

  // Listas interactivas
  MAX_LIST_SECTIONS: 10,
  MAX_ROWS_PER_SECTION: 10,
  MAX_ROW_TITLE_LENGTH: 24,
  MAX_ROW_DESCRIPTION_LENGTH: 72,
  MAX_LIST_BUTTON_TEXT: 20,

  // Texto
  MAX_TEXT_BODY_LENGTH: 1024,
  MAX_TEXT_LENGTH: 4096,

  // Header
  MAX_HEADER_TEXT_LENGTH: 60,

  // Footer
  MAX_FOOTER_LENGTH: 60,

  // Secciones
  MAX_SECTION_TITLE_LENGTH: 24,
} as const;

// ════════════════════════════════════════════════════════════════════════════
// PLANTILLAS PREDEFINIDAS
// ════════════════════════════════════════════════════════════════════════════

export const TEMPLATES = {
  // Menu principal
  mainMenu: {
    header: 'Arise Business OS',
    footer: 'Diamond v9.0',
    button: 'Ver Opciones',
  },

  // Confirmación
  confirmation: {
    body: '¿Estás seguro de realizar esta acción?',
    buttons: [
      { id: 'confirm_yes', title: 'Sí, confirmar' },
      { id: 'confirm_no', title: 'Cancelar' },
    ],
  },

  // Navegación CRM
  crmNavigation: {
    header: 'Gestión CRM',
    footer: 'Arise Intelligence',
    button: 'Seleccionar',
    sections: [
      {
        title: 'Contactos',
        rows: [
          { id: 'crm_list', title: 'Ver Contactos', description: 'Lista completa' },
          { id: 'crm_add', title: 'Nuevo Contacto', description: 'Agregar contacto' },
          { id: 'crm_search', title: 'Buscar', description: 'Buscar contacto' },
        ],
      },
      {
        title: 'Gestiones',
        rows: [
          { id: 'crm_tasks', title: 'Tareas Pendientes', description: 'Ver tareas' },
          { id: 'crm_followup', title: 'Seguimientos', description: 'Clientes por seguir' },
        ],
      },
    ],
  },

  // Navegación Inventario
  inventoryNavigation: {
    header: 'Control Inventario',
    footer: 'Diamond v9.0',
    button: 'Ver Opciones',
    sections: [
      {
        title: 'Productos',
        rows: [
          { id: 'inv_list', title: 'Ver Productos', description: 'Listado completo' },
          { id: 'inv_add', title: 'Nuevo Producto', description: 'Agregar ítem' },
          { id: 'inv_stock', title: 'Ajustar Stock', description: 'Entrada/Salida' },
        ],
      },
      {
        title: 'Reportes',
        rows: [
          { id: 'inv_critical', title: 'Stock Crítico', description: 'Productos bajos' },
          { id: 'inv_movements', title: 'Movimientos', description: 'Kardex' },
        ],
      },
    ],
  },
} as const;
