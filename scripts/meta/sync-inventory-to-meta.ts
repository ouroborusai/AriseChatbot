
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.ARISE_MASTER_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function syncToMeta() {
  const catalogId = process.env.CATALOG_ID || '998467769274169';
  const token = process.env.META_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://arise-chatbot-eight.vercel.app';

  if (!catalogId || !token) return;

  // 1. Obtener productos estandarizados de Supabase
  const { data: items } = await supabase.from('inventory_items').select('*');
  if (!items) return;

  // 2. Mapa de Imágenes Basado en ID Técnico
  const imageMap: Record<string, string> = {
    "mtz_food": "food.png",
    "mtz_construction": "construction.png",
    "mtz_logistics": "logistics.png",
    "mtz_health": "health.png",
    "mtz_pro_services": "pro_services.png",
    "mtz_industrial": "services.png",
    "mtz_distillery": "services.png",
    "mtz_education": "services.png",
    "mtz_automotive": "services.png",
    "mtz_retail": "services.png",
    "mtz_general": "services.png"
  };

  const uniqueItems = Array.from(new Map(items.map(item => [item.sku || item.id, item])).values());

  const requests = uniqueItems.map(item => {
    // Si la categoría ya es mtz_xxx, la usamos. Si no, le damos mtz_general.
    const categoryId = (item.category && item.category.startsWith('mtz_')) ? item.category : "mtz_general";
    const imgFile = imageMap[categoryId] || "services.png";
    
    return {
      method: 'UPDATE',
      retailer_id: item.sku || item.id,
      data: {
        name: item.name,
        description: item.description || 'Producto verificado por Red MTZ',
        availability: 'in stock',
        condition: 'new',
        price: Math.round(Number(item.price) || 15000),
        currency: 'CLP',
        url: 'https://arise.cl',
        image_url: `${baseUrl}/brand/categories/${imgFile}`,
        brand: 'Red MTZ',
        product_type: categoryId // USAMOS EL ID TÉCNICO DIRECTO
      }
    };
  });

  try {
    const res = await fetch(`https://graph.facebook.com/v23.0/${catalogId}/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: token, requests })
    });
    const resData = await res.json();
    console.log('🚀 SINCRONIZACIÓN MAESTRA v11.9.1 COMPLETADA:', JSON.stringify(resData));
  } catch (err) {
    console.error('❌ Error Fatal Sincro:', err);
  }
}

syncToMeta();
