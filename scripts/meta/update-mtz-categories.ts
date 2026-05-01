
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.ARISE_MASTER_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function updateCategories() {
  const categories = [
    "Gastronomía & Alimentos 🍣",
    "Construcción, Ferretería & Maderas 🛠️",
    "Transportes, Grúas & Logística 🚛",
    "Estética, Salud & Bienestar 💅",
    "Seguridad & Servicios Industriales 🛡️",
    "Destilerías & Producción 🍷",
    "Educación & Comunidad 🎨",
    "Automotriz & Talleres 🏎️",
    "Servicios Profesionales & Consultoría ⚖️",
    "Comercio & Retail 🛒"
  ];

  const { data: items } = await supabase.from('inventory_items').select('id, sku');
  
  if (items) {
    for (let i = 0; i < items.length; i++) {
        const catIndex = i % categories.length;
        await supabase.from('inventory_items')
            .update({ category: categories[catIndex] })
            .eq('id', items[i].id);
    }
    console.log('✅ Categorías actualizadas con la nueva estructura MTZ.');
  }
}

updateCategories();
