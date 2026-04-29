import { NextResponse } from 'next/server';
import { executePDFPipeline } from '@/lib/pdf/pipeline';
import { requireAuth } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase (se inicializa una vez)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = (process.env.ARISE_MASTER_SERVICE_KEY || process.env.ARISE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * ARISE PDF PIPELINE Diamond v10.1
 * Handles high-precision document generation and WhatsApp delivery.
 */
export async function POST(req: Request) {
  try {
    const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;
    
    // Log de entrada para diagnóstico
    if (supabase) {
      await supabase.from('audit_logs').insert({
        action: 'PDF_API_HIT',
        new_data: { timestamp: new Date().toISOString() }
      });
    }
    
    if (!INTERNAL_API_KEY) {
      console.error('[PDF_PIPELINE] INTERNAL_API_KEY is missing');
      return NextResponse.json({ error: 'System configuration error' }, { status: 500 });
    }

    if (!supabase) {
      console.error('[PDF_PIPELINE] Supabase client not initialized');
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }
    // Autenticación dual: sesión de usuario O clave interna del neural-processor
    const internalKey = req.headers.get('x-api-key');
    const serverKey = process.env.INTERNAL_API_KEY;
    const isInternalCall = internalKey === serverKey;

    console.log(`[PDF_AUTH_DEBUG] Received: ${internalKey?.substring(0, 10)}..., ServerKey: ${serverKey?.substring(0, 10)}..., Match: ${isInternalCall}`);

    if (!isInternalCall) {
      console.warn('[PDF_AUTH_FAILED] Key mismatch or missing. Falling back to requireAuth().');
      const authResult = await requireAuth();
      if (authResult.error) {
        console.error('[PDF_AUTH_CRITICAL] requireAuth() also failed.');
        return authResult.error;
      }
    }

    const { targetPhone, whatsappToken, phoneNumberId, reportType, companyId, isPreGen } = await req.json();
    
    const result = await executePDFPipeline({
      targetPhone,
      whatsappToken,
      phoneNumberId,
      reportType,
      companyId,
      isPreGen
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("PDF_ROUTE_ERROR", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
