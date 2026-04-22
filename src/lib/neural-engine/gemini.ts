import { createClient } from '@supabase/supabase-js';
import { GEMINI_MODEL, SYSTEM_STRINGS } from './constants';

export interface GeminiResponse {
  text: string;
  error?: any;
}

/**
 * Crea cliente de Supabase fresco (evita problema de singleton con rotación de keys)
 */
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * GEMINI CLIENT v9.8
 * Maneja la comunicación con los modelos Generative Language de Google.
 */
export async function generateGeminiResponse(
  prompt: string,
  companyId: string
): Promise<GeminiResponse> {
  const supabase = createSupabaseClient();

  try {
    // 1. Rotación de API Keys (Industrial)
    let keys = (process.env.GEMINI_API_KEY || "")
      .split(',')
      .map((k: string) => k.trim())
      .filter((k: string) => k.length > 0);

    if (keys.length === 0) {
      const { data: vaultKeys } = await supabase
        .from('gemini_api_keys')
        .select('api_key')
        .eq('is_active', true);
      if (vaultKeys) keys = vaultKeys.map((k: any) => k.api_key);
    }

    const apiKey = keys[Math.floor(Math.random() * keys.length)] || process.env.GEMINI_API_KEY || "";

    if (!apiKey) {
      return { text: "", error: "No Gemini API Key available" };
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error('[GEMINI_LIB_ERROR]', data);
      await supabase.from('audit_logs').insert({
        company_id: companyId,
        action: 'GEMINI_API_FAILURE',
        new_data: { error: data, model: GEMINI_MODEL }
      });
      return { text: "", error: data };
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || SYSTEM_STRINGS.FALLBACK_RESPONSE;
    return { text: aiText };
  } catch (error: any) {
    console.error('[GEMINI_LIB_CRITICAL]', error);
    return { text: "", error: error.message };
  }
}
