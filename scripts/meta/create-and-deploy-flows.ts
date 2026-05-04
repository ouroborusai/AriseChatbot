
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WABA_ID = process.env.WABA_ID;
const API_VERSION = 'v23.0';

const FLOWS_TO_CREATE = [
    {
        name: "arise_admin_inventory_v1",
        category: "OTHER",
        json: {
            "version": "7.3",
            "data_api_version": "4.0",
            "routing_model": {
                "MAIN_MENU": ["NEW_PRODUCT", "ADJUST_STOCK", "REPORT_REQUEST"],
                "NEW_PRODUCT": ["SUCCESS_SCREEN"],
                "ADJUST_STOCK": ["SUCCESS_SCREEN"],
                "REPORT_REQUEST": ["SUCCESS_SCREEN"],
                "SUCCESS_SCREEN": []
            },
            "screens": [
                {
                    "id": "MAIN_MENU",
                    "title": "Gestión de Inventario",
                    "layout": {
                        "type": "SingleColumnLayout",
                        "children": [
                            { "type": "TextHeading", "text": "Panel de Control MTZ" },
                            { "type": "Button", "label": "➕ Nuevo Producto", "on-click-action": { "name": "navigate", "next": { "type": "screen", "name": "NEW_PRODUCT" } } },
                            { "type": "Button", "label": "📦 Ajustar Stock", "on-click-action": { "name": "navigate", "next": { "type": "screen", "name": "ADJUST_STOCK" } } },
                            { "type": "Button", "label": "📊 Generar Informe", "on-click-action": { "name": "navigate", "next": { "type": "screen", "name": "REPORT_REQUEST" } } }
                        ]
                    }
                },
                {
                    "id": "NEW_PRODUCT",
                    "title": "Crear Producto",
                    "layout": {
                        "type": "SingleColumnLayout",
                        "children": [
                            { "type": "TextInput", "name": "prod_name", "label": "Nombre del Producto", "required": true },
                            { "type": "TextInput", "name": "prod_sku", "label": "Código SKU", "required": true },
                            { "type": "TextInput", "name": "prod_price", "label": "Precio Venta", "input-type": "number", "required": true },
                            { "type": "TextInput", "name": "prod_stock", "label": "Stock Inicial", "input-type": "number", "required": true },
                            { "type": "Dropdown", "name": "prod_category", "label": "Rubro (Red MTZ)", "required": true,
                                "data-source": [
                                    { "id": "mtz_food", "title": "Gastronomía" },
                                    { "id": "mtz_construction", "title": "Construcción" },
                                    { "id": "mtz_retail", "title": "Retail" }
                                ]
                            },
                            { "type": "Footer", "label": "Crear",
                                "on-click-action": { "name": "navigate", "next": { "type": "screen", "name": "SUCCESS_SCREEN" },
                                    "payload": { "action": "inventory_create", "name": "${form.prod_name}", "sku": "${form.prod_sku}", "price": "${form.prod_price}", "stock": "${form.prod_stock}", "category": "${form.prod_category}" }
                                }
                            }
                        ]
                    }
                },
                {
                    "id": "ADJUST_STOCK",
                    "title": "Ajuste de Inventario",
                    "layout": {
                        "type": "SingleColumnLayout",
                        "children": [
                            { "type": "TextInput", "name": "adj_sku", "label": "SKU del Producto", "required": true },
                            { "type": "Dropdown", "name": "adj_type", "label": "Tipo de Movimiento", "required": true,
                                "data-source": [
                                    { "id": "in", "title": "Entrada (Suma)" },
                                    { "id": "out", "title": "Salida (Resta)" },
                                    { "id": "adjustment", "title": "Merma (Ajuste)" }
                                ]
                            },
                            { "type": "TextInput", "name": "adj_qty", "label": "Cantidad", "input-type": "number", "required": true },
                            { "type": "Footer", "label": "Registrar",
                                "on-click-action": { "name": "navigate", "next": { "type": "screen", "name": "SUCCESS_SCREEN" },
                                    "payload": { "action": "inventory_update", "sku": "${form.adj_sku}", "type": "${form.adj_type}", "quantity": "${form.adj_qty}" }
                                }
                            }
                        ]
                    }
                },
                {
                    "id": "REPORT_REQUEST",
                    "title": "Centro de Reportes",
                    "layout": {
                        "type": "SingleColumnLayout",
                        "children": [
                            { "type": "Dropdown", "name": "rep_type", "label": "Tipo de Informe", "required": true,
                                "data-source": [
                                    { "id": "inventory", "title": "Inventario General" },
                                    { "id": "ventas-mensual", "title": "Ventas del Mes" }
                                ]
                            },
                            { "type": "Footer", "label": "Solicitar PDF",
                                "on-click-action": { "name": "navigate", "next": { "type": "screen", "name": "SUCCESS_SCREEN" },
                                    "payload": { "action": "pdf_generate", "report_type": "${form.rep_type}" }
                                }
                            }
                        ]
                    }
                },
                {
                    "id": "SUCCESS_SCREEN",
                    "title": "Procesando",
                    "terminal": true,
                    "data": {
                        "action": { "type": "string" },
                        "name": { "type": "string" },
                        "sku": { "type": "string" },
                        "price": { "type": "string" },
                        "stock": { "type": "string" },
                        "category": { "type": "string" },
                        "type": { "type": "string" },
                        "quantity": { "type": "string" },
                        "report_type": { "type": "string" }
                    },
                    "layout": {
                        "type": "SingleColumnLayout",
                        "children": [
                            { "type": "TextHeading", "text": "Solicitud Enviada" },
                            { "type": "TextBody", "text": "El Motor Neural está procesando los datos en la base de datos de Vercel/Supabase. Recibirás una confirmación en este chat." },
                            { "type": "Footer", "label": "Cerrar y Enviar",
                                "on-click-action": { "name": "complete" }
                            }
                        ]
                    }
                }
            ]
        }
    },
    {
        name: "arise_hr_portal_v1",
        category: "OTHER",
        json: {
            "version": "7.3",
            "data_api_version": "4.0",
            "routing_model": {
                "ONBOARDING_SCREEN": ["SUCCESS_SCREEN"],
                "SUCCESS_SCREEN": []
            },
            "screens": [
                {
                    "id": "ONBOARDING_SCREEN",
                    "title": "Portal de RRHH - Contratación",
                    "layout": {
                        "type": "SingleColumnLayout",
                        "children": [
                            { "type": "TextHeading", "text": "Ficha de Nuevo Trabajador" },
                            { "type": "TextInput", "name": "emp_name", "label": "Nombre Completo", "required": true },
                            { "type": "Dropdown", "name": "emp_position", "label": "Cargo / Puesto", "required": true,
                                "data-source": [
                                    { "id": "operario", "title": "Operario" },
                                    { "id": "administrativo", "title": "Administrativo" },
                                    { "id": "vendedor", "title": "Vendedor / Comercial" }
                                ]
                            },
                            { "type": "Dropdown", "name": "emp_contract", "label": "Tipo de Contrato", "required": true,
                                "data-source": [
                                    { "id": "indefinido", "title": "Plazo Indefinido" },
                                    { "id": "fijo", "title": "Plazo Fijo" },
                                    { "id": "honorarios", "title": "Prestación de Servicios" }
                                ]
                            },
                            { "type": "Footer", "label": "Registrar Trabajador",
                                "on-click-action": { 
                                    "name": "navigate", "next": { "type": "screen", "name": "SUCCESS_SCREEN" },
                                    "payload": { "action": "employee_create", "full_name": "${form.emp_name}", "position": "${form.emp_position}", "contract_type": "${form.emp_contract}" }
                                }
                            }
                        ]
                    }
                },
                {
                    "id": "SUCCESS_SCREEN",
                    "title": "Procesando",
                    "terminal": true,
                    "data": {
                        "action": { "type": "string" },
                        "full_name": { "type": "string" },
                        "position": { "type": "string" },
                        "contract_type": { "type": "string" }
                    },
                    "layout": {
                        "type": "SingleColumnLayout",
                        "children": [
                            { "type": "TextHeading", "text": "Datos Enviados" },
                            { "type": "TextBody", "text": "El Motor Neural está registrando al trabajador en la base de datos." },
                            { "type": "Footer", "label": "Cerrar", "on-click-action": { "name": "complete" } }
                        ]
                    }
                }
            ]
        }
    },
    {
        name: "arise_reminders_v1",
        category: "OTHER",
        json: {
            "version": "7.3",
            "data_api_version": "4.0",
            "routing_model": {
                "REMINDER_SCREEN": ["SUCCESS_SCREEN"],
                "SUCCESS_SCREEN": []
            },
            "screens": [
                {
                    "id": "REMINDER_SCREEN",
                    "title": "Centro de Recordatorios",
                    "layout": {
                        "type": "SingleColumnLayout",
                        "children": [
                            { "type": "TextHeading", "text": "Crear Tarea/Alerta" },
                            { "type": "TextInput", "name": "task_content", "label": "Descripción de la Tarea", "required": true },
                            { "type": "Dropdown", "name": "task_time", "label": "Vencimiento (Due At)", "required": true,
                                "data-source": [
                                    { "id": "hoy", "title": "Hoy al final del día" },
                                    { "id": "manana", "title": "Mañana por la mañana" },
                                    { "id": "viernes", "title": "Este Viernes" }
                                ]
                            },
                            { "type": "Footer", "label": "Fijar Recordatorio",
                                "on-click-action": { 
                                    "name": "navigate", "next": { "type": "screen", "name": "SUCCESS_SCREEN" },
                                    "payload": { "action": "reminder_create", "content": "${form.task_content}", "due_at": "${form.task_time}" }
                                }
                            }
                        ]
                    }
                },
                {
                    "id": "SUCCESS_SCREEN",
                    "title": "Alerta Configurada",
                    "terminal": true,
                    "data": {
                        "action": { "type": "string" },
                        "content": { "type": "string" },
                        "due_at": { "type": "string" }
                    },
                    "layout": {
                        "type": "SingleColumnLayout",
                        "children": [
                            { "type": "TextHeading", "text": "Recordatorio Activo" },
                            { "type": "TextBody", "text": "La IA ha guardado este recordatorio y te notificará a tiempo." },
                            { "type": "Footer", "label": "Cerrar", "on-click-action": { "name": "complete" } }
                        ]
                    }
                }
            ]
        }
    }

];

async function createAndDeploy() {
    if (!ACCESS_TOKEN || !WABA_ID) {
        console.error('❌ Falta WHATSAPP_ACCESS_TOKEN o WABA_ID');
        return;
    }

    // Primero obtenemos los flows existentes para saber sus IDs
    const listRes = await fetch(`https://graph.facebook.com/${API_VERSION}/${WABA_ID}/flows`, {
        headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
    });
    const listResult = await listRes.json();
    const existingFlows = listResult.data || [];

    for (const flowData of FLOWS_TO_CREATE) {
        console.log(`\n📦 PROCESANDO FLOW: ${flowData.name}...`);
        let flowId = '';

        const existing = existingFlows.find((f: any) => f.name === flowData.name);
        
        if (existing) {
            flowId = existing.id;
            console.log(`ℹ️ El Flow ya existe. ID: ${flowId}. Procediendo a actualizar assets...`);
        } else {
            try {
                const createRes = await fetch(`https://graph.facebook.com/${API_VERSION}/${WABA_ID}/flows`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${ACCESS_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: flowData.name,
                        categories: [flowData.category]
                    })
                });
                const createResult = await createRes.json();
                if (!createRes.ok) {
                    console.error(`❌ Error creando contenedor:`, JSON.stringify(createResult, null, 2));
                    continue;
                }
                flowId = createResult.id;
                console.log(`✅ Contenedor Creado. ID: ${flowId}`);
            } catch (error: any) {
                console.error(`💥 Fallo creando contenedor:`, error.message);
                continue;
            }
        }

        // Subir el JSON (Assets)
        try {
            const formData = new FormData();
            const blob = new Blob([JSON.stringify(flowData.json)], { type: 'application/json' });
            formData.append('file', blob, 'flow.json');
            formData.append('name', 'flow.json');
            formData.append('asset_type', 'FLOW_JSON');

            const assetRes = await fetch(`https://graph.facebook.com/${API_VERSION}/${flowId}/assets`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` },
                body: formData
            });

            const assetResult = await assetRes.json();
            
            if (assetResult.success) {
                console.log(`✨ ¡ÉXITO! Assets de ${flowData.name} actualizados correctamente.`);
            } else {
                console.error(`❌ Error subiendo assets:`, JSON.stringify(assetResult, null, 2));
            }
        } catch (error: any) {
            console.error(`💥 Fallo subiendo assets:`, error.message);
        }
    }
}

createAndDeploy();
