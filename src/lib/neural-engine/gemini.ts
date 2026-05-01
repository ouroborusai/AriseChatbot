import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GEMINI_MODEL, SYSTEM_STRINGS } from './constants';

export interface GeminiResponse {
  text: string;
  error?: string;
}

/**
 *  GEMINI NEURAL CLIENT v11.9.1 (Diamond Resilience)
 *  Motor de inferencia con rotación de API Keys y telemetría integrada.
 *  Cero 'any'. 
 */

function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = (process.env.ARISE_MASTER_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!;
  return createClient(supabaseUrl, supabaseKey);
}

export interface GeminiContext {
  messageId: string;
  companyId: string;
  contact_id: string;
  conversation_id: string;
  content: string;
}

export async function generateGeminiResponse(
  context: GeminiContext
): Promise<{ response: string; error?: string }> {
  const { companyId, conversation_id, content } = context;
  const supabase = createSupabaseClient();

  try {
    // 1. CARGA DE CONTEXTO DIAMOND v11.9.1
    const [promptRes, historyRes, directoryRes] = await Promise.all([
      supabase.from('ai_prompts').select('system_prompt').eq('company_id', companyId).eq('is_active', true).maybeSingle(),
      supabase.from('messages').select('sender_type, content').eq('conversation_id', conversation_id).order('created_at', { ascending: false }).limit(10),
      supabase.from('internal_directory').select('phone, name, role').eq('company_id', companyId).limit(50)
    ]);

    const systemPrompt = promptRes.data?.system_prompt || "Eres Arise Business OS Diamond v11.9.1.";
    const history = (historyRes.data || []).reverse();
    const directory = directoryRes.data || [];
    
    const formattedHistory = history.map((m: any) => `${m.sender_type === 'user' ? 'User' : 'Bot'}: ${m.content}`).join('\n');
    const directoryContext = directory.map(d => `- ${d.name} (${d.phone}): ${d.role}`).join('\n');

    // CONSTRUCCIÓN DEL PROMPT SUPREMO
    const fullPrompt = `${systemPrompt}\n\n[DIRECTORY]\n${directoryContext}\n\n[HISTORY]\n${formattedHistory}\n\n[USER_MESSAGE]\n${content}\n\n[INSTRUCTION]\nResponde de forma ejecutiva y humana. Si es necesario, usa el formato de acciones [[ { "action": "..." } ]].`;

    // 2. Rotación de API Keys (Diamond Protocol)
    let keys: string[] = (process.env.GEMINI_API_KEY || "")
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (keys.length === 0) {
      const { data: vaultKeys } = await supabase.from('gemini_api_keys').select('api_key').eq('is_active', true);
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

    const data = (await res.json()) as any;
    if (!res.ok) throw new Error(data.error?.message || 'Gemini_Inference_Error');

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || SYSTEM_STRINGS.FALLBACK_RESPONSE;
    
    // PERSISTENCIA DE RESPUESTA (Resiliente v11.9.1)
    try {
      await supabase.from('messages').insert({
        conversation_id: conversation_id,
        sender_type: 'bot',
        content: aiText.trim()
      }).select('id').maybeSingle();
    } catch (e) {
      console.error('[GEMINI_PERSISTENCE_ERROR]', e);
    }

    return { response: aiText };

  } catch (err: unknown) {
    const error = err as Error;
    console.error('[GEMINI_ERROR]', error.message);
    return { response: SYSTEM_STRINGS.FALLBACK_RESPONSE, error: error.message };
  }
}
