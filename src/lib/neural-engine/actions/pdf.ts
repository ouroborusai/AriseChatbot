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
      // 1. Obtener contexto de contacto y teléfono (Bypass Resiliencia v11.9.1)
      const conversationId = (actionData as any).conversation_id;
      let phone = actionData.target_phone || (actionData as any).phone_number;

      // Si no tenemos el teléfono, lo buscamos en la conversación
      if (!phone && conversationId) {
        const { data: contactInfo } = await supabase
          .from('conversations')
          .select('contacts!inner(phone)')
          .eq('id', conversationId)
          .eq('company_id', companyId)
          .single();
        
        if (contactInfo) {
          phone = (contactInfo.contacts as unknown as { phone: string }).phone;
        }
      }

      if (!phone) {
        throw new Error('Context_Resolution_Failed: No recipient phone found in action context.');
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
