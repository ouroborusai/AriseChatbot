import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs';
import 'dotenv/config';

// 1. Configuración
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_PHONE = '56990062213';

async function generateAndSendPdf() {
    console.log("Iniciando generador de PDF (Diamond v7.0 Test)...");

    // 2. Plantilla Hardcodeada para el Test (Evitando el caché de PostgREST)
    const design_html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0045bd; padding-bottom: 20px; margin-bottom: 30px; }
        .title { color: #0045bd; font-size: 24px; font-weight: bold; margin: 0; }
        .details p { margin: 5px 0; color: #64748b; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #f8fafc; color: #334155; padding: 12px; text-align: left; border-bottom: 2px solid #cbd5e1; font-size: 13px; text-transform: uppercase; }
        td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        .qty { text-align: center; font-weight: bold; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1 class="title">REPORTE DE INVENTARIO</h1>
            <div class="details">
                <p>Generado por: Ouroborus AI</p>
            </div>
        </div>
        <div class="details" style="text-align: right;">
            <p><strong>Emitido:</strong> {{date}}</p>
            <p><strong>Operación:</strong> {{company_name}}</p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>SKU</th>
                <th>Producto / Descripción</th>
                <th class="qty">Stock Físico</th>
            </tr>
        </thead>
        <tbody>
            {{#each items}}
            <tr>
                <td style="color: #64748b; font-size: 12px;">{{sku}}</td>
                <td><strong>{{name}}</strong></td>
                <td class="qty" style="color: {{#if low_stock}}#ef4444{{else}}#10b981{{/if}};">{{quantity}}</td>
            </tr>
            {{/each}}
        </tbody>
    </table>

    <div class="footer">
        <p>Documento generado confidencialmente mediante Arise Business OS v7.0.</p>
    </div>
</body>
</html>
    `;

    // 3. Mock de Datos (Lo que Gemini extraería)
    const mockData = {
        date: new Date().toLocaleDateString('es-CL'),
        company_name: 'Tech Industrial S.A. (Prueba v7.0)',
        items: [
            { sku: 'SRV-G7-001', name: 'Servidor ProLiant DL380 Gen10', quantity: 5, low_stock: false },
            { sku: 'NET-SW-048', name: 'Switch Cisco Catalyst 9300', quantity: 2, low_stock: true },
            { sku: 'MEM-64G-02', name: 'Memoria RAM 64GB DDR4 ECC', quantity: 24, low_stock: false },
            { sku: 'STR-SSD-2T', name: 'Disco SSD Enterprise 2TB NVMe', quantity: 1, low_stock: true }
        ]
    };

    // 4. Inyección de Datos (Handlebars)
    console.log("Inyectando datos en la plantilla...");
    const template = handlebars.compile(design_html);
    const finalHtml = template(mockData);

    // 5. Renderizado del PDF (Puppeteer)
    console.log("Renderizando motor Chromium...");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(finalHtml, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({ 
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });
    await browser.close();

    const fileName = `Inventario_Test_${Date.now()}.pdf`;
    fs.writeFileSync(fileName, pdfBuffer);
    console.log(`PDF Guardado localmente como: ${fileName}`);

    // (Opcional: Subir a Supabase Storage aquí en el flujo final usando supersbase.storage.from('documents').upload...)

    // 6. Subir Media a WhatsApp Graph API y enviar
    console.log("Subiendo documento a Meta WhatsApp API...");
    
    const form = new FormData();
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    form.append('file', blob, fileName);
    form.append('type', 'document');
    form.append('messaging_product', 'whatsapp');

    const uploadRes = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/media`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${whatsappToken}` },
        body: form
    });
    
    const uploadData = await uploadRes.json();
    if (uploadData.error) {
        console.error("Error subiendo media:", uploadData.error);
        return;
    }
    
    const mediaId = uploadData.id;
    console.log("Media ID obtenido:", mediaId);

    // 7. Enviar Mensaje a WhatsApp
    console.log(`Enviando Documento vía WhatsApp al número ${TARGET_PHONE}...`);
    const sendRes = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: TARGET_PHONE,
            type: 'document',
            document: {
                id: mediaId,
                caption: '📄 *Reporte de Inventario Actualizado*\n\nGenerado de manera autónoma por Ouroborus AI.',
                filename: fileName
            }
        })
    });

    const sendData = await sendRes.json();
    if (sendData.error) {
        console.error("Error enviando mensaje:", sendData.error);
    } else {
        console.log("✅ MENSAJE ENVIADO CORRECTAMENTE:", sendData);
    }
}

generateAndSendPdf();
