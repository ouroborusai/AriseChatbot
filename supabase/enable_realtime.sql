-- Habilitar Realtime para la tabla messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE contacts;

-- Verificar que esté habilitado
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';