-- Agregar columna chatbot_enabled a conversations
-- Ejecutar en Supabase SQL Editor

ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS chatbot_enabled boolean NOT NULL DEFAULT true;

-- Verificar que se agregó correctamente
SELECT id, phone_number, chatbot_enabled FROM public.conversations LIMIT 5;