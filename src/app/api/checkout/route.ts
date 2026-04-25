import { MercadoPagoConfig, Preference } from 'mercadopago';
import { NextResponse } from 'next/server';
import { requireAuth, verifyCompanyAccess } from '@/lib/api-auth';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || ''
});

// Clave interna para llamadas del neural-processor
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'arise_internal_v9_secret';


export async function POST(req: Request) {
  try {
    // Autenticación dual: sesión de usuario O clave interna
    const internalKey = req.headers.get('x-api-key');
    const isInternalCall = internalKey === INTERNAL_API_KEY;

    let userId = null;

    if (!isInternalCall) {
      const authResult = await requireAuth();
      if (authResult.error) return authResult.error;
      userId = authResult.user.id;
    }


    const { companyId, companyName, userEmail } = await req.json();

    // Validar inputs requeridos
    if (!companyId || !companyName || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required parameters: companyId, companyName, userEmail' },
        { status: 400 }
      );
    }

    // Validar formato de UUID para companyId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(companyId)) {
      return NextResponse.json({ error: 'Invalid companyId format. Expected UUID' }, { status: 400 });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Verificar acceso a la compañía (solo si no es llamada interna)
    if (!isInternalCall && userId) {
      const hasAccess = await verifyCompanyAccess(userId, companyId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied to this company' },
          { status: 403 }
        );
      }
    }


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

    return NextResponse.json({
      init_point: result.init_point,
      preference_id: result.id
    });
  } catch (error: unknown) {
    console.error('MP_CHECKOUT_ERROR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
