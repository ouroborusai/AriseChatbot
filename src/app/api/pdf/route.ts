import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';

export async function POST(req: Request) {
  try {
    const { targetPhone, whatsappToken, phoneNumberId, reportType } = await req.json();

    if (!targetPhone || !whatsappToken || !phoneNumberId) {
        return NextResponse.json({ error: 'Missing required parameters (targetPhone, whatsappToken, phoneNumberId)' }, { status: 400 });
    }

    const design_html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0045bd; padding-bottom: 20px; margin-bottom: 30px; }
        .title { color: #0045bd; font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase; }
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
            <h1 class="title">REPORTE DE ${reportType || 'SISTEMA'}</h1>
            <div class="details">
                <p>Generado autom\u00E1ticamente por Ouroborus AI</p>
            </div>
        </div>
        <div class="details" style="text-align: right;">
            <p><strong>Emitido:</strong> {{date}}</p>
            <p><strong>Operaci\u00F3n:</strong> {{company_name}}</p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>REF / ID</th>
                <th>Descripci\u00F3n del \u00CDtem</th>
                <th class="qty">Estado / Valor</th>
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
        <p>Documento inteligente generado confidencialmente mediante Arise Business OS v7.0.</p>
    </div>
</body>
</html>
    `;

    // Dynamic mock response for immediate wow-factor
    const mockData = {
        date: new Date().toLocaleDateString('es-CL'),
        company_name: 'MTZ Consultores & Arise',
        items: [
            { sku: 'SYS-SRV-01', name: 'Sincronizacion de Directorio Kommo', quantity: 'OK', low_stock: false },
            { sku: 'DOC-REP-02', name: 'Emision de Comprobantes Automatizados', quantity: 'PENDIENTE', low_stock: true },
            { sku: 'AI-ENG-03', name: 'Gemini Neural Processor Flash-Lite', quantity: 'ACTIVO', low_stock: false }
        ]
    };

    const template = handlebars.compile(design_html);
    const finalHtml = template(mockData);

    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(finalHtml, { waitUntil: 'networkidle0' });
    
    // Generar el Buffer del PDF
    const pdfBuffer = await page.pdf({ 
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });
    await browser.close();

    const fileName = `Reporte_${reportType || 'Resumen'}_${Date.now()}.pdf`;

    // Subir a WhatsApp Media API
    const form = new FormData();
    const blob = new Blob([pdfBuffer as unknown as BlobPart], { type: 'application/pdf' });
    form.append('file', blob, fileName);
    form.append('type', 'document');
    form.append('messaging_product', 'whatsapp');

    const uploadRes = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/media`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${whatsappToken}` },
        body: form
    });
    
    const uploadData = await uploadRes.json();
    if (uploadData.error) throw new Error(uploadData.error.message);
    
    const mediaId = uploadData.id;

    // Enviar el Media ID como msj al usuario
    const sendRes = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: targetPhone,
            type: 'document',
            document: {
                id: mediaId,
                caption: '\uD83D\uDCC4 *Aqui tienes tu reporte interactivo*\n\nOuroborus AI v7.0 ha finalizado la extraccion de datos.',
                filename: fileName
            }
        })
    });

    const sendData = await sendRes.json();
    if (sendData.error) throw new Error(sendData.error.message);

    return NextResponse.json({ success: true, sendData });
  } catch (error: any) {
    console.error("PDF_PIPELINE_ERROR", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
