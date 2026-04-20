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

    // --- 1. IDEMPOTENCY (Blindaje v7.5) ---
    const { data: existingMsg } = await supabase.from('messages').select('id').contains('metadata', { whatsapp_message_id: waId }).maybeSingle();
    if (existingMsg) return new Response('OK');

    // --- 2. CONFIG & IDENTITY ---
    const { data: companies } = await supabase.from('companies').select('*').contains('settings', { whatsapp: { phone_number_id: phoneNumberId } });
    const company = companies?.[0];
    if (!company) return new Response('OK');

    const [internalUser, contact, keys] = await Promise.all([
      supabase.from('internal_directory').select('name, role').eq('phone', sender).eq('company_id', company.id).maybeSingle(),
      supabase.from('contacts').select('id').eq('phone', sender).eq('company_id', company.id).maybeSingle(),
      supabase.from('gemini_api_keys').select('api_key').eq('is_active', true)
    ]);

    const isInternal = !!internalUser.data;
    const userName = internalUser.data?.name || 'Usuario';
    const userRole = internalUser.data?.role || 'client';
    const activeKey = keys.data?.[0]?.api_key;

    if (!activeKey) return new Response('OK');

    let content = message.text?.body || '';
    if (message.type === 'interactive') content = message.interactive.button_reply?.title || message.interactive.list_reply?.title || '';

    // --- 3. RAG MODULE (Intelligence v7.9 - Snapshot First) ---
    let financialContext = '';
    try {
      // Priorizar Snapshots para evitar cálculos en la IA
      const { data: snapshots } = await supabase
        .from('client_knowledge')
        .select('content_summary')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (snapshots && snapshots.length > 0) {
        financialContext = `\n[FINANCIAL_SNAPSHOT_CONTEXT]:\n${snapshots.map(s => s.content_summary).join('\n')}`;
      }
    } catch (e) { console.error('RAG_FAIL:', e); }

    // --- 4. DATA PERSISTENCE ---
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

    // --- 5. NEURAL CORE (LM Choice: Gemini 2.5 Flash Lite) ---
    const promptCat = isInternal ? 'Internal' : 'General';
    const { data: p } = await supabase.from('ai_prompts').select('system_prompt').eq('category', promptCat).eq('company_id', company.id).maybeSingle();
    
    const finalPrompt = `${p?.system_prompt || ''}\n\n[IDENTIDAD: ${userName} (${userRole.toUpperCase()})]\n${financialContext}\n\nUsuario: ${content}`;

    const chatRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${activeKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] })
    });

    if (chatRes.ok) {
      const chatData = await chatRes.json();
      const aiResponseText = chatData.candidates?.[0]?.content?.parts?.[0]?.text || '...';

      let payload: any = { messaging_product: 'whatsapp', to: sender, type: 'text', text: { body: aiResponseText } };
      
      // 6. DIAMOND V7.9 UI SCALING (Improved Parser)
      if (aiResponseText.includes('---')) {
        const parts = aiResponseText.split('---');
        // El cuerpo es todo menos la última sección de botones
        const rawBody = parts.slice(0, -1).join('---').trim();
        const rawOptions = parts[parts.length - 1].trim();
        const options = rawOptions.split('|').map(o => o.replace(/\n/g, ' ').trim()).filter(o => o.length > 0);

        if (options.length > 0) {
          const bodyText = rawBody || 'Elige una acción operativa:';
          
          if (options.length <= 3) {
            // Usar botones simples si son pocos
            payload = {
              messaging_product: 'whatsapp', to: sender, type: 'interactive',
              interactive: {
                type: 'button',
                body: { text: bodyText.substring(0, 1024) },
                action: {
                  buttons: options.slice(0, 3).map((o, i) => ({
                    type: 'reply',
                    reply: { id: `btn_${i}`, title: o.substring(0, 20) }
                  }))
                }
              }
            };
          } else {
            // Usar Lista si son muchos
            payload = {
              messaging_product: 'whatsapp', to: sender, type: 'interactive',
              interactive: {
                type: 'list',
                header: { type: 'text', text: 'Arise Operations' },
                body: { text: bodyText.substring(0, 1024) },
                footer: { text: 'Arise Business OS v7.1' },
                action: {
                  button: 'Ver Opciones',
                  sections: [{
                    title: 'Comandos Disponibles',
                    rows: options.slice(0, 10).map((o, i) => ({
                      id: `act_${i}_${Date.now()}`,
                      title: o.substring(0, 24).trim(),
                      description: 'Ejecutar comando'
                    }))
                  }]
                }
              }
            };
          }
        }
      }

      // ASYNC PDF INTERCEPT (LM Rule)
      if (aiResponseText.includes('GENERATE_PDF')) {
         fetch('https://zosravrfpfechanatucx.supabase.co/functions/v1/document-processor', { 
           method: 'POST', 
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ contact_id: cid, type: 'report', metadata: { company_id: company.id } })
         }).catch(e => console.error('PDF_DELEGATION_FAIL:', e));
      }

      await supabase.from('messages').insert({ conversation_id: conv.id, sender_type: 'bot', content: aiResponseText });
      await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${company.settings.whatsapp.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    return new Response('OK');
  } catch (err) {
    console.error('CORE_ERROR:', err);
    return new Response('OK');
  }
});
