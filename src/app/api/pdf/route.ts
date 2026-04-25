import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import { templates } from '@/lib/pdf/templates';
import { requireAuth } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';

// Clave interna para llamadas del neural-processor (sin sesión de usuario)
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'arise_internal_v9_secret';

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
    // Autenticación dual: sesión de usuario O clave interna del neural-processor
    const internalKey = req.headers.get('x-api-key');
    const isInternalCall = internalKey === INTERNAL_API_KEY;

    if (!isInternalCall) {
      const authResult = await requireAuth();
      if (authResult.error) return authResult.error;
    }

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
    const validTypes = ['balance', 'factura', 'invoice', 'compliance', 'f29', 'liquidacion', 'sueldo', '8-columnas', 'dashboard', 'resumen', 'inventory', 'stock'];
    if (reportType && !validTypes.some(t => reportType.toLowerCase().includes(t))) {
        return NextResponse.json({
            error: `Invalid reportType. Valid options: ${validTypes.join(', ')}`
        }, { status: 400 });
    }

    // 1. Template Selection
    const type = (reportType || 'Resumen').toLowerCase();
    let templateSource = templates.default;
    
    // Try to fetch custom template from database first
    const { data: customTemplate } = await supabase
        .from('document_templates')
        .select('design_html')
        .ilike('document_type', `%${type}%`)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (customTemplate?.design_html) {
        console.log(`[PDF_PIPELINE] Using dynamic template from DB for: ${type}`);
        templateSource = customTemplate.design_html;
    } else {
        console.log(`[PDF_PIPELINE] Using hardcoded template for: ${type}`);
        if (type.includes('8-columnas')) templateSource = templates.columnas8;
        else if (type.includes('inventory') || type.includes('stock')) templateSource = templates.inventory;
        else if (type.includes('balance')) templateSource = templates.balance;
        else if (type.includes('factura') || type.includes('invoice')) templateSource = templates.invoice;
        else if (type.includes('compliance') || type.includes('f29')) templateSource = templates.compliance;
        else if (type.includes('liquidacion') || type.includes('sueldo')) templateSource = templates.payroll;
        else if (type.includes('dashboard') || type.includes('resumen')) templateSource = templates.dashboard;
    }

    // 2. Data Acquisition (Diamond v9.0 Summary Cache)
    const { data: companyData } = await supabase.from('companies').select('name').eq('id', companyId).single();
    
    let finalData: any = {
        date: new Date().toLocaleDateString('es-CL'),
        company_name: companyData?.name || 'Arise Business OS',
        folio: Math.floor(Math.random() * 9000) + 1000,
        items: []
    };

    // Attempt to fetch from SUMMARIES table first
    const summaryType = type.includes('8-columnas') ? '8-columnas' : 
                        (type.includes('inventory') || type.includes('stock')) ? 'inventory' : null;

    if (summaryType) {
        const { data: summary } = await supabase
            .from('financial_summaries')
            .select('summary_data')
            .eq('company_id', companyId)
            .eq('report_type', summaryType)
            .order('last_updated', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (summary?.summary_data) {
            console.log(`[PDF_PIPELINE] Using cached summary for: ${summaryType}`);
            finalData = { ...finalData, ...summary.summary_data };
            // Ensure company name and date are preserved from the current session if not in summary
            if (!finalData.company_name) finalData.company_name = companyData?.name || 'Arise Business OS';
            if (!finalData.date) finalData.date = new Date().toLocaleDateString('es-CL');
        } else {
            console.warn(`[PDF_PIPELINE] No summary found for ${summaryType}. Falling back to live data.`);
            // Fallback to legacy live data acquisition (maintaining compatibility)
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
        }
    } else if (type.includes('liquidacion') || type.includes('sueldo')) {
        // Payroll still uses mock for now as it lacks a summaries counterpart
        finalData.period = 'ABRIL 2026';
        finalData.employee_name = 'PERSONAL ARISE';
        finalData.net_salary = '$2,019,220';
        finalData.earnings = [{ name: 'Sueldo Base', amount: '$2,500,000', imponible: true }];
        finalData.deductions = [{ name: 'Previsión', amount: '$354,950' }];
    } else {
        // Default generic items
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
