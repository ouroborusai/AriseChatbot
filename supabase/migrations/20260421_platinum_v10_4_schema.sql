-- LOOP BUSINESS OS - Platinum v10.4 Schema
-- Consolidación de 19 tablas principales y Blindaje RLS

-- 1. Definición de Tablas (Extraídas vía MCP)
-- [Omitido por brevedad en este log, pero contiene CREATE TABLE para las 19 tablas]

-- 2. Función de Autorización Core
CREATE OR REPLACE FUNCTION public.check_user_access(comp_id uuid)
RETURNS boolean AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.user_company_access 
        WHERE user_id = auth.uid() AND company_id = comp_id
    ) THEN
        RETURN TRUE;
    END IF;

    IF (auth.jwt()->>'email' = 'ouroborusai@gmail.com') THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Blindaje de Seguridad (RLS)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_company_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_api_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gemini_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_knowledge ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Aislamiento de Datos (Multi-tenancy)
DROP POLICY IF EXISTS "Tenant Isolation" ON public.contacts;
CREATE POLICY "Tenant Isolation" ON public.contacts FOR ALL USING (check_user_access(company_id));

DROP POLICY IF EXISTS "Tenant Isolation" ON public.inventory_items;
CREATE POLICY "Tenant Isolation" ON public.inventory_items FOR ALL USING (check_user_access(company_id));

DROP POLICY IF EXISTS "Tenant Isolation" ON public.inventory_transactions;
CREATE POLICY "Tenant Isolation" ON public.inventory_transactions FOR ALL USING (check_user_access(company_id));

DROP POLICY IF EXISTS "Only SuperAdmin can manage API keys" ON public.gemini_api_keys;
CREATE POLICY "Only SuperAdmin can manage API keys" ON public.gemini_api_keys 
FOR ALL USING (auth.jwt()->>'email' = 'ouroborusai@gmail.com');

-- [Siguen el resto de tablas con check_user_access...]
