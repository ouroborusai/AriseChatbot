-- RESET COMPLETO: borra todo el esquema public y lo recrea limpio.
-- Esto elimina todas las tablas, funciones, triggers y publicaciones dentro de public.
-- No toca objetos en schemas de Supabase como auth, pg_catalog o information_schema.

DROP PUBLICATION IF EXISTS supabase_realtime;

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO public;

-- Si quieres recrear el esquema mínimo luego de limpiar, ejecuta el contenido de schema.sql.
