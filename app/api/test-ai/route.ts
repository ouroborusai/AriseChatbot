import { NextRequest, NextResponse } from 'next/server';
import { generateAssistantReply, getSystemPromptCached, ConversationTurn } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json();

    if (!phoneNumber || !message) {
      return NextResponse.json({ error: 'Faltan phoneNumber o message' }, { status: 400 });
    }

    console.log('🤖 TEST-AI: Iniciando prueba para', phoneNumber);

    // Simular historial vacío para test
    const history: ConversationTurn[] = [];

    // Generar respuesta IA
    const systemPrompt = getSystemPromptCached();
    const aiResponse = await generateAssistantReply(systemPrompt, history, message);

    console.log('✅ TEST-AI: Completado');

    return NextResponse.json({
      aiResponse,
      historyLength: 0,
    });
  } catch (error) {
    console.error('❌ TEST-AI Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error desconocido',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}