/**
 * Nombres de modelo para @google/generative-ai (Gemini API).
 * @see https://ai.google.dev/gemini-api/docs/models
 *
 * Recomendado estable (chat / WhatsApp): gemini-2.5-flash
 * Más ligero en 2.5: gemini-2.5-flash-lite
 * Más capacidad: gemini-2.5-pro
 * Alias al último Flash: gemini-flash-latest
 *
 * Obsoletos / deprecados: gemini-2.0-flash, gemini-1.5-flash (pueden 404 o apagarse).
 */
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

export function resolveGeminiModel(): string {
  const fromEnv = process.env.GEMINI_MODEL?.trim();
  return fromEnv || DEFAULT_GEMINI_MODEL;
}
