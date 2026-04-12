import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Configurar entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TEMPLATES_DIR = path.resolve(process.cwd(), 'supabase/templates');

async function syncTemplates() {
  console.log('🔄 Iniciando sincronización de plantillas JSON -> Supabase\n');
  
  // Leer recursivamente todos los JSON en las carpetas
  const folders = fs.readdirSync(TEMPLATES_DIR);
  
  for (const folder of folders) {
    const folderPath = path.join(TEMPLATES_DIR, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const templateData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      console.log(`Subiendo plantilla: [${templateData.id}] - ${templateData.name}`);

      const { error } = await supabase
        .from('templates')
        .upsert(templateData, { onConflict: 'id' });

      if (error) {
        console.error(`❌ Error con ${templateData.id}:`, error.message);
      } else {
        console.log(`✅ Sincronizado: ${templateData.id}`);
      }
    }
  }
  console.log('\n🚀 ¡Sincronización Completada!');
}

syncTemplates();
