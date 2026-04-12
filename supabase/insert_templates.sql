-- Limpieza total de plantillas anteriores
DELETE FROM public.templates;

-- 1. Bienvenida Cliente
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, trigger, workflow, actions)
VALUES (
  'bienvenida_cliente',
  'Bienvenida Cliente',
  '¡Hola, {{nombre}}! 👋 Bienvenido a MTZ Consultores. ¿En qué podemos ayudarte hoy?',
  'bienvenida', 'cliente', true, 100, 'hola,start,menu', 'atencion',
  '[{"type":"button","id":"btn_documentos","title":"📄 Mis Documentos"},{"type":"button","id":"btn_tramites","title":"⚙️ Trámites"},{"type":"button","id":"btn_asesor","title":"📞 Hablar con Asesor"}]'
);

-- 2. Bienvenida Prospecto
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, trigger, workflow, actions)
VALUES (
  'bienvenida_prospecto',
  'Bienvenida Prospecto',
  '¡Hola! 👋 Bienvenido a MTZ Consultores. ¿En qué podemos ayudarte?',
  'bienvenida', 'prospecto', true, 100, 'hola,cotizar,informacion', 'atencion',
  '[{"type":"button","id":"btn_cotizar","title":"💼 Cotizar"},{"type":"button","id":"btn_servicios","title":"📝 Ver Servicios"},{"type":"button","id":"btn_asesor","title":"📞 Hablar con Asesor"}]'
);

-- 3. Derivación Asesor
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'derivacion_asesor',
  'Derivación a Asesor',
  'Entendido. Un asesor de MTZ se pondrá en contacto contigo a la brevedad.',
  'general', 'todos', true, 50, '', 'asesor',
  '[{"type":"button","id":"btn_gracias","title":"✅ Entendido"}]'
);

-- 4. Gracias
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, workflow, actions)
VALUES (
  'gracias',
  'Mensaje de Gracias',
  '¡Gracias por contactar MTZ Consultores!',
  'general', 'todos', true, 50, '', 'general',
  '[]'
);
