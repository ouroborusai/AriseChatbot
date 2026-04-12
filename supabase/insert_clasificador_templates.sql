-- Plantillas para el clasificador de intenciones (SOLO SALUDOS)
-- Estas plantillas se cargan según la intención devuelta por Gemini

-- SALUDO: Menú principal de bienvenida
INSERT INTO public.templates (id, name, content, category, actions, is_active, priority, segment, workflow)
VALUES (
  'bienvenida_saludo',
  'Bienvenida - Saludo',
  '¡Hola, {{nombre}}! 👋 Soy el asistente virtual de MTZ Consultores Tributarios. Para poder guiarte de la mejor manera, por favor selecciona una de las siguientes opciones:',
  'saludo',
  '[]'::jsonb,
  true,
  100,
  'todos',
  'general'
)
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  actions = EXCLUDED.actions,
  updated_at = now();

-- DOCUMENTO: Solicitud de documentos
INSERT INTO public.templates (id, name, content, category, actions, is_active, priority, segment, workflow)
VALUES (
  'bienvenida_documento',
  'Bienvenida - Documento',
  '¡Claro! Puedo ayudarte con tus documentos tributarios. ¿Cuál necesitas?',
  'documento',
  '[]'::jsonb,
  true,
  100,
  'todos',
  'general'
)
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  actions = EXCLUDED.actions,
  updated_at = now();

-- SOPORTE: Atención a problemas
INSERT INTO public.templates (id, name, content, category, actions, is_active, priority, segment, workflow)
VALUES (
  'bienvenida_soporte',
  'Bienvenida - Soporte',
  'Entiendo que necesitas ayuda. ¿En qué puedo asistirte?',
  'soporte',
  '[]'::jsonb,
  true,
  100,
  'todos',
  'general'
)
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  actions = EXCLUDED.actions,
  updated_at = now();
