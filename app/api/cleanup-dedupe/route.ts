import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * Endpoint para Vercel Cron - limpia registros de deduplicación > 7 días
 * Se ejecuta semanalmente (domingos 3:00 AM)
 */
export async function GET() {
  const authHeader = 'authorization' in process.env ? process.env.authorization : '';
  const cronSecret = process.env.CRON_SECRET;

  // Validar que la llamada viene del cron (Vercel agrega Authorization: Bearer <token>)
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .rpc('cleanup_old_dedupe_records', { p_days_old: 7 });

    if (error) {
      console.error('[cleanup-dedupe] Error limpiando registros:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const deletedCount = data ?? 0;
    console.log(`[cleanup-dedupe] Eliminados ${deletedCount} registros viejos`);

    return NextResponse.json({
      success: true,
      deleted_count: deletedCount,
      message: `Limpieza completada: ${deletedCount} registros eliminados`,
    });
  } catch (err) {
    console.error('[cleanup-dedupe] Error inesperado:', err);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}
