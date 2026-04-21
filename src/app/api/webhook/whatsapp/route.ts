import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = (process.env.ARISE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();

const supabase = createClient(supabaseUrl!, supabaseKey!);

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

/**
 * INDUSTRIAL WHATSAPP NEURAL WEBHOOK v9.0 CORE
 * Arquitectura de Control de Flujo Estricto.
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
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    
    if (!changes || !changes.messages) return NextResponse.json({ status: 'no_messages' });

    const message = changes.messages[0];
    const waId = message.id;
    const sender = message.from;
    const profileName = changes.contacts?.[0]?.profile?.name || 'Usuario';
    const phoneNumberId = changes.metadata?.phone_number_id;

    console.log("==========================================");
    console.log(`[ID_RES_START] Processing message from: ${sender} (${profileName})`);
    console.log(`[ID_RES_AUTH] Using Key: ${supabaseKey?.substring(0, 10)}...`);
    console.log(`[WH_INPUT] New message from ${sender} (${profileName})`);

    // --- 1. IDEMPOTENCIA ---
    const { data: existingMsg } = await supabase
      .from('messages')
      .select('id')
      .contains('metadata', { whatsapp_message_id: waId })
      .maybeSingle();
      
    if (existingMsg) return NextResponse.json({ status: 'idempotent_skip' });

    // --- 2. RESOLUCIÓN DE IDENTIDAD Y EMPRESA (Lógica Consolidada) ---
    // Intentar resolver contact_id y company_id de una sola vez
    let { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, company_id')
      .eq('phone', sender)
      .limit(1)
      .maybeSingle();

    if (contactError) {
      console.error(`[ID_RES_ERROR] Database error during contact lookup:`, contactError);
      if (contactError.message?.includes('Invalid API key')) {
        console.error(`[AUTH_CRITICAL] THE SERVICE_ROLE_KEY IS BEING REJECTED BY SUPABASE.`);
      }
    }
    console.log(`[ID_RES] Contact lookup for ${sender}:`, contact);

    let companyId = contact?.company_id;
    let contactId = contact?.id;

    // Si no hay contacto, resolver por el directorio interno o el Phone ID de la empresa
    if (!companyId) {
      const { data: staff } = await supabase.from('internal_directory').select('company_id').eq('phone', sender).maybeSingle();
      console.log(`[ID_RES] Staff lookup:`, staff);
      if (staff) {
        companyId = staff.company_id;
      } else {
        const { data: comp } = await supabase.from('companies').select('id').contains('settings', { whatsapp: { phone_number_id: phoneNumberId } }).limit(1).maybeSingle();
        console.log(`[ID_RES] Company by PhoneID lookup (${phoneNumberId}):`, comp);
        companyId = comp?.id;
      }

      if (!companyId) {
        console.warn(`[ID_RES] FAILED to resolve company for ${sender}`);
        return NextResponse.json({ status: 'unauthorized_sender' }, { status: 401 });
      }

      // Crear contacto si no existe
      const { data: newContact } = await supabase.from('contacts').insert({ full_name: profileName, phone: sender, company_id: companyId }).select('id').single();
      contactId = newContact?.id;
    }

    if (!contactId || !companyId) {
      console.warn(`[ID_RES] Final validation failed. contactId: ${contactId}, companyId: ${companyId}`);
      return NextResponse.json({ status: 'identity_resolution_failed' });
    }

    // --- 3. GESTIÓN DE CONVERSACIÓN ---
    let { data: conv } = await supabase
      .from('conversations')
      .select('id, status')
      .eq('contact_id', contactId)
      .eq('company_id', companyId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!conv || conv.status === 'closed') {
      const { data: nconv } = await supabase.from('conversations').insert({ contact_id: contactId, company_id: companyId, status: 'open' }).select('id, status').single();
      conv = nconv;
    }

    if (!conv) return NextResponse.json({ status: 'conversation_failure' });

    // --- 4. PROCESAMIENTO DE CONTENIDO ---
    // Soporte solo para Mensajes de Texto e Interactivos (Diamond v9.6)
    const buttonId = message.interactive?.button_reply?.id || message.interactive?.list_reply?.id;
    let content = message.text?.body || message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || '';
    
    // Si es una acción técnica, la anteponemos al contenido para que la IA/Lógica la reconozca
    if (buttonId) {
      console.log(`[ACTION_DETECTED] Button ID: ${buttonId}`);
    }
    
    if (!content && message.type !== 'text') {
      console.log('--- Ignorando mensaje no soportado (Multimedia/Audio) ---');
      return NextResponse.json({ status: 'unsupported_message_type' });
    }

    // Persistir mensaje del usuario independientemente del estado (para el log)
    await supabase.from('messages').insert({ 
      conversation_id: conv.id,
      sender_type: 'user',
      content, 
      metadata: { whatsapp_message_id: waId, type: message.type } 
    });

    // --- 5. CLÁUSULA DE GUARDA v9.1 (Doble Validación) ---
    if (conv.status !== 'open') {
      console.log(`[HANDOFF] AI Interrupted for conv ${conv.id}. Status: ${conv.status}`);
      return NextResponse.json({ status: 'ai_silenced_handoff' });
    }

    // --- 6. ACTION ROUTER v9.7 (Real Execution) ---
    if (buttonId === 'gen_report_now' || content.toLowerCase().includes('informe de inventario')) {
      console.log(`[ACTION_ROUTER] Disparando Pipeline Real para ${sender}`);
      
      const { data: company } = await supabase.from('companies').select('settings').eq('id', companyId).single();
      const waConfig = company?.settings?.whatsapp;

      if (waConfig) {
        // Disparo asíncrono (Fire and Forget para no bloquear el webhook)
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.INTERNAL_API_KEY || '' },
            body: JSON.stringify({
                targetPhone: sender,
                whatsappToken: waConfig.access_token,
                phoneNumberId: waConfig.phone_number_id,
                reportType: 'inventory',
                companyId: companyId
            })
        }).catch(e => console.error('[PDF_TRIGGER_ERROR]', e));

        await supabase.from('messages').insert({
          conversation_id: conv.id,
          sender_type: 'agent',
          content: '🚀 *Pipeline de Documentos Activado*\n\nGenerando su informe industrial. Recibirá el archivo en unos segundos...'
        });
      }

      return NextResponse.json({ status: 'action_triggered' });
    }

    // --- 7. GENERACIÓN DE RESPUESTA NEURAL (DELEGADO AL MOTOR CENTRAL) ---
    // Según la Constitución Arise, la respuesta se gestiona vía Trigger DB -> arise-neural-engine.
    // Esto garantiza una sola respuesta y reduce el consumo de tokens.
    /*
    const { data: latestConv } = await supabase.from('conversations').select('status').eq('id', conv.id).single();
    if (latestConv?.status === 'open') {
      await generateAndSendAIResponse(conv.id, companyId, sender, content, profileName, phoneNumberId);
    }
    */

    return NextResponse.json({ status: 'success' });

  } catch (error: any) {
    console.error('[WH_CRITICAL_ERROR]', error);
    await supabase.from('audit_logs').insert({
      action: 'WEBHOOK_POST_FAILURE',
      table_name: 'messages',
      new_data: { error: error.message, stack: error.stack }
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Función interna para procesamiento de audio mediante Gemini 2.5
 */
// Módulo de audio removido.

/**
 * Genera y envía la respuesta de IA con Contexto Histórico (Diamond v9.2)
 */
async function generateAndSendAIResponse(convId: string, companyId: string, to: string, content: string, profileName: string, phoneNumberId: string) {
  // 1. Recuperar Contexto Maestro (Historial + Empresa + Prompt + API Key)
  const { data: company } = await supabase.from('companies').select('settings, name').eq('id', companyId).single();
  const { data: p } = await supabase.from('ai_prompts').select('system_prompt').eq('company_id', companyId).eq('is_active', true).limit(1).maybeSingle();
  const { data: history } = await supabase.from('messages').select('sender_type, content').eq('conversation_id', convId).order('created_at', { ascending: false }).limit(10);
  
  // Rotación de API Keys (Industrial)
  let keys = (process.env.GEMINI_API_KEY || "").split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0);
  if (keys.length === 0) {
    const { data: vaultKeys } = await supabase.from('gemini_api_keys').select('api_key').eq('is_active', true);
    if (vaultKeys) keys = vaultKeys.map((k: any) => k.api_key);
  }
  const apiKey = (keys[Math.floor(Math.random() * keys.length)] || process.env.GEMINI_API_KEY || "") as string;
  
  const systemPrompt = p?.system_prompt || "Eres Arise Director AI. Responde breve y ejecutivo.";
  const whatsappToken = company?.settings?.whatsapp?.access_token || process.env.WHATSAPP_ACCESS_TOKEN;

  // 2. Formatear Historial para Gemini (Excluyendo el mensaje actual para evitar eco)
  const formattedHistory = (history || [])
    .filter((m: any) => m.content !== content) // Evitar duplicado del mensaje actual
    .reverse()
    .map((m: any) => `${m.sender_type === 'user' ? 'Usuario' : 'Arise'}: ${m.content}`)
    .join('\n');

  const promptWithContext = `
${systemPrompt}
Socio Operativo de la empresa "${company?.name || 'Arise'}".

[MEMORIA OPERATIVA]
${formattedHistory}

[SOLICITUD ACTUAL]
Director ${profileName}: "${content}"

INSTRUCCIONES DE ALTA PRIORIDAD:
1. ANCLAJE DE MÓDULO: Si el usuario ya eligió un sector (Inventario, Finanzas, etc.) en el historial, MANTENTE en ese contexto. No saludes de nuevo ni muestres el Menú Maestro a menos que se te pida explícitamente ("menú", "volver", "inicio").
2. FLUIDEZ EJECUTIVA: Responde directamente a la solicitud actual usando la memoria previa. Si el usuario dice "PENDIENTES" y en el historial se habla de RRHH, muestra los pendientes de RRHH.
3. FORMATO DE SALIDA: [Respuesta] --- [Acción 1] | [Acción 2] | [Acción 3]
   - Máximo 3 botones.
   - Acciones Neurales: Solo al final de todo [[ { "action": "..." } ]].
`;

  const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: promptWithContext }] }] })
  });

  const gData = await geminiRes.json();
  
  if (!geminiRes.ok) {
    console.error('[GEMINI_ERROR]', gData);
    await supabase.from('audit_logs').insert({
      company_id: companyId,
      action: 'GEMINI_API_FAILURE',
      table_name: 'messages',
      new_data: { error: gData, model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite" }
    });
    return;
  }

  const aiText = gData.candidates?.[0]?.content?.parts?.[0]?.text || "Arise Neural Engine: Fallo de percepción.";

  // Persistir respuesta
  const { data: botMsg } = await supabase.from('messages').insert({ conversation_id: convId, sender_type: 'bot', content: aiText }).select('id').single();

  // Trigger Neural Processor (Procesamiento de acciones)
  if (botMsg && aiText.includes('[[')) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
    fetch(`${baseUrl}/api/neural-processor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: botMsg.id, companyId: companyId })
    }).catch(e => console.error('[NEURAL_BRIDGE] Failed:', e));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MOTOR DE ESCALABILIDAD DINÁMICA (Diamond v9.6)
  // Decide automáticamente: texto plano | botones (≤3) | lista (4-10)
  // ═══════════════════════════════════════════════════════════════════════════
  const cleanAiText = aiText.replace(/\[\[[^\[\]]+\]\]/g, '').trim();
  const parts = cleanAiText.split('---');
  const textPart = parts[0]?.trim() || "Arise Engine: Respuesta procesada.";
  const buttonsPart = parts.length > 1 ? parts[1] : null;

  const iconMap: Record<string, string> = {
    'inv': '📦', 'stock': '📦', 'fin': '💰', 'pag': '💰', 'adm': '⚙️', 
    'ajust': '⚙️', 'rrhh': '👥', 'person': '👥', 'rec': '🔔', 'tarea': '📌',
    'vol': '⬅️', 'men': '🏠', 'ini': '🏠', 'repo': '📊', 'doc': '📄',
    'fac': '🧾', 'cli': '🤝', 'ven': '💵', 'cot': '📋', 'aud': '🔎'
  };

  // Helper: Inyecta emoji si falta
  const enrichText = (text: string): string => {
    const hasEmoji = /\p{Emoji}/u.test(text);
    if (hasEmoji) return text;
    const key = Object.keys(iconMap).find(k => text.toLowerCase().includes(k));
    return key ? `${iconMap[key]} ${text}` : text;
  };

  let payload: any = { 
    messaging_product: 'whatsapp', to, type: 'text', 
    text: { body: textPart } 
  };

  if (buttonsPart) {
    const allOptions = buttonsPart.split('|')
      .map((o: string) => o.trim())
      .filter((o: string) => o.length > 0);

    if (allOptions.length > 0) {
      // ── MODO LISTA UNIFICADO (Forzado para Diamond v9.6) ──
      const rows = allOptions.slice(0, 10).map((o: string) => {
        const title = enrichText(o).substring(0, 24);
        return {
          id: `lst_${title.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20)}`,
          title
        };
      });
      payload = {
        messaging_product: 'whatsapp', to, type: 'interactive',
        interactive: {
          type: 'list',
          body: { text: textPart.substring(0, 1024) },
          footer: { text: 'Arise Business OS v9.6' },
          action: {
            button: 'Ver Opciones',
            sections: [{ title: 'Acciones Disponibles', rows }]
          }
        }
      };
    }
  }

  const waRes = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${whatsappToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!waRes.ok) {
    const errorData = await waRes.json();
    await supabase.from('audit_logs').insert({
      company_id: companyId,
      action: 'WHATSAPP_DELIVERY_FAILURE',
      table_name: 'messages',
      new_data: { error: errorData, payload }
    });
    console.error('[WHATSAPP_ERROR]', errorData);
  }
}
