/**
 * ARISE API TYPES Diamond v10.1 [v10.4 Platinum Update]
 * Tipos TypeScript estrictos para endpoints de la API.
 */

export interface WhatsAppSendRequest {
  contactId: string;
  content: string;
}

export interface WhatsAppSendResponse {
  success: true;
  messageId?: string;
  messageType: 'text' | 'interactive';
}

export interface WhatsAppWebhookRequest {
  object: 'whatsapp_business_account';
  entry: WhatsAppWebhookEntry[];
}

export interface WhatsAppWebhookEntry {
  id: string;
  changes: WhatsAppWebhookChange[];
}

export interface WhatsAppWebhookChange {
  value: {
    messaging_product: 'whatsapp';
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    contacts?: Array<{
      profile: {
        name: string;
      };
      wa_id: string;
    }>;
    messages?: WhatsAppMessage[];
  };
  field: 'messages';
}

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'interactive' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contacts';
  text?: {
    body: string;
  };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: {
      id: string;
    };
    list_reply?: {
      id: string;
      title: string;
      description?: string;
    };
  };
}

export interface NeuralProcessorRequest {
  messageId: string;
  companyId: string;
}

export interface NeuralProcessorResponse {
  status: 'completed' | 'no_actions_detected';
  results?: NeuralAction[];
  error?: string;
}

export type NeuralActionType =
  | 'inventory_create'
  | 'inventory_add'
  | 'inventory_remove'
  | 'inventory_log'
  | 'inventory_scan'
  | 'task_create'
  | 'reminder_create'
  | 'pdf_generate'
  | 'whatsapp_flow_init'
  | 'commerce_catalog_send'
  | 'directory_register'
  | 'register_client'
  | 'credit_limit_set'
  | 'payment_link_generate'
  | 'offer_menus'
  | 'unknown';

export interface SuggestedOption {
  id: string;
  title: string;
  description?: string;
}

export interface NeuralAction {
  action: NeuralActionType | string;
  status: 'success' | 'failed' | 'item_not_found' | 'triggered' | 'pending_execution' | 'validation_failed' | 'error';
  error?: string;
  sku?: string;
  name?: string;
  to?: string;
  result?: Record<string, unknown>;
  instruction_for_ai?: string;
  suggested_options?: SuggestedOption[];
  metadata?: {
    timestamp: string;
    executedBy: string;
  };
}

export interface ApiError {
  error: string;
  details?: string;
  code?: string;
}

export type ApiResponse<T> = T | ApiError;
