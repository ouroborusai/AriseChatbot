-- UPDATE para crear/actualizar la plantilla menu_principal_cliente
-- Esto configurará el menú principal con los 3 botones y su navegación

INSERT INTO public.templates (id, name, content, actions, category, is_active, priority, segment, workflow)
VALUES (
  'menu_principal_cliente',
  'Menú Principal Cliente',
  '¡Hola, {{nombre}}! 👋 Soy el asistente virtual de MTZ Consultores Tributarios. Para poder guiarte de la mejor manera, por favor selecciona una de las siguientes opciones:',
  '[
    {
      "type": "button",
      "id": "btn_mis_documentos",
      "title": "📄 Mis Documentos",
      "next_template_id": "menu_documentos"
    },
    {
      "type": "button",
      "id": "btn_mis_datos",
      "title": "👤 Mis Datos",
      "next_template_id": "menu_mis_datos"
    },
    {
      "type": "button",
      "id": "btn_tramites",
      "title": "⚙️ Trámites",
      "next_template_id": "menu_tramites"
    }
  ]'::jsonb,
  'bienvenida',
  true,
  100,
  'cliente',
  'general'
)
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  actions = EXCLUDED.actions,
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active,
  priority = EXCLUDED.priority,
  segment = EXCLUDED.segment,
  workflow = EXCLUDED.workflow,
  updated_at = now();