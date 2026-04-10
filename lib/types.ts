export type Contact = {
  id: string;
  phone_number: string;
  name?: string | null;
  email?: string | null;
  segment?: string | null;
  location?: string | null;
  last_message_at?: string;
  created_at?: string;
  updated_at?: string;
};

export type Company = {
  id: string;
  legal_name: string;
  rut?: string | null;
  segment?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

export type ContactCompany = {
  contact_id: string;
  company_id: string;
  role: string | null;
  is_primary: boolean;
  contacts?: { phone_number: string; name: string | null } | null;
};

export type CompanyLink = {
  company_id: string;
  is_primary: boolean;
  companies: { id: string; legal_name: string } | null;
};

export type CompanyDocument = {
  id: string;
  contact_id: string;
  company_id: string;
  title: string;
  description: string | null;
  file_name: string | null;
  file_url: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  file_type: string | null;
  created_at: string;
  contacts?: { phone_number: string; name: string | null };
  companies?: { id: string; legal_name: string } | null;
};

export type ClientDocument = {
  id: string;
  contact_id: string;
  company_id?: string | null;
  title: string;
  file_name?: string | null;
  file_url?: string | null;
  storage_bucket?: string | null;
  storage_path?: string | null;
  created_at: string;
};

export type MessageData = {
  phone: string;
  message: string;
  documentUrl?: string;
  documentName?: string;
};

export type ApiResult<T = void> = {
  success?: boolean;
  error?: string;
  data?: T;
};