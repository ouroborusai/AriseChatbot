-- Ejecutar una vez en Supabase SQL Editor si ya aplicaste schema.sql antes.
-- Evita procesar el mismo mensaje varias veces (reintentos de Meta → respuestas en bucle).

CREATE TABLE IF NOT EXISTS processed_whatsapp_messages (
    wa_message_id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processed_wa_created ON processed_whatsapp_messages (created_at DESC);

ALTER TABLE processed_whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Claim atómico (ejecutar también claim_whatsapp_inbound.sql o copiar función aquí)
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
