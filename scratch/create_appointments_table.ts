import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTable() {
  console.log('🚀 Creando tabla appointments...');
  
  // Usamos rpc para ejecutar SQL o simplemente intentamos una inserción para ver si existe
  // Como no hay rpc genérico de SQL por seguridad, lo haremos vía un script que el usuario pueda copiar
  // o intentando crearla si tenemos permisos (usualmente vía migrations).
  
  console.log('⚠️  Nota: El entorno no permite psql directo. Por favor, ejecuta este SQL en el SQL Editor de Supabase:');
  console.log(`
    CREATE TABLE IF NOT EXISTS public.appointments (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      contact_id uuid NOT NULL,
      company_id uuid,
      appointment_date date NOT NULL,
      appointment_time time without time zone NOT NULL,
      status text DEFAULT 'pending',
      notes text,
      created_at timestamp with time zone DEFAULT now(),
      CONSTRAINT appointments_pkey PRIMARY KEY (id),
      CONSTRAINT appointments_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id)
    );
    
    -- Habilitar RLS
    ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
    
    -- Política simple para lectura
    CREATE POLICY "Allow service role full access" ON public.appointments
    FOR ALL USING (true) WITH CHECK (true);
  `);
}

createTable();
