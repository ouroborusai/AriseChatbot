import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const OFFICIAL_PHONES = [
  '56920137573', '56932992302', '56934322178', '56934416233',
  '56934477396', '56935564266', '56940256482', '56942755047',
  '56942850893', '56944132731', '56944609914', '56944940651',
  '56945341500', '56945384800', '56945916539'
];

async function wipeAndReset() {
  console.log('Iniciando Purga de Base de Datos...');
  
  // 1. Borrar todos los mensajes basuras de pruebas
  const { error: msgErr } = await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Mensajes purgados:', msgErr ? msgErr.message : 'OK');

  // 2. Borrar todas las conversaciones
  const { error: convErr } = await supabase.from('conversations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Conversaciones purgadas:', convErr ? convErr.message : 'OK');

  // 3. Borrar contactos que NO son los clientes oficiales
  const { error: cntErr } = await supabase.from('contacts').delete().not('phone_number', 'in', `(${OFFICIAL_PHONES.join(',')})`);
  console.log('Contactos de prueba eliminados (y sus relaciones):', cntErr ? cntErr.message : 'OK');

  console.log('¡Base de datos limpiada y en estado puro!');
}

wipeAndReset();
