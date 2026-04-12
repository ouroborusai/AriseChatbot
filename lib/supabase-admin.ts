import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

/** 
 * FORZADO DE ENTORNO: 
 * En Windows, las variables de sistema pueden pisar las de .env.local.
 * Forzamos la carga del archivo local con override habilitado.
 */
try {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });
} catch (e) {
  // En producción esto podría fallar si el file no existe, ignoramos.
}

let cached: SupabaseClient | null = null;

/** Lazy: evita fallar en `next build` cuando aún no hay env (p. ej. Vercel sin variables). */
export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey.startsWith('sb_')) {
    console.error('[SupabaseAdmin] ❌ ERROR: LLAVE INVÁLIDA O DE SISTEMA DETECTADA.');
    // Si la llave del sistema es inválida, forzamos de nuevo el .env.local
    dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });
  }

  const finalKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  console.log(`[SupabaseAdmin] 🔌 Conectando a ${supabaseUrl} (Key: ${finalKey.substring(0, 10)}...)`);

  cached = createClient(supabaseUrl, finalKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return cached;
}