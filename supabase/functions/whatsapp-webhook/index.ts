import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

// ════════════════════════════════════════════════════════════════════════════
// LOOP WHATSAPP PARSER (Inline para Deno Edge Functions)
// Diamond v10.0 Smart Parser - Detecta --- y | para crear interactivos
// ════════════════════════════════════════════════════════════════════════════

const WHATSAPP_LIMITS = {
  MAX_BUTTONS: 3,
  MAX_BUTTON_TITLE_LENGTH: 20,
  MAX_TEXT_BODY_LENGTH: 1024,
  MAX_TEXT_LENGTH: 4096,
  MAX_ROW_TITLE_LENGTH: 24,
  MAX_ROW_DESCRIPTION_LENGTH: 72,
  MAX_ROWS_PER_SECTION: 10,
  MAX_LIST_BUTTON_TEXT: 20,
} as const;

function buildInteractivePayload(sender: string, aiText: string) {
  // Si no hay separador, enviar texto plano
  if (!aiText.includes('---')) {
    return {
      messaging_product: 'whatsapp' as const,
      to: sender,
      type: 'text' as const,
      text: { body: aiText.substring(0, WHATSAPP_LIMITS.MAX_TEXT_LENGTH) },
    };
  }

  const parts = aiText.split('---').map(s => s.trim());
  const bodyText = parts[0] || 'Seleccione una opción:';
  const optionsStr = parts[parts.length - 1];

  // Limpiar tags de acción [[...]] y parsear opciones
  const options = optionsStr.split('|')
    .map(o => o.replace(/\[\[.*?\]\]/g, '').replace(/[\[\]]/g, '').trim())
    .filter(o => o.length > 0);

  if (options.length === 0) {
    return {
      messaging_product: 'whatsapp' as const,
      to: sender,
      type: 'text' as const,
      text: { body: aiText.substring(0, WHATSAPP_LIMITS.MAX_TEXT_LENGTH) },
    };
  }

  // Siempre usar Lista interactiva para mantener consistencia y ofrecer alternativas (Capacidad 10)
  return {
    messaging_product: 'whatsapp' as const,
    to: sender,
    type: 'interactive' as const,
    interactive: {
      type: 'list' as const,
      body: { text: bodyText.substring(0, WHATSAPP_LIMITS.MAX_TEXT_BODY_LENGTH) },
      footer: { text: 'Cierra el ciclo de tus tareas con Loop' },
      action: {
        button: 'Ver Opciones',
        sections: [{
          title: 'Acciones Sugeridas',
          rows: options.slice(0, WHATSAPP_LIMITS.MAX_ROWS_PER_SECTION).map((o, i) => {
            const title = o.substring(0, WHATSAPP_LIMITS.MAX_ROW_TITLE_LENGTH);
            return {
              id: `bot_list_${i}_${Date.now()}`,
              title: title,
              description: 'Comando Neural',
            };
          }),
        }],
      },
    },
  };
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  const url = new URL(req.url);

  // --- 0. WEBHOOK VERIFICATION ---
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    if (mode === 'subscribe' && token === VERIFY_TOKEN) return new Response(challenge, { status: 200 });
    return new Response('Forbidden', { status: 403 });
  }

  const isTriggerSource = url.searchParams.get('source') === 'trigger';

  try {
    const body = await req.json();
    
    // --- MODO ASÍNCRONO v9.0 (Neural Pulse) ---
    if (isTriggerSource && body.messageId) {
       console.log(`[Neural_Brain] Iniciando inferencia para mensaje: ${body.messageId}`);
       // Recuperar mensaje y contexto
       const { data: msg } = await supabase.from('messages').select('*, conversations(*)').eq('id', body.messageId).single();
       if (!msg) return new Response('Msg not found');

       const { data: p } = await supabase.from('ai_prompts').select('system_prompt').eq('company_id', msg.conversations.company_id).eq('is_active', true).limit(1).maybeSingle();
       const baseSystemPrompt = p?.system_prompt || 'Eres LOOP Director AI. "Cierra el ciclo de tus tareas con Loop".';
       
       const keys = GEMINI_API_KEY.split(',').map(k => k.trim());
       const activeKey = keys[Math.floor(Math.random() * keys.length)];

       const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${activeKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: `${baseSystemPrompt}\n\nMENSAJE: ${msg.content}` }]}] })
       });

       const gData = await geminiRes.json();
       const aiText = gData.candidates?.[0]?.content?.parts?.[0]?.text || "Loop Engine: Error.";

       // Guardar respuesta
       await supabase.from('messages').insert({
          conversation_id: msg.conversation_id,
          sender_type: 'bot',
          content: aiText
       });

       // Enviar a WhatsApp
       const { data: comp } = await supabase.from('companies').select('settings').eq('id', msg.conversations.company_id).single();
       const waToken = comp.settings?.whatsapp?.access_token;
       const phoneId = comp.settings?.whatsapp?.phone_number_id;
       const { data: contact } = await supabase.from('contacts').select('phone').eq('id', msg.conversations.contact_id).single();

       await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
         method: 'POST',
         headers: { 'Authorization': `Bearer ${waToken}`, 'Content-Type': 'application/json' },
         body: JSON.stringify({ messaging_product: 'whatsapp', to: contact.phone, type: 'text', text: { body: aiText } })
       });

       return new Response('Neural Done');
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    if (!changes || !changes.messages) return new Response('OK');

    const message = changes.messages[0];
    const waId = message.id;
    const sender = message.from;
    const profileName = changes.contacts?.[0]?.profile?.name || 'Usuario';
    const phoneNumberId = changes.metadata?.phone_number_id;

    console.log(`[Webhook_Perception] Msg from ${sender} to ID ${phoneNumberId}`);

    // --- 1. IDEMPOTENCY ---
    const { data: existingMsg, error: idEmpError } = await supabase.from('messages').select('id').contains('metadata', { whatsapp_message_id: waId }).maybeSingle();
    if (idEmpError) console.error('[Webhook] Idempotency Check Error:', idEmpError);
    if (existingMsg) {
      console.log(`[Webhook] Duplicate message detected: ${waId}`);
      return new Response('OK');
    }

    // --- 2. IDENTITY RESOLUTION ---
    let companyId = '';
    let contactId = '';

    const { data: staff, error: staffError } = await supabase.from('internal_directory').select('company_id').eq('phone', sender).maybeSingle();
    if (staffError) console.error('[Webhook] Staff Lookup Error:', staffError);

    const { data: contact, error: contactError } = await supabase.from('contacts').select('id, company_id').eq('phone', sender).limit(1).maybeSingle();
    if (contactError) console.error('[Webhook] Contact Lookup Error:', contactError);

    if (staff) {
      companyId = staff.company_id;
      console.log(`[Identity] Staff detected for Company ${companyId}`);
      if (contact && contact.company_id === companyId) {
        contactId = contact.id;
      } else {
        const { data: nc, error: nce } = await supabase.from('contacts').insert({ full_name: `${profileName} (Admin)`, phone: sender, company_id: companyId }).select('id').single();
        if (nce) console.error('[Webhook] Staff-Contact Insert Error:', nce);
        contactId = nc?.id;
      }
    } else if (contact) {
      companyId = contact.company_id;
      contactId = contact.id;
      console.log(`[Identity] Existing contact found for Company ${companyId}`);
    } else {
      console.log(`[Identity] Unknown sender. Resolving fallback via PhoneID ${phoneNumberId}`);
      const { data: defaultComp, error: defError } = await supabase.from('companies').select('id').contains('settings', { whatsapp: { phone_number_id: phoneNumberId } }).limit(1).maybeSingle();
      if (defError) console.error('[Webhook] Default Company Lookup Error:', defError);
      
      if (!defaultComp) {
        console.error(`[Webhook] CRITICAL: No company found for PhoneID ${phoneNumberId}`);
        return new Response('OK');
      }
      companyId = defaultComp.id;
      const { data: nc, error: nce } = await supabase.from('contacts').insert({ full_name: profileName, phone: sender, company_id: companyId }).select('id').single();
      if (nce) console.error('[Webhook] New Contact Insert Error:', nce);
      contactId = nc?.id;
    }

    if (!companyId || !contactId) {
      console.error('[Webhook] Failed to resolve identity. Aborting.');
      return new Response('OK');
    }

    // --- 3. CONFIG RETRIEVAL ---
    const { data: company } = await supabase.from('companies').select('*').eq('id', companyId).single();
    if (!company) return new Response('OK');
    const waToken = company.settings?.whatsapp?.access_token || Deno.env.get('WHATSAPP_ACCESS_TOKEN');

    // --- 4. PERCEPTION (Text Optimized) ---
    let content = '';
    if (message.type === 'text') {
      content = message.text?.body || '';
    } else if (message.type === 'interactive') {
      content = message.interactive.button_reply?.title || message.interactive.list_reply?.title || '';
    } else if (message.type === 'audio' || message.type === 'voice') {
      content = '[Audio recibido - No procesado]';
    } else {
      content = `[Multimedia: ${message.type}]`;
    }

    // --- 5. IMMEDIATE PERSISTENCE (UI Speed) ---
    let { data: conv } = await supabase.from('conversations').select('id, status').eq('contact_id', contactId).eq('company_id', companyId).order('updated_at', { ascending: false }).limit(1).maybeSingle();
    
    if (!conv || conv.status === 'closed') {
      const { data: nconv } = await supabase.from('conversations').insert({ contact_id: contactId, company_id: companyId, status: 'open' }).select('id').single();
      conv = nconv;
    }

    // A. Persistir mensaje de usuario inmediatamente
    await supabase.from('messages').insert({
      conversation_id: conv.id,
      sender_type: 'user',
      content: content || '[Mensaje]',
      metadata: { whatsapp_message_id: waId, type: message.type }
    });

    console.log(`[Webhook_Perception] Msg persisted for trigger. Execution finished.`);
    return new Response('OK');
  } catch (err) {
    console.error('[CRITICAL] Webhook Error:', err);
    return new Response('OK');
  }
});

