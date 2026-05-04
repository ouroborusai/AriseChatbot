import { SupabaseClient } from '@supabase/supabase-js';
import { NeuralActionResult, NeuralActionPayload } from '@/lib/whatsapp/types';

/**
 *  PAYMENT HANDLER v12.0 (Diamond Resilience)
 *  Orquestación de links de pago y pasarelas con aislamiento tenant.
 *  Cero 'any'.
 */
export async function handlePaymentAction(
  supabase: SupabaseClient,
  actionData: NeuralActionPayload,
  companyId: string,
  messageId: string
): Promise<NeuralActionResult[]> {
  const results: NeuralActionResult[] = [];

  try {
    // 1. PAYMENT_LINK_GENERATE
    if (actionData.action === 'payment_link_generate' || actionData.action === 'payment_link') {
      
      // 🛡️ Optimización Diamond: Si ya tenemos el contexto, evitamos queries redundantes.
      // Pero para máxima seguridad en la resolución del email/phone, validamos el contacto.
      
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('phone, email, first_name')
        .eq('id', actionData.contact_id)
        .eq('company_id', companyId) // Blindaje Tenant Directo
        .single();

      if (contactError || !contactData) {
        // Fallback: Resolución vía mensaje si el contact_id falla
        const { data: msgData, error: msgError } = await supabase
          .from('messages')
          .select(`
            conversations!inner(
              contacts(phone, email, first_name)
            )
          `)
          .eq('id', messageId)
          .eq('company_id', companyId)
          .single();

        if (msgError || !msgData) {
          throw new Error(`Payment_Context_Failed: Unauthorized or missing contact context`);
        }

        const fallbackConv = msgData.conversations as unknown as { 
          contacts: { phone: string | null; email: string | null; first_name: string | null } 
        };
        
        const contact = fallbackConv.contacts;
        const phone = contact?.phone;
        const email = contact?.email;
        const name = contact?.first_name || 'Cliente';

        return await executeCheckout(supabase, companyId, email, phone, name, actionData.action, results);
      }

      const phone = contactData.phone;
      const email = contactData.email;
      const name = contactData.first_name || 'Cliente';

      return await executeCheckout(supabase, companyId, email, phone, name, actionData.action, results);
    }
  } catch (err: unknown) {
    const error = err as Error;
    results.push({
      action: actionData.action,
      status: 'error',
      error: error.message
    });
  }

  return results;
}

/**
 * Lógica de ejecución de checkout centralizada
 */
async function executeCheckout(
  supabase: SupabaseClient,
  companyId: string,
  email: string | null,
  phone: string | null,
  name: string,
  action: string,
  results: NeuralActionResult[]
): Promise<NeuralActionResult[]> {
  if (!email) {
    results.push({
      action: action,
      status: 'validation_failed',
      error: 'Email_Required: El contacto no tiene un email configurado para MercadoPago.'
    });
    return results;
  }

  if (phone) {
    const { data: companyData } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();

    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

    if (!INTERNAL_API_KEY) {
      throw new Error('Infrastructure_Failure: INTERNAL_API_KEY missing');
    }

    const response = await fetch(`${appUrl}/api/checkout`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': INTERNAL_API_KEY
      },
      body: JSON.stringify({
        companyId: companyId,
        companyName: companyData?.name || 'ARISE Business OS',
        userEmail: email,
        userName: name
      }),
    });

    const checkoutData = (await response.json()) as { init_point?: string; error?: string };

    if (checkoutData.init_point) {
      await supabase.from('audit_logs').insert({
        company_id: companyId,
        action: 'PAYMENT_LINK_GENERATED',
        new_data: { email, phone, status: 'success' }
      });

      results.push({
        action: action,
        status: 'success',
        url: checkoutData.init_point,
        to: phone
      });
    } else {
      throw new Error(checkoutData.error || 'Checkout_Service_Failure');
    }
  }
  
  return results;
}
