import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

/**
 * INDUSTRIAL WHATSAPP NEURAL WEBHOOK v9.0 (Next.js Edition)
 * Soporta: Texto, Botones, Imágenes (OCR) y AUDIOS (Voz a Acción).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('[WH_INPUT] Payload received:', JSON.stringify(body, null, 2));

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    if (!changes || !changes.messages) return NextResponse.json({ status: 'no_messages' });

    const message = changes.messages[0];
    const waId = message.id;
    const sender = message.from;
    const profileName = changes.contacts?.[0]?.profile?.name || 'Usuario';
    const phoneNumberId = changes.metadata?.phone_number_id;

    // --- 1. IDEMPOTENCIA ---
    const { data: existingMsg } = await supabase
      .from('messages')
      .select('id')
      .contains('metadata', { whatsapp_message_id: waId })
      .maybeSingle();
    if (existingMsg) return NextResponse.json({ status: 'idempotent' });

    // --- 2. ENRUTAMIENTO NEURAL v9.0 ---
    const { data: allCompanies } = await supabase
      .from('companies')
      .select('*')
      .contains('settings', { whatsapp: { phone_number_id: phoneNumberId } });

    if (!allCompanies || allCompanies.length === 0) {
       console.error('[WH_ERROR] Company not found for phoneId:', phoneNumberId);
       return NextResponse.json({ status: 'company_not_found' });
    }

    const company = allCompanies[0];
    const whatsappToken = company.settings?.whatsapp?.access_token || process.env.WHATSAPP_ACCESS_TOKEN;

    // --- 3. PROCESAMIENTO MULTIMODAL (AUDIO HABILITADO) ---
    let content = '';
    let isAudio = false;

    if (message.type === 'text') {
      content = message.text?.body || '';
    } else if (message.type === 'interactive') {
      content = message.interactive.button_reply?.title || message.interactive.list_reply?.title || '';
    } else if (message.type === 'audio' || message.type === 'voice') {
      console.log('[WH_AUDIO] Audio message detected. Processing via Neural Engine...');
      isAudio = true;
      const mediaId = message.audio?.id || message.voice?.id;
      
      // Descargar audio de Meta
      const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
        headers: { 'Authorization': `Bearer ${whatsappToken}` }
      });
      const mediaData = await mediaRes.json();
      
      if (mediaData.url) {
        const audioBuffer = await fetch(mediaData.url, {
          headers: { 'Authorization': `Bearer ${whatsappToken}` }
        }).then(res => res.arrayBuffer());
        
        // --- GEMINI 2.5 FLASH LITE VOICE PERCEPTION ---
        const base64Audio = Buffer.from(audioBuffer).toString('base64');
        const voicePrompt = "Transcribe este audio de WhatsApp y responde a la solicitud. Si es una orden de inventario, genera el JSON correspondiente.";
        
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: voicePrompt },
                { inline_data: { mime_type: "audio/ogg", data: base64Audio } }
              ]
            }]
          })
        });
        
        const geminiData = await geminiRes.json();
        content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '[Audio no procesable]';
        console.log('[WH_AUDIO] Transcription result:', content);
      }
    }

    // --- 4. PERSISTENCIA ---
    const { data: contact } = await supabase.from('contacts').select('id').eq('phone', sender).eq('company_id', company.id).maybeSingle();
    let cid = contact?.id;
    if (!cid) {
      const { data: nc, error: nce } = await supabase.from('contacts').insert({ full_name: profileName, phone: sender, company_id: company.id }).select('id').single();
      if (nce || !nc) {
        console.error('[WH_ERROR] Failed to create contact:', nce);
        return NextResponse.json({ status: 'contact_creation_failed' });
      }
      cid = nc.id;
    }

    let { data: conv } = await supabase.from('conversations').select('id, status').eq('contact_id', cid).eq('company_id', company.id).order('updated_at', { ascending: false }).limit(1).maybeSingle();
    if (!conv || conv.status === 'closed') {
      const { data: nconv, error: nce } = await supabase.from('conversations').insert({ contact_id: cid, company_id: company.id, status: 'open' }).select('id, status').single();
      if (nce || !nconv) {
        console.error('[WH_ERROR] Failed to create conversation:', nce);
        return NextResponse.json({ status: 'conv_creation_failed' });
      }
      conv = nconv;
    }

    // Guardar el mensaje del usuario (o transcripción de audio)
    const { data: savedMsg, error: sme } = await supabase.from('messages').insert({ 
      conversation_id: conv.id, sender_type: 'user', content, 
      metadata: { whatsapp_message_id: waId, type: message.type, is_audio: isAudio } 
    }).select('id').single();
    if (sme || !savedMsg) {
      console.error('[WH_ERROR] Failed to save message:', sme);
      return NextResponse.json({ status: 'msg_save_failed' });
    }

    // --- 5. RESPUESTA NEURAL (INDUSTRIAL v9.0) ---
    if (conv.status === 'open') {
      // Buscar Prompt Activo
      const { data: p } = await supabase
        .from('ai_prompts')
        .select('system_prompt')
        .eq('company_id', company.id)
        .eq('is_active', true)
        .in('category', ['General', 'Internal'])
        .limit(1)
        .maybeSingle();

      const baseSystemPrompt = p?.system_prompt || "Eres Arise Diamond v9.0 (Director AI). Responde de forma ejecutiva.";

      // Rotación de API Keys (env + vault)
      let keys = (process.env.GEMINI_API_KEY || "").split(',').map(k => k.trim()).filter(k => k.length > 0);

      if (keys.length === 0) {
        const { data: vaultKeys } = await supabase
          .from('gemini_api_keys')
          .select('api_key')
          .eq('is_active', true);
        if (vaultKeys && vaultKeys.length > 0) {
          keys = vaultKeys.map(k => k.api_key);
        }
      }

      if (keys.length > 0) {
        const activeKey = keys[Math.floor(Math.random() * keys.length)];

        const promptWithContext = `${baseSystemPrompt}\n\n[USUARIO: ${profileName}]\n[MENSAJE: ${content}]`;

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${activeKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: promptWithContext }] }] })
        });

        const gData = await geminiRes.json();
        const aiText = gData.candidates?.[0]?.content?.parts?.[0]?.text || "Arise Neural Engine: Fallo de percepción.";

        // Guardar respuesta del bot
        const { data: botMsg, error: bme } = await supabase
          .from('messages')
          .insert({
            conversation_id: conv.id,
            sender_type: 'bot',
            content: aiText
          })
          .select('id')
          .single();

        // --- TRIGGER NEURAL PROCESSOR (si hay bloques de acción) ---
        if (botMsg && aiText.includes('[[')) {
          fetch(`${process.env.APP_URL || 'http://localhost:3000'}/api/neural-processor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId: botMsg.id, companyId: company.id })
          }).catch(e => console.error('[NEURAL_BRIDGE] Failed:', e));
        }

        // --- 6. WHATSAPP DELIVERY (Diamond v9.0 Smart Parser) ---
        const [textPart, buttonsPart] = aiText.split('---');
        const responseText = textPart.trim();

        let payload: any = {
          messaging_product: 'whatsapp',
          to: sender,
          type: 'text',
          text: { body: aiText }
        };

        // Parsear botones si existen
        if (buttonsPart) {
          const options = buttonsPart.split('|')
            .map(o => o.replace(/\[\[.*?\]\]/g, '').trim())
            .filter(o => o.length > 0);

          if (options.length > 0 && options.length <= 3) {
            payload = {
              messaging_product: 'whatsapp',
              to: sender,
              type: 'interactive',
              interactive: {
                type: 'button',
                body: { text: responseText.substring(0, 1024) },
                action: {
                  buttons: options.slice(0, 3).map((btn: string, i: number) => ({
                    type: 'reply',
                    reply: { id: `ai_btn_${i}_${Date.now()}`, title: btn.substring(0, 20) }
                  }))
                }
              }
            };
          }
        }

        await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }
    }

    return NextResponse.json({ status: 'success' });

  } catch (error: any) {
    console.error('[WH_CRITICAL_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
