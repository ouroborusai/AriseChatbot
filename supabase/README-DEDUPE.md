# Solución: Mensajes Duplicados en WhatsApp Webhook

## Problema

Meta (WhatsApp) envía el mismo webhook múltiples veces cuando:
1. Hay latencia de red o timeout en la respuesta
2. El servidor no responde con 200 OK rápidamente
3. Hay reconexiones en la infraestructura de Meta

Esto causa que tu chatbot responda 2-3 veces al mismo mensaje.

## Solución Implementada

El código usa **deduplicación atómica** con una tabla en Supabase que registra los IDs de mensajes ya procesados.

### Flujo de deduplicación

```
1. Meta envía webhook con message.id = "wamid.XXX"
2. Webhook llama a claim_whatsapp_inbound("wamid.XXX")
3. Función SQL intenta INSERT con ON CONFLICT
4. Si INSERT funciona → mensaje nuevo → procesar
5. Si INSERT falla (duplicado) → omitir procesamiento
```

## Pasos para aplicar la solución

### 1. Ejecutar SQL en Supabase

Ve a **Supabase Dashboard → SQL Editor** y ejecuta:

```sql
-- Copia y pega el contenido de supabase/schema.sql completo
-- O solo esto si ya tienes las tablas conversations/messages:

CREATE TABLE IF NOT EXISTS processed_whatsapp_messages (
    wa_message_id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processed_wa_created ON processed_whatsapp_messages (created_at DESC);

ALTER TABLE processed_whatsapp_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON processed_whatsapp_messages;
CREATE POLICY "Service role full access"
    ON processed_whatsapp_messages
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

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

GRANT EXECUTE ON FUNCTION public.claim_whatsapp_inbound(text) TO service_role;

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

GRANT EXECUTE ON FUNCTION public.cleanup_old_dedupe_records(integer) TO service_role;
```

### 2. Verificar que funciona

Ejecuta este SQL para diagnosticar:

```sql
-- Verificar tabla y función
SELECT tablename FROM pg_tables WHERE tablename = 'processed_whatsapp_messages';
SELECT routine_name FROM information_schema.routines WHERE routine_name = 'claim_whatsapp_inbound';

-- Probar deduplicación
SELECT claim_whatsapp_inbound('test-123');  -- Debe retornar TRUE (nuevo)
SELECT claim_whatsapp_inbound('test-123');  -- Debe retornar FALSE (duplicado)
```

### 3. Verificar variables de entorno

En `.env.local` asegúrate de tener:

```bash
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role_aqui
```

**Importante:** Debe ser la `SERVICE_ROLE_KEY`, no la anon key.

### 4. Limpiar registros antiguos (opcional)

Para eliminar mensajes procesados hace más de 7 días:

```sql
SELECT cleanup_old_dedupe_records(7);
```

## Cómo verificar que está funcionando

### Logs esperados (mensaje nuevo)

```
[webhook] Recibido: { id: 'wamid.XXX', type: 'text', from: '52155...', textLen: 25 }
[webhook] Clave dedupe: wamid.XXX...
[webhook] Mensaje nuevo confirmado (RPC claim): wamid.XXX...
Message from 52155...: hola
```

### Logs esperados (mensaje duplicado)

```
[webhook] Recibido: { id: 'wamid.XXX', type: 'text', from: '52155...', textLen: 25 }
[webhook] Clave dedupe: wamid.XXX...
[webhook] DUPLICADO DETECTADO (RPC claim): wamid.XXX...
[webhook] Mensaje duplicado, omitiendo procesamiento
```

## Problemas comunes

### 1. "function claim_whatsapp_inbound does not exist"

La función no se creó en Supabase. Ejecuta el SQL del paso 1.

### 2. "permission denied for table processed_whatsapp_messages"

Estás usando la anon key en lugar de la service_role_key. Verifica `.env.local`.

### 3. "relation processed_whatsapp_messages does not exist"

La tabla no existe. Ejecuta el CREATE TABLE del paso 1.

### 4. Los duplicados persisten

Revisa los logs:
- Si ves `RPC claim_whatsapp_inbound falló` → la función no existe o RLS deniega
- Si ves `DUPLICADO DETECTADO` pero igual se envía → hay un bug en el flujo

## Limpieza automática (opcional avanzado)

Para limpiar automáticamente cada noche, usa un cron job o GitHub Actions:

```bash
# Ejemplo con curl a un endpoint API que llame a cleanup_old_dedupe_records
curl -X POST https://tu-app.vercel.app/api/cleanup-dedupe \
  -H "Authorization: Bearer tu_secret_internal"
```
