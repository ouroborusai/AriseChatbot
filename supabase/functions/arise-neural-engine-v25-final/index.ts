import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

/**
 * MASTER NEURAL ENGINE v48 - Ouroborus AI (Industrial Sync)
 * Procesa pulsos de la DB y genera respuestas inteligentes con soporte para acciones neurales.
 * Implementa Triple Algoritmo de Resiliencia: Reintentos -> Multi-Modelo -> Rotación de Llaves.
 */
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!, 
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

async function sendWhatsApp(to: string, payload: any, token: string, phoneId: string) {
  return await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, ...payload })
  });
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const body = await req.json();

    if (req.method === 'GET') {
        const challenge = url.searchParams.get('hub.challenge');
        return new Response(challenge, { status: 200 });
    }

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

      const [promptRes, historyRes, keysRes, directoryRes, companyRes, contactRes] = await Promise.all([
        supabase.from('ai_prompts').select('system_prompt').eq('company_id', companyId).eq('is_active', true).maybeSingle(),
        supabase.from('messages').select('sender_type, content').eq('conversation_id', msg.conversation_id).order('created_at', { ascending: false }).limit(10),
        supabase.from('gemini_api_keys').select('api_key').eq('is_active', true),
        supabase.from('internal_directory').select('phone, name, role').eq('company_id', companyId).limit(50),
        supabase.from('companies').select('settings').eq('id', companyId).maybeSingle(),
        conversation.contact_id ? supabase.from('contacts').select('phone').eq('id', conversation.contact_id).maybeSingle() : Promise.resolve({ data: null })
      ]);

      const systemPrompt = promptRes.data?.system_prompt || "Eres Arise Business OS v9.0.";
      const history = (historyRes.data || []).reverse();
      const directory = directoryRes.data || [];
      const waSettings = companyRes.data?.settings?.whatsapp;

      let keys = (Deno.env.get('GEMINI_API_KEY') || "").split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0);
      if (keys.length === 0 && keysRes.data) keys = keysRes.data.map((k: any) => k.api_key);
      if (keys.length === 0) throw new Error('No API Keys');

      const formattedHistory = history.map((m: any) => `${m.sender_type === 'user' ? 'User' : 'Bot'}: ${m.content}`).join('\n');
      const directoryContext = directory.map(d => `- ${d.name} (${d.phone}): ${d.role}`).join('\n');
      const lastMsgLower = msg.content.trim().toLowerCase();
      const isReset = lastMsgLower === 'hola' || lastMsgLower === 'menú' || lastMsgLower === 'menu' || lastMsgLower === 'inicio';

      const fullPrompt = `${systemPrompt}\n\n[DIRECTORY]\n${directoryContext}\n\n[HISTORY]\n${formattedHistory}\n\n[IDENTITY]\nTe llamas ARISE. Eres la inteligencia de Arise Business OS.\n\n[INSTRUCTION]\n${isReset ? "ATENCIÓN: REINICIA la conversación saludando y mostrando el [Menú Principal]." : "Responde de forma ejecutiva y breve."}\nUsa [[ { \"action\": \"...\" } ]] para acciones.\nPara botones usa: [Texto] --- [Botón 1] | [Botón 2]`;

      let aiResponse = null;
      let lastErr = "";
      const shuffledKeys = keys.sort(() => Math.random() - 0.5);
      const models = ['gemini-2.5-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];

      // ELASTIC NEURAL LOOP: Attempts -> Models -> Keys
      searchLoop: for (let attempt = 0; attempt < 2; attempt++) {
        for (const model of models) {
          for (const key of shuffledKeys) {
            console.log(`[Neural] Trying ${model} with key ${key.substring(0, 5)}...`);
            try {
              const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
              });
              
              if (res.ok) {
                const d = await res.json();
                aiResponse = d.candidates?.[0]?.content?.parts?.[0]?.text;
                if (aiResponse) break searchLoop;
              } else {
                lastErr = await res.text();
                console.warn(`[Neural] ${model} failed: ${res.status}`);
              }
            } catch (err: any) {
              lastErr = err.message;
            }
          }
        }
        console.log(`[Neural] Full cycle failed. Cooling down 5s...`);
        await delay(5000);
      }

      if (!aiResponse) throw new Error(`Neural Exhaustion. Last Err: ${lastErr}`);

      // Persistencia y Salida
      const { data: botMsg } = await supabase.from('messages').insert({ 
        conversation_id: convId, 
        sender_type: 'bot', 
        content: aiResponse.trim() 
      }).select('id').maybeSingle();

      const targetPhone = contactRes.data?.phone;
      if (waSettings?.access_token && waSettings?.phone_number_id && targetPhone) {
        const cleanAiText = aiResponse.replace(/\[\[[^\[\]]+\]\]/g, '').trim();
        const parts = cleanAiText.split('---');
        const textPart = parts[0]?.trim() || "Procesado.";
        const buttonsPart = parts.length > 1 ? parts[1] : null;

        let payload: any = { type: 'text', text: { body: textPart } };

        if (buttonsPart) {
          const rows = buttonsPart.split('|').map((o: string) => {
            const title = o.trim().substring(0, 24);
            return { id: `btn_${title.toLowerCase().replace(/\s+/g, '_')}`, title };
          });
          payload = {
            type: 'interactive',
            interactive: {
              type: 'list',
              body: { text: textPart },
              action: { button: 'Opciones', sections: [{ title: 'Acciones', rows }] }
            }
          };
        }
        await sendWhatsApp(targetPhone, payload, waSettings.access_token, waSettings.phone_number_id);
      }

      if (aiResponse.includes('[[') && botMsg) {
        const appUrl = Deno.env.get('APP_URL') || "https://arise-business-os.vercel.app";
        fetch(`${appUrl}/api/neural-processor`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'x-api-key': Deno.env.get('INTERNAL_API_KEY') || 'arise_internal_v9_secret' 
          },
          body: JSON.stringify({ messageId: botMsg.id, companyId: companyId })
        }).catch(() => {});
      }
      return new Response('OK');
    }
    return new Response('Ignored', { status: 400 });
  } catch (e: any) {
    console.error(`[Neural] FATAL: ${e.message}`);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
