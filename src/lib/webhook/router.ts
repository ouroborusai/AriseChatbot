import { executePDFPipeline } from '../pdf/pipeline';
import { waitUntil } from '@vercel/functions';
import { supabase, sendWhatsAppDocument, logEvent } from './utils';
import { sendWhatsAppMessage } from '../neural-engine/whatsapp';

export const ACTION_PREFIXES = {
  BUTTON: 'btn_',
  LIST: 'lst_',
  TECHNICAL: 'tech_',
};

/**
 * Normaliza y valida si el ID del botón corresponde a una acción de reporte.
 */
export function getRequestedReportType(buttonId: string | undefined): string | null {
  if (!buttonId) return null;
  
  const rawId = buttonId.toLowerCase();

  if (rawId.includes('8columnas')) return '8-columnas';
  if (rawId.includes('resultados')) return 'estado-resultados';
  if (rawId.includes('inventario')) return 'inventory';
  if (rawId.includes('ventas')) return 'ventas-mensual';
  if (rawId.includes('remuneraciones')) return 'remuneraciones';

  if (rawId.startsWith('pdf_')) {
    return rawId.replace('pdf_', '').replace('_', '-');
  }
  
  return null;
}

/**
 * Orquestador de ruteo con Telemetría Diamond v10.2
 */
export async function handleActionRouting(params: {
  buttonId: string | undefined;
  content: string;
  sender: string;
  companyId: string;
  whatsappToken: string;
  phoneNumberId: string;
}) {
  const { buttonId, sender, companyId, whatsappToken, phoneNumberId } = params;
  
  const reportType = getRequestedReportType(buttonId);
  
  if (reportType) {
    await logEvent({
      companyId,
      action: `PDF_REQUEST_DETECTED: ${reportType}`,
      details: { sender, buttonId }
    });

    // 1. Búsqueda en Caché
    const { data: cached, error: cacheError } = await supabase
      .from('prepared_reports')
      .select('media_id')
      .eq('company_id', companyId)
      .eq('report_type', reportType)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (cacheError) {
        await logEvent({ companyId, action: 'CACHE_CHECK_ERROR', details: { error: cacheError.message } });
    }

    if (cached?.media_id) {
      await logEvent({ companyId, action: 'SHADOW_PDF_HIT', details: { mediaId: cached.media_id } });
      
      const sendPromise = sendWhatsAppDocument({
        to: sender,
        mediaId: cached.media_id,
        filename: `Reporte_${reportType}_Instant.pdf`,
        token: whatsappToken,
        phoneId: phoneNumberId
      }).then(async (res) => {
          const resData = await res.json();
          await logEvent({ 
              companyId, 
              action: res.ok ? 'SHADOW_SEND_SUCCESS' : 'SHADOW_SEND_FAILED', 
              details: resData 
          });
      });

      waitUntil(sendPromise);
      return true;
    }

    // 2. Fallback: Generación en Tiempo Real
    await logEvent({ companyId, action: 'CACHE_MISS_LAUNCHING_PIPELINE', details: { reportType } });
    
    const pdfPromise = executePDFPipeline({
      targetPhone: sender,
      whatsappToken,
      phoneNumberId,
      reportType,
      companyId
    }).then(async (res) => {
        await logEvent({ companyId, action: 'PDF_PIPELINE_COMPLETED', details: res });
    }).catch(async (err) => {
        await logEvent({ companyId, action: 'PDF_PIPELINE_CRASHED', details: { error: err.message } });
        // NOTIFICACIÓN AL USUARIO
        await sendWhatsAppMessage({
            to: sender,
            text: `⚠️ *Arise Debug:* Falló la generación del reporte *${reportType}*.\n\n*Motivo:* ${err.message}\n\nRevisando logs para corregir...`,
            phoneNumberId,
            whatsappToken,
            companyId
        });
    });


    waitUntil(pdfPromise);
    return true;
  }

  return false;
}
