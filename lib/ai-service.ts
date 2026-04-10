/**
 * AI Service
 * Maneja la generación de respuestas con Gemini o OpenAI
 * 
 * Incluye clasificador de intenciones con Structured Outputs (JSON Schema)
 */

import { resolveGeminiModel } from './gemini-model';
import { GoogleGenerativeAI, type GenerateContentResult } from '@google/generative-ai';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

export type Intencion = 'saludo' | 'soporte' | 'documento' | 'desconocido';

const SYSTEM_PROMPT_CLASIFICADOR = `Eres un clasificador de intenciones. Lee el mensaje del usuario y devuelve únicamente un JSON con la intención. Las intenciones válidas son: 'saludo', 'soporte', 'documento'.JSON de respuesta: {"intencion": "valor"}`;

export const CLASIFICADOR_SCHEMA = {
  type: "object",
  properties: {
    intencion: {
      type: "string",
      enum: ["saludo", "soporte", "documento"]
    }
  },
  required: ["intencion"]
};

/**
 * Clasifica la intención del mensaje usando Gemini con Structured Output
 * Gemini SOLO devuelve JSON, no texto自由
 */
export async function classifyIntencion(userMessage: string): Promise<Intencion> {
  const modelName = resolveGeminiModel();
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT_CLASIFICADOR,
    generationConfig: {
      responseSchema: CLASIFICADOR_SCHEMA,
      responseMimeType: "application/json",
    },
  });

  try {
    const result: GenerateContentResult = await model.generateContent(userMessage);
    const response = await result.response;
    const text = response.text();
    
    const parsed = JSON.parse(text);
    const intencion = parsed.intencion as Intencion;
    
    console.log('[AI] Intención clasificada:', intencion);
    return intencion || 'desconocido';
  } catch (error) {
    console.error('[AI] Error clasificando:', error);
    return 'desconocido';
  }
}

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
    const backend = process.env.AI_BACKEND?.trim().toLowerCase();
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    const openaiKey = process.env.OPENAI_API_KEY?.trim();

    if (backend === 'ollama') {
      console.log('[AI] Usando Ollama local...');
      try {
        return await generateOllamaReply(systemPrompt, history, latestUserText);
      } catch (ollamaError) {
        console.warn('[AI] Ollama falló, intentando backend alternativo...', ollamaError instanceof Error ? ollamaError.message : String(ollamaError));
      }
    }

    if (backend === 'gemini') {
      if (!geminiKey) {
        throw new Error('❌ CONFIGURACIÓN FALTANTE: GEMINI_API_KEY no está configurada para AI_BACKEND=gemini');
      }
      console.log('[AI] Forzando Gemini...');
      return await generateGeminiReply(systemPrompt, history, latestUserText);
    }

    if (backend === 'openai') {
      if (!openaiKey) {
        throw new Error('❌ CONFIGURACIÓN FALTANTE: OPENAI_API_KEY no está configurada para AI_BACKEND=openai');
      }
      console.log('[AI] Forzando OpenAI...');
      return await generateOpenAIReply(systemPrompt, history, latestUserText);
    }

    // Sin backend forzado, intenta Gemini primero si existe, luego OpenAI.
    if (geminiKey) {
      console.log('[AI] Intentando con Gemini...');
      try {
        return await generateGeminiReply(systemPrompt, history, latestUserText);
      } catch (geminiError) {
        console.warn('[AI] Gemini falló, intentando OpenAI...', geminiError instanceof Error ? geminiError.message : 'Error desconocido');
      }
    }

    if (openaiKey) {
      console.log('[AI] Usando OpenAI');
      return await generateOpenAIReply(systemPrompt, history, latestUserText);
    }

    throw new Error('❌ No se pudo generar respuesta: no se detectó backend válido ni llaves configuradas');
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
    { role: 'user', content: latestUserText },
  ];
  
  const completion = await openai!.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4',
    messages,
    temperature: 0.7,
  });
  
  return completion.choices[0]?.message?.content || 'Lo siento, no pude procesar tu mensaje.';
}

async function generateOllamaReply(
  systemPrompt: string,
  history: ConversationTurn[],
  latestUserText: string
): Promise<string> {
  const url = process.env.OLLAMA_API_URL?.trim() || 'http://127.0.0.1:11434/v1/chat/completions';
  const model = process.env.OLLAMA_MODEL?.trim() || 'llama2';

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((t) => ({ role: t.role, content: t.content })),
    { role: 'user', content: latestUserText },
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
    }),
  });

  const raw = await response.text();
  if (!response.ok) {
    let detail = raw;
    try {
      const json = JSON.parse(raw);
      detail = json.error?.message || JSON.stringify(json);
    } catch {
      // no es JSON
    }
    throw new Error(`Ollama request failed: ${response.status} ${detail}`);
  }

  const json = JSON.parse(raw) as { choices?: Array<{ message?: { role?: string; content?: string } }> };
  const content = json.choices?.[0]?.message?.content;
  return content || 'Lo siento, no pude procesar tu mensaje.';
}

/**
 * Detecta el proveedor actual de IA
 */
export function getAIProvider(): 'gemini' | 'openai' | 'ollama' {
  const backend = process.env.AI_BACKEND?.trim().toLowerCase();
  if (backend === 'ollama') return 'ollama';
  if (backend === 'openai') return 'openai';
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
