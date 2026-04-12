
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('--- DIAGNOSTIC SUPABASE ---');
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Loaded (starts with ' + process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 10) + ')' : 'MISSING');
console.log('ROLE KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Loaded (starts with ' + process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 5) + '... ends with ' + process.env.SUPABASE_SERVICE_ROLE_KEY.slice(-5) + ')' : 'MISSING');
console.log('WHATSAPP ID:', process.env.WHATSAPP_PHONE_NUMBER_ID ? 'Loaded' : 'MISSING');
console.log('---------------------------');
