import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

/**
 * ARISE META STATUS ORCHESTRATOR v10.4
 * Sanitiza variables y aplica fallback DB -> ENV para asegurar visibilidad de activos.
 */
const cleanEnvVar = (val?: string) => val?.replace(/["\r\n\\]/g, '').trim() || '';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  try {
    // 1. Autorización de Usuario
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 2. Consulta de Empresa (Tenant)
    const { data: company } = await supabase
      .from('companies')
      .select('settings')
      .single();

    const dbConfig = company?.settings?.whatsapp || {};

    // 3. Fallback Polimórfico (DB -> ENV)
    // LM Protocol: Si no está en DB, usar variables de entorno maestras configuradas en Vercel/Local
    const access_token = dbConfig.access_token || cleanEnvVar(process.env.WHATSAPP_ACCESS_TOKEN) || cleanEnvVar(process.env.META_ACCESS_TOKEN);
    const whatsapp_business_account_id = dbConfig.whatsapp_business_account_id || cleanEnvVar(process.env.WABA_ID) || cleanEnvVar(process.env.META_BUSINESS_ID);
    const catalog_id = dbConfig.catalog_id || cleanEnvVar(process.env.META_CATALOG_ID) || ''; 

    const apiVersion = cleanEnvVar(process.env.META_API_VERSION) || 'v23.0';

    if (!access_token || !whatsapp_business_account_id) {
      console.error('[META_STATUS_CRITICAL] Missing credentials even after fallback');
      return NextResponse.json({ 
        error: 'Configuración de Meta incompleta. Falta WABA ID o Access Token.',
        details: { waba_id: !!whatsapp_business_account_id, token: !!access_token }
      }, { status: 404 });
    }

    // 4. Consultar Plantillas (Graph API)
    const templatesRes = await fetch(
      `https://graph.facebook.com/${apiVersion}/${whatsapp_business_account_id}/message_templates?access_token=${access_token}&limit=100`
    );
    const templatesData = await templatesRes.json();

    if (templatesData.error) {
        console.error('[META_TEMPLATES_ERROR]', templatesData.error);
    }

    // 5. Consultar Catálogo
    let catalogData = null;
    if (catalog_id) {
      const catalogRes = await fetch(
        `https://graph.facebook.com/${apiVersion}/${catalog_id}/products?access_token=${access_token}&fields=id,name,review_status,image_url&limit=50`
      );
      catalogData = await catalogRes.json();
    }

    return NextResponse.json({
      templates: templatesData.data || [],
      catalog: catalogData?.data || [],
      business_id: whatsapp_business_account_id,
      catalog_id: catalog_id,
      sync_mode: dbConfig.whatsapp_business_account_id ? 'database' : 'environment_fallback'
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('[META_ROUTE_CRASH]', err.message);
    return NextResponse.json({ error: 'Error interno al consultar Meta API', details: err.message }, { status: 500 });
  }
}

