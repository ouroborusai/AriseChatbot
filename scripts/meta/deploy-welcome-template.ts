import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WABA_ID = process.env.WABA_ID;
const APP_ID = '827530206405111';
const VIDEO_PATH = path.resolve(process.cwd(), 'public/brand/categories/mp_.mp4');

async function deployWelcome() {
    if (!ACCESS_TOKEN || !WABA_ID) {
        console.error('❌ Falta configuración en .env.local');
        return;
    }

    try {
        console.log('📡 [1/3] Iniciando sesión de carga de video...');
        const stats = fs.statSync(VIDEO_PATH);
        
        // 1. Crear sesión de carga
        const sessionRes = await fetch(`https://graph.facebook.com/v19.0/${APP_ID}/uploads?file_length=${stats.size}&file_type=video/mp4&access_token=${ACCESS_TOKEN}`, {
            method: 'POST'
        });
        const sessionData = await sessionRes.json();
        const uploadSessionId = sessionData.id;

        if (!uploadSessionId) {
            throw new Error(`Error creando sesión: ${JSON.stringify(sessionData)}`);
        }

        console.log(`✅ Sesión iniciada: ${uploadSessionId}`);

        // 2. Subir el binario
        console.log('📡 [2/3] Subiendo video mp_.mp4...');
        const fileBuffer = fs.readFileSync(VIDEO_PATH);
        const uploadRes = await fetch(`https://graph.facebook.com/v19.0/${uploadSessionId}`, {
            method: 'POST',
            headers: {
                'Authorization': `OAuth ${ACCESS_TOKEN}`,
                'file_offset': '0'
            },
            body: fileBuffer
        });
        const uploadData = await uploadRes.json();
        const handle = uploadData.h;

        if (!handle) {
            throw new Error(`Error subiendo archivo: ${JSON.stringify(uploadData)}`);
        }

        console.log(`✅ Video subido con éxito. Handle: ${handle}`);

        // 3. Crear la Plantilla (SIN EMOJIS EN BOTONES)
        console.log('📡 [3/3] Registrando plantilla arise_v11_welcome...');
        const templatePayload = {
            name: "arise_v11_welcome",
            language: "es",
            category: "MARKETING",
            components: [
                {
                    type: "HEADER",
                    format: "VIDEO",
                    example: {
                        header_handle: [handle]
                    }
                },
                {
                    type: "BODY",
                    text: "Bienvenido al ecosistema *ARISE v11.9.1 Diamond Resilience*. Soy tu Director Neural.\n\nEstoy aquí para optimizar tu operativa y conectar tu negocio con la Red MTZ de forma inteligente. ¿Cómo podemos evolucionar hoy?"
                },
                {
                    type: "FOOTER",
                    text: "Ouroborus Neural Engine - ARISE Business OS"
                },
                {
                    type: "BUTTONS",
                    buttons: [
                        {
                            type: "QUICK_REPLY",
                            text: "Comenzar"
                        },
                        {
                            type: "QUICK_REPLY",
                            text: "Ver Catálogo"
                        }
                    ]
                }
            ]
        };

        const templateRes = await fetch(`https://graph.facebook.com/v19.0/${WABA_ID}/message_templates`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(templatePayload)
        });

        const templateData = await templateRes.json();
        console.log('🏁 Resultado Final:', JSON.stringify(templateData, null, 2));

    } catch (error: any) {
        console.error('❌ Error en el despliegue:', error.message);
    }
}

deployWelcome();
