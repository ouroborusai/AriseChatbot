import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { systemTemplates } from '@/supabase/templates';

export async function POST() {
  try {
    const supabase = getSupabaseAdmin();
    let count = 0;

    for (const template of systemTemplates) {
      const { error } = await supabase
        .from('templates')
        .upsert(template, { onConflict: 'id' });
        
      if (error) {
        console.error('Error insertando plantilla:', template.id, error);
        throw error;
      }
      count++;
    }

    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}