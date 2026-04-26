import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { generateGeminiResponse } from '@/lib/neural-engine/gemini';
import { sendWhatsAppMessage } from '@/lib/neural-engine/whatsapp';
import { ACTION_PREFIXES } from '@/lib/neural-engine/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
// Usar un nombre único para evitar colisiones con variables de entorno del sistema
const supabaseKey = (process.env.ARISE_MASTER_SERVICE_KEY || process.env.ARISE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('[WH_INIT] Missing Supabase credentials');
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);




const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

/**
 * INDUSTRIAL WHATSAPP NEURAL WEBHOOK v10.0 CORE - LOOP Intelligence
 * Arquitectura de Control de Flujo Estricto.
 */

/**
 * Helper: Obtiene configuración de WhatsApp centralizada (Diamond v10.1)
 */
async function getWhatsAppConfig(companyId: string) {
  const { data: companyData } = await supabase
    .from('companies')
    .select('settings')
    .eq('id', companyId)
    .single();

  const token = companyData?.settings?.whatsapp?.access_token || process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = companyData?.settings?.whatsapp?.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    await supabase.from('audit_logs').insert({
      company_id: companyId,
      action: 'WHATSAPP_CONFIG_MISSING',
      new_data: { has_token: !!token, has_phone_id: !!phoneId }
    });
  }

  return { token, phoneId };
}
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
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, company_id')
      .eq('phone', sender)
      .limit(1)
      .maybeSingle();

    if (contactError) {
      // Contact lookup error - continue to fallback resolution
    }

    let companyId = contact?.company_id;
    let contactId = contact?.id;

    // Si no hay contacto, resolver por el directorio interno o el Phone ID de la empresa
    if (!companyId) {
      const { data: staff } = await supabase.from('internal_directory').select('company_id').eq('phone', sender).maybeSingle();
      
      if (staff) {
        companyId = staff.company_id;
      } else {
        const { data: comp } = await supabase.from('companies').select('id').contains('settings', { whatsapp: { phone_number_id: phoneNumberId } }).limit(1).maybeSingle();
        companyId = comp?.id;
      }

      if (!companyId) {
        return NextResponse.json({ status: 'unauthorized_sender' }, { status: 401 });
      }


      // Crear contacto si no existe
      const { data: newContact } = await supabase.from('contacts').insert({ full_name: profileName, phone: sender, company_id: companyId }).select('id').single();
      contactId = newContact?.id;
    }


    if (!contactId || !companyId) {
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
    // Soporte para Mensajes de Texto, Interactivos y Documentos (Diamond v10.1)
    const buttonId = message.interactive?.button_reply?.id || message.interactive?.list_reply?.id;
    const content = message.text?.body || message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || '';
    const isDocument = message.type === 'document';


    // Manejo de Documentos PDF
    if (isDocument) {
      const docName = message.document?.filename || 'archivo.pdf';
      const mimeType = message.document?.mime_type || 'application/pdf';

      console.log(`[DOCUMENT_RECEIVED] ${docName} (${mimeType}) from ${sender}`);

      // Persistir el documento en el historial
      await supabase.from('messages').insert({
        conversation_id: conv.id,
        sender_type: 'user',
        content: `[Documento: ${docName}]`,
        metadata: {
          whatsapp_message_id: waId,
          type: 'document',
          filename: docName,
          mime_type: mimeType
        }
      });

      // Obtener configuración de WhatsApp centralizada
      const { token: whatsappToken } = await getWhatsAppConfig(companyId);

      // Feedback inmediato al usuario
      const feedbackMsg = `📄 *Documento Recepcionado*\n\n*Archivo:* ${docName}\n*Estado:* Procesado y guardado en el historial.\n\n¿Qué deseas hacer con este documento?`;

      await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: sender,
          type: 'text',
          text: { body: feedbackMsg }
        })
      }).catch(async () => {
        await supabase.from('audit_logs').insert({
          company_id: companyId,
          action: 'WHATSAPP_FEEDBACK_FAILURE',
          new_data: { phone: sender }
        });
      });

      return NextResponse.json({ status: 'document_received' });
    }

    // Ignorar otros tipos de multimedia no soportados
    if (!content && message.type !== 'text') {
      return NextResponse.json({ status: 'unsupported_message_type' });
    }

    // --- 4.5 PERSISTENCIA CON ID (Para evitar doble inserción) ---
    const { data: userMsg } = await supabase.from('messages').insert({
      conversation_id: conv.id,
      sender_type: 'user',
      content,
      metadata: { whatsapp_message_id: waId, type: message.type }
    }).select('id').single();

    // --- 5. CLÁUSULA DE GUARDA Diamond v10.1 (Doble Validación) ---
    if (conv.status !== 'open') {
      console.log(`[HANDOFF] AI Interrupted for conv ${conv.id}. Status: ${conv.status}`);
      return NextResponse.json({ status: 'ai_silenced_handoff' });
    }

    // --- 6. ACTION ROUTER Diamond v10.1 (Intelligent Execution) ---
    const isTechnicalAction =
      buttonId?.startsWith(ACTION_PREFIXES.TECHNICAL) ||
      buttonId?.startsWith(ACTION_PREFIXES.LIST) ||
      buttonId?.startsWith(ACTION_PREFIXES.BUTTON);

    // Mapeo de acciones técnicas (Diamond Diamond v10.1)
    const actionMap: Record<string, string> = {
      [`${ACTION_PREFIXES.TECHNICAL}report_now`]: 'inventory_report',
      [`${ACTION_PREFIXES.LIST}inventario`]: 'inventory',
      [`${ACTION_PREFIXES.LIST}finanzas`]: 'finance',
      [`${ACTION_PREFIXES.LIST}rrhh`]: 'hr',
      [`${ACTION_PREFIXES.BUTTON}inventario`]: 'inventory',
      [`${ACTION_PREFIXES.BUTTON}finanzas`]: 'finance',
      [`${ACTION_PREFIXES.BUTTON}rrhh`]: 'hr',
    };

    const mappedAction = actionMap[buttonId?.toLowerCase() || ''] || actionMap[content?.toLowerCase().substring(0, 20) || ''];

    if (isTechnicalAction || content.toLowerCase().includes('informe de inventario') || mappedAction) {

      const { token: whatsappToken, phoneId: waPhoneId } = await getWhatsAppConfig(companyId);

      if (whatsappToken && waPhoneId) {
        // Lógica para Reporte de Inventario (Existente)
        if (buttonId === 'gen_report_now' || content.toLowerCase().includes('informe de inventario')) {
          // Timeout para PDF trigger
          const pdfController = new AbortController();
          const pdfTimeout = setTimeout(() => pdfController.abort(), 30000);

          fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/pdf`, {
              method: 'POST',
              signal: pdfController.signal,
              headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.INTERNAL_API_KEY || '' },
              body: JSON.stringify({
                  targetPhone: sender,
                  whatsappToken,
                  phoneNumberId: waPhoneId,
                  reportType: 'inventory',
                  companyId: companyId
              })
          }).catch(async (e) => {
              if (e.name === 'AbortError') {
                console.error('[PDF_TRIGGER] Timeout after 30s');
              } else {
                console.error('[PDF_TRIGGER_ERROR]', e.message);
              }
              await supabase.from('audit_logs').insert({
                  company_id: companyId,
                  action: 'PDF_TRIGGER_FAILURE',
                  new_data: { error: e.message, phone: sender }
              });
          }).finally(() => clearTimeout(pdfTimeout));

          await supabase.from('messages').insert({
            conversation_id: conv.id,
            sender_type: 'bot',
            content: '🚀 *Pipeline de Documentos Activado*\n\nGenerando su informe industrial. Recibirá el archivo en unos segundos...'
          });

          return NextResponse.json({ status: 'action_triggered' });
        }

        // Manejo para otras acciones mapeadas
        if (mappedAction && !buttonId?.includes('gen_report')) {
          // La IA procesará esta acción en generateAndSendAIResponse
        }
      }
    }

    // --- 7. GENERACIÓN DE RESPUESTA NEURAL (DELEGADO AL MOTOR CENTRAL) ---
    // Según la Constitución Arise, la respuesta se gestiona vía Trigger DB -> arise-neural-engine.
    // Esto garantiza una sola respuesta y reduce el consumo de tokens.
    const { data: latestConv } = await supabase.from('conversations').select('status').eq('id', conv.id).single();
    if (latestConv?.status === 'open') {
      // await generateAndSendAIResponse(conv.id, companyId, sender, content, profileName, phoneNumberId, userMsg?.id);
    }

    return NextResponse.json({ status: 'success' });

  } catch (error: any) {
    await supabase.from('audit_logs').insert({
      action: 'WEBHOOK_POST_FAILURE',
      table_name: 'messages',
      new_data: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Función interna para procesamiento de audio mediante Gemini 2.5
 */
// Módulo de audio removido.

/**
 * Genera y envía la respuesta de IA con Contexto Histórico (Diamond Diamond v10.1)
 */
async function generateAndSendAIResponse(convId: string, companyId: string, to: string, content: string, profileName: string, phoneNumberId: string, currentMsgId?: string) {
  // 1. Recuperar Contexto Maestro
  const { data: company, error: companyError } = await supabase.from('companies').select('settings, name').eq('id', companyId).single();
  const { data: p } = await supabase.from('ai_prompts').select('system_prompt').eq('company_id', companyId).eq('is_active', true).limit(1).maybeSingle();
  const { data: history } = await supabase.from('messages').select('sender_type, content').eq('conversation_id', convId).order('created_at', { ascending: false }).limit(10);

  // Validación crítica: company debe existir
  if (companyError || !company) {
    console.error(`[GENERATE_RESPONSE] Company ${companyId} not found:`, companyError?.message);
    return;
  }

  const systemPrompt = p?.system_prompt || "Eres LOOP Director AI. Responde de forma ejecutiva y eficiente.";
  const { token: whatsappToken } = await getWhatsAppConfig(companyId);

  // 2. Formatear Historial (Filtrado por ID)
  const formattedHistory = (history || [])
    .filter((m: any) => m.id !== currentMsgId) 
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
1. ROL ESTRICTO: Eres un asistente experto para esta empresa. Asume 100% la identidad y el tono del rol definido en tu System Prompt (ej. Taller MMC u otro).
2. ANCLAJE DE CONTEXTO: Mantén coherencia con los mensajes anteriores.
3. FORMATO DE SALIDA: Debes responder en ESTRICTO formato: [Respuesta Corta] --- [Opción 1] | [Opción 2] | [Opción 3] | [Opción 4]
   - SIEMPRE entrega entre 3 a 5 opciones interactivas para que el usuario pueda avanzar fluidamente.
   - Acciones Neurales: Si se requiere acción técnica, anexa [[ { "action": "..." } ]] al final.
   - IMPORTANTE: Para campos de fecha como "due_at", usa SIEMPRE formato ISO 8601 (YYYY-MM-DDTHH:mm:ss). No uses nombres de días o formatos relativos.
`;

  // 3. Generar respuesta vía Librería Neural con Bucle de Auto-Sanación (Diamond v10.1)
  let aiText = '';
  let aiError = null;
  let attempts = 0;
  const maxAttempts = 2;
  let currentPrompt = promptWithContext;

  while (attempts < maxAttempts) {
    const response = await generateGeminiResponse(currentPrompt, companyId);
    aiText = response.text || '';
    aiError = response.error;

    if (aiError || !aiText) break;

    // Validación Intercepción Técnica v61
    const hasV61Format = aiText.includes('---') && aiText.includes('|');
    if (hasV61Format) {
      break; // Salir del bucle, formato correcto
    }

    // Auto-corrección invisible (Re-prompt)
    attempts++;
    console.log(`[AUTO-HEALING] Intento ${attempts}: Gemini omitió formato v61. Forzando re-prompt.`);
    currentPrompt = `${promptWithContext}\n\n[ERROR CRÍTICO SISTEMA]\nTu respuesta anterior omitió el formato interactivo obligatorio. Es CRÍTICO para el sistema. REESCRIBE tu respuesta e incluye estrictamente '--- Título | Opción 1 | Opción 2' al final.`;
  }

  if (aiError || !aiText) return;

  // Fallback Determinista (Plan Z) si falla todos los intentos
  if (!aiText.includes('---') || !aiText.includes('|')) {
    console.error(`[FALLBACK_ACTIVATED] Gemini falló ${maxAttempts} veces en formato v61. Inyectando menú de emergencia.`);
    aiText = `${aiText.replace(/\[\[[^\[\]]+\]\]/g, '').trim()} --- Menú de Emergencia | Menú Principal | Contactar Soporte`;
  }

  // 4. Persistir respuesta
  const { data: botMsg } = await supabase.from('messages').insert({ conversation_id: convId, sender_type: 'bot', content: aiText }).select('id').single();

  // 5. Trigger Neural Processor (Si hay acciones)
  if (botMsg && aiText.includes('[[')) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
    fetch(`${baseUrl}/api/neural-processor`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': process.env.INTERNAL_API_KEY || 'arise_internal_v9_secret'
      },
      body: JSON.stringify({ messageId: botMsg.id, companyId: companyId })
    }).catch(e => console.error('[NEURAL_BRIDGE_ERROR]', e));
  }

  // 6. Enviar a WhatsApp vía Librería Sender
  const cleanAiText = aiText.replace(/\[\[[^\[\]]+\]\]/g, '').trim();
  const parts = cleanAiText.split('---');
  const responseText = parts[0]?.trim() || "Respuesta procesada.";
  const buttonsPart = parts.length > 1 ? parts[1] : null;

  let options: string[] = [];
  if (buttonsPart) {
    options = buttonsPart.split('|').map(o => o.trim()).filter(o => o.length > 0);
    // Escape al Menú Principal
    if (!options.some(o => o.toLowerCase().includes('menú')) && options.length < 9) {
      options.push('Menú Principal');
    }
  }

  await sendWhatsAppMessage({
    to,
    text: responseText,
    options,
    phoneNumberId,
    whatsappToken: whatsappToken || "",
    companyId
  });
}
