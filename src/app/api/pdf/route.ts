import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';

export async function POST(req: Request) {
  try {
    const { targetPhone, whatsappToken, phoneNumberId, reportType } = await req.json();

    if (!targetPhone || !whatsappToken || !phoneNumberId) {
        return NextResponse.json({ error: 'Missing required parameters (targetPhone, whatsappToken, phoneNumberId)' }, { status: 400 });
    }

    const getTemplate = (type: string) => {
      const baseStyles = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
        body { font-family: 'Inter', sans-serif; background: #0c0e12; color: #ffffff; padding: 40px; margin: 0; }
        .bg-gradient { position: absolute; top: -100px; right: -100px; width: 400px; height: 400px; background: radial-gradient(circle, rgba(0,69,189,0.15) 0%, rgba(0,0,0,0) 70%); z-index: -1; }
        .glass-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 24px; backdrop-filter: blur(10px); margin-bottom: 20px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; background: linear-gradient(90deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .meta { color: #94a3b8; font-size: 12px; font-variant-numeric: tabular-nums; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { text-align: left; color: #94a3b8; font-size: 11px; text-transform: uppercase; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        td { padding: 16px 12px; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .badge { padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
        .badge-success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .badge-warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .badge-error { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .footer { margin-top: 60px; font-size: 11px; color: #475569; text-align: center; letter-spacing: 0.05em; }
        .diamond-accent { color: #6366f1; font-weight: bold; }
      `;

      if (type.toLowerCase().includes('dashboard') || type.toLowerCase().includes('resumen')) {
        return `
          <!DOCTYPE html>
          <html>
          <head><style>${baseStyles}</style></head>
          <body>
            <div class="bg-gradient"></div>
            <div class="header">
              <div>
                <h1 class="title">DIAMOND EXECUTIVE DASHBOARD</h1>
                <div class="meta">Ouroborus Neural Architecture | Arise Business OS v7.1</div>
              </div>
              <div style="text-align: right">
                <div class="meta">EMITIDO: {{date}}</div>
                <div class="meta">CLIENTE: <span class="diamond-accent">{{company_name}}</span></div>
              </div>
            </div>

            <div class="glass-card">
              <h2 style="font-size: 16px; margin-top: 0">S\u00EDntesis de Operaciones</h2>
              <table>
                <thead>
                  <tr>
                    <th>M\u00D3DULO / REF</th>
                    <th>DEFINICI\u00D3N</th>
                    <th style="text-align: right">KPI / ESTATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {{#each items}}
                  <tr>
                    <td style="color: #6366f1; font-weight: bold">{{sku}}</td>
                    <td>{{name}}</td>
                    <td style="text-align: right">
                      <span class="badge {{#if low_stock}}badge-error{{else}}badge-success{{/if}}">{{quantity}}</span>
                    </td>
                  </tr>
                  {{/each}}
                </tbody>
              </table>
            </div>

            <div class="footer">Este documento ha sido generado mediante inteligencia de negocios sint\u00E9tica. Prohibida su divulgaci\u00F3n no autorizada.</div>
          </body>
          </html>
        `;
      }

      // Default Template
      return `
        <!DOCTYPE html>
        <html>
        <head><style>${baseStyles}</style></head>
        <body>
          <div class="header">
            <h1 class="title">REPORTE T\u00C9CNICO: {{reportType}}</h1>
            <div class="meta">{{date}}</div>
          </div>
          <div class="glass-card">
            {{#each items}}
            <div style="margin-bottom: 8px; font-size: 13px;">\u2022 {{name}}: <span class="diamond-accent">{{quantity}}</span></div>
            {{/each}}
          </div>
        </body>
        </html>
      `;
    };

    const design_html = getTemplate(reportType || 'Resumen');

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
