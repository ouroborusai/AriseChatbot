
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.ARISE_MASTER_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function updateCategories() {
  // ✅ LEY DEL GUIÓN BAJO Diamond v12 - IDs técnicos puros SSOT
  const categories = [
    "mtz_food",
    "mtz_construction",
    "mtz_logistics",
    "mtz_health",
    "mtz_industrial",
    "mtz_distillery",
    "mtz_education",
    "mtz_automotive",
    "mtz_pro_services",
    "mtz_retail"
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
