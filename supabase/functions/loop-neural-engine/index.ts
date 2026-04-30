import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

/**
 * MASTER NEURAL ENGINE v10.4 (LOOP Platinum)
 * Procesa pulsos de la DB y responde vía WhatsApp, Facebook e Instagram.
 */

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!, 
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const META_ACCESS_TOKEN = Deno.env.get('META_ACCESS_TOKEN') || "";

async function sendWhatsApp(to: string, payload: any, token: string, phoneId: string) {
  return await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, ...payload })
  });
}

async function sendMetaMessage(recipientId: string, text: string, options: string[] = []) {
  if (!META_ACCESS_TOKEN) {
    console.error("[Neural] Error: META_ACCESS_TOKEN no configurado.");
    return;
  }

  const payload: any = {
    recipient: { id: recipientId },
    message: { text: text }
  };

  if (options.length > 0) {
    payload.message.quick_replies = options.slice(0, 13).map((opt, i) => ({
      content_type: "text",
      title: opt.trim().substring(0, 20),
      payload: `opt_${i}`
    }));
  }

  return await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${META_ACCESS_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const body = await req.json();

    if (url.searchParams.get('source') === 'trigger' && body.messageId) {
      console.log(`[Neural] Pulse received: ${body.messageId}`);
      
      const { data: msg, error: msgErr } = await supabase
        .from('messages')
        .select('*, conversations(*)')
        .eq('id', body.messageId)
        .single();

      if (msgErr || !msg) return new Response('Msg not found', { status: 404 });

      const conversation = Array.isArray(msg.conversations) ? msg.conversations[0] : msg.conversations;
      const companyId = conversation?.company_id;
      if (!companyId) return new Response('No company', { status: 400 });

      // Cargar contexto
      const [promptRes, historyRes, keysRes, directoryRes, companyRes, contactRes] = await Promise.all([
        supabase.from('ai_prompts').select('system_prompt').eq('company_id', companyId).eq('is_active', true).maybeSingle(),
        supabase.from('messages').select('sender_type, content').eq('conversation_id', msg.conversation_id).order('created_at', { ascending: false }).limit(10),
        supabase.from('gemini_api_keys').select('api_key').eq('is_active', true),
        supabase.from('internal_directory').select('phone, name, role').eq('company_id', companyId).limit(50),
        supabase.from('companies').select('settings').eq('id', companyId).maybeSingle(),
        supabase.from('contacts').select('phone').eq('id', conversation.contact_id).maybeSingle()
      ]);
      const systemPrompt = promptRes.data?.system_prompt || "Eres LOOP Business OS Diamond v10.4 Platinum.";
      const history = (historyRes.data || []).reverse();
      const directory = directoryRes.data || [];
      const waSettings = companyRes.data?.settings?.whatsapp;

      let keys = (Deno.env.get('GEMINI_API_KEY') || "").split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0);
      if (keys.length === 0 && keysRes.data) keys = keysRes.data.map((k: any) => k.api_key);
      
      const formattedHistory = history.map((m: any) => `${m.sender_type === 'user' ? 'User' : 'Bot'}: ${m.content}`).join('\n');
      const directoryContext = directory.map(d => `- ${d.name} (${d.phone}): ${d.role}`).join('\n');

      const fullPrompt = `${systemPrompt}\n\n[DIRECTORY]\n${directoryContext}\n\n[HISTORY]\n${formattedHistory}\n\n[INSTRUCTION]\nResponde de forma ejecutiva como Director AI de LOOP. Usa el formato v61 obligatorio (Texto --- Botón 1 | Botón 2).`;

      let aiResponse = null;
      const shuffledKeys = keys.sort(() => Math.random() - 0.5);
      
      // Bucle de inferencia resiliente
      searchLoop: for (let attempt = 0; attempt < 2; attempt++) {
        for (const key of shuffledKeys) {
          try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
            });
            if (res.ok) {
              const d = await res.json();
              aiResponse = d.candidates?.[0]?.content?.parts?.[0]?.text;
              if (aiResponse) break searchLoop;
            }
          } catch (e) {}
        }
        await delay(1000);
      }

      if (!aiResponse) throw new Error("Neural exhaustion");

      // Persistir respuesta
      const { data: botMsg } = await supabase.from('messages').insert({ 
        conversation_id: msg.conversation_id, 
        sender_type: 'bot', 
        content: aiResponse.trim() 
      }).select('id').maybeSingle();

      // CANAL DE SALIDA: Determinar fuente
      const source = msg.metadata?.source;
      const externalId = msg.metadata?.external_id;

      if (source === 'facebook' || source === 'instagram') {
        // Enviar a Meta (FB/IG)
        console.log(`[Neural] Enviando respuesta a ${source}: ${externalId}`);
        const cleanText = aiResponse.replace(/\[\[[^\[\]]+\]\]/g, '').trim();
        const parts = cleanText.split('---');
        const textPart = parts.slice(0, -1).join(' --- ').trim() || "Procesado.";
        const buttonsPart = parts[parts.length - 1];
        const options = buttonsPart ? buttonsPart.split('|').map(o => o.trim()) : [];

        await sendMetaMessage(externalId, textPart, options);
      } else {
        // Enviar a WhatsApp (Legacy flow)
        const targetPhone = contactRes.data?.phone || externalId;
        if (waSettings?.access_token && waSettings?.phone_number_id && targetPhone) {
          const cleanAiText = aiResponse.replace(/\[\[[^\[\]]+\]\]/g, '').trim();
          const parts = cleanAiText.split('---');
          const textPart = parts.slice(0, -1).join(' --- ').trim() || "Procesado por LOOP Director AI.";
          const buttonsPart = parts[parts.length - 1];

          let payload: any = { type: 'text', text: { body: textPart } };
          if (buttonsPart && buttonsPart.includes('|')) {
            const rows = buttonsPart.split('|').map((o: string, i: number) => ({ id: `btn_${i}`, title: o.trim().substring(0, 24) }));
            payload = { type: 'interactive', interactive: { type: 'list', body: { text: textPart }, action: { button: 'Opciones', sections: [{ title: 'Menú LOOP', rows: rows.slice(0, 10) }] } } };
          }
          await sendWhatsApp(targetPhone, payload, waSettings.access_token, waSettings.phone_number_id);
        }
      }

      // Procesador de acciones neurales [[ ]]
      if (aiResponse.includes('[[') && botMsg) {
        const appUrl = Deno.env.get('APP_URL') || "https://loop-business-os.vercel.app";
        fetch(`${appUrl}/api/neural-processor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': Deno.env.get('LOOP_INTERNAL_API_KEY') || Deno.env.get('INTERNAL_API_KEY') || 'loop_internal_v10_secret' },
          body: JSON.stringify({ messageId: botMsg.id, companyId: companyId })
        }).catch(() => {});
      }
   }

      return new Response('OK');
    }
    return new Response('Ignored', { status: 400 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
