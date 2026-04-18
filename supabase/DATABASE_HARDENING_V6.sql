-- 1. ASEGURAR COLUMNAS DE EMPRESA (Multi-tenancy Base)
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.ai_api_telemetry ADD COLUMN IF NOT EXISTS company_id UUID;

-- 2. NORMALIZACIÓN DE VENTAS (Módulo CRM -> Inventory)
CREATE TABLE IF NOT EXISTS public.sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID, -- No ponemos FK a auth.users aún para evitar bloqueos de permisos, solo la columna
    contact_id UUID REFERENCES public.contacts(id),
    document_id UUID REFERENCES public.client_documents(id),
    total_amount NUMERIC(15,2),
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. VÍNCULO FINANZAS-INVENTARIO (Audit Trail)
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS document_id UUID;
ALTER TABLE public.inventory_transactions 
ADD CONSTRAINT fk_transaction_document 
FOREIGN KEY (document_id) REFERENCES public.client_documents(id);

-- 4. ÍNDICES DE PERFORMANCE (Ahora con company_id existente)
CREATE INDEX IF NOT EXISTS idx_telemetry_company_latency ON public.ai_api_telemetry (company_id, latency_ms);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON public.contacts (company_id);

-- 5. POLÍTICA DE LIMPIEZA
-- Verifica si pg_cron está activo
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule('cache-cleanup', '0 3 * * *', 'DELETE FROM public.ai_semantic_cache WHERE last_used_at < now() - interval ''90 days''');
  END IF;
END $$;
