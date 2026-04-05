-- Migración: Agregar estados y etiquetas a conversaciones
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columna status (por defecto 'pending' para nuevos)
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
CHECK (status IN ('pending', 'in_progress', 'closed', 'escalated'));

-- 2. Agregar columna tags como array de texto
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 3. Agregar columna assigned_to para asignación a agentes
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);

-- 4. Índice para filtrar por estado
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

-- 5. Índice GIN para búsquedas en array de tags
CREATE INDEX IF NOT EXISTS idx_conversations_tags ON conversations USING GIN(tags);

-- 6. Actualizar RLS para permitir updates de authenticated en status/tags/assigned_to
DROP POLICY IF EXISTS "Authenticated users can update conversation metadata" ON conversations;
CREATE POLICY "Authenticated users can update conversation metadata"
    ON conversations
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 7. Trigger: auto-cerrar conversaciones inactivas >30 días (opcional, ejecutar como job)
-- Se puede llamar manualmente o con cron
CREATE OR REPLACE FUNCTION public.auto_close_stale_conversations(p_days_inactive integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    updated_count integer;
BEGIN
    UPDATE conversations
    SET status = 'closed'
    WHERE status IN ('pending', 'in_progress')
      AND updated_at < NOW() - (p_days_inactive || ' days')::interval;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;

REVOKE ALL ON FUNCTION public.auto_close_stale_conversations(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auto_close_stale_conversations(integer) TO service_role;

-- 8. Función para agregar tag (evita duplicados)
CREATE OR REPLACE FUNCTION public.add_conversation_tag(p_conversation_id uuid, p_tag text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE conversations
    SET tags = array_append(
        CASE WHEN tags IS NULL THEN '{}' ELSE tags END,
        lower(trim(p_tag))
    )
    WHERE id = p_conversation_id
      AND NOT (tags && ARRAY[lower(trim(p_tag))]); -- Solo si no existe ya
END;
$$;

REVOKE ALL ON FUNCTION public.add_conversation_tag(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_conversation_tag(uuid, text) TO service_role;

-- 9. Función para remover tag
CREATE OR REPLACE FUNCTION public.remove_conversation_tag(p_conversation_id uuid, p_tag text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE conversations
    SET tags = array_remove(tags, lower(trim(p_tag)))
    WHERE id = p_conversation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.remove_conversation_tag(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_conversation_tag(uuid, text) TO service_role;
