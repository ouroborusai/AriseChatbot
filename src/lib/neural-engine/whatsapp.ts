import { createClient } from '@supabase/supabase-js';
import { ICON_MAP, WHATSAPP_LIMITS, SYSTEM_STRINGS } from './constants';
import { SuggestedOption } from '@/types/api';

function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Enriquece el texto con emojis basados en palabras clave.
 */
export function enrichText(text: string): string {
  // Regex más estricto para detectar si ya tiene emojis visuales reales
  const hasEmoji = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u.test(text);
  if (hasEmoji) return text;

  const key = Object.keys(ICON_MAP).find(k => text.toLowerCase().includes(k));
  // Si no hay match en el mapa, poner un rombo de opciones por defecto
  return key ? `${ICON_MAP[key]} ${text}` : `🔹 ${text}`;
}

/**
 * WHATSAPP SENDER Diamond v10.1
 * Maneja el envío de mensajes interactivos (Listas) y texto plano.
 */
export async function sendWhatsAppMessage(params: {
  to: string;
  text?: string;
  options?: (string | { id: string; title: string; description?: string })[];
  template?: {
    name: string;
    language: string;
    variables: string[];
  };
  phoneNumberId: string;
  whatsappToken: string;
  companyId: string;
}) {
  const supabase = createSupabaseClient();
  const { to, text, options, template, phoneNumberId, whatsappToken, companyId } = params;

  let payload: any = {
    messaging_product: 'whatsapp',
    to,
  };

  if (template) {
    // Modo Plantilla (Diamond v10.2 Standard)
    payload.type = 'template';
    payload.template = {
      name: template.name,
      language: { code: template.language },
      components: [
        {
          type: 'body',
          parameters: template.variables.map(v => ({ type: 'text', text: v }))
        }
      ]
    };
  } else if (text) {
    const textPart = text.substring(0, WHATSAPP_LIMITS.MAX_BODY_LENGTH);
    if (options && options.length > 0) {
      // Modo Lista Interactiva
      const safeOptions = options.slice(0, WHATSAPP_LIMITS.MAX_OPTIONS);
      const rows = safeOptions.map((o: any) => {
        const isObject = typeof o === 'object';
        const title = isObject ? o.title : enrichText(o);
        const id = isObject ? o.id : `lst_${title.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20)}`;
        
        return {
          id,
          title: title.substring(0, WHATSAPP_LIMITS.MAX_TITLE_LENGTH),
          description: isObject && o.description ? o.description : (o.length > WHATSAPP_LIMITS.MAX_TITLE_LENGTH ? o.substring(0, WHATSAPP_LIMITS.MAX_DESCRIPTION_LENGTH) : undefined)
        };
      });


      payload.type = 'interactive';
      payload.interactive = {
        type: 'list',
        header: { type: 'text', text: 'Loop Business OS' },
        body: { text: textPart },
        footer: { text: 'Cierra el ciclo de tus tareas con Loop' },
        action: {
          button: '📋 Ver Opciones',
          sections: [{ title: 'Acciones Sugeridas', rows }]
        }
      };
    } else {
      // Modo Texto Simple
      payload.type = 'text';
      payload.text = { body: textPart };
    }
  }

  const apiVersion = process.env.META_API_VERSION || 'v23.0';
  const res = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${whatsappToken}`, 
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json();
    console.error('[WHATSAPP_LIB_ERROR]', errorData);

    await supabase.from('audit_logs').insert({
      company_id: companyId,
      action: 'WHATSAPP_DELIVERY_FAILURE',
      new_data: { error: errorData, payload }
    });
  }

  return res;
}

/**
 * GENERATE AND SEND AI RESPONSE
 * Orquesta la llamada a Gemini, procesa acciones [[ ]] y cierra el ciclo con interactividad.
 * Soporta simulationMode para testing sin WhatsApp.
 */
export async function generateAndSendAIResponse(params: {
  content: string;
  companyId: string;
  contactId: string | null;
  conversationId: string;
  sender: string;
  phoneNumberId: string;
  whatsappToken: string;
  isSecondPass?: boolean;
  accumulatedOptions?: SuggestedOption[];
  simulationMode?: boolean;
}): Promise<any> {
  const { content, companyId, sender, phoneNumberId, whatsappToken, isSecondPass, accumulatedOptions = [], simulationMode = false } = params;
  const { generateGeminiResponse } = await import('./gemini');
  const supabase = createSupabaseClient();

  const systemPrompt = `
REGLA DIAMANTE: CERO CÁLCULOS. Si el usuario pide reportes, balances o inventario, responde: "Generando tu reporte oficial..." No intentes procesar los montos tú mismo. 
Identidad: Arise Director AI. Tu misión es "Cerrar el ciclo operativo con elegancia y precisión". Tono cálido, ejecutivo y proactivo (Concierge).

PROTOCOLOS PLATINUM v10.4:
1. BRUTAL HONESTIDAD: Tienes prohibido inventar éxitos si el Status es validation_failed o item_not_found. Usa empatía concierge para solicitar datos faltantes.
2. NEURAL LOOP (Doble Paso):
   - Si Status es "success": Celebra brevemente el éxito.
   - Si Status es "item_not_found" o "validation_failed": Sé empático, informa del error específico usando el campo 'error' del sistema.
3. ACCIONES ESTRUCTURADAS: Usa [[ { "action": "..." } ]] exclusivamente para: task_create, inventory_add, inventory_remove, inventory_scan, pdf_generate.
4. ESTÉTICA LUMINOUS: Comunicación vibrante, premium y proactiva.
`;

  try {
    const fullPrompt = `${systemPrompt}\n\nUsuario: ${content}\nID Empresa: ${companyId}`;
    const aiRes = await generateGeminiResponse(fullPrompt, companyId);
    
    if (aiRes.error) throw new Error(aiRes.error);

    const actionBlocks = aiRes.text.match(/\[\[([\s\S]*?)\]\]/g);

    if (actionBlocks && actionBlocks.length > 0 && !isSecondPass) {
        console.log(`[NEURAL_LOOP] Acciones detectadas: ${actionBlocks.length}`);

        const { handleTaskAction } = await import('./actions/task');
        const { handleInventoryAction } = await import('./actions/inventory');

        let currentResultString = "";
        const currentOptions: SuggestedOption[] = [];

        for (const block of actionBlocks) {
            try {
                const cleanJson = block.replace('[[', '').replace(']]', '').trim();
                const actionData = JSON.parse(cleanJson);
                console.log(`[NEURAL_LOOP] Ejecutando: ${actionData.action}`, actionData);
                
                let results;
                if (actionData.action.startsWith('task_') || actionData.action.startsWith('reminder_')) {
                    results = await handleTaskAction(supabase, actionData, companyId, 'system_call');
                } else if (actionData.action.startsWith('inventory_')) {
                    results = await handleInventoryAction(supabase, actionData, companyId, 'system_call');
                }

                console.log(`[NEURAL_LOOP] Resultado:`, results);

                if (results && results.length > 0) {
                    currentResultString += `Acción: ${actionData.action} | Status: ${results[0].status}. `;
                    if (results[0].suggested_options) {
                        console.log(`[NEURAL_LOOP] Botones detectados:`, results[0].suggested_options.length);
                        currentOptions.push(...results[0].suggested_options);
                    }
                }
            } catch (jsonErr) {
                console.error('[NEURAL_LOOP_PARSE_ERROR]', jsonErr);
            }
        }

        const systemResult = `[SYSTEM_RESULT] ${currentResultString}`;

        // --- SHADOW PDF BACKGROUND REFRESH (v10.3) ---
        if (currentResultString.includes('inventory_') && !simulationMode) {
            import('@/lib/pdf/pipeline').then(({ executePDFPipeline }) => {
                executePDFPipeline({ 
                    companyId, 
                    reportType: 'inventory_general', 
                    isPreGen: true,
                    targetPhone: sender, 
                    whatsappToken, 
                    phoneNumberId 
                }).catch(e => console.error('[SHADOW_PDF_ERROR]', e));
            });
        }

        return generateAndSendAIResponse({
            ...params,
            content: systemResult,
            isSecondPass: true,
            accumulatedOptions: currentOptions,
            simulationMode
        });
    }

    const cleanText = aiRes.text.replace(/\[\[([\s\S]*?)\]\]/g, '').trim();

    // MODO SIMULACIÓN: Retornar resultado en lugar de enviar a WhatsApp
    if (simulationMode) {
        return {
            text: cleanText,
            options: accumulatedOptions,
            status: 'success'
        };
    }

    if (cleanText) {
        await sendWhatsAppMessage({
            to: sender,
            text: cleanText,
            phoneNumberId,
            whatsappToken,
            companyId,
            options: accumulatedOptions.length > 0 ? accumulatedOptions : undefined
        });
    }

    return { status: 'success', sent: true };

  } catch (err: any) {
    console.error('[AI_RESPONSE_ERROR]', err.message);
    if (!simulationMode && !isSecondPass) {
        await sendWhatsAppMessage({
            to: sender,
            text: "Disculpa, estoy experimentando un breve retraso neuronal. Reintenta en un momento.",
            phoneNumberId,
            whatsappToken,
            companyId
        });
    }
    return { status: 'error', error: err.message };
  }
}

