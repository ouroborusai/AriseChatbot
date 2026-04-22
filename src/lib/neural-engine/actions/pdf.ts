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

        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        fetch(`${appUrl}/api/pdf`, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetPhone: phone,
            whatsappToken,
            phoneNumberId,
            reportType: actionData.type || 'balance',
            companyId: companyId,
          }),
        })
          .catch(err => {
            if (err.name === 'AbortError') {
              console.error('[PDF_ACTION_TIMEOUT] 30s exceeded');
            } else {
              console.error('[PDF_ACTION_ERROR]', err);
            }
          })
          .finally(() => clearTimeout(timeout));

        results.push({ action: 'pdf_generate', status: 'triggered', to: phone });
      }
    }
  }

  return results;
}
