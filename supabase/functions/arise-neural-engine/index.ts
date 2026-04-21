import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const body = await req.json();

    if (req.method === 'GET') return new Response(url.searchParams.get('hub.challenge'), { status: 200 });

    if (url.searchParams.get('source') === 'trigger' && body.messageId) {
      console.log(`[Neural] Pulse received for message: ${body.messageId}`);
      const { data: msg } = await supabase.from('messages').select('*, conversations(*)').eq('id', body.messageId).single();
      const { data: p } = await supabase.from('ai_prompts').select('system_prompt').eq('company_id', msg.conversations.company_id).eq('is_active', true).limit(1).maybeSingle();
      
      let keys = (Deno.env.get('GEMINI_API_KEY') || "").split(',').map(k => k.trim()).filter(k => k.length > 0);
      
      if (keys.length === 0) {
        console.log("[Neural] GEMINI_API_KEY env empty. Fetching from Vault table...");
        const { data: vaultKeys } = await supabase.from('gemini_api_keys').select('api_key').eq('is_active', true);
        if (vaultKeys && vaultKeys.length > 0) {
           keys = vaultKeys.map(k => k.api_key);
        }
      }

      if (keys.length === 0) {
         console.error("[Neural] CRITICAL: No API keys found in ENV or Vault.");
         return new Response('Fatal');
      }

      let aiResponse = null;

      for (const key of keys) {
        console.log(`[Neural] Trying core starting with ${key.substring(0, 5)}...`);
        // USANDO EL MODELO CERTIFICADO EN AUDITORÍA: gemini-2.5-flash-lite
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: `${p?.system_prompt || "Eres Arise Business OS v9.0."}\n\nMensaje: ${msg.content}` }]}] })
        });
        
        if (res.status === 200) {
          const d = await res.json();
          aiResponse = d.candidates?.[0]?.content?.parts?.[0]?.text;
          if (aiResponse) {
            console.log(`[Neural] Core success! Response length: ${aiResponse.length}`);
            break;
          }
        } else {
          console.warn(`[Neural] Core failed with status ${res.status}`);
        }
      }

      if (aiResponse) {
        await supabase.from('messages').insert({ conversation_id: msg.conversation_id, sender_type: 'bot', content: aiResponse.trim() });
        const { data: comp } = await supabase.from('companies').select('settings').eq('id', msg.conversations.company_id).single();
        const { data: cont } = await supabase.from('contacts').select('phone').eq('id', msg.conversations.contact_id).single();
        
        await fetch(`https://graph.facebook.com/v19.0/${comp.settings.whatsapp.phone_number_id}/messages`, {
           method: 'POST',
           headers: { 'Authorization': `Bearer ${comp.settings.whatsapp.access_token}`, 'Content-Type': 'application/json' },
           body: JSON.stringify({ messaging_product: 'whatsapp', to: cont.phone, type: 'text', text: { body: aiResponse.trim() } })
        });
      }
      return new Response('OK');
    }

    // Ingesta de Webhook (Fallback directo)
    const m = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (m) {
      const { data: c } = await supabase.from('contacts').select('id, company_id').eq('phone', m.from).limit(1).maybeSingle();
      if (c) {
        let { data: conv } = await supabase.from('conversations').select('id').eq('contact_id', c.id).order('updated_at', { ascending: false }).limit(1).maybeSingle();
        if (!conv) {
          const { data: nc } = await supabase.from('conversations').insert({ contact_id: c.id, company_id: c.company_id, status: 'open' }).select('id').single();
          conv = nc;
        }
        await supabase.from('messages').insert({ conversation_id: conv.id, sender_type: 'user', content: m.text?.body || '[Multimedia]' });
      }
    }
    return new Response('OK');
  } catch (e) {
    console.error(`[Neural] Fatal error: ${e.message}`);
    return new Response('Fatal');
  }
});
