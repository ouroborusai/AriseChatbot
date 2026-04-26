import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

/**
 * MASTER NEURAL ENGINE Diamond v10.1 - Ouroborus AI
 * Procesa pulsos de la DB y genera respuestas inteligentes con soporte para acciones neurales.
 */
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!, 
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const DIRECTOR_PHONE = "56990062213";

async function sendWhatsApp(to: string, payload: any, token: string, phoneId: string) {
  return await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, ...payload })
  });
}

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const body = await req.json();

    if (req.method === 'GET') {
        const challenge = url.searchParams.get('hub.challenge');
        return new Response(challenge, { status: 200 });
    }

    // --- TRIGGER MODE (tr_neural_pulse) ---
    if (url.searchParams.get('source') === 'trigger' && body.messageId) {
      console.log(`[Neural] Pulse received for message: ${body.messageId}`);
      
      // 1. Obtener mensaje y contexto de conversación
      const { data: msg, error: msgErr } = await supabase
        .from('messages')
        .select('*, conversations(*)')
        .eq('id', body.messageId)
        .single();

      if (msgErr || !msg) return new Response('Msg not found', { status: 404 });

      const companyId = msg.conversations.company_id;
      const convId = msg.conversation_id;

      // 2. Obtener Prompt y API Keys
      const { data: p } = await supabase.from('ai_prompts').select('system_prompt').eq('company_id', companyId).eq('is_active', true).limit(1).maybeSingle();
      const { data: history } = await supabase.from('messages').select('sender_type, content').eq('conversation_id', convId).order('created_at', { ascending: false }).limit(10);
      
      let keys = (Deno.env.get('GEMINI_API_KEY') || "").split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0);
      if (keys.length === 0) {
        const { data: vaultKeys } = await supabase.from('gemini_api_keys').select('api_key').eq('is_active', true);
        if (vaultKeys) keys = vaultKeys.map((k: any) => k.api_key);
      }

      if (keys.length === 0) return new Response('No API Keys', { status: 500 });

      // 3. Formatear historial para Gemini
      const formattedHistory = (history || [])
        .reverse()
        .map((m: any) => `${m.sender_type === 'user' ? 'Usuario' : 'Loop'}: ${m.content}`)
        .join('\n');

      const systemPrompt = p?.system_prompt || 'Eres LOOP, el Director de Operaciones (Diamond CORE). Tu misión: "Cierra el ciclo de tus tareas con Loop".';
      
      const lastMsgLower = msg.content.trim().toLowerCase();
      const isReset = lastMsgLower === 'hola' || lastMsgLower === 'menú' || lastMsgLower === 'menu' || lastMsgLower === 'inicio';

      const promptWithContext = `
${systemPrompt}

[HISTORIAL DE CONVERSACIÓN]
${formattedHistory}

[INSTRUCCIÓN FINAL]
${isReset 
  ? "ATENCIÓN: SALUDO DETECTADO. Reinicia el contexto. Muestra OBLIGATORIAMENTE el Menú Inicial con al menos 5 opciones (📦 Inventario | 💰 Finanzas | 👥 Personal | 📊 Reportes | ⚙️ Ajustes) usando el formato: [Texto] --- [Opción 1] | [Opción 2] | [Opción 3] | [Opción 4] | [Opción 5]" 
  : "Genera una respuesta ejecutiva y breve. Ofrece alternativas para cerrar el ciclo."}
Si necesitas realizar una acción (inventario, reporte, etc.), incluye el bloque [[ { "action": "..." } ]] al final.
Para botones, usa el formato: [Texto de respuesta] --- [Botón 1] | [Botón 2]
`;

      let aiResponse = null;
      const apiKey = keys[Math.floor(Math.random() * keys.length)];

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: promptWithContext }] }] })
      });
      
      if (res.status === 200) {
        const d = await res.json();
        aiResponse = d.candidates?.[0]?.content?.parts?.[0]?.text;
      } else {
        const errorText = await res.text();
        console.error(`[Neural] Gemini API Error (${res.status}): ${errorText}`);
        // Registrar telemetría de error si es posible
        await supabase.from('ai_api_telemetry').insert({
          company_id: companyId,
          model_name: 'gemini-2.5-flash-lite',
          latency_ms: 0,
          created_at: new Date().toISOString(),
          metadata: { error: errorText, status: res.status, phase: 'generation' }
        });
      }

      if (aiResponse) {
        // 4. Persistir respuesta del Bot
        const { data: botMsg } = await supabase.from('messages').insert({ 
            conversation_id: convId, 
            sender_type: 'bot', 
            content: aiResponse.trim() 
        }).select('id').single();

        // 5. Enviar a WhatsApp
        const { data: comp } = await supabase.from('companies').select('settings').eq('id', companyId).single();
        const { data: cont } = await supabase.from('contacts').select('phone').eq('id', msg.conversations.contact_id).single();
        
        const waToken = comp.settings.whatsapp.access_token;
        const phoneId = comp.settings.whatsapp.phone_number_id;

        // Limpiar bloques de acción para el mensaje de texto
        const cleanAiText = aiResponse.replace(/\[\[[^\[\]]+\]\]/g, '').trim();
        const parts = cleanAiText.split('---');
        const textPart = parts[0]?.trim();
        const buttonsPart = parts.length > 1 ? parts[1] : null;

        let payload: any = { type: 'text', text: { body: textPart } };

        if (buttonsPart) {
          const rows = buttonsPart.split('|').map((o: string) => {
            const title = o.trim().replace(/[\[\]]/g, '').substring(0, 24);
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

        await sendWhatsApp(cont.phone, payload, waToken, phoneId);

        // 6. Bridge al Neural Processor (Si hay acciones)
        if (aiResponse.includes('[[')) {
          const appUrl = Deno.env.get('APP_URL') || "https://arise-business-os.vercel.app";
          fetch(`${appUrl}/api/neural-processor`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json', 
              'x-api-key': Deno.env.get('INTERNAL_API_KEY') || 'arise_internal_v9_secret' 
            },
            body: JSON.stringify({ messageId: botMsg?.id, companyId: companyId })
          }).catch((e: Error) => console.error('[Neural Bridge] Failed:', e));
        }
      }
      return new Response('OK');
    }

    return new Response('Not a trigger', { status: 400 });
  } catch (e: any) {
    console.error(`[Neural] Fatal error: ${e.message}`);
    return new Response('Fatal', { status: 500 });
  }
});

