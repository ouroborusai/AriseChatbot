import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  try {
    // 1. Obtener credenciales de la empresa activa
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: company } = await supabase
      .from('companies')
      .select('settings')
      .single();

    const config = company?.settings?.whatsapp;
    if (!config || !config.access_token || !config.whatsapp_business_account_id) {
      return NextResponse.json({ error: 'Configuración de WhatsApp incompleta' }, { status: 404 });
    }

    const { access_token, whatsapp_business_account_id, catalog_id } = config;
    const apiVersion = process.env.META_API_VERSION || 'v23.0';

    // 2. Consultar Plantillas
    const templatesRes = await fetch(
      `https://graph.facebook.com/${apiVersion}/${whatsapp_business_account_id}/message_templates?access_token=${access_token}`
    );
    const templatesData = await templatesRes.json();

    // 3. Consultar Estado del Catálogo (Opcional, si hay ID)
    let catalogData = null;
    if (catalog_id) {
      const catalogRes = await fetch(
        `https://graph.facebook.com/${apiVersion}/${catalog_id}/products?access_token=${access_token}&fields=id,name,review_status,image_url`
      );
      catalogData = await catalogRes.json();
    }

    return NextResponse.json({
      templates: templatesData.data || [],
      catalog: catalogData?.data || [],
      business_id: whatsapp_business_account_id,
      catalog_id: catalog_id
    });

  } catch (error) {
    return NextResponse.json({ error: 'Error al consultar Meta API' }, { status: 500 });
  }
}
