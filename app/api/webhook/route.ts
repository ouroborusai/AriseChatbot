import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
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
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
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

async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

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
        to: phoneNumber,
        text: { body: message },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Error sending WhatsApp message:', error);
    throw new Error(`Failed to send message: ${error}`);
  }

  return response.json();
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
  console.log('POST /api/webhook - Message received');

  try {
    const body = await request.json();
    console.log('Webhook payload:', JSON.stringify(body, null, 2));

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const messageData = changes?.value?.messages?.[0];

    if (!messageData) {
      console.log('No message found in payload');
      return new NextResponse('OK', { status: 200 });
    }

    const phoneNumber = messageData.from;
    const text = messageData.text?.body;

    if (!text || !phoneNumber) {
      console.log('Missing phone or text');
      return new NextResponse('OK', { status: 200 });
    }

    console.log(`Message from ${phoneNumber}: ${text}`);

    const conversationId = await getOrCreateConversation(phoneNumber);
    await saveMessage(conversationId, 'user', text);

    const history = await getConversationHistory(phoneNumber);
    const systemPrompt = getSystemPrompt();

    const provider = process.env.GEMINI_API_KEY?.trim() ? 'Gemini' : 'OpenAI';
    console.log(`Calling ${provider} with`, history.length, 'messages in history');

    const assistantResponse = await generateAssistantReply(systemPrompt, history, text);
    console.log('AI Response:', assistantResponse);

    await saveMessage(conversationId, 'assistant', assistantResponse);
    await sendWhatsAppMessage(phoneNumber, assistantResponse);

    console.log('Message processing completed successfully');
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
