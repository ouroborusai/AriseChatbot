import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GEMINI_MODEL, SYSTEM_STRINGS } from './constants';
import { logEvent } from '@/lib/webhook/utils';
import { type GeminiResponse, type GeminiContext } from '@/lib/whatsapp/types';

/**
 * GEMINI NEURAL CLIENT v12.0 (Diamond Resilience)
 * Motor de inferencia con Cross-Selling Neural e inyección de Stock.
 * Cero 'any'. Aislamiento Tenant Mandatorio.
 */

function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = (process.env.ARISE_MASTER_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!;
  return createClient(supabaseUrl, supabaseKey);
}

export async function generateGeminiResponse(
  context: GeminiContext
): Promise<GeminiResponse> {
  const { companyId, conversation_id, content } = context;
  const supabase = createSupabaseClient();

  try {
    // 1. CARGA DE CONTEXTO DIAMOND v12.0
    const [promptRes, historyRes, directoryRes, inventoryRes] = await Promise.all([
      supabase.from('ai_prompts').select('system_prompt').eq('company_id', companyId).eq('is_active', true).maybeSingle(),
      supabase.from('messages').select('sender_type, content').eq('conversation_id', conversation_id).eq('company_id', companyId).order('created_at', { ascending: false }).limit(10),
      supabase.from('internal_directory').select('phone, name, role').eq('company_id', companyId).limit(50),
      supabase.from('inventory_items').select('sku, name, current_stock').eq('company_id', companyId).gt('current_stock', 0).limit(20)
    ]);

    const systemPrompt = promptRes.data?.system_prompt || "Eres Arise Business OS Diamond v12.0.";
    const history = (historyRes.data || []).reverse();
    const directory = directoryRes.data || [];
    const inventory = inventoryRes.data || [];

    const formattedHistory = history.map((m: { sender_type: string; content: string }) => `${m.sender_type === 'user' ? 'User' : 'Bot'}: ${m.content}`).join('\n');
    const directoryContext = directory.map(d => `- ${d.name} (${d.phone}): ${d.role}`).join('\n');
    const stockContext = inventory.map(i => `- ${i.name} (SKU: ${i.sku}): ${i.current_stock} uds.`).join('\n');

    // CONSTRUCCIÓN DEL PROMPT SUPREMO (v12.0 - Cross-Selling Enabled)
    const fullPrompt = `${systemPrompt}\n\n[DIRECTORY]\n${directoryContext}\n\n[STOCK]\n${stockContext}\n\n[HISTORY]\n${formattedHistory}\n\n[USER_MESSAGE]\n${content}\n\n[INSTRUCTION]\nResponde de forma ejecutiva y humana. Si el cliente pregunta por stock de los productos arriba listados, usa técnicas de escasez. Si es necesario, usa el formato de acciones [[ { "action": "..." } ]].`;

    // 2. Rotación de API Keys (Diamond Protocol)
    let keys: string[] = (process.env.GEMINI_API_KEY || "")
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (keys.length === 0) {
      const { data: vaultKeys } = await supabase.from('gemini_api_keys').select('api_key').eq('company_id', companyId).eq('is_active', true);
      if (vaultKeys) keys = vaultKeys.map(k => k.api_key);
    }

    let apiKey = "";
    if (keys.length > 0) {
      const randomBuffer = new Uint32Array(1);
      crypto.getRandomValues(randomBuffer);
      apiKey = keys[randomBuffer[0] % keys.length];
    } else {
      apiKey = process.env.GEMINI_API_KEY || "";
    }

    if (!apiKey) throw new Error("No_Gemini_API_Key_Resolved");

    // 3. Ejecución de Inferencia
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.2, topP: 0.95, maxOutputTokens: 2048 }
        }),
      }
    );

    const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; error?: { message?: string } };
    if (!res.ok) throw new Error(data.error?.message || 'Gemini_Inference_Error');

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || SYSTEM_STRINGS.FALLBACK_RESPONSE;

    // PERSISTENCIA DE RESPUESTA (Resiliente v12.0)
    try {
      await supabase.from('messages').insert({
        conversation_id: conversation_id,
        company_id: companyId,
        sender_type: 'bot',
        content: aiText.trim()
      }).select('id').maybeSingle();

      // 🎯 TELEMETRÍA COMERCIAL PROACTIVA (Diamond v12.0)
      const salesKeywords = ['stock', 'sku', 'precio', 'unidades', 'disponible', 'vender', 'comprar'];
      const hasSalesIntent = salesKeywords.some(kw => aiText.toLowerCase().includes(kw));
      
      if (hasSalesIntent) {
        await logEvent({
          companyId,
          action: 'PURCHASE_INTENT_DETECTED',
          details: { 
            customer_phone: context.phone_number || 'N/A',
            intent: 'Sales_Assistance',
            response_sample: aiText.substring(0, 100)
          }
        });
      }
    } catch (e: unknown) {
      console.error('[GEMINI_PERSISTENCE_ERROR]', (e as Error).message);
    }

    return { text: aiText };

  } catch (err: unknown) {
    const error = err as Error;
    console.error('[GEMINI_ERROR]', error.message);
    return { text: SYSTEM_STRINGS.FALLBACK_RESPONSE, error: error.message };
  }
}
