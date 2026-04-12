-- Plantillas para Agente MTZ - WhatsApp Chatbot (SOLO SALUDOS)
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- BIENVENIDA Y MENÚS PRINCIPALES
-- ============================================

-- Menú Principal Cliente
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, trigger, workflow, actions)
VALUES (
  'menu_principal_cliente',
  '1. Menú Principal Cliente',
  '¡Hola, {{nombre}}! 👋 Soy el asistente virtual de MTZ Consultores Tributarios. Para poder guiarte de la mejor manera, por favor selecciona una de las siguientes opciones:',
  'bienvenida', 'cliente', true, 100, 'hola,hola!,buenos días,buenas,bienvenido,start,menu', 'atencion',
  '[]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();

-- Bienvenida Prospecto
INSERT INTO public.templates (id, name, content, category, segment, is_active, priority, trigger, workflow, actions)
VALUES (
  'bienvenida_prospecto',
  '1. Saludo Prospecto',
  '¡Hola! 👋 Bienvenido a MTZ Consultores. ¿En qué podemos ayudarte?',
  'bienvenida', 'prospecto', true, 1, 'hola,hola!,buenos días,buenas', 'atencion',
  '[]'
) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, actions = EXCLUDED.actions, updated_at = now();
