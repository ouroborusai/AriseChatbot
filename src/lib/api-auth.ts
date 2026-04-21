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
 * Usa Service Role Key para operaciones administrativas
 */
export async function requireAuth() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
      user: null
    };
  }

  return { error: null, user };
}

/**
 * Verifica que el usuario tenga acceso a la compañía especificada
 */
export async function verifyCompanyAccess(userId: string, companyId: string) {
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
