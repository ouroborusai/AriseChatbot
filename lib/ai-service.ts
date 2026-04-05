/**
 * AI Service
 * Maneja la generación de respuestas con Gemini o OpenAI
 */

import { resolveGeminiModel } from './gemini-model';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

const openai =
  process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'tu_openai_api_key'
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

/**
 * Genera respuesta del asistente usando Gemini o OpenAI
 */
export async function generateAssistantReply(
  systemPrompt: string,
  history: ConversationTurn[],
  latestUserText: string
): Promise<string> {
  try {
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    
    if (geminiKey) {
      console.log('[AI] Usando Gemini');
      return await generateGeminiReply(systemPrompt, history, latestUserText);
    }

    if (openai) {
      console.log('[AI] Usando OpenAI');
      return await generateOpenAIReply(systemPrompt, history, latestUserText);
    }

    throw new Error('Configura GEMINI_API_KEY o OPENAI_API_KEY en .env.local');
  } catch (error) {
    console.error('[AI] ❌ Error generando respuesta:', error);
    if (error instanceof Error) {
      console.error('[AI] Error message:', error.message);
    }
    throw error;
  }
}

/**
 * Genera respuesta usando Google Gemini
 */
async function generateGeminiReply(
  systemPrompt: string,
  history: ConversationTurn[],
  latestUserText: string
): Promise<string> {
  try {
    console.log('[AI/Gemini] Inicializando GoogleGenerativeAI...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    
    console.log('[AI/Gemini] Resolviendo modelo...');
    const modelName = resolveGeminiModel();
    console.log('[AI/Gemini] Modelo seleccionado:', modelName);
    
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
    });

    const prior =
      history.length > 0 && history[history.length - 1].role === 'user'
        ? history.slice(0, -1)
        : history;

    const geminiHistory = prior.map((t) => ({
      role: t.role === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: t.content }],
    }));

    console.log('[AI/Gemini] Iniciando chat con', geminiHistory.length, 'mensajes previos');
    const chat = model.startChat({ history: geminiHistory });
    
    console.log('[AI/Gemini] Enviando mensaje a Gemini...');
    const result = await chat.sendMessage(latestUserText);
    
    console.log('[AI/Gemini] ✓ Respuesta recibida');
    return (await result.response).text() || 'Lo siento, no pude procesar tu mensaje.';
  } catch (error) {
    console.error('[AI/Gemini] ❌ ERROR:', error);
    if (error instanceof Error) {
      console.error('[AI/Gemini] Message:', error.message);
      console.error('[AI/Gemini] Stack:', error.stack);
    }
    throw error;
  }
}

/**
 * Genera respuesta usando OpenAI ChatGPT
 */
async function generateOpenAIReply(
  systemPrompt: string,
  history: ConversationTurn[],
  latestUserText: string
): Promise<string> {
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((t) => ({ role: t.role, content: t.content })),
  ];
  
  const completion = await openai!.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4',
    messages,
    temperature: 0.7,
  });
  
  return completion.choices[0]?.message?.content || 'Lo siento, no pude procesar tu mensaje.';
}

/**
 * Detecta el proveedor actual de IA
 */
export function getAIProvider(): 'gemini' | 'openai' {
  return process.env.GEMINI_API_KEY?.trim() ? 'gemini' : 'openai';
}

// Cache del prompt con TTL para invalidación automática
let cachedSystemPrompt: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Lee el prompt del sistema con cache invalidable cada 5 minutos
 */
export function getSystemPromptCached(): string {
  const now = Date.now();
  const isExpired = (now - cacheTimestamp) > CACHE_TTL_MS;
  
  if (cachedSystemPrompt && !isExpired) {
    return cachedSystemPrompt;
  }
  
  const promptPath = path.join(process.cwd(), 'AGENT_PROMPT.md');
  try {
    cachedSystemPrompt = fs.readFileSync(promptPath, 'utf-8');
    cacheTimestamp = now;
    return cachedSystemPrompt;
  } catch (err) {
    console.error('[AI] Error leyendo AGENT_PROMPT.md:', err);
    throw new Error('No se pudo leer AGENT_PROMPT.md. Verifica que exista.');
  }
}

/**
 * Invalida el cache del prompt manualmente
 */
export function invalidateSystemPromptCache(): void {
  cachedSystemPrompt = null;
  cacheTimestamp = 0;
  console.log('[AI] System prompt cache invalidated');
}
