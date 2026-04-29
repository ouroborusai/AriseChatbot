-- IMPLEMENTACIÓN DE AUTOMATIZACIÓN PDF (Shadow Pre-generation)
-- Arise Business OS Diamond v10.2

-- 1. Tabla de Caché de Reportes Preparados
CREATE TABLE IF NOT EXISTS public.prepared_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,
    media_id TEXT NOT NULL,
    checksum TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Indexar para búsquedas instantáneas
CREATE INDEX IF NOT EXISTS idx_prepared_reports_lookup ON public.prepared_reports (company_id, report_type);

-- 2. Función Trigger para Pre-generación
CREATE OR REPLACE FUNCTION public.fn_trigger_pdf_pregeneration()
RETURNS TRIGGER AS $$
DECLARE
    api_url TEXT;
    master_key TEXT;
BEGIN
    -- Configuración (Ajustar según entorno)
    api_url := 'https://' || (SELECT settings->>'app_domain' FROM public.companies WHERE id = NEW.company_id) || '/api/pdf';
    master_key := current_setting('app.arise_master_key', true);

    -- Invocación asíncrona a la Edge Function o API interna
    -- Nota: Usamos pg_net si está disponible, o simplemente registramos la tarea para un worker
    INSERT INTO public.audit_logs (company_id, action, new_data)
    VALUES (NEW.company_id, 'PENDING_PDF_PREGEN', jsonb_build_object(
        'report_type', NEW.report_type,
        'summary_id', NEW.id,
        'checksum', md5(NEW.summary_data::text)
    ));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Vinculación del Trigger
DROP TRIGGER IF EXISTS tr_pregenerate_pdf ON public.financial_summaries;
CREATE TRIGGER tr_pregenerate_pdf
AFTER INSERT OR UPDATE ON public.financial_summaries
FOR EACH ROW EXECUTE FUNCTION public.fn_trigger_pdf_pregeneration();
