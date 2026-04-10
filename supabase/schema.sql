-- SCHEMA LIMPIO - AriseChatbot
-- Sin RLS, solo tablas necesarias

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- CONTACTS
CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL UNIQUE,
  name text,
  tags text[] DEFAULT '{}'::text[],
  notes text,
  is_blocked boolean DEFAULT false,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  email text,
  segment text,
  location text,
  purchase_history jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- COMPANIES (empresas / razones sociales)
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name text NOT NULL,
  rut text,
  segment text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RELACIÓN N a N: un contacto (número WhatsApp) puede tener varias empresas,
-- y una empresa puede tener varios contactos (varios números WhatsApp).
CREATE TABLE IF NOT EXISTS public.contact_companies (
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role text, -- p.ej. "dueño", "rrhh", "contabilidad"
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (contact_id, company_id)
);

-- CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL UNIQUE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  active_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  is_open boolean NOT NULL DEFAULT true,
  chatbot_enabled boolean NOT NULL DEFAULT true,
  first_response_at timestamptz,
  last_response_at timestamptz,
  message_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- DOCUMENTOS DE CLIENTES
CREATE TABLE IF NOT EXISTS public.client_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  file_name text,
  file_url text,
  storage_bucket text,
  storage_path text,
  file_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- SOLICITUDES Y TICKETS
CREATE TABLE IF NOT EXISTS public.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_code text NOT NULL UNIQUE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  request_type text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  result_url text,
  assigned_to text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_service_requests_contact_id ON public.service_requests(contact_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_conversation_id ON public.service_requests(conversation_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_client_documents_contact_id ON public.client_documents(contact_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_company_id ON public.client_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_conversations_phone ON public.conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_companies_legal_name ON public.companies(legal_name);
CREATE INDEX IF NOT EXISTS idx_contact_companies_company_id ON public.contact_companies(company_id);

-- TRIGGERS para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_contacts_updated_at ON public.contacts;
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS DESHABILITADO (DESARROLLO)
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests DISABLE ROW LEVEL SECURITY;

-- PLANTILLAS DE MENSAJES
CREATE TABLE IF NOT EXISTS public.templates (
  id text PRIMARY KEY,
  name text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  service_type text,
  trigger text,
  actions jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 50,
  segment text NOT NULL DEFAULT 'todos',
  workflow text DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_templates_category ON public.templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_priority ON public.templates(priority);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON public.templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_workflow ON public.templates(workflow);
CREATE TABLE IF NOT EXISTS public.client_access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(phone_number, code)
);

CREATE INDEX IF NOT EXISTS idx_client_access_codes_phone ON public.client_access_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_client_access_codes_code ON public.client_access_codes(code);
