
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { systemTemplates } from '../supabase/templates';

dotenv.config({ path: '.env.local', override: true });

async function sync() {
  const fs = require('fs');
  const env = fs.readFileSync('.env.local', 'utf8');
  const match = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
  console.log('--- DIRECT FILE READ ---');
  console.log('Line 4 match from file:', match ? match[1].substring(0, 10) + '...' : 'NOT FOUND');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('--- SYNC TEMPLATES ---');
  console.log('URL:', url);
  console.log('KEY STARTS WITH:', key?.substring(0, 10));
  
  if (!url || !key) {
    console.error('Missing env vars');
    return;
  }
  
  const supabase = createClient(url, key);
  
  for (const tpl of systemTemplates) {
    console.log(`Upserting ${tpl.id}...`);
    const { error } = await supabase.from('templates').upsert(tpl, { onConflict: 'id' });
    if (error) console.error(`Error in ${tpl.id}:`, error.message);
  }
  
  console.log('Done!');
}

sync();
