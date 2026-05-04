
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WABA_ID = process.env.WABA_ID;
const API_VERSION = 'v23.0';

const EXPLORER_JSON = {
  "version": "7.3",
  "data_api_version": "4.0",
  "routing_model": {
    "CATEGORY_SELECTION": ["SUCCESS_SCREEN"],
    "SUCCESS_SCREEN": []
  },
  "screens": [
    {
      "id": "CATEGORY_SELECTION",
      "title": "Explorador Red MTZ",
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          { "type": "TextHeading", "text": "Elija un Rubro" },
          { "type": "TextBody", "text": "Seleccione la categoría que desea explorar." },
          {
            "type": "RadioButtonsGroup",
            "name": "selected_category",
            "label": "Rubros Disponibles",
            "required": true,
            "data-source": [
              { "id": "mtz_food", "title": "Gastronomía & Alimentos 🍣" },
              { "id": "mtz_construction", "title": "Construcción & Hogar 🛠️" },
              { "id": "mtz_logistics", "title": "Transporte & Logística 🚛" },
              { "id": "mtz_health", "title": "Salud & Bienestar 💅" },
              { "id": "mtz_pro_services", "title": "Servicios Profesionales ⚖️" },
              { "id": "mtz_industrial", "title": "Seguridad & Industrial 🛡️" },
              { "id": "mtz_distillery", "title": "Destilerías & Producción 🍷" },
              { "id": "mtz_education", "title": "Educación & Comunidad 🎨" },
              { "id": "mtz_automotive", "title": "Automotriz & Talleres 🏎️" },
              { "id": "mtz_retail", "title": "Comercio & Retail 🛒" }
            ]
          },
          {
            "type": "Footer",
            "label": "Continuar",
            "on-click-action": {
              "name": "navigate",
              "next": { "type": "screen", "name": "SUCCESS_SCREEN" },
              "payload": { "category": "${form.selected_category}" }
            }
          }
        ]
      }
    },
    {
      "id": "SUCCESS_SCREEN",
      "title": "Procesando Selección",
      "terminal": true,
      "data": {
        "category": { "type": "string", "__path": "category", "__example__": "mtz_food" }
      },
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          { "type": "TextHeading", "text": "¡Rubro Seleccionado!" },
          { "type": "TextBody", "text": "Estamos preparando el catálogo especializado de Red MTZ para usted." },
          {
            "type": "Footer",
            "label": "Ver Catálogo",
            "on-click-action": {
              "name": "complete",
              "payload": {
                "category": "${data.category}",
                "action": "view_collection"
              }
            }
          }
        ]
      }
    }
  ]
};

async function deploy() {
  if (!ACCESS_TOKEN || !WABA_ID) return;
  console.log('📡 Aplicando requerimiento de Meta (__example__) al Flow...');
  
  const FLOW_ID = '1022620870276018'; // arise_v12_mtz_explorer — SSOT v12.0 

  const formData = new FormData();
  const blob = new Blob([JSON.stringify(EXPLORER_JSON)], { type: 'application/json' });
  formData.append('file', blob, 'flow.json');
  formData.append('name', 'flow.json');
  formData.append('asset_type', 'FLOW_JSON');

  const assetRes = await fetch(`https://graph.facebook.com/${API_VERSION}/${FLOW_ID}/assets`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` },
    body: formData
  });

  const assetData = await assetRes.json();
  console.log('🏁 Flow Certificado por Meta:', JSON.stringify(assetData, null, 2));
}

deploy();
