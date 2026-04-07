-- Vincular contactos con empresas
INSERT INTO contact_companies (contact_id, company_id, is_primary)
SELECT c.id, co.id, true
FROM contacts c
JOIN companies co ON c.name = co.legal_name
WHERE c.segment = 'cliente'
AND NOT EXISTS (
  SELECT 1 FROM contact_companies cc 
  WHERE cc.contact_id = c.id AND cc.company_id = co.id
);

-- Verificar la vinculación
SELECT c.phone_number, c.name as contacto, co.legal_name as empresa
FROM contacts c
JOIN contact_companies cc ON c.id = cc.contact_id
JOIN companies co ON cc.company_id = co.id
WHERE c.segment = 'cliente';