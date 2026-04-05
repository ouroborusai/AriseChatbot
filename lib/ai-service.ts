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
 * Lee el prompt del sistema desde AGENT_PROMPT.md
 */
export function getSystemPrompt(): string {
  const promptPath = path.join(process.cwd(), 'AGENT_PROMPT.md');
  return fs.readFileSync(promptPath, 'utf-8');
}

/**
 * Genera respuesta del asistente usando Gemini o OpenAI
 */
export async function generateAssistantReply(
  systemPrompt: string,
  history: ConversationTurn[],
  latestUserText: string
): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  
  if (geminiKey) {
    return generateGeminiReply(systemPrompt, history, latestUserText);
  }

  if (openai) {
    return generateOpenAIReply(systemPrompt, history, latestUserText);
  }

  throw new Error('Configura GEMINI_API_KEY o OPENAI_API_KEY en .env.local');
}

/**
 * Genera respuesta usando Google Gemini
 */
async function generateGeminiReply(
  systemPrompt: string,
  history: ConversationTurn[],
  latestUserText: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: resolveGeminiModel(),
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

  const chat = model.startChat({ history: geminiHistory });
  const result = await chat.sendMessage(latestUserText);
  return (await result.response).text() || 'Lo siento, no pude procesar tu mensaje.';
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

// Cache del prompt para evitar leerlo del disco cada vez
let cachedSystemPrompt: string | null = null;

/**
 * Lee el prompt del sistema desde archivo (con cache)
 */
export function getSystemPromptCached(): string {
  if (cachedSystemPrompt) return cachedSystemPrompt;
  
  const promptPath = path.join(process.cwd(), 'AGENT_PROMPT.md');
  try {
    cachedSystemPrompt = fs.readFileSync(promptPath, 'utf-8');
    return cachedSystemPrompt;
  } catch (err) {
    console.error('[AI] Error leyendo AGENT_PROMPT.md:', err);
    throw new Error('No se pudo leer AGENT_PROMPT.md. Verifica que exista en la raíz del proyecto.');
  }
}
