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
    console.log(`[WHATS_WEBHOOK] Incoming from ${sender} to ${phoneNumberId}`);
    const { data: companies } = await supabase.from('companies').select('*').contains('settings', { whatsapp: { phone_number_id: phoneNumberId } });
    const company = companies?.find(c => c.settings?.whatsapp?.access_token) || companies?.[0];
    
    if (!company) {
      console.error(`[WHATS_WEBHOOK] No company found for phone_number_id: ${phoneNumberId}`);
      return new Response('OK');
    }
    console.log(`[WHATS_WEBHOOK] Resolved Company: ${company.name} (${company.id})`);

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

    await supabase.from('messages').insert({ conversation_id: conv.id, sender_type: 'user', content: messageContent });

    if (conv.status === 'open') {
      const startTime = Date.now();
      const [compliance, reminders] = await Promise.all([
        supabase.from('company_compliance').select('*').eq('company_id', company.id).eq('status', 'pending').limit(1).maybeSingle(),
        supabase.from('reminders').select('*').eq('contact_id', contactId).eq('status', 'pending').limit(1).maybeSingle()
      ]);

      let flashContext = '';
      if (compliance.data) flashContext += `\nVENCIMIENTO_LEGAL_PRÓXIMO: ${compliance.data.task_name} (Fecha: ${compliance.data.due_date})`;
      if (reminders.data) flashContext += `\nRECORDATORIO_PENDIENTE: ${reminders.data.content}`;

      const promptCategory = isInternal ? 'Internal' : 'General';
      const { data: p } = await supabase.from('ai_prompts').select('system_prompt').eq('company_id', company.id).eq('category', promptCategory).maybeSingle();
      
      const elitePrompt = `${p?.system_prompt || ''}\n\n[IDENTIDAD ELITE: Estás hablando con ${userName} (${userRole.toUpperCase()}). Eres el Socio Contable de ${company.name}.]\n${flashContext}\n\nUsuario: ${messageContent}`;

      const { data: keys } = await supabase.from('gemini_api_keys').select('id, api_key').eq('is_active', true);
      if (keys && keys.length > 0) {
        const keyObj = keys[Math.floor(Math.random() * keys.length)];
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${keyObj.api_key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: elitePrompt }] }] })
        });

        if (geminiRes.ok) {
          const res = await geminiRes.json();
          const aiRawText = res.candidates?.[0]?.content?.parts?.[0]?.text || '...';
          const usage = res.usageMetadata;

          await supabase.from('ai_api_telemetry').insert({
            company_id: company.id, model_name: 'gemini-2.5-flash-lite',
            tokens_input: usage?.promptTokenCount || 0, tokens_output: usage?.candidatesTokenCount || 0,
            latency_ms: Date.now() - startTime, cost_estimated: (usage?.totalTokenCount || 0) * 0.0000002
          });

          let payload: any = { messaging_product: 'whatsapp', to: senderPhoneRaw, type: 'text', text: { body: aiRawText.substring(0, 4000) } };
          
          if (aiRawText.includes('---')) {
            const [bodyPart, optionsPart] = aiRawText.split('---').map(s => s.trim());
            const options = optionsPart.split('|').map(o => o.trim()).filter(o => o.length > 0);

            if (options.length > 0 && options.length <= 3) {
                payload = {
                messaging_product: 'whatsapp', to: senderPhoneRaw, type: 'interactive',
                interactive: {
                  type: 'button', body: { text: bodyPart.substring(0, 1024) },
                  action: { buttons: options.slice(0, 3).map((o, i) => ({ type: 'reply', reply: { id: `act_${i}_${Date.now()}`, title: o.substring(0, 20) } })) }
                }
              };
            } else if (options.length > 3) {
              payload = {
                messaging_product: 'whatsapp', to: senderPhoneRaw, type: 'interactive',
                interactive: {
                  type: 'list', header: { type: 'text', text: 'Arise Operations' }, body: { text: bodyPart.substring(0, 1024) },
                  footer: { text: 'Selecciona una opcion' },
                  action: {
                    button: 'Ver Opciones',
                    sections: [{ title: 'Menú Ejecutivo', rows: options.slice(0, 10).map((o, i) => ({ id: `list_${i}_${Date.now()}`, title: o.substring(0, 24), description: 'Accion rapida' })) }]
                  }
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
            const errData = await metaRes.json();
            console.error('META_API_ERROR', errData);
            await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${whatsappToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ messaging_product: 'whatsapp', to: senderPhoneRaw, type: 'text', text: { body: aiRawText.split('---')[0].trim() } })
            });
          }
        }
      }
      }

      await supabase.from('messages').insert({ conversation_id: conv.id, sender_type: 'bot', content: aiResponseText });
      
      const response = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${company.settings.whatsapp.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('META_API_ERROR:', JSON.stringify(errorData));
        // Fallback to text message
        await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${company.settings.whatsapp.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: sender,
            type: 'text',
            text: { body: aiResponseText.substring(0, 4000) }
          })
        });
      }
    }

    return new Response('OK');
  } catch (err) {
    console.error('CORE_ERROR:', err);
    return new Response('OK');
  }
});
