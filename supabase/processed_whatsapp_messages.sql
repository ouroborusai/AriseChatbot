-- Ejecutar una vez en Supabase SQL Editor si ya aplicaste schema.sql antes.
-- Evita procesar el mismo mensaje varias veces (reintentos de Meta → respuestas en bucle).

CREATE TABLE IF NOT EXISTS processed_whatsapp_messages (
    wa_message_id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processed_wa_created ON processed_whatsapp_messages (created_at DESC);

ALTER TABLE processed_whatsapp_messages ENABLE ROW LEVEL SECURITY;
