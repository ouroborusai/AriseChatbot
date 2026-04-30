import { SuggestedOption } from '@/types/api';

/**
 *  NEURAL ACTION INTERFACES v11.9.1 (Diamond Resilience)
 *  SSOT para la orquestación del motor Ouroborus.
 *  Cero 'any'. 
 */

export interface NeuralProcessorRequest {
  messageId: string;
  companyId: string;
  contact_id: string;
  conversation_id: string;
  phone_number: string;
  payload?: Record<string, unknown>;
}

export interface NeuralProcessorResponse {
  response: string;
  action_results?: NeuralActionResult[];
}

export interface TaskActionParams {
  action: 'task_create' | 'reminder_create' | 'reminder_set';
  company_id: string;
  title?: string;
  description?: string;
  due_at?: string;
  content?: string;
  parameters?: {
    title?: string;
    description?: string;
    due_at?: string;
    time?: string;
    content?: string;
  };
}

export interface InventoryActionParams {
  action: 'inventory_create' | 'inventory_add' | 'inventory_remove' | 'inventory_log' | 'inventory_scan';
  company_id: string;
  name?: string;
  sku?: string;
  current_stock?: number;
  params?: {
    item_id?: string;
    sku?: string;
    current_stock?: number;
    type?: 'in' | 'out';
  };
}

export interface PaymentActionParams {
  action: 'payment_link' | 'payment_link_generate' | 'payment_status';
  company_id: string;
  amount?: number;
  description?: string;
  contact_id: string;
  conversation_id: string;
}

export interface PdfActionParams {
  action: 'pdf_generate' | 'pdf_send';
  company_id: string;
  report_type: string;
  target_phone: string;
  is_pregen?: boolean;
}

export interface CreditActionParams {
  action: 'credit_limit_set' | string;
  company_id: string;
  phone?: string;
  amount?: string | number;
  params?: {
    phone?: string;
    amount?: string | number;
  };
}

export interface DirectoryActionParams {
  action: 'directory_register' | 'directory_update' | 'register_client' | string;
  company_id: string;
  phone?: string;
  name?: string;
  role?: string;
  params?: {
    phone?: string;
    name?: string;
    role?: string;
  };
}

export interface MenuActionParams {
  action: 'offer_menus' | string;
  company_id: string;
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
  suggested_options?: SuggestedOption[];
}
