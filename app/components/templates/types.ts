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

export type Action = {
  type: 'button' | 'list';
  id: string;
  title: string;
  description?: string;
  next_template_id?: string;
};

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

export type Template = {
  id: string;
  name: string;
  content: string;
  category: string;
  service_type?: string;
  trigger?: string;
  actions: Action[];
  is_active: boolean;
  priority: number;
  segment: 'cliente' | 'prospecto' | 'todos';
  workflow?: string;
  created_at?: string;
};

export type FlowNodeData = {
  template: Template;
  x: number;
  y: number;
  connections: { actionId: string; targetId: string }[];
};

export type Connection = {
  from: string;
  to: string;
  label: string;
  color: string;
};
