/**
 * Modelos de Dominio (Base de Datos)
 */

export interface Contact {
  id: string;
  phone_number: string;
  name?: string | null;
  email?: string | null;
  segment?: string | null; // 'cliente', 'prospecto'
  metadata?: Record<string, any>;
  location?: string | null;
  last_message_at?: string;
  created_at?: string;
  updated_at?: string;
  is_blocked?: boolean;
  notes?: string | null;
}

export interface Company {
  id: string;
  legal_name: string;
  rut?: string | null;
  segment?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface ContactCompany {
  contact_id: string;
  company_id: string;
  role: string | null;
  is_primary: boolean;
  contacts?: { phone_number: string; name: string | null } | null;
  companies?: { id: string; legal_name: string } | null;
}

export interface CompanyLink {
  company_id: string;
  is_primary: boolean;
  companies?: { id: string; legal_name: string } | null;
}

export interface ClientDocument {
  id: string;
  contact_id: string;
  company_id?: string | null;
  title: string;
  description?: string | null;
  file_name?: string | null;
  file_url?: string | null;
  storage_bucket?: string | null;
  storage_path?: string | null;
  file_type?: string | null;
  created_at: string;
  contacts?: { phone_number: string; name: string | null } | null;
  companies?: { id: string; legal_name: string } | null;
}

export interface Conversation {
  id: string;
  phone_number: string;
  contact_id: string;
  active_company_id?: string | null;
  chatbot_enabled?: boolean;
  is_open?: boolean;
  message_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ServiceRequest {
  id: string;
  contact_id: string;
  company_id?: string | null;
  request_type: string;
  status: string;
  priority: number;
  description?: string | null;
  request_code?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface Appointment {
  id: string;
  contact_id: string;
  company_id?: string | null;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryItem {
  id: string;
  company_id: string;
  name: string;
  sku?: string | null;
  unit?: string | null;
  current_stock: number;
  last_purchase_price?: number | null;
  min_stock_alert?: number | null;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryTransaction {
  id: string;
  item_id: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  net_amount?: number;
  iva_amount?: number;
  total_amount?: number;
  doc_type?: string;
  doc_number?: string;
  source_type?: string | null;
  source_id?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface InventoryProvider {
  id: string;
  company_id: string;
  name: string;
  rut: string;
}

