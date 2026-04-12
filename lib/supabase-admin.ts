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
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[SupabaseAdmin] ❌ Faltan variables de entorno.');
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  // Validación Industrial: Las llaves de producción son JWT largos (>150 chars)
  if (supabaseServiceKey.length < 100) {
    console.warn(`[SupabaseAdmin] ⚠️ La llave detectada parece ser inválida o demasiado corta (${supabaseServiceKey.length} chars).`);
  }

  console.log(`[SupabaseAdmin] 🔌 Conectando a ${supabaseUrl} (Key: ${supabaseServiceKey.substring(0, 10)}...)`);

  cached = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return cached;
}