import { SupabaseClient } from '@supabase/supabase-js';

export async function handlePaymentAction(
  supabase: SupabaseClient,
  actionData: any,
  companyId: string,
  messageId: string
) {
  const results: any[] = [];

  // 1. PAYMENT_LINK_GENERATE
  if (actionData.action === 'payment_link_generate') {
    const { data: msgInfo } = await supabase.from('messages').select('conversation_id').eq('id', messageId).single();

    if (msgInfo) {
      const { data: contactInfo } = await supabase.from('conversations').select('contacts(phone, email, first_name)').eq('id', msgInfo.conversation_id).single();
      const phone = (contactInfo as any)?.contacts?.phone;
      const email = (contactInfo as any)?.contacts?.email || 'noreply@arise.ai';
      const name = (contactInfo as any)?.contacts?.first_name || 'Cliente Arise';

      if (phone) {
        const { data: companyData } = await supabase.from('companies').select('name').eq('id', companyId).single();
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'arise_internal_v9_secret';

        try {
          const response = await fetch(`${appUrl}/api/checkout`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-api-key': INTERNAL_API_KEY
            },
            body: JSON.stringify({
              companyId: companyId,
              companyName: companyData?.name || 'Arise Business OS',
              userEmail: email,
            }),
          });

          const checkoutData = await response.json();

          if (checkoutData.init_point) {
            results.push({
              action: 'payment_link_generate',
              status: 'success',
              url: checkoutData.init_point,
              to: phone
            });
          } else {
            results.push({
              action: 'payment_link_generate',
              status: 'failed',
              error: checkoutData.error || 'Failed to generate link'
            });
          }
        } catch (err: any) {
          results.push({
            action: 'payment_link_generate',
            status: 'failed',
            error: err.message
          });
        }
      }
    }
  }

  return results;
}
