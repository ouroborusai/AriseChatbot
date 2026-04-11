/**
 * Tipos para la API de WhatsApp Cloud
 */

export interface InboundMessage {
  from?: string;
  text?: { body?: string };
  interactive?: {
    button_reply?: { id?: string; title?: string };
    list_reply?: { id?: string; title?: string; description?: string };
  };
  type?: 'text' | 'interactive' | 'button' | 'list_reply' | 'document' | 'image';
  document?: {
    id: string;
    mime_type: string;
    filename: string;
    sha256: string;
  };
}

export interface WhatsAppResponse {
  messaging_product: 'whatsapp';
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export interface MessageData {
  phone: string;
  message: string;
  documentUrl?: string;
  documentName?: string;
}
