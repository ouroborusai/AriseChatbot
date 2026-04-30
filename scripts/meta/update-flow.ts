
import * as dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local' });

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const API_VERSION = 'v23.0';

async function updateFlow(flowId: string) {
  if (!ACCESS_TOKEN) {
    console.error('❌ Falta WHATSAPP_ACCESS_TOKEN');
    return;
  }

  console.log(`💉 INICIANDO CIRUGÍA EN FLOW: ${flowId}`);

  // 1. Obtener el asset
  const assetsRes = await fetch(`https://graph.facebook.com/${API_VERSION}/${flowId}/assets`, {
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
  });
  const assets = await assetsRes.json();
  const asset = assets.data?.find((a: any) => a.asset_type === 'FLOW_JSON');

  if (!asset || !asset.download_url) {
    console.error('❌ No se encontró el flow.json');
    return;
  }

  // 2. Descargar y corregir
  const jsonRes = await fetch(asset.download_url);
  let flowJson = await jsonRes.json();

  // PARCHE MAESTRO: Conectar pantallas huérfanas y corregir sintaxis v7.3 (Guiones medios exhaustivos)
  const flowStr = JSON.stringify(flowJson)
    .replace(/"on_click_action"/g, '"on-click-action"')
    .replace(/"on_enter_action"/g, '"on-enter-action"')
    .replace(/"on_data_exchange"/g, '"on-data-exchange"')
    .replace(/"data_source"/g, '"data-source"')
    .replace(/"data_key"/g, '"data-key"')
    .replace(/"error_message"/g, '"error-message"')
    .replace(/"input_type"/g, '"input-type"')
    .replace(/"helper_text"/g, '"helper-text"')
    .replace(/"is_required"/g, '"is-required"')
    .replace(/"routing_model"/g, '"routing_model"');
  
  flowJson = JSON.parse(flowStr);

  if (flowJson.routing_model) {
    const screens = flowJson.screens || [];
    const firstScreen = screens[0]?.id;
    // Buscar la pantalla de éxito (insensible a mayúsculas/minúsculas)
    const successScreenObj = screens.find((s: any) => s.id.toLowerCase().includes('success'));
    const successScreen = successScreenObj?.id;

    if (firstScreen && successScreen) {
        flowJson.routing_model[firstScreen] = [successScreen];
        flowJson.routing_model[successScreen] = [];
        console.log(`🔗 Conectando ${firstScreen} -> ${successScreen}`);
    }

    // Corregir Footer en pantallas terminales (v7.3 rule: name must be 'complete')
    screens.forEach((screen: any) => {
        if (screen.terminal) {
            const footer = screen.layout?.children?.find((c: any) => c.type === 'Footer');
            if (footer) {
                footer['on-click-action'] = {
                    name: 'complete',
                    payload: { status: 'success' }
                };
                console.log(`✅ Configurando Footer terminal en: ${screen.id}`);
            }
        }
    });
  }

  // 3. Subir de nuevo
  // Para actualizar un Flow, se usa el endpoint /assets con el archivo
  // NOTA: Meta a veces requiere un FormData con el archivo real.
  // Intentaremos la actualización vía API.
  
  console.log('🚀 Subiendo parche a Meta...');
  
  const formData = new FormData();
  const blob = new Blob([JSON.stringify(flowJson)], { type: 'application/json' });
  formData.append('file', blob, 'flow.json');
  formData.append('name', 'flow.json');
  formData.append('asset_type', 'FLOW_JSON');

  const updateRes = await fetch(`https://graph.facebook.com/${API_VERSION}/${flowId}/assets`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` },
    body: formData
  });

  const result = await updateRes.json();
  console.log('🏁 Resultado:', JSON.stringify(result, null, 2));
  
  if (result.success) {
      console.log('✨ FLOW REPARADO CON ÉXITO. Revisa tu panel de Meta.');
  }
}

const flowId = process.argv[2] || '3141848516022930';
updateFlow(flowId);
