
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
  const phone = process.argv[2] || '56990062213';
  console.log(`Checking contact for: ${phone}`);
  
  const { data: contact, error } = await supabase
    .from('contacts')
    .select('*')
    .ilike('phone_number', `%${phone}%`)
    .single();
    
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log('Contact Details:', JSON.stringify(contact, null, 2));
  
  const { data: conv, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('phone_number', contact.phone_number)
    .maybeSingle();
    
  if (convError) {
    console.error('Conv Error:', convError.message);
  } else {
    console.log('Conversation Details:', JSON.stringify(conv, null, 2));
  }
}

check();
