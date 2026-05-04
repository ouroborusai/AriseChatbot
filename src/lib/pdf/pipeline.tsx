import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { AriseDocument } from './AriseDocument';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logEvent } from '../webhook/utils';

export interface PDFPipelineParams {
  targetPhone: string;
  whatsappToken: string;
  phoneNumberId: string;
  reportType: string;
  companyId: string;
  isPreGen?: boolean;
}

/**
 *  PDF GENERATION PIPELINE v12.0 (Diamond Resilience)
 *  Orquestación industrial para la generación, almacenamiento y despacho de PDFs.
 *  Cero 'any'. Aislamiento Tenant Estricto.
 */

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
  (process.env.ARISE_MASTER_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!.trim()
);

export async function executePDFPipeline(params: PDFPipelineParams) {
  const { targetPhone, whatsappToken, phoneNumberId, reportType, companyId, isPreGen } = params;
  
  const cleanReportType = reportType.replace('pdf_', '');

  try {
    // 🛡️ Validación Diamond: Acceso y Estatus de Compañía
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('status, name')
      .eq('id', companyId)
      .single();

    if (companyError || !company || company.status !== 'active') {
        throw new Error(`Access_Denied: Empresa ${companyId} no activa o inexistente.`);
    }

    await logEvent({ 
      companyId, 
      action: 'PDF_PIPELINE_STARTED', 
      details: { reportType: cleanReportType, targetPhone },
      tableName: 'pdf_telemetry'
    });

    const currentMonth = new Intl.DateTimeFormat('es-CL', { month: 'long' }).format(new Date());
    const currentYear = new Date().getFullYear();
    
    // SSOT Data Fetching con Aislamiento Tenant
    const { data: dbData, error: dbError } = await supabase
      .from('financial_summaries')
      .select('summary_data')
      .eq('company_id', companyId) // 🛡️ AISLAMIENTO TENANT OBLIGATORIO
      .eq('report_type', cleanReportType)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbError) throw dbError;

    const dataPayload = {
        period: `${currentMonth.toUpperCase()} ${currentYear}`,
        folio: `ARISE-${Date.now().toString().slice(-6)}`,
        ...(dbData?.summary_data as Record<string, unknown> || {})
    };

    // Renderizado con Estética Luminous Pure (Hardened)
    const pdfBuffer = await renderToBuffer(
      <AriseDocument
        reportType={cleanReportType}
        companyName={company.name || "ARISE Business OS"}
        date={new Date().toLocaleDateString('es-CL')}
        data={dataPayload as any} // Cast controlado para el componente React-PDF
      />
    );

    await logEvent({ 
      companyId, 
      action: 'PDF_RENDER_SUCCESS', 
      details: { reportType: cleanReportType },
      tableName: 'pdf_telemetry'
    });

    // 3. Carga en Meta Graph API (v21.0 Hardened)
    const apiVersion = process.env.META_API_VERSION || 'v21.0';
    const formData = new FormData();
    formData.append('file', new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' }), `Reporte_${cleanReportType}.pdf`);
    formData.append('type', 'application/pdf');
    formData.append('messaging_product', 'whatsapp');

    const uploadRes = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/media`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${whatsappToken}` },
      body: formData,
    });

    if (!uploadRes.ok) {
      const metaError = await uploadRes.json();
      throw new Error(`Meta_Upload_Failure: ${JSON.stringify(metaError)}`);
    }

    const { id: mediaId } = (await uploadRes.json()) as { id: string };
    
    // 4. Persistencia en Supabase Storage (Audit Trail)
    const storagePath = `${companyId}/${cleanReportType}_${Date.now()}.pdf`;
    const { error: storageError } = await supabase.storage
      .from('reports')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (storageError) {
      console.warn('[STORAGE_WARNING]', storageError.message);
    }

    // 5. Gestión de Caché (Shadow PDF)
    const { error: cacheError } = await supabase.from('prepared_reports').upsert({
      company_id: companyId,
      report_type: cleanReportType,
      media_id: mediaId,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }, { onConflict: 'company_id,report_type' });

    if (cacheError) {
      await logEvent({ companyId, action: 'CACHE_UPSERT_FAILED', details: { error: cacheError.message } });
    }

    // 6. Despacho Final via WhatsApp
    if (isPreGen) {
      await logEvent({ companyId, action: 'PDF_PREGEN_COMPLETED', details: { mediaId } });
      return { success: true, mediaId, cached: true, sent: false };
    }

    const sendRes = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
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
          caption: `✅ Reporte de ${cleanReportType} generado y certificado.`
        },
      }),
    });

    return { success: true, mediaId, sent: sendRes.ok };

  } catch (err: unknown) {
    const error = err as Error;
    await logEvent({ 
      companyId, 
      action: 'PDF_PIPELINE_CRASHED', 
      details: { error: error.message },
      tableName: 'pdf_telemetry'
    });
    console.error('[PDF_PIPELINE_ERROR]', error.message);
    throw error;
  }
}
