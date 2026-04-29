import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { generateGeminiResponse } from '@/lib/neural-engine/gemini';
import { sendWhatsAppMessage } from '@/lib/neural-engine/whatsapp';
import { ACTION_PREFIXES } from '@/lib/neural-engine/constants';
import { getRelevantKnowledge } from '@/lib/neural-engine/knowledge';

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

/**
 * GENERATOR: Crea y envía respuesta de IA integrada con el Centro de Conocimiento
 */
async function generateAndSendAIResponse(params: {
  content: string,
  companyId: string,
  contactId: string,
  conversationId: string,
  sender: string,
  phoneNumberId: string,
  whatsappToken: string
}) {
  const { content, companyId, contactId, conversationId, sender, phoneNumberId, whatsappToken } = params;

  // 1. Obtener Conocimiento Relevante (FAQs)
  const knowledgeContext = await getRelevantKnowledge(content, companyId);

  // 2. Obtener Prompt del Sistema de la Empresa
  const { data: promptData } = await supabase
    .from('ai_prompts')
    .select('system_prompt')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  const basePrompt = promptData?.system_prompt || "Eres Arise, el sistema operativo de negocios inteligente de LOOP. Ayuda al usuario con sus tareas de forma profesional y eficiente.";

  // 3. Construir Prompt Final
  const finalPrompt = `
${basePrompt}

${knowledgeContext}

HISTORIAL RECIENTE (Simulado):
Usuario: ${content}

INSTRUCCIÓN: Responde de forma breve y profesional.
- Si crees que el usuario necesita tomar una decisión operativa o elegir un camino (ej: ver inventario, generar reporte), incluye al final una lista de 2 a 4 opciones cortas precedidas por '[OPTIONS]:'. 
- Si es una notificación crítica o confirmación importante y deseas usar una plantilla pre-aprobada de Meta (para mayor confiabilidad), incluye al final '[TEMPLATE]: nombre_plantilla, var1, var2'.

PLANTILLAS DISPONIBLES:
- std_confirmation_v1 (Var1: Nombre): Para confirmar acciones exitosas.
- std_alert_v1 (Var1: Item/Detalle): Para alertas de inventario o stock bajo.
- std_marketing_v1 (Var1: Nombre): Para invitar al catálogo.

Ejemplo con plantilla: 
He registrado la entrada de stock correctamente. [TEMPLATE]: std_confirmation_v1, Carlos

Ejemplo con opciones: 
Entendido. Tengo los datos listos. ¿Qué deseas hacer?
[OPTIONS]: Ver Reporte, Enviar Email, Cancelar
`;

  // 4. Generar Respuesta Gemini
  const aiResponse = await generateGeminiResponse(finalPrompt, companyId);
  
  if (aiResponse.error || !aiResponse.text) {
    console.error('[AI_GEN_ERROR]', aiResponse.error);
    return;
  }

  // 5. Procesar Opciones Contextuales y Plantillas
  let cleanText = aiResponse.text;
  let dynamicOptions: string[] | undefined = undefined;
  let templateConfig: any = undefined;

  if (cleanText.includes('[OPTIONS]:')) {
    const parts = cleanText.split('[OPTIONS]:');
    cleanText = parts[0].trim();
    dynamicOptions = parts[1].split(',').map(o => o.trim()).filter(o => o.length > 0);
  }

  if (cleanText.includes('[TEMPLATE]:')) {
    const parts = cleanText.split('[TEMPLATE]:');
    cleanText = parts[0].trim();
    const templateData = parts[1].split(',').map(t => t.trim());
    const templateName = templateData[0];
    const variables = templateData.slice(1);
    
    templateConfig = {
      name: templateName,
      language: 'es',
      variables: variables
    };
  }

  // 6. Persistir Mensaje del Bot
  const { data: botMsg } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_type: 'bot',
    content: cleanText || (templateConfig ? `[Plantilla: ${templateConfig.name}]` : ''),
    metadata: { 
      has_options: !!dynamicOptions,
      template_name: templateConfig?.name
    }
  }).select('id').single();

  // 7. Enviar vía WhatsApp (Protocolo v62 Contextual)
  await sendWhatsAppMessage({
    to: sender,
    text: cleanText,
    options: dynamicOptions,
    template: templateConfig,
    phoneNumberId,
    whatsappToken,
    companyId
  });
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
    const buttonId = message.interactive?.button_reply?.id || message.interactive?.list_reply?.id;
    const content = message.text?.body || message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || '';
    console.log(`[WH_DEBUG] buttonId: "${buttonId}", content: "${content}"`);

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
    // buttonId y content ya fueron extraídos arriba para logs
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

      const apiVersion = process.env.META_API_VERSION || 'v23.0';
      await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
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
      [`${ACTION_PREFIXES.LIST}inventory_report`]: 'inventory_report',
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
        console.log(`[WH_ROUTER] Checking for PDF trigger. buttonId: ${buttonId}, content: ${content}`);
        if (buttonId === 'gen_report_now' || buttonId === 'lst_inventory_report' || content.toLowerCase().includes('reporte pdf') || content.toLowerCase().includes('informe de inventario')) {
            console.log(`[WH_ROUTER] Triggering PDF for company ${companyId}`);
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
          }).then(async (res) => {
              // Éxito: limpiar timeout inmediatamente
              clearTimeout(pdfTimeout);
              console.log('[PDF_TRIGGER] Success:', res.status);
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
          }).finally(() => {
              // Cleanup de seguridad por si acaso
              clearTimeout(pdfTimeout);
          });

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

    // --- 7. FALLBACK TO AI RESPONDER (If no action triggered) ---
    const { token: whatsappToken, phoneId: waPhoneId } = await getWhatsAppConfig(companyId);

    if (whatsappToken && waPhoneId) {
       await generateAndSendAIResponse({
          content,
          companyId,
          contactId,
          conversationId: conv.id,
          sender,
          phoneNumberId: waPhoneId,
          whatsappToken
       });
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

