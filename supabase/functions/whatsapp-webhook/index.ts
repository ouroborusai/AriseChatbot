import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN')!
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  const url = new URL(req.url)

  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 })
    }
    return new Response('Forbidden', { status: 403 })
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json()
      const entry = body.entry?.[0]
      const changes = entry?.changes?.[0]?.value
      if (!changes || !changes.messages) return new Response('OK', { status: 200 })

      const phoneNumberId = changes.metadata?.phone_number_id
      const message = changes.messages[0]
      const senderPhone = message.from
      const messageContent = message.text?.body || ''

      // 1. IDENTIFICAR EMPRESA
      const { data: company } = await supabase
        .from('companies')
        .select('id, settings')
        .contains('settings', { whatsapp: { phone_number_id: phoneNumberId } })
        .single();

      if (!company) return new Response('Unauthorized', { status: 200 });

      // 2. BUSCAR/CREAR CONTACTO + CONVERSACIÓN
      const { data: contact } = await supabase.from('contacts').select('id').eq('phone', senderPhone).eq('company_id', company.id).single();
      let contactId = contact?.id;
      if (!contactId) {
        const { data: nc } = await supabase.from('contacts').insert({ full_name: senderPhone, phone: senderPhone, company_id: company.id }).select('id').single();
        contactId = nc?.id;
      }

      let { data: conv } = await supabase.from('conversations').select('id, status').eq('contact_id', contactId).eq('status', 'open').single();
      if (!conv) {
        const { data: nconv } = await supabase.from('conversations').insert({ contact_id: contactId, company_id: company.id, status: 'open' }).select('id').single();
        conv = nconv;
      }

      // 3. GUARDAR MENSAJE DEL USUARIO
      await supabase.from('messages').insert({ conversation_id: conv.id, sender_type: 'user', content: messageContent });

      // 4. ¿EL BOT DEBE RESPONDER? (LÓGICA HANDOFF)
      if (conv.status === 'open') {
        const { data: promptData } = await supabase.from('ai_prompts').select('system_prompt').eq('company_id', company.id).eq('category', 'General').single();
        
        // ROTACIÓN DINÁMICA DE LLAVES GEMINI
        const { data: keyRows } = await supabase.from('gemini_api_keys').select('api_key').eq('is_active', true);
        const activeKeys = keyRows?.map(r => r.api_key) || [];
        const selectedKey = activeKeys.length > 0 
          ? activeKeys[Math.floor(Math.random() * activeKeys.length)] 
          : GEMINI_API_KEY;

        console.log(`USING_KEY: ...${selectedKey.slice(-4)}`);

        // LLAMADA A GEMINI NEURAL ENGINE (STANDARD 2.5 FLASH LITE)
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${selectedKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${promptData?.system_prompt || 'Eres un asistente industrial experto en Arise.'}\n\nCliente dice: ${messageContent}` }] }]
          })
        });

        const aiResult = await geminiResponse.json();
        console.log('GEMINI_RAW_RESPONSE:', JSON.stringify(aiResult)); // Telemetría de diagnóstico

        let aiText = "Lo siento, mi conexión neural está inestable.";
        if (aiResult.candidates?.[0]?.content?.parts?.[0]?.text) {
          aiText = aiResult.candidates[0].content.parts[0].text;
        } else if (aiResult.error) {
          console.error('GEMINI_API_ERROR:', aiResult.error.message);
          aiText = `Error Neural: ${aiResult.error.message}`;
        }

        // 5. GUARDAR RESPUESTA DEL BOT
        await supabase.from('messages').insert({ conversation_id: conv.id, sender_type: 'bot', content: aiText });

        // 6. ENVIAR A WHATSAPP (META API)
        const whatsappToken = company.settings?.whatsapp?.access_token;
        if (whatsappToken) {
           await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
             method: 'POST',
             headers: { 'Authorization': `Bearer ${whatsappToken}`, 'Content-Type': 'application/json' },
             body: JSON.stringify({ messaging_product: "whatsapp", to: senderPhone, type: "text", text: { body: aiText } })
           });
        }
      }

      return new Response('Processed', { status: 200 })
    } catch (err) {
      console.error('WEBHOOK_CRITICAL_ERROR:', err);
      return new Response('Error', { status: 200 });
    }
  }
  return new Response('Forbidden', { status: 403 })
})
