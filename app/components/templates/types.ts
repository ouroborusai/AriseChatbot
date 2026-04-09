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
