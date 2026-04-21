/**
 * OUROBORUS AI - INDUSTRIAL TYPE DEFINITIONS
 * Version: 2.0 (Light Edition Architecture)
 */

export interface Company {
  id: string;
  name: string;
  tax_id: string; // RUT/VAT
  created_at: string;
}

export interface Contact {
  id: string;
  company_id: string; // Unified Multi-tenancy
  name: string;
  phone: string;
  email?: string;
  segment?: string;
  tags?: string[];
  purchase_history: Record<string, unknown>; // Legacy JSONB - To be deprecated by SalesOrder
}

export interface SalesOrder {
  id: string;
  contact_id: string;
  company_id: string;
  order_code: string;
  status: 'pending' | 'completed' | 'cancelled';
  total_amount: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  company_id: string;
  sku: string;
  name: string;
  current_stock: number;
  min_stock_alert: number;
  last_cost: number;
}

export interface InventoryTransaction {
  id: string;
  item_id: string;
  order_id?: string; // Link to SalesOrder
  document_id?: string; // Link to ClientDocument
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  total_amount: number;
  created_at: string;
}

export interface ClientDocument {
  id: string;
  company_id: string;
  title: string;
  net_amount: number;
  iva_amount: number;
  total_amount: number;
  status: string;
  created_at: string;
}
