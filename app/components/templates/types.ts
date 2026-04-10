/**
 * Tipos para el sistema de plantillas de WhatsApp con condicionales
 * MTZ Consultores Tributarios
 */

export type ServiceType = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  colorHex: string;
  description: string;
};

/**
 * Campo sobre el cual se evalúa una condición
 */
export type ConditionField =
  | 'segment'           // Segmento del contacto (cliente, prospecto)
  | 'has_documents'     // Tiene documentos disponibles
  | 'has_company'       // Tiene empresa seleccionada
  | 'document_count'    // Cantidad de documentos
  | 'document_type'     // Tipo específico de documento (iva, renta, etc.)
  | 'company_count'     // Cantidad de empresas vinculadas
  | 'last_action'       // Última acción realizada
  | 'conversation_count' // Cantidad de mensajes en conversación
  | 'custom';           // Condición personalizada (evaluada por función externa)

/**
 * Operadores disponibles para evaluar condiciones
 */
export type ConditionOperator =
  | 'equals'            // Igual a
  | 'not_equals'        // Diferente de
  | 'greater_than'      // Mayor que
  | 'less_than'         // Menor que
  | 'greater_or_equal'  // Mayor o igual
  | 'less_or_equal'     // Menor o igual
  | 'includes'          // Incluye (para arrays o strings)
  | 'not_includes'      // No incluye
  | 'exists'            // El campo existe (valor booleano)
  | 'not_exists';       // El campo no existe

/**
 * Condición individual para evaluar en una acción
 */
export interface Condition {
  field: ConditionField;
  operator: ConditionOperator;
  value?: string | number | boolean | string[];
  /** Función personalizada para evaluación compleja (solo en runtime) */
  customFn?: (context: TemplateContext) => boolean;
}

/**
 * Acción a tomar cuando no se cumplen las condiciones
 */
export type ElseActionType = 'show_message' | 'redirect' | 'hide_button';

export interface ElseAction {
  type: ElseActionType;
  /** Mensaje a mostrar cuando type='show_message' */
  message?: string;
  /** ID del template al que redirigir cuando type='redirect' */
  redirect_template_id?: string;
  /** Ocultar el botón completamente cuando type='hide_button' (default) */
};

/**
 * Combinación lógica para múltiples condiciones
 */
export type ConditionLogic = 'AND' | 'OR';

/**
 * Condiciones aplicadas a una acción
 */
export interface ActionConditions {
  /** Condiciones que deben cumplirse para mostrar la acción */
  show_if?: Condition[];
  /** Lógica para combinar múltiples condiciones (default: AND) */
  logic?: ConditionLogic;
  /** Acción alternativa cuando no se cumplen las condiciones */
  else_action?: ElseAction;
}

/**
 * Acción dentro de una plantilla (botón o lista)
 */
export interface Action {
  type: 'button' | 'list';
  id: string;
  title: string;
  description?: string;
  next_template_id?: string;
  /** Condiciones para mostrar esta acción */
  conditions?: ActionConditions;
}

export type Workflow = {
  id: string;
  name: string;
  description: string;
  icon: string;
  colorHex: string;
};

export const WORKFLOWS: Workflow[] = [
  { id: 'atencion', name: 'Atención Inicial', description: 'Bienvenida y clasificación', icon: '👋', colorHex: '#22c55e' },
  { id: 'documentos', name: 'Gestión Docs', description: 'Solicitud y entrega de documentos', icon: '📄', colorHex: '#f97316' },
  { id: 'iva', name: 'IVA', description: 'Declaraciones y trámites IVA', icon: '🧾', colorHex: '#eab308' },
  { id: 'renta', name: 'Renta', description: 'Declaración anual de renta', icon: '📊', colorHex: '#8b5cf6' },
  { id: 'nomina', name: 'Nómina', description: 'Liquidaciones y contratos', icon: '👥', colorHex: '#ec4899' },
  { id: 'cobranza', name: 'Cobranza', description: 'Recordatorios y cobros', icon: '💳', colorHex: '#ef4444' },
  { id: 'asesor', name: 'Derivación', description: 'Derivación a asesor humano', icon: '📞', colorHex: '#6366f1' },
  { id: 'general', name: 'General', description: 'Mensajes generales', icon: '💬', colorHex: '#64748b' },
];

/**
 * Contexto requerido para que un template sea válido
 */
export interface RequiredContext {
  /** Requiere que el contacto tenga empresa vinculada */
  has_company?: boolean;
  /** Requiere que el contacto tenga documentos */
  has_documents?: boolean;
  /** Cantidad mínima de documentos requeridos */
  min_document_count?: number;
  /** Tipo de documento específico requerido */
  required_document_type?: string;
  /** Requiere segmento específico */
  required_segment?: 'cliente' | 'prospecto';
}

/**
 * Reglas aplicadas a nivel de template
 */
export interface TemplateRule {
  /** Contexto requerido para mostrar este template */
  required_context?: RequiredContext;
  /** Template alternativo cuando no se cumplen las reglas */
  fallback_template_id?: string;
  /** Máximo de intentos antes de fallback (para evitar loops) */
  max_redirect_attempts?: number;
}

/**
 * Tipo de segmento para filtrado de templates
 */
export type TemplateSegment = 'cliente' | 'prospecto' | 'todos';

/**
 * Plantilla de mensaje WhatsApp
 */
export interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
  service_type?: string;
  trigger?: string;
  actions: Action[];
  is_active: boolean;
  priority: number;
  segment: TemplateSegment;
  workflow?: string;
  /** Reglas para mostrar este template */
  rules?: TemplateRule;
  created_at?: string;
  updated_at?: string;
}

/**
 * Datos de un nodo en el editor visual de flujos
 */
export interface FlowNodeData {
  template: Template;
  x: number;
  y: number;
  connections: { actionId: string; targetId: string }[];
}

/**
 * Conexión entre nodos en el editor de flujos
 */
export interface Connection {
  from: string;
  to: string;
  label: string;
  color: string;
}

/**
 * Contexto completo para evaluación de condiciones
 * Se construye en runtime con datos de la conversación actual
 */
export interface TemplateContext {
  /** Información del contacto */
  contact: {
    id: string;
    name?: string | null;
    phone_number?: string;
    segment?: string | null;
  };
  /** Empresas vinculadas al contacto */
  companies: Array<{
    id: string;
    legal_name: string;
    tax_id?: string;
  }>;
  /** Empresa activa en la conversación actual */
  activeCompanyId: string | null;
  /** Documentos disponibles para el contacto */
  documents: Array<{
    id: string;
    title: string;
    file_name?: string | null;
    document_type?: string;
    created_at: string;
  }>;
  /** Última acción realizada (ID del botón) */
  lastAction: string | null;
  /** Historial de acciones en la conversación actual */
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
  }>;
  /** Contador de redirecciones (para evitar loops infinitos) */
  redirectCount: number;
  /** Variables personalizadas para condiciones custom */
  customVariables?: Record<string, any>;
}
