import { MercadoPagoConfig, Preference } from 'mercadopago';
import { NextResponse } from 'next/server';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '' 
});

export async function POST(req: Request) {
  try {
    const { companyId, companyName, userEmail } = await req.json();

    const preference = new Preference(client);
    
    const result = await preference.create({
      body: {
        items: [
          {
            id: 'plan_pro_monthly',
          title: `Arise Business OS - Plan PRO (${companyName})`,
          quantity: 1,
          unit_price: 29990, // Ejemplo: 29.990 CLP
          currency_id: 'CLP',
        }
      ],
      metadata: {
        company_id: companyId,
        user_email: userEmail,
        plan_type: 'pro'
      },
      back_urls: {
        success: `${req.headers.get('origin')}/dashboard?status=success`,
        failure: `${req.headers.get('origin')}/dashboard?status=failure`,
        pending: `${req.headers.get('origin')}/dashboard?status=pending`,
      },
      auto_return: 'approved',
      notification_url: `https://zosravrfpfechanatucx.supabase.co/functions/v1/mercadopago-webhook`, // Usaremos una Edge Function para el webhook
    }
    });

    return NextResponse.json({ init_point: result.init_point });
  } catch (error: any) {
    console.error('MP_CHECKOUT_ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
