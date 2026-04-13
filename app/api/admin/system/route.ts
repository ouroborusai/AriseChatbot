import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { systemTemplates } from '@/supabase/templates';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  try {
    const keys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
    const names = ['Principal', 'MTZ Contabilidad', 'Te Quiero Feliz', 'Carlos Villagra', 'Ouroborus AI', 'Soporte 6', 'De Doctor', 'Ouroborus MTZ'];
    
    // Obtener telemetría de hoy desde Supabase
    const supabase = getSupabaseAdmin();
    const { data: usageData } = await supabase.from('ai_api_usage_today').select('*');
    
    // Obtener estado de rotación en tiempo real del servidor
    const { getAiClusterStatus } = await import('@/lib/ai-service');
    const clusterStatus = getAiClusterStatus();

    const health = clusterStatus.map((node) => {
      const displayName = names[node.index - 1] || `Réplica de Soporte #${node.index}`;
      const stats = usageData?.find(u => u.key_index === node.index) || { total_requests: 0, total_tokens: 0 };
      
      return {
        id: node.index,
        name: displayName,
        status: node.status === 'online' ? 'active' : 'exhausted',
        label: node.status === 'online' ? 'Operativa' : `Enfriando (${node.cooldownRemaining}s)`,
        requestsToday: stats.total_requests,
        tokensToday: stats.total_tokens,
        isCurrent: node.isCurrent,
        cooldownRemaining: node.cooldownRemaining,
        lastMeasured: new Date().toISOString()
      };
    });

    return NextResponse.json({ success: true, keys: health });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action } = await req.json();
    const supabase = getSupabaseAdmin();

    switch (action) {
      case 'sync-templates': {
        let count = 0;
        for (const template of systemTemplates) {
          const { error } = await supabase
            .from('templates')
            .upsert(template, { onConflict: 'id' });
          if (error) throw error;
          count++;
        }
        return NextResponse.json({ success: true, message: `${count} plantillas sincronizadas.` });
      }

      case 'purge-templates': {
        const { error } = await supabase.from('templates').delete().neq('id', '0'); // Delete all
        if (error) throw error;
        return NextResponse.json({ success: true, message: 'Todas las plantillas han sido eliminadas.' });
      }

      case 'purge-sessions': {
        // En cascada debería borrar mensajes si las FKs están bien expuestas en Supabase, 
        // si no, borramos mensajes primero.
        await supabase.from('messages').delete().neq('id', '0');
        const { error } = await supabase.from('conversations').delete().neq('id', '0');
        if (error) throw error;
        return NextResponse.json({ success: true, message: 'Historial de conversaciones y mensajes purgado.' });
      }

      case 'master-reset': {
        // Purge + Sync
        await supabase.from('templates').delete().neq('id', '0');
        let count = 0;
        for (const template of systemTemplates) {
          await supabase.from('templates').upsert(template, { onConflict: 'id' });
          count++;
        }
        return NextResponse.json({ success: true, message: `Sistema reseteado. ${count} plantillas restauradas.` });
      }

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Admin API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
