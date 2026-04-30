import { NextResponse } from 'next/server';
import { executePDFPipeline } from '@/lib/pdf/pipeline';
import { requireAuth } from '@/lib/api-auth';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 *  PDF ORCHESTRATION API v11.9.1 (Diamond Resilience)
 *  Punto de entrada para la generación de reportes industriales.
 *  Cero 'any'. Aislamiento Tenant Blindado.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = (process.env.ARISE_MASTER_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();

if (!supabaseUrl || !supabaseKey) {
  throw new Error('[PDF_API] Missing Supabase Infrastructure Keys');
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;
    if (!INTERNAL_API_KEY) throw new Error('[PDF_API] INTERNAL_API_KEY missing');

    // Autenticación dual: máster interno O sesión de usuario
    const internalKey = req.headers.get('x-api-key');
    const isInternalCall = internalKey === INTERNAL_API_KEY;

    if (!isInternalCall) {
      const authResult = await requireAuth();
      if (authResult.error) return authResult.error;
    }

    const body = await req.json();
    const { targetPhone, whatsappToken, phoneNumberId, reportType, companyId, isPreGen } = body;

    // 🛡️ Validación Diamond: Contexto Tenant Mandatorio
    if (!companyId || !reportType) {
      return NextResponse.json(
        { error: 'Incomplete_Request: companyId and reportType required' },
        { status: 400 }
      );
    }

    // Telemetría de Entrada
    await supabase.from('audit_logs').insert({
      company_id: companyId,
      action: 'PDF_API_REQUEST_RECEIVED',
      new_data: { reportType, isPreGen }
    });

    // Delegación al Pipeline Hardened (v11.9.1)
    const result = await executePDFPipeline({
      targetPhone,
      whatsappToken,
      phoneNumberId,
      reportType,
      companyId,
      isPreGen
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[PDF_API_FAILURE]', error.message);
    
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
