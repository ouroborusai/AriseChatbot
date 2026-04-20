import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  const url = new URL(req.url);

  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    if (mode === 'subscribe' && token === VERIFY_TOKEN) return new Response(challenge, { status: 200 });
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const body = await req.json();
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    if (!changes || !changes.messages) return new Response('OK');

    const message = changes.messages[0];
    const waId = message.id;
    const sender = message.from;
    const phoneNumberId = changes.metadata?.phone_number_id;

    // --- 1. IDEMPOTENCY ---
    const { data: existingMsg } = await supabase.from('messages').select('id').contains('metadata', { whatsapp_message_id: waId }).maybeSingle();
    if (existingMsg) return new Response('OK');

    // --- 2. CONFIG & IDENTITY ---
    const { data: companies } = await supabase.from('companies').select('*').contains('settings', { whatsapp: { phone_number_id: phoneNumberId } });
    const company = companies?.find(c => c.settings?.whatsapp?.access_token) || companies?.[0];
    
    if (!company) return new Response('OK');
    const whatsappToken = company.settings?.whatsapp?.access_token;
    if (!whatsappToken) return new Response('OK');

    const [internalUser, contact] = await Promise.all([
      supabase.from('internal_directory').select('name, role').eq('phone', sender).eq('company_id', company.id).maybeSingle(),
      supabase.from('contacts').select('id').eq('phone', sender).eq('company_id', company.id).maybeSingle()
    ]);

    const isInternal = !!internalUser.data;
    const userName = internalUser.data?.name || 'Usuario';
    const userRole = internalUser.data?.role || 'client';

    let content = message.text?.body || '';
    if (message.type === 'interactive') content = message.interactive.button_reply?.title || message.interactive.list_reply?.title || '';

    // --- 3. DATA PERSISTENCE ---
    let cid = contact.data?.id;
    if (!cid) {
      const { data: nc } = await supabase.from('contacts').insert({ full_name: userName, phone: sender, company_id: company.id, category: isInternal ? 'client' : 'lead' }).select('id').single();
      cid = nc.id;
    }

    let { data: conv } = await supabase.from('conversations').select('id, status').eq('contact_id', cid).eq('company_id', company.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (!conv || conv.status === 'closed') {
      const { data: nconv } = await supabase.from('conversations').insert({ contact_id: cid, company_id: company.id, status: 'open' }).select('id').single();
      conv = nconv;
    }

    await supabase.from('messages').insert({ 
      conversation_id: conv.id, sender_type: 'user', content, 
      metadata: { whatsapp_message_id: waId, type: message.type } 
    });

    if (conv.status === 'open') {
      const startTime = Date.now();
      const { data: keys } = await supabase.from('gemini_api_keys').select('api_key').eq('is_active', true);
      const activeKey = keys?.[0]?.api_key;
      if (!activeKey) return new Response('OK');

      const promptCategory = isInternal ? 'Internal' : 'General';
      const { data: p } = await supabase.from('ai_prompts').select('system_prompt').eq('company_id', company.id).eq('category', promptCategory).maybeSingle();
      
      const elitePrompt = `${p?.system_prompt || ''}\n\n[IDENTIDAD: Hablas con ${userName} (${userRole}). Empresa: ${company.name}]\n\nMensaje: ${content}`;

      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${activeKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: elitePrompt }] }] })
      });

      if (geminiRes.ok) {
        const res = await geminiRes.json();
        const aiRawText = res.candidates?.[0]?.content?.parts?.[0]?.text || '...';
        
        let payload: any = { messaging_product: 'whatsapp', to: sender, type: 'text', text: { body: aiRawText.substring(0, 4000) } };
        
        // --- RESILIENT PARSER v7.5 ---
        if (aiRawText.includes('---') || aiRawText.includes('|')) {
          let bodyPart = aiRawText;
          let options: string[] = [];
          if (aiRawText.includes('---')) {
            const parts = aiRawText.split('---').map(s => s.trim());
            if (parts[1] && parts[1].includes('|')) {
              bodyPart = parts[0];
              options = parts[1].split('|');
            } else if (parts[0].includes('|')) {
              const sub = parts[0].split('|');
              bodyPart = sub[0];
              options = sub.slice(1);
            }
          } else {
            const parts = aiRawText.split('|');
            bodyPart = parts[0];
            options = parts.slice(1);
          }

          const cleanOptions = options.map(o => o.trim()).filter(o => o.length > 0 && o.length <= 20).slice(0, 3);
          if (cleanOptions.length > 0) {
            payload = {
              messaging_product: 'whatsapp', to: sender, type: 'interactive',
              interactive: {
                type: 'button', body: { text: bodyPart.substring(0, 1024) },
                action: { buttons: cleanOptions.map((o, i) => ({ type: 'reply', reply: { id: `act_${i}`, title: o } })) }
              }
            };
          }
        }

        await supabase.from('messages').insert({ conversation_id: conv.id, sender_type: 'bot', content: aiRawText });
        
        const metaRes = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${whatsappToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!metaRes.ok) {
          // Fallback to text
          await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${whatsappToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ messaging_product: 'whatsapp', to: sender, type: 'text', text: { body: aiRawText.split('---')[0].trim() } })
          });
        }
      }
    }

    return new Response('OK');
  } catch (err) {
    console.error('SERVER_ERROR:', err);
    return new Response('OK');
  }
});
