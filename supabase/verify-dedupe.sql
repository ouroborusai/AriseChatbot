-- Ejecutar en Supabase SQL Editor para verificar deduplicación
-- Esto diagnostica por qué los mensajes se procesan duplicados

-- 1. Verificar si la tabla existe
SELECT
    'TABLA' as tipo,
    tablename as nombre,
    'EXISTS' as estado
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'processed_whatsapp_messages';

-- 2. Verificar si la función existe
SELECT
    'FUNCION' as tipo,
    routine_name as nombre,
    'EXISTS' as estado
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'claim_whatsapp_inbound';

-- 3. Probar la función directamente
SELECT public.claim_whatsapp_inbound('test-message-id-12345') as resultado;

-- 4. Verificar si el test se insertó
SELECT * FROM processed_whatsapp_messages
WHERE wa_message_id = 'test-message-id-12345';

-- 5. Probar segunda llamada (debería retornar false = duplicado)
SELECT public.claim_whatsapp_inbound('test-message-id-12345') as es_nuevo_o_duplicado;
-- TRUE = mensaje nuevo, FALSE = duplicado

-- 6. Verificar políticas RLS de la tabla
SELECT
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'processed_whatsapp_messages';

-- 7. Contar registros en la tabla
SELECT COUNT(*) as total_mensajes_procesados
FROM processed_whatsapp_messages;

-- 8. Ver últimos mensajes procesados
SELECT wa_message_id, created_at
FROM processed_whatsapp_messages
ORDER BY created_at DESC
LIMIT 10;
