import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST() {
  try {
    const supabase = getSupabaseAdmin();
    
    const template = {
      id: 'menu_principal_cliente',
      name: 'Menú Principal Cliente',
      content: '¡Hola, {{nombre}}! 👋 Soy el asistente virtual de MTZ Consultores Tributarios. Para poder guiarte de la mejor manera, por favor selecciona una de las siguientes opciones:',
      actions: [
        {
          type: 'list',
          title: 'Opciones',
          description: 'Selecciona una opción',
          content: JSON.stringify([
            { id: 'btn_mis_documentos', title: '📄 Mis Documentos', description: 'Consultar y descargar archivos' },
            { id: 'btn_mis_datos', title: '👤 Mis Datos', description: 'Actualizar información personal' },
            { id: 'btn_tramites', title: '⚙️ Trámites', description: 'Gestiones y servicios' },
            { id: 'btn_asesor_principal', title: '📞 Hablar con asesor', description: 'Atención personalizada' },
          ])
        }
      ] as any,
      category: 'bienvenida',
      is_active: true,
      priority: 100,
      segment: 'cliente',
      workflow: 'general'
    };

    const { data, error } = await supabase
      .from('templates')
      .upsert(template, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}