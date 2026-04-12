import { createClient } from '@supabase/supabase-js';

const url = "https://kevagewrvpyhrflqmwod.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldmFnZXdydnB5aHJmbHFtd29kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQwODQ0MSwiZXhwIjoyMDkwOTg0NDQxfQ.ZboB8eZ1_IbrCdTXw1woNGXzItVfys9rgFlw6J30Vsc";

async function hardcodedTest() {
  const supabase = createClient(url, key);
  const { data, error } = await supabase.from('contacts').select('count');
  if (error) {
    console.error('Error with hardcoded key:', error.message);
  } else {
    console.log('Success with hardcoded key!', data);
  }
}

hardcodedTest();
