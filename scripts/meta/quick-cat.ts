
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WABA_ID = '930946633057624';

async function run() {
  const r1 = await fetch(`https://graph.facebook.com/v23.0/${WABA_ID}/product_catalogs`, {
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
  });
  console.log('CATALOGS:', await r1.json());

  const r2 = await fetch(`https://graph.facebook.com/v23.0/${WABA_ID}?fields=commerce_account`, {
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
  });
  console.log('COMMERCE:', await r2.json());
}
run();
