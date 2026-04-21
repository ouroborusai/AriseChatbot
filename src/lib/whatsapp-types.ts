/**
 * ARISE WHATSAPP INTERACTIVE TYPES v9.0
 * Tipos TypeScript estrictos para la API de WhatsApp Business
 * Documentación: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
 */

// ════════════════════════════════════════════════════════════════════════════
// TIPOS BASE
// ════════════════════════════════════════════════════════════════════════════

export type WhatsAppMessageType = 'text' | 'interactive' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | 'location' | 'contacts';

export type InteractiveType = 'button' | 'list' | 'catalog_message' | 'product' | 'product_list' | 'carousel';

export type ButtonType = 'reply' | 'phone_number' | 'url' | 'otp' | 'mpm' | 'flow';

// ════════════════════════════════════════════════════════════════════════════
// INTERFACES PARA MENSAJES DE TEXTO
// ════════════════════════════════════════════════════════════════════════════

export interface TextMessage {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'text';
  text: {
    body: string;
    preview_url?: boolean;
  };
}

// ════════════════════════════════════════════════════════════════════════════
// INTERFACES PARA BOTONES INTERACTIVOS
// ════════════════════════════════════════════════════════════════════════════

export interface InteractiveButton {
  type: 'reply';
  reply: {
    id: string;
    title: string;
  };
}

export interface ButtonInteractive {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'interactive';
  interactive: {
    type: 'button';
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      buttons: InteractiveButton[];
    };
  };
}

// ════════════════════════════════════════════════════════════════════════════
// INTERFACES PARA LISTAS INTERACTIVAS
// ════════════════════════════════════════════════════════════════════════════

export interface ListRow {
  id: string;
  title: string;
  description?: string;
}

export interface ListSection {
  title: string;
  rows: ListRow[];
}

export interface ListInteractive {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'interactive';
  interactive: {
    type: 'list';
    header?: {
      type: 'text' | 'image' | 'video' | 'document';
      text?: string;
      image?: { link: string };
      video?: { link: string };
      document?: { link: string; filename: string };
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      button: string;
      sections: ListSection[];
    };
  };
}

// ════════════════════════════════════════════════════════════════════════════
// UNION TYPE PARA TODOS LOS MENSAJES
// ════════════════════════════════════════════════════════════════════════════

export type WhatsAppMessage = TextMessage | ButtonInteractive | ListInteractive;

// ════════════════════════════════════════════════════════════════════════════
// PARSED CONTENT (para uso interno)
// ════════════════════════════════════════════════════════════════════════════

export interface ParsedInteractiveContent {
  hasInteractive: boolean;
  bodyText: string;
  options: InteractiveOption[];
  footer?: string;
  header?: string;
}

export interface InteractiveOption {
  id: string;
  title: string;
  description?: string;
  actionPayload?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// WHATSAPP API RESPONSE
// ════════════════════════════════════════════════════════════════════════════

export interface WhatsAppApiResponse {
  messaging_product: 'whatsapp';
  contacts?: Array<{
    input: string;
    wa_id: string;
  }>;
  messages?: Array<{
    id: string;
  }>;
  error?: {
    message: string;
    type: string;
    code: number;
    error_data?: {
      details: string;
    };
  };
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE EMPRESA
// ════════════════════════════════════════════════════════════════════════════

export interface CompanyWhatsAppConfig {
  access_token: string;
  phone_number_id: string;
  business_account_id?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES Y LÍMITES DE WHATSAPP
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

// ════════════════════════════════════════════════════════════════════════════
// UTILIDADES DE CONSTRUCCIÓN
// ════════════════════════════════════════════════════════════════════════════

/**
 * Construye un mensaje de texto válido para WhatsApp
 */
export function buildTextMessage(phone: string, text: string): TextMessage {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'text',
    text: {
      body: text.substring(0, WHATSAPP_LIMITS.MAX_TEXT_LENGTH),
    },
  };
}

/**
 * Construye un mensaje con botones interactivos (máx 3 botones)
 */
export function buildButtonMessage(
  phone: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>,
  footer?: string
): ButtonInteractive {
  const validButtons = buttons
    .slice(0, WHATSAPP_LIMITS.MAX_BUTTONS)
    .map(btn => ({
      type: 'reply' as const,
      reply: {
        id: btn.id,
        title: btn.title.substring(0, WHATSAPP_LIMITS.MAX_BUTTON_TITLE_LENGTH),
      },
    }));

  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: bodyText.substring(0, WHATSAPP_LIMITS.MAX_TEXT_BODY_LENGTH),
      },
      ...(footer && {
        footer: {
          text: footer.substring(0, WHATSAPP_LIMITS.MAX_FOOTER_LENGTH),
        },
      }),
      action: {
        buttons: validButtons,
      },
    },
  };
}

/**
 * Construye un mensaje con lista interactiva (hasta 10 secciones, 10 rows c/u)
 */
export function buildListMessage(
  phone: string,
  bodyText: string,
  sections: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>,
  button: string,
  header?: string,
  footer?: string
): ListInteractive {
  const validSections = sections
    .slice(0, WHATSAPP_LIMITS.MAX_LIST_SECTIONS)
    .map(section => ({
      title: section.title.substring(0, WHATSAPP_LIMITS.MAX_SECTION_TITLE_LENGTH),
      rows: section.rows
        .slice(0, WHATSAPP_LIMITS.MAX_ROWS_PER_SECTION)
        .map(row => ({
          id: row.id,
          title: row.title.substring(0, WHATSAPP_LIMITS.MAX_ROW_TITLE_LENGTH),
          ...(row.description && {
            description: row.description.substring(0, WHATSAPP_LIMITS.MAX_ROW_DESCRIPTION_LENGTH),
          }),
        })),
    }));

  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'interactive',
    interactive: {
      type: 'list',
      ...(header && {
        header: {
          type: 'text' as const,
          text: header.substring(0, WHATSAPP_LIMITS.MAX_HEADER_TEXT_LENGTH),
        },
      }),
      body: {
        text: bodyText.substring(0, WHATSAPP_LIMITS.MAX_TEXT_BODY_LENGTH),
      },
      ...(footer && {
        footer: {
          text: footer.substring(0, WHATSAPP_LIMITS.MAX_FOOTER_LENGTH),
        },
      }),
      action: {
        button: button.substring(0, WHATSAPP_LIMITS.MAX_LIST_BUTTON_TEXT),
        sections: validSections,
      },
    },
  };
}
