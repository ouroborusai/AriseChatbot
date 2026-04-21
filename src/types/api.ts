/**
 * ARISE API TYPES v9.0
 * Tipos TypeScript estrictos para endpoints de la API
 */

// ════════════════════════════════════════════════════════════════════════════
// WHATSAPP API
// ════════════════════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════════════════════
// NEURAL PROCESSOR API
// ════════════════════════════════════════════════════════════════════════════

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
  | 'inventory_scan'
  | 'task_create'
  | 'reminder_create'
  | 'pdf_generate'
  | 'unknown';

export interface NeuralAction {
  action: NeuralActionType;
  status: 'success' | 'failed' | 'item_not_found' | 'triggered';
  error?: string;
  sku?: string;
  name?: string;
  to?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// OCR PROCESSOR API
// ════════════════════════════════════════════════════════════════════════════

export interface OCRProcessorRequest {
  filePath: string;
  companyId: string;
}

export interface OCRProcessorResponse {
  status: 'completed';
  extraction: OCRExtraction;
  transactions: OCRTransactionResult[];
  error?: string;
}

export interface OCRExtraction {
  vendor: string;
  date: string;
  total: number;
  items: OCRItem[];
}

export interface OCRItem {
  sku: string;
  description: string;
  quantity: number;
  price: number;
}

export interface OCRTransactionResult {
  sku: string;
  status: 'success' | 'failed';
}

// ════════════════════════════════════════════════════════════════════════════
// PDF GENERATOR API
// ════════════════════════════════════════════════════════════════════════════

export interface PDFGeneratorRequest {
  targetPhone: string;
  whatsappToken: string;
  phoneNumberId: string;
  reportType: string;
}

export interface PDFGeneratorResponse {
  success: true;
  fileName: string;
  error?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// CHECKOUT API (MercadoPago)
// ════════════════════════════════════════════════════════════════════════════

export interface CheckoutRequest {
  companyId: string;
  companyName: string;
  userEmail: string;
}

export interface CheckoutResponse {
  init_point: string;
  preference_id: string;
  error?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// ERROR RESPONSES
// ════════════════════════════════════════════════════════════════════════════

export interface ApiError {
  error: string;
  details?: string;
  code?: string;
}

export type ApiResponse<T> = T | ApiError;
