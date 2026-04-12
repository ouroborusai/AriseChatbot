import { getSupabaseAdmin } from '../lib/supabase-admin';

async function rename() {
  console.log('--- 🏷️ RENOMBRADO FINAL DE CONSISTENCIA ---');
  
  // 1. Clonar 'ver_documentos' como 'menu_archivo'
  const { data: old } = await getSupabaseAdmin()
    .from('templates')
    .select('*')
    .eq('id', 'ver_documentos')
    .single();

  if (old) {
    const newT = { 
      ...old, 
      id: 'menu_archivo', 
      name: 'SUB-MENU ARCHIVO' 
    };
    
    await getSupabaseAdmin().from('templates').upsert(newT);
    console.log('✅ Sub-menú clonado como menu_archivo.');

    // 2. Actualizar el link en el menú principal
    const { data: menu } = await getSupabaseAdmin()
      .from('templates')
      .select('*')
      .eq('id', 'menu_principal_cliente')
      .single();

    if (menu) {
      const content = JSON.parse(menu.actions[0].content || '[]');
      const updated = content.map((a: any) => 
        a.id === 'ver_documentos' ? { ...a, id: 'menu_archivo' } : a
      );
      
      const newActions = [{ 
        ...menu.actions[0], 
        content: JSON.stringify(updated) 
      }];
      
      await getSupabaseAdmin()
        .from('templates')
        .update({ actions: newActions })
        .eq('id', 'menu_principal_cliente');
        
      console.log('✅ Menú Principal actualizado al nuevo ID.');
    }
  }
}

rename();
