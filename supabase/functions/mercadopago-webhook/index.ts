import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const MP_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const url = new URL(req.url);
    const body = await req.json();
    
    // Mercado Pago envía notificaciones de diferentes tipos.
    // Buscamos específicamente 'payment' o 'subscription'
    const resourceId = body.data?.id || body.resource_id;
    const type = body.type || body.topic;

    if (type === 'payment' && resourceId) {
      // 1. Consultar el estado real del pago en Mercado Pago
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
        headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
      });

      if (mpRes.ok) {
        const payment = await mpRes.json();
        const { status, metadata } = payment;
        const companyId = metadata.company_id;

        if (status === 'approved' && companyId) {
          // 2. ASCENDER A PLAN PRO
          console.log(`[SUBSCRIPTION] Activando Plan PRO para empresa: ${companyId}`);

          // Diamond v10.1: Fetch atómico — obtener settings actuales ANTES de actualizar
          // Evita race condition con spread de async dentro de update()
          const { data: currentCompany, error: fetchError } = await supabase
            .from('companies')
            .select('settings')
            .eq('id', companyId)
            .single();

          if (fetchError || !currentCompany) {
            throw new Error(`[SUBSCRIPTION] No se pudo obtener datos de empresa ${companyId}: ${fetchError?.message}`);
          }

          const mergedSettings = {
            ...(currentCompany.settings || {}),
            subscription: {
              status: 'active',
              last_payment_id: resourceId,
              last_payment_date: new Date().toISOString(),
              tier: 'pro'
            }
          };

          const { error } = await supabase
            .from('companies')
            .update({
              plan_tier: 'pro',
              settings: mergedSettings
            })
            .eq('id', companyId);

          if (error) throw error;

          console.log(`[SUBSCRIPTION] Plan PRO activado exitosamente para empresa: ${companyId}`);
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (err: any) {
    console.error('WEBHOOK_ERROR:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
