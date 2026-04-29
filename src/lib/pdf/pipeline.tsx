import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { AriseDocument } from './AriseDocument';
import { createClient } from '@supabase/supabase-js';
import { logEvent } from '../webhook/utils';

export interface PDFPipelineParams {
  targetPhone: string;
  whatsappToken: string;
  phoneNumberId: string;
  reportType: string;
  companyId: string;
  isPreGen?: boolean; // LM Protocol: Si es true, solo genera y cachea, no envía.
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
  (process.env.ARISE_MASTER_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!.trim()
);

export async function executePDFPipeline(params: PDFPipelineParams) {
  const { targetPhone, whatsappToken, phoneNumberId, reportType, companyId, isPreGen } = params;
  
  // 0. Limpieza de tipo de reporte
  const cleanReportType = reportType.replace('pdf_', '');

  try {
    // 0. Validación de Seguridad (Platinum v10.4)
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('status, name')
      .eq('id', companyId)
      .single();

    if (companyError || !company || company.status !== 'active') {
        throw new Error(`ACCESO DENEGADO: Empresa ${companyId} no activa o inexistente.`);
    }

    await logEvent({ companyId, action: 'PDF_PIPELINE_STARTED', details: { reportType: cleanReportType, targetPhone } });

    // 1. Obtener Data desde Supabase
    // LM Audit: Dynamic Metadata Injection (D5 Fix)
    const currentMonth = new Intl.DateTimeFormat('es-CL', { month: 'long' }).format(new Date());
    const currentYear = new Date().getFullYear();
    let data: any = { 
        period: `${currentMonth.toUpperCase()} ${currentYear}`, 
        folio: `ARISE-${Date.now().toString().slice(-6)}` 
    };
    
    const { data: dbData } = await supabase
      .from('financial_summaries')
      .select('summary_data')
      .eq('company_id', companyId)
      .eq('report_type', cleanReportType)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbData?.summary_data) {
        data = { ...data, ...dbData.summary_data };
    }

    // 2. Renderizar PDF (RESTAURADO)
    const pdfBuffer = await renderToBuffer(
      <AriseDocument
        reportType={cleanReportType}
        companyName="Arise Business OS"
        date={new Date().toLocaleDateString('es-CL')}
        data={data}
      />
    );

    await logEvent({ companyId, action: 'PDF_RENDER_SUCCESS', details: { reportType: cleanReportType } });

    // 3. Subir a Meta WhatsApp Media API
    const formData = new FormData();
    formData.append('file', new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' }), `Reporte_${cleanReportType}.pdf`);
    formData.append('type', 'application/pdf');
    formData.append('messaging_product', 'whatsapp');

    const uploadRes = await fetch(`https://graph.facebook.com/v23.0/${phoneNumberId}/media`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${whatsappToken}` },
      body: formData,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json();
      throw new Error(`Meta Upload Failed: ${JSON.stringify(err)}`);
    }

    const { id: mediaId } = await uploadRes.json();
    await logEvent({ companyId, action: 'PDF_META_UPLOAD_SUCCESS', details: { mediaId } });

    // 4. GUARDAR EN SUPABASE STORAGE
    const storagePath = `${companyId}/${cleanReportType}_${Date.now()}.pdf`;
    const { error: storageError } = await supabase.storage
      .from('reports')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (storageError) {
        console.error('[STORAGE_ERROR]', storageError);
    }

    // 5. GUARDAR EN CACHÉ (Shadow PDF)
    const { error: cacheError } = await supabase.from('prepared_reports').upsert({
      company_id: companyId,
      report_type: cleanReportType,
      media_id: mediaId,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
    }, { onConflict: 'company_id,report_type' });

    if (cacheError) {
      await logEvent({ companyId, action: 'CACHE_UPSERT_FAILED', details: { error: cacheError.message } });
    } else {
      await logEvent({ companyId, action: 'CACHE_UPSERT_SUCCESS', details: { reportType: cleanReportType } });
    }

    // 6. Enviar Documento al Usuario (Saltar si es Pre-generación)
    if (isPreGen) {
      await logEvent({ companyId, action: 'PDF_PREGEN_COMPLETED', details: { mediaId } });
      return { success: true, mediaId, cached: true, sent: false };
    }

    const sendRes = await fetch(`https://graph.facebook.com/v23.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: targetPhone,
        type: 'document',
        document: {
          id: mediaId,
          filename: `Reporte_${cleanReportType}.pdf`,
          caption: `✅ Tu reporte de ${cleanReportType} ha sido generado con éxito.`
        },
      }),
    });

    return { success: true, mediaId, sent: sendRes.ok };

  } catch (error: any) {
    await logEvent({ companyId, action: 'PDF_PIPELINE_CRASHED', details: { error: error.message } });
    console.error('[PDF_PIPELINE_ERROR]', error.message);
    throw error;
  }
}
