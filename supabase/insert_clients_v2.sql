-- Ejecutar en partes si hay error

-- 1. Primero verificar que las tablas existen y la estructura
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'contacts' AND column_name IN ('phone_number', 'name', 'segment');

SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'companies' AND column_name = 'legal_name';

-- 2. Insertar clientes uno por uno (si hay conflicto, simple INSERT)
INSERT INTO contacts (phone_number, name, segment, last_message_at) VALUES
('56920137573', 'DIAMOND LASH IQUIQUE SPA', 'cliente', NOW());

-- Si ya existe, actualizar
UPDATE contacts SET name = 'DIAMOND LASH IQUIQUE SPA', segment = 'cliente' 
WHERE phone_number = '56920137573';

-- 3. Verificar existentes
SELECT phone_number, name, segment FROM contacts WHERE segment = 'cliente';