import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req: Request) => {
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
      const senderPhoneRaw = message.from // Usually digit-only string
      const senderPhoneFormatted = senderPhoneRaw.startsWith('+') ? senderPhoneRaw : `+${senderPhoneRaw}`
      
      let messageContent = ''
      let interactiveData = null

      if (message.type === 'text') {
        messageContent = message.text.body
      } else if (message.type === 'interactive') {
        interactiveData = message.interactive
        messageContent = interactiveData.list_reply?.title || interactiveData.button_reply?.title || ''
      } else if (message.type === 'audio') {
        const audioId = message.audio.id;
        messageContent = `[AUDIO_MESSAGE_RECEIVED: ${audioId}]`; 
        console.log(`AUDIO_RECEIVED: ${audioId}. Ready for Transcription Pipeline.`);
      }

      // 1. Identificación Multi-Tenant (Priorizar empresa con token activo si hay colisión)
      const { data: companies, error: idError } = await supabase
        .from('companies')
        .select('id, settings')
        .contains('settings', { whatsapp: { phone_number_id: phoneNumberId } });

      if (idError) throw idError;
      
      // Priorizar la que tiene access_token si hay múltiples
      const company = (companies as any[])?.find((c: any) => c.settings?.whatsapp?.access_token) || companies?.[0];

      if (!company) {
        console.warn(`IDENTIFICATION_FAILED: No company found for PhoneID ${phoneNumberId}`);
        return new Response('Unauthorized', { status: 200 });
      }
      const whatsappToken = company.settings?.whatsapp?.access_token;

      // 2. Identificación de Rol (Interno vs Cliente)
      const { data: internalMember } = await supabase
        .from('internal_directory')
        .select('name, role')
        .eq('phone', senderPhoneRaw)
        .eq('company_id', company.id)
        .maybeSingle();

      const senderType = internalMember ? 'agent' : 'user';

      // 3. Gestión de Contacto y Conversación (Auto-Onboarding Lead Flow)
      const { data: contact } = await supabase.from('contacts').select('id, category').eq('phone', senderPhoneRaw).eq('company_id', company.id).maybeSingle();
      let contactId = contact?.id;
      let contactCategory = contact?.category;

      if (!contactId) {
        // Todo número nuevo NO registrado internamente entra como Lead (Prospecto)
        contactCategory = internalMember ? (internalMember.role === 'admin' ? 'admin' : 'employee') : 'lead';
        
        const { data: nc } = await supabase.from('contacts').insert({ 
          full_name: internalMember ? internalMember.name : senderPhoneFormatted, 
          phone: senderPhoneRaw, 
          company_id: company.id,
          category: contactCategory
        }).select('id').single();
        contactId = nc?.id;
      }

      let { data: conv } = await supabase.from('conversations').select('id, status').eq('contact_id', contactId).eq('company_id', company.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      
      if (!conv || conv.status === 'closed') {
        const { data: nconv } = await supabase.from('conversations').insert({ contact_id: contactId, company_id: company.id, status: 'open' }).select('id, status').single();
        conv = nconv;
      }

      // 3.5. PDF / Document Intercept Auto-Generador
      const pdfKeywords = ['reporte', 'pdf', 'documento', 'inventario', 'cotización', 'factura', 'balance'];
      const isPdfRequest = pdfKeywords.some(kw => messageContent.toLowerCase().includes(kw)) || 
                           interactiveData?.button_reply?.id?.includes('pdf') || 
                           interactiveData?.list_reply?.id?.includes('pdf') ||
                           interactiveData?.button_reply?.title?.toLowerCase().includes('pdf') ||
                           interactiveData?.list_reply?.title?.toLowerCase().includes('pdf');

      if (isPdfRequest) {
        if (whatsappToken) {
           await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${whatsappToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ messaging_product: "whatsapp", to: senderPhoneRaw, type: "text", text: { body: "⏳ Procesando síntesis documental. Esto tomará unos segundos..." } })
           });
        }
        
        // Disparar PDF API. Fire & Forget background.
        const appUrl = Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'https://ouroborusai.vercel.app';
        fetch(`${appUrl}/api/pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               targetPhone: senderPhoneRaw,
               whatsappToken,
               phoneNumberId,
               reportType: 'Documento'
            })
        }).catch(err => console.error("PDF_TRIG_ERR", err));
        
        return new Response('Processed', { status: 200 }); 
      }

      // 4. Handoff Automático
      const handoffKeywords = ['agente', 'hablar', 'humano', 'ayuda', 'asistente', 'soporte'];
      const isHandoffRequest = handoffKeywords.some(kw => messageContent.toLowerCase().includes(kw)) || 
                              interactiveData?.button_reply?.id?.includes('talk') || 
                              interactiveData?.list_reply?.id?.includes('talk');

      if (isHandoffRequest && conv.status !== 'waiting_human') {
        await supabase.from('conversations').update({ status: 'waiting_human' }).eq('id', conv.id);
        conv.status = 'waiting_human';
      }

      // Guardar mensaje del usuario con metadata interactiva
      await supabase.from('messages').insert({ 
        conversation_id: conv.id, 
        sender_type: senderType, 
        content: messageContent,
        metadata: { 
          interactive_id: interactiveData?.list_reply?.id || interactiveData?.button_reply?.id,
          raw_whatsapp_type: message.type
        }
      });

      // 4. Procesamiento AI (Solo si la conversación está abierta y el remitente es un CLIENTE)
      // Nota: Los admins pueden hablar pero quizás el bot debería atenderlos como "Socio AI"
      if (conv.status === 'open') {
        const isInternal = senderType === 'agent';
        const { data: promptData } = await supabase
          .from('ai_prompts')
          .select('system_prompt')
          .eq('company_id', company.id)
          .eq('category', isInternal ? 'Internal' : 'General')
          .maybeSingle();
        
        const systemPrompt = promptData?.system_prompt || (isInternal 
          ? 'Eres el Copiloto de Arise. Estás hablando con un Admin/Empleado. Sé técnico y directo.' 
          : 'Eres el Asistente de Arise. Estás hablando con un Cliente.');

        const { data: keyRows } = await supabase.from('gemini_api_keys').select('id, api_key').eq('is_active', true);
        const activeKeys = keyRows || [];
        
        let aiText = "Lo siento, estoy experimentando dificultades técnicas. Por favor, intenta de nuevo en unos momentos.";
        let interactiveButtons: string[] = [];

        if (activeKeys.length > 0) {
          const selectedKeyObj = activeKeys[Math.floor(Math.random() * activeKeys.length)];
          const selectedKey = selectedKeyObj.api_key;

          try {
            const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${selectedKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ 
                  parts: [{ 
                    text: `${systemPrompt}${messageContent.length < 5 ? '\n(El usuario envió un mensaje corto/test. Sé breve y pregúntale cómo puedes ayudarle hoy de forma amigable.)' : ''}\n\nCliente: ${messageContent}` 
                  }] 
                }]
              })
            });

            if (geminiResponse.ok) {
              const aiResult = await geminiResponse.json();
              aiText = aiResult.candidates?.[0]?.content?.parts?.[0]?.text || "Estoy procesando tu solicitud...";
            } else {
              const errorData = await geminiResponse.json();
              console.error("GEMINI_API_ERROR:", selectedKeyObj.id, errorData);
              // Desactivar llave si es error de cuota o auth
              if (geminiResponse.status === 429 || geminiResponse.status === 401 || geminiResponse.status === 400) {
                await supabase.from('gemini_api_keys').update({ is_active: false, error_count: 5 }).eq('id', selectedKeyObj.id);
              }
            }
          } catch (e) {
            console.error("GEMINI_FETCH_CRITICAL:", e);
          }
        }

        // Parsear botones: "Texto --- Boton1 | Boton2"
        let payload: any = { messaging_product: "whatsapp", to: senderPhoneRaw, type: "text", text: { body: aiText } };

        if (!aiText.includes('---')) {
          aiText += "\n\n--- 👥 Ayuda | 🏠 Menú Principal | 📊 Ver Status";
        }

        const portions = aiText.split('---');
        const textBody = portions[0].trim();
        const optionsRaw = portions[1];
        const options = optionsRaw.split('|').map(o => o.trim()).filter(o => o.length > 0);
        interactiveButtons = options;
        
        if (options.length > 0 && options.length <= 3) {
          payload = {
            messaging_product: "whatsapp",
            to: senderPhoneRaw,
            type: "interactive",
            interactive: {
              type: "button",
              body: { text: textBody.substring(0, 1024) },
              action: {
                buttons: options.map((opt, i) => ({
                  type: "reply",
                  reply: { id: `action_${i}_${Date.now()}`, title: opt.substring(0, 20) }
                }))
              }
            }
          };
        } else if (options.length > 3) {
          payload = {
            messaging_product: "whatsapp",
            to: senderPhoneRaw,
            type: "interactive",
            interactive: {
              type: "list",
              header: { type: "text", text: "Menú Arise" },
              body: { text: textBody.substring(0, 1024) },
              footer: { text: "Selecciona una opción" },
              action: {
                button: "Ver Opciones",
                sections: [{
                  title: "Opciones disponibles",
                  rows: options.slice(0, 10).map((opt, i) => ({
                    id: `list_${i}_${Date.now()}`,
                    title: opt.substring(0, 24),
                    description: "Toca para elegir"
                  }))
                }]
              }
            }
          };
        }

        // Guardar mensaje del bot
        await supabase.from('messages').insert({ 
          conversation_id: conv.id, 
          sender_type: 'bot', 
          content: aiText,
          metadata: { interactive_buttons: interactiveButtons }
        });
        
        // Enviar a WhatsApp (Usando senderPhoneRaw SIN +)
        if (whatsappToken) {
          const metaResp = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${whatsappToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          if (!metaResp.ok) {
            const metaData = await metaResp.json();
            console.error("META_API_ERROR_DETAIL:", JSON.stringify(metaData));
            // Protocolo Fallback: Reintento en texto plano si falló el interactivo
            if (payload.type === 'interactive') {
              await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${whatsappToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  messaging_product: "whatsapp", 
                  to: senderPhoneRaw, 
                  type: "text", 
                  text: { body: aiText.split('---')[0].trim() } 
                })
              });
            }
          } else {
            console.log("META_DELIVERY_SUCCESS for conversation", conv.id);
          }
        }
      }

      return new Response('Processed', { status: 200 })
    } catch (err) {
      console.error('CRITICAL_WEBHOOK_FAILURE:', err);
      return new Response('Internal Error', { status: 200 }); // Retornar 200 para evitar loops de reintento de Meta
    }
  }

  return new Response('Forbidden', { status: 403 })
})
