/**
 * ARISE CORE TYPES - SSOT v12.1 (Diamond Resilience)
 * Master Single Source of Truth para Ouroborus AI.
 */

export type WhatsAppMessageType = 'text' | 'interactive' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | 'location' | 'contacts' | 'order';
export type InteractiveType = 'button' | 'list' | 'catalog_message' | 'product' | 'product_list' | 'carousel' | 'flow';
export type ButtonType = 'reply' | 'phone_number' | 'url' | 'otp' | 'mpm' | 'flow';

export interface TextMessage {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'text';
  text: { body: string; preview_url?: boolean };
}

export interface DocumentMessage {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'document';
  document: { link: string; filename?: string; caption?: string };
}

export interface InteractiveButton {
  type: 'reply';
  reply: { id: string; title: string };
}

export interface ButtonInteractive {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'interactive';
  interactive: {
    type: 'button';
    body: { text: string };
    footer?: { text: string };
    action: { buttons: InteractiveButton[] };
  };
}

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
    body: { text: string };
    footer?: { text: string };
    action: { button: string; sections: ListSection[] };
  };
}

export interface TemplateMessage {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: { code: string };
    components?: Array<{
      type: 'header' | 'body' | 'button';
      parameters: Array<{
        type: 'text' | 'image' | 'document' | 'video' | 'payload';
        text?: string;
        image?: { link: string };
        document?: { link: string; filename?: string };
        video?: { link: string };
        payload?: string;
      }>;
      index?: number;
      sub_type?: 'quick_reply' | 'url';
    }>;
  };
}

export interface CatalogMessage {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'interactive';
  interactive: {
    type: 'catalog_message';
    body: { text: string };
    footer?: { text: string };
    action: {
      name: 'catalog_message';
      parameters?: { thumbnail_product_retailer_id?: string };
    };
  };
}

export interface ProductMessage {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'interactive';
  interactive: {
    type: 'product';
    body?: { text: string };
    footer?: { text: string };
    action: { catalog_id: string; product_retailer_id: string };
  };
}

export interface FlowMessage {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'interactive';
  interactive: {
    type: 'flow';
    header?: { type: 'text'; text: string };
    body: { text: string };
    footer?: { text: string };
    action: {
      name: 'flow';
      parameters: {
        flow_token: string;
        flow_id: string;
        flow_cta: string;
        flow_action: 'navigate' | 'data_exchange';
        flow_action_payload?: { screen: string; data?: Record<string, unknown> };
      };
    };
  };
}

export interface WhatsAppMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text' | 'template' | 'interactive' | 'document';
  text?: { body: string };
  template?: Record<string, unknown>;
  interactive?: Record<string, unknown>;
  document?: Record<string, unknown>;
}

export interface OrderItem {
  product_retailer_id: string;
  quantity: string;
  item_price: string;
  currency: string;
}

export interface OrderPayload {
  catalog_id: string;
  text?: string;
  product_items: OrderItem[];
}

export interface OrderMessageParams {
  order: OrderPayload;
  sender: string;
  companyId: string;
  contactId: string;
  conversationId: string;
  whatsappToken: string;
  phoneNumberId: string;
}

export interface WhatsAppContact {
  profile: { name: string };
  wa_id: string;
  bsuid?: string;
}

export interface InteractiveMessagePayload {
  type: string;
  button_reply?: { id: string; title: string };
  list_reply?: { id: string; title: string };
  nfm_reply?: { response_json: string; name?: string; body?: string };
}

export interface WhatsAppMessageData {
  from: string;
  id: string;
  type: string;
  text?: { body: string };
  interactive?: InteractiveMessagePayload;
  order?: OrderPayload;
}

export interface WhatsAppValue {
  messaging_product: string;
  metadata: { display_phone_number: string; phone_number_id: string };
  contacts?: WhatsAppContact[];
  messages?: WhatsAppMessageData[];
}

export interface WhatsAppWebhookRequest {
  object: string;
  entry?: Array<{
    id: string;
    changes?: Array<{ value: WhatsAppValue; field: string }>;
  }>;
}

export interface GeminiResponse {
  text: string;
  error?: string;
}

export interface GeminiContext {
  messageId: string;
  companyId: string;
  contact_id: string;
  conversation_id: string;
  content: string;
  phone_number?: string;
}

export interface NeuralProcessorRequest {
  messageId: string;
  companyId: string;
  contact_id: string;
  conversation_id: string;
  phone_number: string;
  content?: string;
  payload?: Record<string, unknown>;
}

export interface NeuralProcessorResponse {
  response: string;
  action_results?: NeuralActionResult[];
}

export interface NeuralActionResult {
  action: string;
  status: 'success' | 'failed' | 'item_not_found' | 'validation_failed' | 'error' | 'pending_execution';
  error?: string;
  name?: string;
  sku?: string;
  phone?: string;
  stock?: string | number;
  url?: string;
  to?: string;
  instruction_for_ai?: string;
  full_name?: string;
  position?: string;
  suggested_options?: Record<string, unknown>[];
}

export interface NeuralActionPayload {
  action: string;
  sku?: string;
  name?: string;
  current_stock?: string | number;
  contact_id?: string;
  conversation_id?: string;
  phone_number?: string;
  target_phone?: string;
  phone?: string; // Explicitly added for credit actions
  amount?: string | number; // Explicitly added for credit actions
  full_name?: string; // Explicitly added for HR actions
  position?: string; // Explicitly added for HR actions
  contract_type?: string; // Explicitly added for HR actions
  title?: string; // Explicitly added for Task actions
  description?: string; // Explicitly added for Task actions
  content?: string; // Explicitly added for Reminder actions
  due_at?: string; // Explicitly added for Reminder actions
  report_type?: string;
  is_pregen?: boolean;
  params?: {
    sku?: string;
    current_stock?: string | number;
    type?: 'in' | 'out';
    phone?: string;
    amount?: string | number;
    title?: string;
    description?: string;
    content?: string;
    due_at?: string;
    [key: string]: unknown;
  };
  parameters?: {
    sku?: string;
    current_stock?: string | number;
    type?: 'in' | 'out';
    phone?: string;
    amount?: string | number;
    title?: string;
    description?: string;
    content?: string;
    due_at?: string;
    [key: string]: unknown;
  };
  meta_payload?: Record<string, unknown>;
  [key: string]: unknown; // Allow for action-specific fields while maintaining type safety
}

/**
 * Opción parseada compatible con el SSOT de WhatsApp.
 * Mapeable directamente a ListRow o a la propiedad 'reply' de InteractiveButton.
 */
export interface ParsedInteractiveOption {
  id: string;
  title: string;
  description?: string;
  actionPayload?: string; // Alta detectabilidad para comandos como [[CATALOG]]
  _uiMetadata?: {
    borderRadius: 40;
    color: '#22c55e';
  };
}

/**
 * Resultado estructurado del parseo de mensajes interactivos de la IA.
 * Centralizado según el Mandato de Tipado SSOT.
 */
export interface AIInteractiveParseResult {
  hasInteractive: boolean;
  bodyText: string;
  options: ParsedInteractiveOption[];
  footer?: string;
  /** Metadatos estéticos obligatorios para el renderizado seguro en el cliente */
  uiMetadata?: {
    borderRadius: 40;
    brandColor: '#22c55e';
  };
}
