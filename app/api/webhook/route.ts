import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { resolveGeminiModel } from '@/lib/gemini-model';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

type Turn = { role: 'user' | 'assistant'; content: string };

const openai =
  process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'tu_openai_api_key'
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

function getSystemPrompt(): string {
  const promptPath = path.join(process.cwd(), 'AGENT_PROMPT.md');
  return fs.readFileSync(promptPath, 'utf-8');
}

async function generateAssistantReply(
  systemPrompt: string,
  history: Turn[],
  latestUserText: string
): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    const genAI = new GoogleGenerativeAI(geminiKey);
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

  if (openai) {
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((t) => ({ role: t.role, content: t.content })),
    ];
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages,
      temperature: 0.7,
    });
    return completion.choices[0]?.message?.content || 'Lo siento, no pude procesar tu mensaje.';
  }

  throw new Error('Configura GEMINI_API_KEY o OPENAI_API_KEY en .env.local');
}

/** WhatsApp Cloud API: `to` sin +, solo dígitos (ej. 56912345678). */
function formatWhatsAppRecipient(phone: string): string {
  let d = digitsOnly(phone);
  if (d.startsWith('0')) d = d.replace(/^0+/, '');
  return d;
}

async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = formatWhatsAppRecipient(phoneNumber);

  if (!to || to.length < 8) {
    throw new Error(`Número destino inválido para WhatsApp API: "${phoneNumber}" → "${to}"`);
  }

  const bodyText = message.length > 4096 ? message.slice(0, 4093) + '...' : message;

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { preview_url: false, body: bodyText },
      }),
    }
  );

  const raw = await response.text();
  if (!response.ok) {
    let detail = raw;
    try {
      const j = JSON.parse(raw) as { error?: { message?: string; code?: number; error_subcode?: number } };
      if (j?.error) {
        detail = `${j.error.message || raw} (code=${j.error.code}, subcode=${j.error.error_subcode ?? 'n/a'})`;
      }
    } catch {
      /* raw no es JSON */
    }
    console.error('[webhook] Graph API send error:', response.status, detail);
    throw new Error(`WhatsApp send failed: ${detail}`);
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return { raw };
  }
}

async function releaseWaDedup(dedupeKey: string | undefined): Promise<void> {
  if (!dedupeKey?.trim()) return;
  const { error } = await getSupabaseAdmin()
    .from('processed_whatsapp_messages')
    .delete()
    .eq('wa_message_id', dedupeKey.trim());
  if (error) {
    console.warn('[webhook] No se pudo liberar deduplicación:', error.message);
  }
}

async function getOrCreateConversation(phoneNumber: string) {
  const { data: existing } = await getSupabaseAdmin()
    .from('conversations')
    .select('id')
    .eq('phone_number', phoneNumber)
    .single();

  if (existing) {
    console.log('Found existing conversation:', existing.id);
    return existing.id;
  }

  const { data: newConv, error } = await getSupabaseAdmin()
    .from('conversations')
    .insert({ phone_number: phoneNumber })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }

  console.log('Created new conversation:', newConv.id);
  return newConv.id;
}

async function getConversationHistory(phoneNumber: string): Promise<Turn[]> {
  const { data: conversation } = await getSupabaseAdmin()
    .from('conversations')
    .select('id')
    .eq('phone_number', phoneNumber)
    .single();

  if (!conversation) return [];

  const { data: messages } = await getSupabaseAdmin()
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true })
    .limit(20);

  return (messages || []).map((m) => {
    const role = m.role === 'assistant' ? ('assistant' as const) : ('user' as const);
    return { role, content: m.content ?? '' };
  });
}

async function saveMessage(conversationId: string, role: 'user' | 'assistant', content: string) {
  const { error } = await getSupabaseAdmin()
    .from('messages')
    .insert({ conversation_id: conversationId, role, content });

  if (error) {
    console.error('Error saving message:', error);
    throw error;
  }
  console.log(`Saved ${role} message for conversation ${conversationId}`);
}

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}

/**
 * true = este evento es nuevo (se procesa). false = duplicado (Meta reintenta o payload repetido).
 * Prioridad: RPC atómico claim_whatsapp_inbound (sin condición de carrera entre instancias Vercel).
 */
async function tryClaimInboundDedupe(dedupeKey: string): Promise<boolean> {
  const key = dedupeKey.trim();
  if (!key) {
    console.warn('[webhook] Clave de deduplicación vacía');
    return true;
  }

  const admin = getSupabaseAdmin();
  const { data: claimed, error: rpcError } = await admin.rpc('claim_whatsapp_inbound', {
    p_wa_id: key,
  });

  if (!rpcError && typeof claimed === 'boolean') {
    if (!claimed) {
      console.log('[webhook] Duplicado (claim atómico), omitiendo:', key.slice(0, 80));
    }
    return claimed;
  }

  const rpcMsg = rpcError?.message || '';
  const rpcMissing =
    rpcMsg.includes('claim_whatsapp_inbound') ||
    rpcMsg.includes('function') ||
    rpcError?.code === 'PGRST202' ||
    rpcMsg.includes('42883');

  if (!rpcMissing) {
    console.error('[webhook] RPC claim_whatsapp_inbound:', rpcError);
  }

  const { error } = await admin.from('processed_whatsapp_messages').insert({ wa_message_id: key });

  if (!error) return true;
  if (error.code === '23505') {
    console.log('[webhook] Duplicado (insert), omitiendo:', key.slice(0, 80));
    return false;
  }

  const msg = error.message || '';
  if (
    msg.includes('Could not find the table') ||
    msg.includes('does not exist') ||
    msg.includes('processed_whatsapp_messages')
  ) {
    console.warn(
      '[webhook] Tabla processed_whatsapp_messages ausente → riesgo de duplicados. Ejecuta supabase/processed_whatsapp_messages.sql y supabase/claim_whatsapp_inbound.sql'
    );
    return true;
  }
  console.error('[webhook] Error deduplicación:', error);
  return true;
}

type WaInboundText = {
  id?: string;
  from?: string;
  type?: string;
  timestamp?: string;
  text?: { body?: string };
};

function buildInboundDedupeKey(messageData: WaInboundText, phoneNumber: string, text: string): string {
  const id = messageData.id?.trim();
  if (id) return id;
  const ts = messageData.timestamp?.trim() || '0';
  const slice = text.trim().slice(0, 240);
  return `fb:${digitsOnly(phoneNumber)}:${ts}:${slice}`;
}

async function handleInboundUserMessage(messageData: WaInboundText): Promise<void> {
  if (messageData.type !== 'text') {
    console.log('[webhook] Ignorado (no es texto):', messageData.type);
    return;
  }

  const phoneNumber = messageData.from;
  const text = messageData.text?.body?.trim();

  const ignoreFrom = process.env.WHATSAPP_IGNORE_INBOUND_FROM?.trim();
  if (ignoreFrom && phoneNumber && digitsOnly(phoneNumber) === digitsOnly(ignoreFrom)) {
    console.log('[webhook] Ignorado remitente = WHATSAPP_IGNORE_INBOUND_FROM (evita ecos)');
    return;
  }

  if (!text || !phoneNumber) {
    console.log('[webhook] Falta texto o from');
    return;
  }

  const dedupeKey = buildInboundDedupeKey(messageData, phoneNumber, text);
  const claimed = await tryClaimInboundDedupe(dedupeKey);
  if (!claimed) return;

  console.log(`Message from ${phoneNumber}: ${text}`);

  const conversationId = await getOrCreateConversation(phoneNumber);
  await saveMessage(conversationId, 'user', text);

  const history = await getConversationHistory(phoneNumber);
  const systemPrompt = getSystemPrompt();

  const provider = process.env.GEMINI_API_KEY?.trim() ? 'Gemini' : 'OpenAI';
  console.log(`Calling ${provider} with`, history.length, 'messages in history');

  try {
    const assistantResponse = await generateAssistantReply(systemPrompt, history, text);
    console.log('AI Response:', assistantResponse);

    await sendWhatsAppMessage(phoneNumber, assistantResponse);
    await saveMessage(conversationId, 'assistant', assistantResponse);

    console.log('Message processing completed successfully');
  } catch (err) {
    await releaseWaDedup(dedupeKey);
    throw err;
  }
}

export async function GET(request: NextRequest) {
  console.log('GET /api/webhook - Webhook verification called');

  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Webhook verified successfully');
    return new NextResponse(challenge, { status: 200 });
  }

  console.log('Webhook verification failed');
  return new NextResponse('Verification failed', { status: 403 });
}

export async function POST(request: NextRequest) {
  console.log('POST /api/webhook - payload received');

  try {
    const body = await request.json();
    console.log('Webhook payload:', JSON.stringify(body, null, 2));

    const entries = body.entry;
    if (!Array.isArray(entries)) {
      return new NextResponse('OK', { status: 200 });
    }

    for (const entry of entries) {
      const changes = entry?.changes;
      if (!Array.isArray(changes)) continue;

      for (const change of changes) {
        if (change?.field !== 'messages') {
          console.log('[webhook] Campo ignorado:', change?.field);
          continue;
        }

        const messages = change?.value?.messages;
        if (!Array.isArray(messages) || messages.length === 0) {
          continue;
        }

        for (const messageData of messages) {
          await handleInboundUserMessage(messageData as WaInboundText);
        }
      }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
