import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * Verifica autenticación del usuario para endpoints API protegidos
 * Retorna el usuario autenticado o null si no está autenticado
 */
export async function getAuthenticatedUser() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Middleware para proteger endpoints API
 * Usa Anon Key + session cookies para auth estándar
 * Service Role Key solo para operaciones internas con API key
 */
export async function requireAuth() {
  const { headers } = await import('next/headers');
  const headerList = await headers();
  const apiKey = headerList.get('x-api-key');

  // Permitir acceso si la llave de API interna es correcta (operaciones internas)
  if (apiKey && apiKey === process.env.INTERNAL_API_KEY) {
    return { error: null, user: { id: 'system_agent', email: 'agent@loop-os.ai' } };
  }



  // Usar Anon Key + session cookies para auth de usuario estándar
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return {
      error: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
      user: null
    };
  }

  return { error: null, user: session.user };
}

/**
 * Verifica que el usuario tenga acceso a la compañía especificada
 */
export async function verifyCompanyAccess(userId: string, companyId: string) {
  // El agente del sistema tiene acceso total para operaciones automatizadas
  if (userId === 'system_agent') return true;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: access } = await supabase
    .from('user_company_access')
    .select('company_id')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .maybeSingle();

  return !!access;
}
