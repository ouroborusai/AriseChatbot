require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  console.log("Testing dashboard queries...");
  try {
    const isGlobal = true;
    const companyId = 'global';
    
    let contactsQuery = supabase.from('contacts').select('*', { count: 'estimated', head: true });
    let chatsQuery = supabase.from('conversations').select('*', { count: 'estimated', head: true });
    let invQuery = supabase.from('inventory_items').select('name, current_stock, min_stock_alert');
    
    console.log("Running Promise.all...");
    const [
      contactsResult,
      chatsResult,
      invResult
    ] = await Promise.all([
      contactsQuery,
      chatsQuery.catch(e => { console.log('chats error', e); return { count: 0 }; }),
      invQuery
    ]);

    console.log("Contacts:", contactsResult);
    console.log("Chats:", chatsResult);
    console.log("Inventory:", invResult);
    console.log("Success");
  } catch (err) {
    console.error("Fatal Error:", err);
  }
}

test();
