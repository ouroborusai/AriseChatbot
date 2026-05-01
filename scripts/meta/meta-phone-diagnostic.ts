
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function diagnosePhone() {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.PHONE_NUMBER_ID;
    const apiVersion = process.env.META_API_VERSION || 'v23.0';

    if (!token || !phoneId) {
        console.error('❌ Falta WHATSAPP_ACCESS_TOKEN o PHONE_NUMBER_ID');
        return;
    }

    console.log(`📡 [DIAGNÓSTICO] Consultando perfil comercial del número: ${phoneId}...`);

    try {
        // 1. Consultar Perfil Comercial (Catálogo, Carrito, etc.)
        const profileUrl = `https://graph.facebook.com/${apiVersion}/${phoneId}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical&access_token=${token}`;
        const profileRes = await fetch(profileUrl);
        const profileData = await profileRes.json();

        // 2. Consultar Ajustes de Comercio (¡Crucial!)
        const commerceUrl = `https://graph.facebook.com/${apiVersion}/${phoneId}/whatsapp_commerce_settings?access_token=${token}`;
        const commerceRes = await fetch(commerceUrl);
        const commerceData = await commerceRes.json();

        console.log('\n👤 PERFIL COMERCIAL:');
        console.log(JSON.stringify(profileData, null, 2));

        console.log('\n🛒 AJUSTES DE COMERCIO (Carrito/Catálogo):');
        console.log(JSON.stringify(commerceData, null, 2));

        if (commerceData.data && commerceData.data.length > 0) {
            const settings = commerceData.data[0];
            console.log('\n✅ Análisis:');
            console.log(`   - Carrito habilitado: ${settings.is_cart_enabled ? 'SÍ' : 'NO'}`);
            console.log(`   - Catálogo visible: ${settings.is_catalog_visible ? 'SÍ' : 'NO'}`);
        } else {
            console.log('\n⚠️ ADVERTENCIA: No se encontraron ajustes de comercio. El catálogo NO está vinculado a este número.');
        }

    } catch (error) {
        console.error('❌ Error fatal en el diagnóstico:', error);
    }
}

diagnosePhone();
