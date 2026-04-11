-- TEMPORAL: Deshabilitar RLS para debugging (SOLO DESARROLLO, NO PRODUCCIÓN)
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Confirmar
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('contacts', 'conversations', 'messages');
