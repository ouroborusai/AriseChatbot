-- Ejecutar en Supabase SQL Editor DESPUÉS de processed_whatsapp_messages.sql
-- Claim atómico: evita condiciones de carrera cuando Meta envía varios POST en paralelo.

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
