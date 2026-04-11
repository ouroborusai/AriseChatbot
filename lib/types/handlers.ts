/**
 * Tipos para el Motor de Handlers (Lógica)
 */
import { Contact, Company } from './domain';

export interface HandlerContext {
  phoneNumber: string;
  text?: string;
  interactive?: string;
  contact: Contact;
  conversationId: string;
  companies: Company[];
  activeCompanyId: string | null;
}

export interface HandlerResponse {
  handled: boolean;
  response?: string;
  shouldContinue?: boolean;
}

export interface ApiResult<T = void> {
  success?: boolean;
  error?: string;
  data?: T;
}

// IDs de botones para navegación
export const BUTTON_IDS = {
  // Clasificación
  CLIENT_YES: 'btn_is_client_yes',
  CLIENT_NO: 'btn_is_client_no',
  
  // Menú cliente
  EXISTING_DOCS: 'btn_existing_docs',
  EXISTING_REQUEST_DOC: 'btn_existing_request_doc',
  EXISTING_TAX: 'btn_existing_tax',
  EXISTING_HUMAN: 'btn_existing_human',
  CHECK_REQUEST_STATUS: 'btn_check_request_status',
  
  // Menú prospecto
  NEW_QUOTE: 'btn_new_quote',
  NEW_INFO: 'btn_new_info',
  NEW_HUMAN: 'btn_new_human',
  
  // Documentos categorías
  DOC_CAT_TAX: 'btn_doc_cat_tax',
  DOC_CAT_ACCOUNTING: 'btn_doc_cat_accounting',
  DOC_CAT_PAYROLL_CONTRACTS: 'btn_doc_cat_payroll_contracts',
  
  // Documentos específicos
  DOC_IVA: 'btn_doc_iva',
  DOC_RENTA: 'btn_doc_renta',
  DOC_BALANCE: 'btn_doc_balance',
  DOC_LIQUIDACIONES: 'btn_doc_liquidaciones',
  DOC_CONTRATOS: 'btn_doc_contratos',
  
  // Empresa
  COMPANY_PREFIX: 'company_',
  COMPANY_FREE_TEXT: 'btn_company_free_text',
  SELECT_COMPANY: 'btn_select_company',
} as const;

export type ButtonId = typeof BUTTON_IDS[keyof typeof BUTTON_IDS];
