
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WABA_ID = '930946633057624';
const API_VERSION = 'v23.0';

const EXPLORER_JSON = {
  "version": "7.3",
  "data_api_version": "4.0",
  "routing_model": {
    "CATEGORY_SELECTION": []
  },
  "screens": [
    {
      "id": "CATEGORY_SELECTION",
      "title": "Explorador Red MTZ",
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Elija un Rubro"
          },
          {
            "type": "TextBody",
            "text": "Seleccione la categoría que desea explorar para ver nuestros proveedores y servicios verificados."
          },
          {
            "type": "RadioButtonsGroup",
            "name": "selected_category",
            "label": "Rubros Disponibles",
            "required": true,
            "data-source": [
              { "id": "mtz_services", "title": "Tus Servicios MTZ" },
              { "id": "mtz_food", "title": "Alimentos y Gastronomía" },
              { "id": "mtz_health", "title": "Salud y Bienestar" },
              { "id": "mtz_construction", "title": "Construcción y Hogar" },
              { "id": "mtz_logistics", "title": "Transporte y Logística" },
              { "id": "mtz_pro_services", "title": "Servicios Profesionales" }
            ]
          },
          {
            "type": "Footer",
            "label": "Ver Productos",
            "on-click-action": {
              "name": "complete",
              "payload": {
                "category": "${form.selected_category}",
                "action": "view_collection"
              }
            }
          }
        ]
      },
      "terminal": true
    }
  ]
};

async function deploy() {
  if (!ACCESS_TOKEN) return;

  console.log('📡 [1/2] Registrando nuevo Flow: loop_v10_mtz_explorer');
  const createRes = await fetch(`https://graph.facebook.com/${API_VERSION}/${WABA_ID}/flows`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'loop_v10_mtz_explorer',
      categories: ['OTHER']
    })
  });

  const createData: any = await createRes.json();
  if (!createData.id) {
    console.error('❌ Error al crear Flow:', createData);
    return;
  }

  const FLOW_ID = createData.id;
  console.log(`✅ Flow creado con ID: ${FLOW_ID}`);

  console.log('📡 [2/2] Subiendo estructura JSON v7.3...');
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
  console.log('🏁 Resultado Final:', JSON.stringify(assetData, null, 2));
}

deploy();
