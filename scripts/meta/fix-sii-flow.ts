
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const API_VERSION = 'v23.0';
const FLOW_ID = '1679867603465733';

const FINAL_JSON_LM = {
  "version": "7.3",
  "data_api_version": "4.0",
  "routing_model": {
    "sii_credentials_screen": [
      "success_screen"
    ],
    "success_screen": []
  },
  "screens": [
    {
      "id": "sii_credentials_screen",
      "title": "Portal Seguro SII",
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Ingresa tus credenciales del SII"
          },
          {
            "type": "TextBody",
            "text": "LOOP utiliza encriptación de grado militar para proteger tus datos."
          },
          {
            "type": "TextInput",
            "name": "rut_input",
            "label": "RUT (Ej: 12345678-9)",
            "required": true,
            "pattern": "^\\d{7,8}-[0-9Kk]$|\\d{1,2}\\.\\d{3}\\.\\d{3}-[0-9Kk]$",
            "error-message": "Por favor ingresa un RUT válido.",
            "helper-text": "Ingrese su RUT con guión"
          },
          {
            "type": "TextInput",
            "name": "password_sii",
            "label": "Clave Tributaria SII",
            "input-type": "password",
            "required": true,
            "helper-text": "Ingrese su clave del SII"
          },
          {
            "type": "Dropdown",
            "name": "tramite_selector",
            "label": "Selecciona el trámite a procesar",
            "required": true,
            "data-source": [
              {
                "id": "iva",
                "title": "Revisión de IVA (F29)"
              },
              {
                "id": "facturacion",
                "title": "Historial de Facturación"
              },
              {
                "id": "cartola",
                "title": "Cartola Tributaria"
              }
            ]
          },
          {
            "type": "Footer",
            "label": "Procesar Solicitud",
            "on-click-action": {
              "name": "navigate",
              "next": {
                "type": "screen",
                "name": "success_screen"
              },
              "payload": {
                "rut": "${form.rut_input}",
                "clave": "${form.password_sii}",
                "tramite": "${form.tramite_selector}"
              }
            }
          }
        ]
      }
    },
    {
      "id": "success_screen",
      "title": "Procesando",
      "terminal": true,
      "data": {
        "rut": { "type": "string", "__example__": "12345678-9" },
        "clave": { "type": "string", "__example__": "clave123" },
        "tramite": { "type": "string", "__example__": "iva" }
      },
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextBody",
            "text": "Conectando con el motor neural. LOOP te notificará por chat cuando finalice el proceso."
          },
          {
            "type": "Footer",
            "label": "Cerrar",
            "on-click-action": {
              "name": "complete"
            }
          }
        ]
      }
    }
  ]
};

async function fixSII() {
  if (!ACCESS_TOKEN) return;
  console.log(`🚀 SUBIENDO SOLUCIÓN MAESTRA LM AL FLOW: ${FLOW_ID}`);
  
  const formData = new FormData();
  const blob = new Blob([JSON.stringify(FINAL_JSON_LM)], { type: 'application/json' });
  formData.append('file', blob, 'flow.json');
  formData.append('name', 'flow.json');
  formData.append('asset_type', 'FLOW_JSON');

  const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${FLOW_ID}/assets`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` },
    body: formData
  });

  const result = await res.json();
  console.log('🏁 RESULTADO FINAL:', JSON.stringify(result, null, 2));
}

fixSII();
