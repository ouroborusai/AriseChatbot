-- SCRIPT DE CORRECCIÓN: Relación Appointments <-> Companies
-- Este script soluciona el error PGRST200 (Bad Request) al consultar citas.

-- 1. Asegurar que la columna existe (si no existe)
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

-- 2. Si la columna ya existía pero faltaba la llave foránea, la añadimos explícitamente:
-- (Nota: El comando de arriba ya intenta crear la relación si añade la columna. 
-- Si la columna ya estaba pero sin relación, usamos el siguiente bloque)

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'appointments_company_id_fkey'
    ) THEN
        ALTER TABLE public.appointments 
        ADD CONSTRAINT appointments_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Habilitar tiempo real si no estaba activado para esta tabla
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
