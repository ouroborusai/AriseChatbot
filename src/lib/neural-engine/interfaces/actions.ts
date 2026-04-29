import { SuggestedOption } from '@/types/api';

/**
 * Arise Neural Action Interfaces v10.4 (Diamond Platinum)
 * Centralized types for internal neural execution.
 */

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
  stock?: string | number;
  quantity?: string | number;
  item?: string;
  item_name?: string;
  product?: string;
  params?: {
    item_id?: string;
    sku?: string;
    quantity?: string | number;
    type?: 'in' | 'out';
  };
}

export interface NeuralActionResult {
  action: string;
  status: 'success' | 'failed' | 'item_not_found' | 'validation_failed' | 'error';
  error?: string;
  name?: string;
  sku?: string;
  stock?: string | number;
  instruction_for_ai?: string;
  suggested_options?: SuggestedOption[];
}
