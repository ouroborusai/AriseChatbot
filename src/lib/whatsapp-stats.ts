import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getWhatsAppAnalytics() {
  const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!wabaId || !token) {
    return { error: 'Missing WhatsApp Credentials' };
  }

  try {
    const end = Math.floor(Date.now() / 1000);
    const start = end - (7 * 24 * 60 * 60); // Últimos 7 días

    // 1. Obtener analítica de mensajes
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${wabaId}?fields=analytics.start(${start}).end(${end}).granularity(DAY)&access_token=${token}`
    );
    const data = await res.json();

    // 2. Obtener costos reales (Conversations)
    const costRes = await fetch(
      `https://graph.facebook.com/v19.0/${wabaId}?fields=conversation_analytics.start(${start}).end(${end}).granularity(DAILY)&access_token=${token}`
    );
    const costData = await costRes.json();

    return {
      usage: data.analytics || null,
      costs: costData.conversation_analytics || null,
      lastUpdate: new Date().toISOString()
    };
  } catch (e) {
    console.error('WhatsApp Stats Sync Error:', e);
    return { error: 'Sync failed' };
  }
}
