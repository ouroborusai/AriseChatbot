/**
 * AI Service - Cluster de Alta Disponibilidad & Telemetría
 * Maneja la generación de respuestas con Gemini (8 llaves) y OpenAI de respaldo.
 */

import { resolveGeminiModel } from './gemini-model';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSupabaseAdmin } from './supabase-admin';
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
 * Obtiene el estado de salud de todo el cluster de IA
 */
export function getAiClusterStatus() {
  const allKeys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  const now = Date.now();
  return allKeys.map((key, index) => {
    const cooldownUntil = keyCooldowns[index] || 0;
    const isReady = now > cooldownUntil;
    return {
      index: index + 1,
      name: `Core-IA #${index + 1}`,
      status: isReady ? 'online' : 'cooldown',
      cooldownRemaining: isReady ? 0 : Math.ceil((cooldownUntil - now) / 1000),
      isCurrent: index === globalKeyPointer
    };
  });
}

/**
 * Registra el uso de la API en la base de datos para monitoreo
 */
async function logAiUsage(data: {
  keyIndex: number;
  keyName: string;
  tokensInput?: number;
  tokensOutput?: number;
  latencyMs: number;
  status: 'success' | 'quota_exceeded' | 'error';
  errorMessage?: string;
  usageType?: string;
}) {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('ai_api_telemetry').insert({
      key_index: data.keyIndex,
      key_name: data.keyName,
      tokens_input: data.tokensInput || 0,
      tokens_output: data.tokensOutput || 0,
      latency_ms: data.latencyMs,
      status: data.status,
      error_message: data.errorMessage,
      usage_type: data.usageType || 'conversational'
    });
  } catch (err: any) {
    console.error('[Telemetry] Error saving usage:', err?.message);
  }
}

// Puntero global para balanceo de carga (Round Robin)
let globalKeyPointer = 0;
// Semáforo de llaves en enfriamiento (Circuit Breaker)
const keyCooldowns: Record<number, number> = {};

/**
 * Genera respuesta usando Google Gemini con Circuit Breaker y Balanceo Circular
 */
async function generateGeminiReply(
  systemPrompt: string,
  history: ConversationTurn[],
  latestUserText: string,
  usageType: string = 'conversational'
): Promise<string> {
  const allKeys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  const names = ['Principal', 'MTZ Contabilidad', 'Te Quiero Feliz', 'Carlos Villagra', 'Ouroborus AI', 'Soporte 6', 'De Doctor', 'Ouroborus MTZ'];
  
  if (allKeys.length === 0) throw new Error('No hay llaves de Gemini configuradas.');

  const numKeys = allKeys.length;
  const now = Date.now();
  let lastError: any = null;

  for (let attempt = 0; attempt < numKeys; attempt++) {
    const i = (globalKeyPointer + attempt) % numKeys;
    const cooldownUntil = keyCooldowns[i] || 0;
    
    if (now < cooldownUntil) continue; 

    const currentKey = allKeys[i];
    const keyName = names[i] || `Réplica #${i + 1}`;
    const startTime = Date.now();

    try {
      const genAI = new GoogleGenerativeAI(currentKey);
      const modelId = resolveGeminiModel();
      const model = genAI.getGenerativeModel({ model: modelId, systemInstruction: systemPrompt });

      const geminiHistory = history.slice(0, -1).map((t) => ({
        role: t.role === 'user' ? ('user' as const) : ('model' as const),
        parts: [{ text: t.content }],
      }));

      const chat = model.startChat({ history: geminiHistory });
      const result = await chat.sendMessage(latestUserText);
      const response = await result.response;
      
      const latencyMs = Date.now() - startTime;
      const usage = response.usageMetadata;
      
      globalKeyPointer = (i + 1) % numKeys;
      delete keyCooldowns[i];

      logAiUsage({
        keyIndex: i + 1, keyName, tokensInput: usage?.promptTokenCount,
        tokensOutput: usage?.candidatesTokenCount, latencyMs, status: 'success', usageType
      });

      return response.text();
    } catch (error: any) {
      lastError = error;
      const isQuota = error?.message?.includes('429') || error?.message?.includes('quota');
      if (isQuota) {
        keyCooldowns[i] = Date.now() + 60000;
        logAiUsage({ keyIndex: i + 1, keyName, latencyMs: Date.now() - startTime, status: 'quota_exceeded', usageType, errorMessage: '429' });
        continue;
      }
      break; 
    }
  }
  throw lastError || new Error('Cluster de IA no disponible.');
}

/**
 * Interfaz principal para generar respuestas
 */
export async function generateAssistantReply(
  systemPrompt: string,
  history: ConversationTurn[],
  latestUserText: string,
  usageType: string = 'conversational'
): Promise<string> {
  const backend = process.env.AI_BACKEND?.trim().toLowerCase();
  
  if (backend === 'gemini' || (!backend && process.env.GEMINI_API_KEY)) {
    try {
      return await generateGeminiReply(systemPrompt, history, latestUserText, usageType);
    } catch (err) {
      console.warn('[AI] Gemini falló, intentando respaldo...');
    }
  }

  if (process.env.OPENAI_API_KEY) {
    return await generateOpenAIReply(systemPrompt, history, latestUserText);
  }

  throw new Error('No hay proveedores de IA disponibles.');
}

export async function extractInventoryData(text: string): Promise<any> {
    const systemPrompt = `Eres un experto contable. Extrae en JSON: producto, cantidad, unidad, proveedor_nombre, proveedor_rut, monto_neto, numero_documento.`;
    try {
      const raw = await generateAssistantReply(systemPrompt, [], `Extrae: "${text}"`, 'inventory_extraction');
      const jsonStr = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch { return null; }
}

async function generateOpenAIReply(systemPrompt: string, history: ConversationTurn[], latestUserText: string): Promise<string> {
  if (!openai) throw new Error('OpenAI no configurado');
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4',
    messages: [{ role: 'system', content: systemPrompt }, ...history.map(t => ({ role: t.role, content: t.content })), { role: 'user', content: latestUserText }],
  });
  return completion.choices[0]?.message?.content || 'Error OpenAI';
}

// Funciones de utilidad (Prompt, Cache, Audio, Imagen)
export function getSystemPromptCached(): string {
  const promptPath = path.join(process.cwd(), 'AGENT_PROMPT.md');
  return fs.readFileSync(promptPath, 'utf-8');
}

export async function transcribeAudio(audioBuffer: Buffer, fileName: string): Promise<string> {
    return 'Transcripción no implementada en este build log';
}

export async function extractInventoryFromImage(imageUrl: string): Promise<any> {
    return { items: [], total: 0 };
}

export function invalidateSystemPromptCache(): void {
  console.log('[AI] System prompt cache invalidated');
}
