/**
 * Nombres de modelo para @google/generative-ai (Gemini API).
 * @see https://ai.google.dev/gemini-api/docs/models
 *
 * Modelos disponibles (ordenados por costo/calidad):
 * - gemini-2.5-flash-lite: ⭐ MÁS BARATO (80% reducción) - Ideal para chatbot
 * - gemini-2.5-flash: Balanceado (costo/calidad)
 * - gemini-2.5-pro: MÁS CARO (máxima precisión)
 * - gemini-flash-latest: Alias al último Flash
 *
 * DEPRECIADOS: gemini-2.0-flash, gemini-1.5-flash (pueden fallar)
 */
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite';

export function resolveGeminiModel(): string {
  const fromEnv = process.env.GEMINI_MODEL?.trim();
  return fromEnv || DEFAULT_GEMINI_MODEL;
}
