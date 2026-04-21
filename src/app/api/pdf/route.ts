import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import { templates } from '@/lib/pdf/templates';
import { requireAuth } from '@/lib/api-auth';

/**
 * ARISE PDF PIPELINE v9.0
 * Handles high-precision document generation and WhatsApp delivery.
 */
export async function POST(req: Request) {
  try {
    // Verificar autenticación
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;

    const { targetPhone, whatsappToken, phoneNumberId, reportType } = await req.json();

    // Validación de parámetros requeridos
    if (!targetPhone || !whatsappToken || !phoneNumberId) {
        return NextResponse.json({ error: 'Missing required parameters: targetPhone, whatsappToken, phoneNumberId' }, { status: 400 });
    }

    // Validación de formato de teléfono (prefijo + dígitos)
    const phoneRegex = /^\+?\d{8,15}$/;
    if (!phoneRegex.test(targetPhone.replace(/[\s\-\(\)]/g, ''))) {
        return NextResponse.json({ error: 'Invalid phone format. Expected: +CC9XXXXXXXX' }, { status: 400 });
    }

    // Validación de reportType
    const validTypes = ['balance', 'factura', 'invoice', 'compliance', 'f29', 'liquidacion', 'sueldo', '8-columnas', 'dashboard', 'resumen'];
    if (reportType && !validTypes.some(t => reportType.toLowerCase().includes(t))) {
        return NextResponse.json({
            error: `Invalid reportType. Valid options: ${validTypes.join(', ')}`
        }, { status: 400 });
    }

    // 1. Template Selection
    const type = (reportType || 'Resumen').toLowerCase();
    let templateSource = templates.default;
    
    if (type.includes('8-columnas')) templateSource = templates.columnas8;
    else if (type.includes('balance')) templateSource = templates.balance;
    else if (type.includes('factura') || type.includes('invoice')) templateSource = templates.invoice;
    else if (type.includes('compliance') || type.includes('f29')) templateSource = templates.compliance;
    else if (type.includes('liquidacion') || type.includes('sueldo')) templateSource = templates.payroll;
    else if (type.includes('dashboard') || type.includes('resumen')) templateSource = templates.dashboard;

    // 2. Mock Data Generation (Operational Context)
    let mockData: any = {
        date: new Date().toLocaleDateString('es-CL'),
        company_name: 'MTZ Consultores & Arise',
        folio: Math.floor(Math.random() * 9000) + 1000,
        items: []
    };

    // Populate mockData based on type
    if (type.includes('8-columnas')) {
        mockData.company_rut = '76.462.417-3';
        mockData.company_name = 'INVERSIONES ROJAS Y COMPANIA LIMITADA';
        mockData.company_address = 'AVENIDA PLAYA BRAVA #2109-A IQUIQUE';
        mockData.rep_legal = 'MARCO ANTONIO ROJAS REJAS';
        mockData.period = 'ENERO A DICIEMBRE 2023';
        mockData.accounts = [
            { name: '1101-01 CUENTA CAJA', sum_debit: '1.182.433.333', sum_credit: '973.893.183', balance_deudor: '208.540.150', balance_acreedor: '', inventory_asset: '208.540.150', inventory_liability: '', result_loss: '', result_gain: '' },
            { name: '1104-01 DEUDORES CLIENTES', sum_debit: '252.983', sum_credit: '', balance_deudor: '252.983', balance_acreedor: '', inventory_asset: '252.983', inventory_liability: '', result_loss: '', result_gain: '' },
            { name: '2105-01 FACTURAS POR PAGAR', sum_debit: '940.621.653', sum_credit: '2.008.133.798', balance_deudor: '', balance_acreedor: '1.067.512.145', inventory_asset: '', inventory_liability: '1.067.512.145', result_loss: '', result_gain: '' },
            { name: '5101-01 VENTAS', sum_debit: '', sum_credit: '306.762.825', balance_deudor: '', balance_acreedor: '306.762.825', inventory_asset: '', inventory_liability: '', result_loss: '', result_gain: '306.762.825' }
        ];
        mockData.totals = {
            sum_debit: '4.277.116.904',
            sum_credit: '4.277.116.904',
            balance_deudor: '1.849.234.584',
            balance_acreedor: '1.849.234.584',
            inventory_asset: '1.353.157.804',
            inventory_liability: '1.353.157.804',
            result_loss: '508.604.586',
            result_gain: '508.604.586'
        };
    } else if (type.includes('balance')) {
        mockData.items = [
            { sku: '1-01-001', name: 'Banco Santander (Pesos)', quantity: '$42,500,000', low_stock: false },
            { sku: '1-01-002', name: 'Cuentas por Cobrar Clientes', quantity: '$12,380,000', low_stock: false },
            { sku: '2-01-001', name: 'IVA por Pagar (F29)', quantity: '$-2,150,000', low_stock: true },
            { sku: '3-01-001', name: 'Patrimonio Neto', quantity: '$52,730,000', low_stock: false }
        ];
    } else if (type.includes('factura')) {
        mockData.items = [
            { name: 'Consuloría Tributaria Mensual', quantity: '$1,200,000' },
            { name: 'Gestión de Auditoría Remota', quantity: '$450,000' },
            { name: 'Suscripción Arise Business OS', quantity: '$95,000' }
        ];
        mockData.total = '1,745,000';
    } else if (type.includes('liquidacion') || type.includes('sueldo')) {
        mockData.company_rut = '76.462.417-3';
        mockData.company_name = 'INVERSIONES ROJAS Y COMPANIA LIMITADA';
        mockData.period = 'ABRIL 2026';
        mockData.employee_name = 'MARCO ANTONIO ROJAS REJAS';
        mockData.employee_rut = '15.432.123-K';
        mockData.job_title = 'Director de Finanzas';
        mockData.days_worked = '30';
        mockData.join_date = '01/01/2020';
        mockData.earnings = [
            { name: 'Sueldo Base', amount: '$2,500,000', imponible: true },
            { name: 'Gratificación Legal (Art. 50)', amount: '$150,000', imponible: true },
            { name: 'Bono de Responsabilidad', amount: '$450,000', imponible: true },
            { name: 'Asignación de Colación', amount: '$85,000', imponible: false },
            { name: 'Asignación de Movilización', amount: '$70,000', imponible: false }
        ];
        mockData.total_earnings = '$3,255,000';
        mockData.deductions = [
            { name: 'AFP Provida (11.45%)', amount: '$354,950' },
            { name: 'Fonasa (7%)', amount: '$217,000' },
            { name: 'Seguro de Cesantía (0.6%)', amount: '$18,600' },
            { name: 'Impuesto Único 2da Cat.', amount: '$145,230' },
            { name: 'Anticipo de Sueldo', amount: '$500,000' }
        ];
        mockData.total_deductions = '$1,235,780';
        mockData.net_salary = '$2,019,220';
        mockData.net_uf = '54.23 UF';
        mockData.net_usd = '$2,145.50';
        mockData.signature_hash = '8fe4-99b2-ac11-2e55';
    } else {
        mockData.items = [
            { sku: 'SYS-SRV-01', name: 'Sincronización de Directorio Arise', quantity: 'OK', low_stock: false },
            { sku: 'DOC-REP-02', name: 'Emisión de Comprobantes Automatizados', quantity: 'PENDIENTE', low_stock: true },
            { sku: 'AI-ENG-03', name: 'Gemini 2.5 Flash-Lite Neural Engine', quantity: 'ACTIVO', low_stock: false }
        ];
    }

    // 3. Document Generation
    const template = Handlebars.compile(templateSource);
    const finalHtml = template(mockData);

    const isLandscape = type.includes('8-columnas');
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(finalHtml, { waitUntil: 'domcontentloaded' });
    
    const pdfBuffer = await page.pdf({ 
        format: 'A4',
        landscape: isLandscape,
        printBackground: true,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });
    await browser.close();

    const fileName = `Reporte_${reportType || 'Resumen'}_${Date.now()}.pdf`;

    // 4. WhatsApp Media Upload & Delivery
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

    await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
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
                caption: `📄 *Aquí tienes tu reporte de ${reportType || 'Resumen'}*\n\nOuroborusAI - Arise Business OS v9.0 ha finalizado el procesamiento.`,
                filename: fileName
            }
        })
    });

    // --- 5. INTERACTIVE FOLLOW-UP LIST (Diamond v9.0 Scale) ---
    await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: targetPhone,
            type: 'interactive',
            interactive: {
                type: 'list',
                header: { type: 'text', text: 'Operaciones Finalizadas' },
                body: { text: 'El procesamiento ha concluido exitosamente. ¿Qué deseas hacer a continuación?' },
                footer: { text: 'Arise Neural Assistant' },
                action: {
                    button: 'Ver Opciones',
                    sections: [
                        {
                            title: 'Navegación Maestro',
                            rows: [
                                { id: 'pdf_again', title: '🔄 Generar otro reporte', description: 'Reinicia el flujo de documentación' },
                                { id: 'back_to_menu', title: '⬅️ Volver al Menú', description: 'Regresa al panel de control principal' },
                                { id: 'talk_human', title: '👥 Hablar con Agente', description: 'Solicita asistencia humana inmediata' }
                            ]
                        },
                        {
                            title: 'Acciones de Reporte',
                            rows: [
                                { id: 'pdf_send_email', title: '📧 Enviar por Correo', description: 'Despacha este PDF a tu email registrado' },
                                { id: 'pdf_audit', title: '🔎 Auditar Datos', description: 'Inicia análisis profundo del reporte' }
                            ]
                        }
                    ]
                }
            }
        })
    });

    return NextResponse.json({ success: true, fileName });
  } catch (error: any) {
    console.error("PDF_PIPELINE_ERROR", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
