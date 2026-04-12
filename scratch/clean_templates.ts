import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan credenciales de Supabase en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanTemplates() {
  console.log('Iniciando limpieza total de plantillas...');

  const { data, error } = await supabase
    .from('templates')
    .delete()
    .neq('id', 'borrar_todo_hack'); // Elimina todos los registros de la tabla

  if (error) {
    console.error('Error limpiando la tabla de plantillas:', error.message);
  } else {
    console.log('✅ Todas las plantillas han sido eliminadas exitosamente de la base de datos.');
  }

  // Opcional: También podríamos eliminar o vaciar los archivos .sql que las auto-generaban,
  // pero primero limpiaremos el estado de producción/desarrollo.
}

cleanTemplates();
