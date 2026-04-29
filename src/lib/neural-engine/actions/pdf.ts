import { SupabaseClient } from '@supabase/supabase-js';

export async function handlePdfAction(
  supabase: SupabaseClient,
  actionData: any,
  companyId: string,
  messageId: string
) {
  const results: any[] = [];

  if (actionData.action === 'pdf_generate') {
    const { data: msgInfo } = await supabase.from('messages').select('conversation_id').eq('id', messageId).single();

    if (msgInfo) {
      const { data: contactInfo } = await supabase.from('conversations').select('contacts(phone)').eq('id', msgInfo.conversation_id).single();
      const phone = (contactInfo as any)?.contacts?.phone;

      if (phone) {
        const { data: companyData } = await supabase.from('companies').select('settings').eq('id', companyId).single();
        const whatsappToken = companyData?.settings?.whatsapp?.access_token || process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneNumberId = companyData?.settings?.whatsapp?.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID;

        if (!whatsappToken || !phoneNumberId) {
          results.push({ action: 'pdf_generate', status: 'failed', error: 'Missing WhatsApp configuration' });
          return results;
        }

        const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 
              (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 
              (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'));
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

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
              reportType: actionData.report_type || actionData.parameters?.report_type || actionData.type || actionData.parameters?.type || 'inventory',
              companyId: companyId,
              isPreGen: false // LM Protocol: Si viene de la IA, enviar al usuario.
            }),
          });

          const resData = await response.json();
          clearTimeout(timeout);

          results.push({ 
            action: 'pdf_generate', 
            status: response.ok ? 'success' : 'failed', 
            to: phone,
            details: resData.fileName || resData.error
          });
        } catch (err: any) {
          results.push({ 
            action: 'pdf_generate', 
            status: 'error', 
            to: phone, 
            error: err.name === 'AbortError' ? 'Timeout (30s)' : err.message 
          });
        }
      }
    }
  }

  return results;
}
