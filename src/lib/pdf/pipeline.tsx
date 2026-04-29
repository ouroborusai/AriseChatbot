import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { AriseDocument } from './AriseDocument';
import { createClient } from '@supabase/supabase-js';

export interface PDFPipelineParams {
  targetPhone: string;
  whatsappToken: string;
  phoneNumberId: string;
  reportType: string;
  companyId: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
  process.env.SUPABASE_SERVICE_ROLE_KEY!.trim()
);


export async function executePDFPipeline(params: PDFPipelineParams) {
  const { targetPhone, whatsappToken, phoneNumberId, reportType, companyId } = params;
  
  // 0. Limpieza de tipo de reporte
  const cleanReportType = reportType.replace('pdf_', '');

  try {
    // 1. Obtener Data desde Supabase (Simulado o Real según el tipo)
    let data: any = { period: 'ABRIL 2026', folio: '001' };
    
    // Inyectar data real si existe en financial_summaries
    const { data: dbData } = await supabase
      .from('financial_summaries')
      .select('data')
      .eq('company_id', companyId)
      .eq('report_type', cleanReportType)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbData?.data) {
        data = { ...data, ...dbData.data };
    }

    // 2. Renderizar PDF
    const pdfBuffer = await renderToBuffer(
      <AriseDocument
        reportType={cleanReportType}
        companyName="Arise Business OS"
        date={new Date().toLocaleDateString('es-CL')}
        data={data}
      />
    );

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
    await supabase.from('prepared_reports').upsert({
      company_id: companyId,
      report_type: cleanReportType,
      media_id: mediaId,
      storage_path: storagePath,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
    });


    // 5. Enviar Documento al Usuario
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
    console.error('[PDF_PIPELINE_ERROR]', error.message);
    throw error;
  }
}
