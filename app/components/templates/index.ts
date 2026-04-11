import { Template } from './types';

export * from './types';
export * from './config';
export * from './helpers';
export { default as TemplateDetailPanel } from './TemplateDetailPanel';
export { default as TemplateEditor } from './TemplateEditor';
export { default as FlowMap } from './FlowMap';
export { default as FlowCanvas } from './FlowCanvas';

/**
 * NOTA: Las plantillas ahora están definidas en la base de datos (tabla public.templates)
 * El sistema las carga dinámicamente desde Supabase.
 * 
 * Para editar las plantillas, usa el SQL en: supabase/insert_templates.sql
 * o el panel de administración en /dashboard/templates
 */