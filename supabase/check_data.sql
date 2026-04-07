-- Verificar qué hay en cada tabla
SELECT 'CONTACTS' as tabla, COUNT(*) as total FROM contacts WHERE segment = 'cliente'
UNION ALL
SELECT 'COMPANIES' as tabla, COUNT(*) as total FROM companies
UNION ALL
SELECT 'CONTACT_COMPANIES' as tabla, COUNT(*) as total FROM contact_companies;

-- Mostrar los contactos clientes
SELECT phone_number, name, segment FROM contacts WHERE segment = 'cliente';

-- Mostrar las empresas
SELECT id, legal_name FROM companies;