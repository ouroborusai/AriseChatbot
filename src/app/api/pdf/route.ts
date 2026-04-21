import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import { templates } from '@/lib/pdf/templates';
import { requireAuth } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * ARISE PDF PIPELINE v9.0
 * Handles high-precision document generation and WhatsApp delivery.
 */
export async function POST(req: Request) {
  try {
    // Verificar autenticación
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;

    const { targetPhone, whatsappToken, phoneNumberId, reportType, companyId } = await req.json();

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

    // 2. Data Acquisition
    const { data: companyData } = await supabase.from('companies').select('name').eq('id', companyId).single();
    
    let finalData: any = {
        date: new Date().toLocaleDateString('es-CL'),
        company_name: companyData?.name || 'Arise Business OS',
        folio: Math.floor(Math.random() * 9000) + 1000,
        items: []
    };

    // --- CASE 1: REAL INVENTORY DATA ---
    if (type.includes('inventory') || type.includes('stock')) {
        const { data: realItems } = await supabase
            .from('inventory_items')
            .select('sku, name, current_stock')
            .eq('company_id', companyId)
            .order('name');
        
        if (realItems && realItems.length > 0) {
            finalData.items = realItems.map(i => ({
                sku: i.sku,
                name: i.name,
                quantity: `${i.current_stock} uds.`,
                low_stock: i.current_stock < 5 
            }));
        }
    } 
    // --- CASE 2: 8 COLUMNAS (Accounting Mock) ---
    else if (type.includes('8-columnas')) {
        finalData.company_rut = '76.462.417-3';
        finalData.company_address = 'AVENIDA PLAYA BRAVA #2109-A IQUIQUE';
        finalData.rep_legal = 'MARCO ANTONIO ROJAS REJAS';
        finalData.period = 'ENERO A DICIEMBRE 2023';
        finalData.accounts = [
            { name: '1101-01 CUENTA CAJA', sum_debit: '1.182.433.333', sum_credit: '973.893.183', balance_deudor: '208.540.150', balance_acreedor: '', inventory_asset: '208.540.150', inventory_liability: '', result_loss: '', result_gain: '' },
            { name: '1104-01 DEUDORES CLIENTES', sum_debit: '252.983', sum_credit: '', balance_deudor: '252.983', balance_acreedor: '', inventory_asset: '252.983', inventory_liability: '', result_loss: '', result_gain: '' },
            { name: '2105-01 FACTURAS POR PAGAR', sum_debit: '940.621.653', sum_credit: '2.008.133.798', balance_deudor: '', balance_acreedor: '1.067.512.145', inventory_asset: '', inventory_liability: '1.067.512.145', result_loss: '', result_gain: '' },
            { name: '5101-01 VENTAS', sum_debit: '', sum_credit: '306.762.825', balance_deudor: '', balance_acreedor: '306.762.825', inventory_asset: '', inventory_liability: '', result_loss: '', result_gain: '306.762.825' }
        ];
        finalData.totals = {
            sum_debit: '4.277.116.904', sum_credit: '4.277.116.904',
            balance_deudor: '1.849.234.584', balance_acreedor: '1.849.234.584',
            inventory_asset: '1.353.157.804', inventory_liability: '1.353.157.804',
            result_loss: '508.604.586', result_gain: '508.604.586'
        };
    } 
    // --- CASE 3: PAYROLL (Mock) ---
    else if (type.includes('liquidacion') || type.includes('sueldo')) {
        finalData.period = 'ABRIL 2026';
        finalData.employee_name = 'PERSONAL ARISE';
        finalData.net_salary = '$2,019,220';
        finalData.earnings = [{ name: 'Sueldo Base', amount: '$2,500,000', imponible: true }];
        finalData.deductions = [{ name: 'Previsión', amount: '$354,950' }];
    } 
    // --- CASE 4: OTHER/GENERIC ---
    else {
        finalData.items = [
            { sku: 'SYS-SRV-01', name: 'Sincronización de Directorio Arise', quantity: 'OK', low_stock: false },
            { sku: 'DOC-REP-02', name: 'Emisión de Reportes Dynamicos', quantity: 'ACTIVO', low_stock: false }
        ];
    }

    // 3. Document Generation
    const template = Handlebars.compile(templateSource);
    const finalHtml = template(finalData);

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
