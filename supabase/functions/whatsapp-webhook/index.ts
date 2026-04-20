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

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0]?.value;
      if (!changes || !changes.messages) return new Response('OK', { status: 200 });

      const phoneNumberId = changes.metadata?.phone_number_id;
      const message = changes.messages[0];
      const senderPhoneRaw = message.from;
      
      let messageContent = '';
      let interactiveId = '';

      if (message.type === 'text') {
        messageContent = message.text.body;
      } else if (message.type === 'interactive') {
        const interactive = message.interactive;
        interactiveId = interactive.list_reply?.id || interactive.button_reply?.id || '';
        messageContent = interactive.list_reply?.title || interactive.button_reply?.title || '';
      }

      const { data: companies } = await supabase.from('companies').select('*').contains('settings', { whatsapp: { phone_number_id: phoneNumberId } });
      const company = (companies as any[])?.find((c: any) => c.settings?.whatsapp?.access_token) || companies?.[0];
      if (!company) return new Response('Unauthorized', { status: 200 });
      const whatsappToken = company.settings?.whatsapp?.access_token;

      // --- ROLE RECOGNITION (OUROBOROUS ENGINE v7.3) ---
      const { data: internalUser } = await supabase.from('internal_directory').select('name, role').eq('phone', senderPhoneRaw).eq('company_id', company.id).maybeSingle();
      const isInternal = !!internalUser;
      const userRole = internalUser?.role || 'client';
      const userName = internalUser?.name || 'Usuario';

      const { data: contact } = await supabase.from('contacts').select('id, category').eq('phone', senderPhoneRaw).eq('company_id', company.id).maybeSingle();
      let contactId = contact?.id;
      if (!contactId) {
        const { data: nc } = await supabase.from('contacts').insert({ full_name: userName, phone: senderPhoneRaw, company_id: company.id, category: isInternal ? 'client' : 'lead' }).select('id').single();
        contactId = nc?.id;
      }

      let { data: conv } = await supabase.from('conversations').select('id, status').eq('contact_id', contactId).eq('company_id', company.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (!conv || conv.status === 'closed') {
        const { data: nconv } = await supabase.from('conversations').insert({ contact_id: contactId, company_id: company.id, status: 'open', metadata: { user_role: userRole } }).select('id, status').single();
        conv = nconv;
      }

      await supabase.from('messages').insert({ conversation_id: conv.id, sender_type: 'user', content: messageContent });

      if (conv.status === 'open') {
        const startTime = Date.now();
        const [compliance, reminders] = await Promise.all([
          supabase.from('company_compliance').select('*').eq('company_id', company.id).eq('status', 'pending').limit(1).maybeSingle(),
          supabase.from('reminders').select('*').eq('contact_id', contactId).eq('status', 'pending').limit(1).maybeSingle()
        ]);

        let flashContext = '';
        if (compliance.data) flashContext += `\\nVENCIMIENTO_LEGAL_PRÓXIMO: ${compliance.data.task_name} (Fecha: ${compliance.data.due_date})`;
        if (reminders.data) flashContext += `\\nRECORDATORIO_PENDIENTE: ${reminders.data.content}`;

        const promptCategory = isInternal ? 'Internal' : 'General';
        const { data: p } = await supabase.from('ai_prompts').select('system_prompt').eq('company_id', company.id).eq('category', promptCategory).maybeSingle();
        
        const elitePrompt = `${p?.system_prompt || ''}\\n\\n[IDENTIDAD ELITE: Estás hablando con ${userName} (${userRole.toUpperCase()}). Eres el Socio Contable de ${company.name}.]\\n${flashContext}\\n\\nUsuario: ${messageContent}`;

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
            const aiText = res.candidates?.[0]?.content?.parts?.[0]?.text || '...';
            const usage = res.usageMetadata;

            await supabase.from('ai_api_telemetry').insert({
              company_id: company.id, model_name: 'gemini-2.5-flash-lite',
              tokens_input: usage?.promptTokenCount || 0, tokens_output: usage?.candidatesTokenCount || 0,
              latency_ms: Date.now() - startTime, cost_estimated: (usage?.totalTokenCount || 0) * 0.0000002
            });

            let payload: any = { messaging_product: 'whatsapp', to: senderPhoneRaw, type: 'text', text: { body: aiText } };
            
            if (aiText.includes('---')) {
              const parts = aiText.split('---');
              const bodyText = parts[0].trim();
              const options = parts[1].split('|').map(o => o.trim()).filter(o => o.length > 0);

              if (options.length >= 1 && options.length <= 3) {
                 payload = {
                  messaging_product: 'whatsapp', to: senderPhoneRaw, type: 'interactive',
                  interactive: {
                    type: 'button', body: { text: bodyText },
                    action: { buttons: options.map((o, i) => ({ type: 'reply', reply: { id: `act_${i}_${Date.now()}`, title: o.substring(0, 20) } })) }
                  }
                };
              } else if (options.length > 3) {
                payload = {
                  messaging_product: 'whatsapp', to: senderPhoneRaw, type: 'interactive',
                  interactive: {
                    type: 'list', header: { type: 'text', text: 'Opciones Arise' }, body: { text: bodyText },
                    footer: { text: 'Selecciona para continuar' },
                    action: {
                      button: 'Ver Opciones',
                      sections: [{ title: 'Menú Ejecutivo', rows: options.slice(0, 10).map((o, i) => ({ id: `list_${i}_${Date.now()}`, title: o.substring(0, 24), description: 'Toca para elegir' })) }]
                    }
                  }
                };
              }
            }

            await supabase.from('messages').insert({ conversation_id: conv.id, sender_type: 'bot', content: aiText });
            await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${whatsappToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
          }
        }
      }

      return new Response('OK', { status: 200 });
    } catch (err) {
      console.error('ERROR_ELITE_ENGINE:', err);
      return new Response('Error', { status: 200 });
    }
  }
  return new Response('Forbidden', { status: 403 });
});
