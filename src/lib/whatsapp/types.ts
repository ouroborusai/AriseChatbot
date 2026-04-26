/**
 * ARISE WHATSAPP TYPES Diamond v10.1
 * Tipos TypeScript estrictos para la API de WhatsApp Business
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
// INTERFACES PARA MENSAJES DE DOCUMENTOS
// ════════════════════════════════════════════════════════════════════════════

export interface DocumentMessage {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'document';
  document: {
    link: string;
    filename?: string;
    caption?: string;
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

export type WhatsAppMessage = TextMessage | ButtonInteractive | ListInteractive | DocumentMessage;

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
