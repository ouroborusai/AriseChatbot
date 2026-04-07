-- Insertar clientes con sus empresas en Supabase
-- Ejecutar en SQL Editor

-- 1. Insertar contactos como clientes
INSERT INTO contacts (phone_number, name, segment, last_message_at) VALUES
('56920137573', 'DIAMOND LASH IQUIQUE SPA', 'cliente', NOW()),
('56932992302', 'MINIMARKET BUENOS VECINOS SPA', 'cliente', NOW()),
('56934322178', 'RODRIGO RAUL GUILLEN POLANCO', 'cliente', NOW()),
('56934416233', 'B055 FISH STORE SPA', 'cliente', NOW()),
('56934477396', 'NEURO FIT CENTRO DE INTERVENCIÓN INTEGRAL Y CAPACITACIÓN SPA', 'cliente', NOW()),
('56935564266', 'COMERCIAL TODOMADERAS LIMITADA', 'cliente', NOW()),
('56940256482', 'JOSE ANTONIO LEIVA FLORES', 'cliente', NOW()),
('56942755047', 'LOGÍSTICA Y TRANSPORTE DEL NORTE SPA', 'cliente', NOW()),
('56942850893', 'APOCALYPSIS AGENCY SPA', 'cliente', NOW()),
('56944132731', 'SALUDNET SPA', 'cliente', NOW()),
('56944609914', 'CYA SPA', 'cliente', NOW()),
('56944940651', 'RODRIGO WOKROLL', 'cliente', NOW()),
('56945341500', 'PROYECTOS Y SERVICIOS G Y B LIMITADA', 'cliente', NOW()),
('56945384800', 'KINESIÓLOGOS DEL NORTE SPA', 'cliente', NOW()),
('56945916539', 'INVERSIONES ROJAS Y COMPAÑÍA LIMITADA', 'cliente', NOW())
ON CONFLICT (phone_number) DO UPDATE SET 
  name = EXCLUDED.name,
  segment = 'cliente';

-- 2. Crear empresas para cada cliente
INSERT INTO companies (legal_name) VALUES
('DIAMOND LASH IQUIQUE SPA'),
('MINIMARKET BUENOS VECINOS SPA'),
('RODRIGO RAUL GUILLEN POLANCO'),
('B055 FISH STORE SPA'),
('NEURO FIT CENTRO DE INTERVENCIÓN INTEGRAL Y CAPACITACIÓN SPA'),
('COMERCIAL TODOMADERAS LIMITADA'),
('JOSE ANTONIO LEIVA FLORES'),
('LOGÍSTICA Y TRANSPORTE DEL NORTE SPA'),
('APOCALYPSIS AGENCY SPA'),
('SALUDNET SPA'),
('CYA SPA'),
('RODRIGO WOKROLL'),
('PROYECTOS Y SERVICIOS G Y B LIMITADA'),
('KINESIÓLOGOS DEL NORTE SPA'),
('INVERSIONES ROJAS Y COMPAÑÍA LIMITADA')
ON CONFLICT (legal_name) DO NOTHING;

-- 3. Vincular contactos con empresas
INSERT INTO contact_companies (contact_id, company_id, is_primary)
SELECT c.id, co.id, true
FROM contacts c
CROSS JOIN companies co
WHERE c.segment = 'cliente'
AND c.name = co.legal_name
AND NOT EXISTS (
  SELECT 1 FROM contact_companies cc 
  WHERE cc.contact_id = c.id AND cc.company_id = co.id
);

-- Verificar
SELECT c.phone_number, c.name, c.segment, co.legal_name as empresa
FROM contacts c
LEFT JOIN contact_companies cc ON c.id = cc.contact_id
LEFT JOIN companies co ON cc.company_id = co.id
WHERE c.segment = 'cliente'
ORDER BY c.name;