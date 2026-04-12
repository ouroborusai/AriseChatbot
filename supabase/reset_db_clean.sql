-- Purga y Reseteo Definitivo de AriseChatbot (Abril 2026)
-- Elimina basura de pruebas y deja solo a los clientes canónicos

BEGIN;

-- 1. Purgar todo el historial de conversaciones y mensajes basura
DELETE FROM messages;
DELETE FROM conversations;

-- 2. Eliminar de la base de datos TODOS los contactos (y sus conexiones con empresas)
-- EXCEPTO aquellos 15 clientes verificados que instalamos el día de origen.
DELETE FROM contacts
WHERE phone_number NOT IN (
  '56920137573', '56932992302', '56934322178', '56934416233',
  '56934477396', '56935564266', '56940256482', '56942755047',
  '56942850893', '56944132731', '56944609914', '56944940651',
  '56945341500', '56945384800', '56945916539'
);

COMMIT;

-- 3. Mensaje de victoria (Solo visible si todo sale bien)
SELECT '¡Base de datos limpiada con éxito! Has sido purificado.' as status;
