-- Ejecutar en Supabase SQL Editor
-- Esto configura la deduplicación para evitar mensajes repetidos del webhook

-- 1. Tabla de mensajes procesados (deduplicación)
CREATE TABLE IF NOT EXISTS processed_whatsapp_messages (
    wa_message_id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processed_wa_created ON processed_whatsapp_messages (created_at DESC);

-- 2. Habilitar RLS y política para service_role
ALTER TABLE processed_whatsapp_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON processed_whatsapp_messages;
CREATE POLICY "Service role full access"
    ON processed_whatsapp_messages
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 3. Función claim atómico (evita race conditions)
CREATE OR REPLACE FUNCTION public.claim_whatsapp_inbound(p_wa_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ins AS (
    INSERT INTO public.processed_whatsapp_messages (wa_message_id)
    VALUES (p_wa_id)
    ON CONFLICT (wa_message_id) DO NOTHING
    RETURNING 1
  )
  SELECT EXISTS (SELECT 1 FROM ins);
$$;

REVOKE ALL ON FUNCTION public.claim_whatsapp_inbound(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_whatsapp_inbound(text) TO service_role;

-- 4. Función de limpieza (opcional, elimina registros > 7 días)
CREATE OR REPLACE FUNCTION public.cleanup_old_dedupe_records(p_days_old integer DEFAULT 7)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM processed_whatsapp_messages
    WHERE created_at < NOW() - (p_days_old || ' days')::interval;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_old_dedupe_records(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_old_dedupe_records(integer) TO service_role;

-- 5. Verificación rápida (deberías ver 1 fila en cada consulta)
SELECT 'Tabla existe' as estado WHERE EXISTS (SELECT 1 FROM processed_whatsapp_messages LIMIT 1) OR TRUE;
SELECT 'Función claim_whatsapp_inbound existe' as estado WHERE EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'claim_whatsapp_inbound');
