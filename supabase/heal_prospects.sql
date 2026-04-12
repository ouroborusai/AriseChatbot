-- Curación de Base de Datos (Reparación de Bug de Prospectos)
-- Fecha: 12 de Abril 2026
-- Objetivo: Alinear la DB a la ley SSOT ('prospecto' vs 'prospect')

BEGIN;

UPDATE contacts
SET segment = 'prospecto'
WHERE segment = 'prospect';

COMMIT;
