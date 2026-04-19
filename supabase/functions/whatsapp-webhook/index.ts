import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req: Request) => {
  const url = new URL(req.url)

  // 1. VERIFICACIÓN DE WEBHOOK (GET)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 })
    }
    return new Response('Forbidden', { status: 403 })
  }

  // 2. PROCESAMIENTO DE MENSAJES (POST)
  if (req.method === 'POST') {
    try {
      const body = await req.json()
      const entry = body.entry?.[0]
      const changes = entry?.changes?.[0]?.value
      if (!changes || !changes.messages) return new Response('OK', { status: 200 })

      const phoneNumberId = changes.metadata?.phone_number_id
      const message = changes.messages[0]
      const senderPhone = message.from
      
      // --- ROUTER DE ENTRADA INDUSTRIAL ---
      let messageContent = ''
      let mediaId = null
      let mediaType = message.type
      let interactiveData = null

      if (message.type === 'text') {
        messageContent = message.text.body
      } else if (message.type === 'interactive') {
        interactiveData = message.interactive
        // Si el usuario tocó un botón o lista, tomamos el TÍTULO como contenido para la IA
        messageContent = interactiveData.list_reply?.title || interactiveData.button_reply?.title || ''
        console.log(`INTERACTIVE_SELECTION: ID=${interactiveData.list_reply?.id || interactiveData.button_reply?.id}`);
      } else if (['image', 'document', 'audio', 'video'].includes(message.type)) {
        mediaId = message[message.type].id
        messageContent = `[Archivo ${message.type} recibido]`
      }

      // 3. IDENTIFICAR EMPRESA (TENANT)
      const { data: company } = await supabase
        .from('companies')
        .select('id, settings')
        .contains('settings', { whatsapp: { phone_number_id: phoneNumberId } })
        .single();

      if (!company) return new Response('Unauthorized (Company not found)', { status: 200 });
      const whatsappToken = company.settings?.whatsapp?.access_token;

      // 4. GESTIÓN DE CONTACTOS Y CONVERSACIONES (Diamond logic)
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

      // 5. PROCESAMIENTO DE MEDIA (Si existe)
      let mediaPublicUrl = null
      if (mediaId && whatsappToken) {
        try {
          const mediaMetaResponse = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
            headers: { 'Authorization': `Bearer ${whatsappToken}` }
          });
          const mediaMetaData = await mediaMetaResponse.json();
          if (mediaMetaData.url) {
            const mediaFile = await fetch(mediaMetaData.url, { headers: { 'Authorization': `Bearer ${whatsappToken}` } });
            const blob = await mediaFile.blob();
            const fileName = `${company.id}/${Date.now()}_${mediaId}`;
            const { data: uploadData } = await supabase.storage.from('whatsapp_media').upload(fileName, blob, { contentType: blob.type });
            if (uploadData) {
              const { data: publicUrlData } = supabase.storage.from('whatsapp_media').getPublicUrl(fileName);
              mediaPublicUrl = publicUrlData.publicUrl;
            }
          }
        } catch (e) {
          console.error("MEDIA_PROCESSING_FAILED:", e);
        }
      }

      // 6. GUARDAR MENSAJE EN DB (Incluyendo Metadata de IDs y Media)
      const interactiveId = interactiveData?.list_reply?.id || interactiveData?.button_reply?.id;
      
      await supabase.from('messages').insert({ 
        conversation_id: conv.id, 
        sender_type: 'user', 
        content: messageContent,
        metadata: {
          interactive_id: interactiveId,
          media_url: mediaPublicUrl,
          media_type: mediaType
        }
      });

      // --- LÓGICA DE HANDOFF AUTOMÁTICO POR BOTÓN ---
      if (interactiveId && (interactiveId.includes('talk') || interactiveId.includes('agent') || interactiveId.includes('humano'))) {
        await supabase.from('conversations').update({ status: 'waiting_human' }).eq('id', conv.id);
        
        if (whatsappToken) {
          await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${whatsappToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: senderPhone,
              type: "text",
              text: { body: "Entendido. He pausado mi respuesta automática y te he contactado con un contador humano. Estará contigo en breve. 👤" }
            })
          });
        }
        return new Response('Handoff Processed', { status: 200 });
      }

      // 7. RESPUESTA NEURAL GEMINI (Si la conversación está abierta)
      if (conv.status === 'open') {
        const { data: promptData } = await supabase.from('ai_prompts').select('system_prompt').eq('company_id', company.id).eq('category', 'General').single();
        
        // Rotación de llaves para industrialización
        const { data: keyRows } = await supabase.from('gemini_api_keys').select('api_key').eq('is_active', true);
        const activeKeys = keyRows?.map((r: any) => r.api_key) || [];
        const selectedKey = activeKeys.length > 0 ? activeKeys[Math.floor(Math.random() * activeKeys.length)] : (Deno as any).env.get('GEMINI_API_KEY');

        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${selectedKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${promptData?.system_prompt || 'Eres el Agente Personal Contable de Arise.'}\n\nCliente dice: ${messageContent}` }] }]
          })
        });

        const aiResult = await geminiResponse.json();
        let aiText = aiResult.candidates?.[0]?.content?.parts?.[0]?.text || "Estoy procesando tu solicitud contable...";

        // 8. PARSER DE LISTAS INTERACTIVAS (Específicas de 10 opciones)
        let payload: any = { messaging_product: "whatsapp", to: senderPhone, type: "text", text: { body: aiText } };

        if (aiText.includes('---')) {
          const [textBody, optionsRaw] = aiText.split('---');
          const options = optionsRaw.split('|').map((o: string) => o.trim()).filter((o: string) => o.length > 0).slice(0, 10);
          
          if (options.length > 0) {
            payload = {
              messaging_product: "whatsapp",
              to: senderPhone,
              type: "interactive",
              interactive: {
                type: "list",
                header: { type: "text", text: "Menú Asistente Personal" },
                body: { text: textBody.trim() },
                footer: { text: "Presiona abajo para ver opciones" },
                action: {
                  button: "Ver Menú",
                  sections: [{
                    title: "Acciones rápidas",
                    rows: options.map((opt: string, i: number) => ({
                      id: `action_${i + 1}`,
                      title: opt.substring(0, 24), // Control estricto de Meta
                      description: "Disponible ahora"
                    }))
                  }]
                }
              }
            };
          }
        }

        // GUARDAR Y ENVIAR RESPUESTA
        await supabase.from('messages').insert({ conversation_id: conv.id, sender_type: 'bot', content: aiText });
        
        if (whatsappToken) {
          await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${whatsappToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
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
