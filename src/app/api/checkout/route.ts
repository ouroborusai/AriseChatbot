import { MercadoPagoConfig, Preference } from 'mercadopago';
import { NextResponse } from 'next/server';
import { requireAuth, verifyCompanyAccess } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';

/**
 *  CHECKOUT ENGINE v12.0 (Diamond Resilience)
 *  Orquestación de pasarela de pagos con MercadoPago y Aislamiento Tenant.
 *  Cero 'any'.
 */

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || ''
});

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;
if (!INTERNAL_API_KEY) throw new Error('[CHECKOUT] INTERNAL_API_KEY env var is not set');

// Cliente de infraestructura para telemetría
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.ARISE_MASTER_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!
);

export async function POST(req: Request) {
  try {
    // Autenticación dual: sesión de usuario O clave interna master
    const internalKey = req.headers.get('x-api-key');
    const isInternalCall = internalKey === INTERNAL_API_KEY;

    let userId: string | null = null;

    if (!isInternalCall) {
      const authResult = await requireAuth();
      if (authResult.error) return authResult.error;
      userId = authResult.user.id;
    }

    const { companyId, companyName, userEmail, userName } = (await req.json()) as {
      companyId: string;
      companyName: string;
      userEmail: string;
      userName?: string;
    };

    // 🛡️ Validación Diamond: Parámetros y Formatos
    if (!companyId || !companyName || !userEmail) {
      return NextResponse.json(
        { error: 'Incomplete_Request: companyId, companyName, userEmail required' },
        { status: 400 }
      );
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(companyId)) {
      return NextResponse.json({ error: 'Security_Violation: Invalid companyId UUID format' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return NextResponse.json({ error: 'Security_Violation: Invalid email format' }, { status: 400 });
    }

    // 🛡️ Aislamiento Tenant: Verificar acceso
    if (!isInternalCall && userId) {
      const hasAccess = await verifyCompanyAccess(userId, companyId);
      if (!hasAccess) {
        return NextResponse.json({ error: 'Access_Denied: Tenant isolation violation' }, { status: 403 });
      }
    }

    // 2. Creación de Preferencia MercadoPago
    const preference = new Preference(client);
    
    const result = await preference.create({
      body: {
        items: [
          {
            id: 'plan_pro_monthly',
            title: `ARISE Business OS - Plan PRO (${companyName})`,
            quantity: 1,
            unit_price: 29990, // CLP
            currency_id: 'CLP',
          }
        ],
        payer: {
          email: userEmail,
          name: userName || 'Cliente Arise'
        },
        metadata: {
          company_id: companyId,
          user_email: userEmail,
          plan_type: 'pro'
        },
        back_urls: {
          success: `${req.headers.get('origin')}/dashboard?checkout=success`,
          failure: `${req.headers.get('origin')}/dashboard?checkout=failure`,
          pending: `${req.headers.get('origin')}/dashboard?checkout=pending`,
        },
        auto_return: 'approved',
        notification_url: process.env.MERCADOPAGO_NOTIFICATION_URL || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/mercadopago-webhook`,
      }
    });

    // Auditoría Diamond
    await supabase.from('audit_logs').insert({
      company_id: companyId,
      action: 'CHECKOUT_PREFERENCE_CREATED',
      new_data: { preference_id: result.id, email: userEmail }
    });

    return NextResponse.json({
      init_point: result.init_point,
      preference_id: result.id
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[CHECKOUT_FAILURE]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
