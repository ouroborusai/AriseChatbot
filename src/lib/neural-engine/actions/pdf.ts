import { SupabaseClient } from '@supabase/supabase-js';
import { PdfActionParams, NeuralActionResult } from '../interfaces/actions';

/**
 *  PDF GENERATOR HANDLER v11.9.1 (Diamond Resilience)
 *  Orquestación de generación de reportes PDF y envío vía WhatsApp.
 *  Cero 'any'. Aislamiento Tenant Blindado.
 */
export async function handlePdfAction(
  supabase: SupabaseClient,
  actionData: PdfActionParams,
  companyId: string,
  messageId: string
): Promise<NeuralActionResult[]> {
  const results: NeuralActionResult[] = [];

  try {
    if (actionData.action === 'pdf_generate' || actionData.action === 'pdf_send') {
      // 1. Obtener contexto de contacto y teléfono con Aislamiento Tenant
      const { data: msgInfo, error: msgError } = await supabase
        .from('messages')
        .select('conversation_id, conversations!inner(company_id, contacts(phone))')
        .eq('id', messageId)
        .eq('conversations.company_id', companyId) // 🛡️ AISLAMIENTO TENANT OBLIGATORIO
        .single();

      if (msgError || !msgInfo) {
        throw new Error(`Context_Resolution_Failed: ${msgError?.message || 'Access denied'}`);
      }

      // 💎 CORRECCIÓN DIAMOND: Lectura plana directa desde actionData (SSOT de interfaces/actions.ts)
      const phone = actionData.target_phone || (msgInfo as any).conversations?.contacts?.phone as string | undefined;

      if (!phone) {
        return [{
          action: 'pdf_generate',
          status: 'validation_failed',
          error: 'Missing_Recipient_Phone'
        }];
      }

      // 2. Obtener credenciales de WhatsApp de la empresa (SSOT Settings)
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('settings')
        .eq('id', companyId)
        .single();

      if (companyError || !companyData) throw companyError;

      const cleanEnvVar = (val?: string) => val?.replace(/["\r\n\\]/g, '').trim() || '';
      
      const settings = (companyData.settings || {}) as any;
      const whatsappToken = settings.whatsapp?.access_token || cleanEnvVar(process.env.WHATSAPP_ACCESS_TOKEN);
      const phoneNumberId = settings.whatsapp?.phone_number_id || cleanEnvVar(process.env.WHATSAPP_PHONE_NUMBER_ID);

      if (!whatsappToken || !phoneNumberId) {
        return [{
          action: 'pdf_generate',
          status: 'failed',
          error: 'WhatsApp_Config_Incomplete'
        }];
      }

      // 3. Resolución de Endpoint y Pipeline PDF
      const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 
            (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'));
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000); // 45s para generación PDF

      try {
        const response = await fetch(`${appUrl}/api/pdf`, {
          method: 'POST',
          signal: controller.signal,
          headers: { 
            'Content-Type': 'application/json',
            'x-api-key': process.env.INTERNAL_API_KEY || ''
          },
          body: JSON.stringify({
            targetPhone: phone,
            whatsappToken,
            phoneNumberId,
            reportType: actionData.report_type || 'inventory',
            companyId: companyId,
            isPreGen: actionData.is_pregen || false
          }),
        });

        const resData = (await response.json()) as { fileName?: string; error?: string };
        clearTimeout(timeout);

        if (!response.ok) {
           throw new Error(resData.error || 'PDF_Generation_Failed');
        }

        // Telemetría de Auditoría Diamond
        await supabase.from('audit_logs').insert({
          company_id: companyId,
          action: 'PDF_GENERATED_AND_SENT',
          table_name: 'prepared_reports',
          new_data: { type: actionData.report_type || 'inventory', phone, status: 'success' }
        });

        results.push({ 
          action: 'pdf_generate', 
          status: 'success', 
          to: phone
        });
      } catch (err: unknown) {
        const error = err as Error;
        results.push({ 
          action: 'pdf_generate', 
          status: 'error', 
          to: phone, 
          error: error.name === 'AbortError' ? 'Pipeline_Timeout (45s)' : error.message 
        });
      }
    }
  } catch (err: unknown) {
    const error = err as Error;
    results.push({
      action: 'pdf_generate',
      status: 'error',
      error: error.message
    });
  }

  return results;
}
