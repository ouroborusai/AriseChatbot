/**
 * OUROBORUS AI - DATABASE TYPE DEFINITIONS
 * Diamond Resilience v11.8 — Espejo exacto del esquema Supabase auditado.
 * Fuente de Verdad: SUPABASE_REAL_SCHEMA_v11.8_AUDITED (zosravrfpfechanatucx)
 *
 * REGLA DIAMOND: Este archivo es el ÚNICO contrato de tipos para la DB.
 * Prohibido crear interfaces locales en páginas que dupliquen estos tipos.
 * Cualquier cambio en la DB debe reflejarse aquí primero.
 */

// ════════════════════════════════════════════════════════════════════════════
// IDENTIDAD Y ACCESO
// ════════════════════════════════════════════════════════════════════════════

export interface Company {
  id: string;
  name: string;                    // Nombre legal de la empresa
  tax_id: string | null;           // RUT/VAT — identificador fiscal
  status: 'active' | 'inactive' | null;
  settings: Record<string, unknown>; // JSON libre: whatsapp, branding, etc.
  plan_tier: 'free' | 'pro' | 'enterprise' | null;
  created_at: string;
}

export interface Profile {
  id: string;                      // Vinculado a auth.users.id
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  preferences: Record<string, unknown> | null;
  created_at: string;
}

export interface UserCompanyAccess {
  user_id: string;
  company_id: string;
  role: 'admin' | 'staff' | 'viewer' | null;
}

// ════════════════════════════════════════════════════════════════════════════
// CRM — CONTACTOS Y CONVERSACIONES
// ════════════════════════════════════════════════════════════════════════════

export interface Contact {
  id: string;
  company_id: string | null;
  full_name: string;               // ⚠️ CAMPO REAL: full_name (no 'name')
  email: string | null;
  phone: string | null;
  category: 'lead' | 'client' | 'family' | null; // ⚠️ CAMPO REAL: category (no 'segment')
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  company_id: string | null;
  contact_id: string | null;
  status: 'open' | 'closed' | 'pending' | 'waiting_human' | null;
  metadata: Record<string, unknown> | null;
  current_state: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string | null;
  sender_type: 'bot' | 'user' | 'system' | 'agent' | null;
  content: string;
  external_id: string | null;     // ID único de WhatsApp (anti-duplicados)
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ════════════════════════════════════════════════════════════════════════════
// INVENTARIO
// ════════════════════════════════════════════════════════════════════════════

export interface InventoryItem {
  id: string;
  company_id: string | null;
  name: string;
  sku: string;
  current_stock: number | null;
  min_stock_alert: number | null;
  price: number | null;            // ⚠️ CAMPO REAL: price (no 'last_cost')
  category: string | null;
  unit: string | null;
  description: string | null;
  created_at: string;
}

export interface InventoryTransaction {
  id: string;
  company_id: string | null;
  item_id: string | null;
  type: 'in' | 'out' | 'adjustment' | null;
  quantity: number;
  created_at: string;
}

// ════════════════════════════════════════════════════════════════════════════
// DOCUMENTOS Y FACTURACIÓN
// ════════════════════════════════════════════════════════════════════════════

export interface ClientDocument {
  id: string;
  company_id: string | null;
  contact_id: string | null;
  document_type: 'factura' | 'boleta' | 'nota_credito' | 'nota_debito'; // ⚠️ CAMPO REAL (no 'title')
  folio: number;
  amount_net: number | null;       // ⚠️ CAMPO REAL: amount_net (no 'net_amount')
  amount_tax: number | null;       // ⚠️ CAMPO REAL: amount_tax (no 'iva_amount')
  amount_total: number | null;
  status: 'issued' | 'paid' | 'canceled' | 'pending';
  issue_date: string | null;
  direction: 'incoming' | 'outgoing' | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface DocumentTemplate {
  id: string;
  company_id: string | null;
  name: string;
  document_type: string;
  design_html: string;
  config: Record<string, unknown> | null;
  is_active: boolean | null;
  created_at: string;
}

// ════════════════════════════════════════════════════════════════════════════
// FINANZAS
// ════════════════════════════════════════════════════════════════════════════

export interface FinancialSummary {
  id: string;
  company_id: string;
  report_type: string;
  period_label: string;
  summary_data: Record<string, unknown>;
  is_stale: boolean | null;
  last_updated: string;
  created_at: string;
}

// ════════════════════════════════════════════════════════════════════════════
// EQUIPO Y DIRECTORIO INTERNO
// ════════════════════════════════════════════════════════════════════════════

export interface Employee {
  id: string;
  company_id: string | null;
  full_name: string;
  position: string | null;
  contract_type: string | null;
  created_at: string;
}

export interface InternalDirectory {
  id: string;
  company_id: string | null;
  phone: string;
  name: string | null;
  role: 'ADMIN' | 'MMC' | 'PROVEEDOR' | 'CONTADOR' | 'CLIENTE' | 'PROSPECTO' | null;
  credit_limit: number | null;
  credit_limit_updated_at: string | null;
  created_at: string;
}

// ════════════════════════════════════════════════════════════════════════════
// IA Y MOTOR NEURAL
// ════════════════════════════════════════════════════════════════════════════

export interface AiPrompt {
  id: string;
  company_id: string | null;
  name: string;
  system_prompt: string;
  is_active: boolean | null;
  category: 'General' | 'Onboarding' | 'Ventas' | 'Soporte' | 'Finanzas' | 'Internal' | null;
  description: string | null;
  created_at: string;
}

export interface GeminiApiKey {
  id: string;
  api_key: string;
  is_active: boolean | null;
  last_used_at: string;
  error_count: number | null;
  description: string | null;
  created_at: string;
}

export interface AiApiTelemetry {
  id: string;
  company_id: string;
  user_id: string | null;
  model_name: string;
  tokens_input: number;
  tokens_output: number;
  cost_estimated: number | null;
  latency_ms: number | null;
  created_at: string;
}

// ════════════════════════════════════════════════════════════════════════════
// CONOCIMIENTO Y DOCUMENTOS VAULT
// ════════════════════════════════════════════════════════════════════════════

export interface ClientKnowledge {
  id: string;
  company_id: string | null;
  contact_id: string | null;
  file_name: string | null;
  content_summary: string | null;
  vector_embedding: unknown | null; // pgvector
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Faq {
  id: string;
  company_id: string | null;
  question: string;
  answer: string;
  is_active: boolean | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// ════════════════════════════════════════════════════════════════════════════
// RECORDATORIOS Y SOLICITUDES
// ════════════════════════════════════════════════════════════════════════════

export interface Reminder {
  id: string;
  company_id: string | null;
  contact_id: string | null;
  content: string;
  due_at: string | null;
  status: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ServiceRequest {
  id: string;
  company_id: string | null;
  contact_id: string | null;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface CompanyCompliance {
  id: string;
  company_id: string | null;
  task_name: string;
  due_date: string;
  status: string | null;
  legal_reference: string | null;
  created_at: string;
}

// ════════════════════════════════════════════════════════════════════════════
// REPORTES Y AUDITORÍA
// ════════════════════════════════════════════════════════════════════════════

export interface PreparedReport {
  id: string;
  company_id: string | null;
  report_type: string;
  media_id: string;                // Meta Media ID para Shadow PDF Cache
  checksum: string | null;
  expires_at: string;
  last_accessed_at: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  company_id: string | null;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}
