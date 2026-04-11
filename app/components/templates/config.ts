import { Category, ServiceType, Workflow } from './types';

export const CATEGORIES: Category[] = [
  { id: 'bienvenida', name: 'Bienvenida', icon: '👋', color: 'bg-green-600', colorHex: '#16a34a', description: 'Saludos y primer contacto' },
  { id: 'menu', name: 'Menú Principal', icon: '📋', color: 'bg-blue-600', colorHex: '#2563eb', description: 'Opciones del menú interactivo' },
  { id: 'servicios', name: 'Servicios', icon: '💼', color: 'bg-indigo-600', colorHex: '#4f46e5', description: 'Información de servicios' },
  { id: 'documentos', name: 'Documentos', icon: '📄', color: 'bg-orange-600', colorHex: '#ea580c', description: 'Solicitud y envío de docs' },
  { id: 'tramites', name: 'Trámites', icon: '🏢', color: 'bg-purple-600', colorHex: '#9333ea', description: 'Trámites específicos' },
  { id: 'cobranza', name: 'Cobranza', icon: '💳', color: 'bg-red-600', colorHex: '#dc2626', description: 'Recordatorios y cobros' },
  { id: 'general', name: 'General', icon: '💬', color: 'bg-slate-600', colorHex: '#475569', description: 'Mensajes generales' },
];

export const SERVICE_TYPES: ServiceType[] = [
  { id: 'inicio_actividades', name: 'Inicio de Actividades', description: 'Altas, cambios y bajas', icon: '🚀' },
  { id: 'iva', name: 'IVA', description: 'Declaraciones mensuales', icon: '🧾' },
  { id: 'renta', name: 'Renta', description: 'Declaración anual', icon: '📊' },
  { id: 'contabilidad', name: 'Contabilidad', description: 'Balances, estados', icon: '📈' },
  { id: 'nomina', name: 'Nómina', description: 'Liquidaciones, contratos', icon: '👥' },
  { id: 'regularizacion', name: 'Regularización', description: 'Rectificaciones', icon: '✅' },
];

export const WORKFLOWS: Workflow[] = [
  { id: 'general', name: 'General', icon: '💬' },
  { id: 'atencion', name: 'Atención', icon: '👋' },
  { id: 'documentos', name: 'Documentos', icon: '📄' },
  { id: 'iva', name: 'IVA', icon: '🧾' },
  { id: 'renta', name: 'Renta', icon: '📊' },
  { id: 'nomina', name: 'Nómina', icon: '👥' },
  { id: 'cobranza', name: 'Cobranza', icon: '💳' },
  { id: 'asesor', name: 'Asesor', icon: '📞' },
];
