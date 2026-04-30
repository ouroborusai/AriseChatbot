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

export async function generateGeminiResponse(
  prompt: string,
  companyId: string
): Promise<GeminiResponse> {
  const supabase = createSupabaseClient();

  try {
    // 1. Rotación de API Keys (Diamond Protocol)
    let keys: string[] = (process.env.GEMINI_API_KEY || "")
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (keys.length === 0) {
      const { data: vaultKeys, error: vaultError } = await supabase
        .from('gemini_api_keys')
        .select('api_key')
        .eq('is_active', true);
      
      if (vaultError) throw vaultError;
      if (vaultKeys) keys = vaultKeys.map(k => k.api_key);
    }

    // Selección Segura (Criptográfica)
    let apiKey = "";
    if (keys.length > 0) {
      const randomBuffer = new Uint32Array(1);
      crypto.getRandomValues(randomBuffer);
      const secureIndex = randomBuffer[0] % keys.length;
      apiKey = keys[secureIndex];
    } else {
      apiKey = process.env.GEMINI_API_KEY || "";
    }

    if (!apiKey) {
      return { text: "", error: "No_Gemini_API_Key_Resolved" };
    }

    // 2. Ejecución de Inferencia (v1beta API)
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2, // Estabilidad Diamond
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        }),
      }
    );

    const data = (await res.json()) as { 
      candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
      error?: { message: string };
    };

    if (!res.ok) {
      const errorMsg = data.error?.message || 'Gemini_Inference_Error';
      await supabase.from('audit_logs').insert({
        company_id: companyId,
        action: 'GEMINI_API_FAILURE',
        new_data: { error: errorMsg, model: GEMINI_MODEL }
      });
      return { text: '', error: errorMsg };
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || SYSTEM_STRINGS.FALLBACK_RESPONSE;
    return { text: aiText };

  } catch (err: unknown) {
    const error = err as Error;
    return { text: '', error: error.message };
  }
}
