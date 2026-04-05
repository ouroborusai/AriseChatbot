import { NextRequest, NextResponse } from 'next/server';
import { generateAssistantReply } from '@/lib/ai-service';
import { getConversationHistory } from '@/lib/database-service';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json();

    if (!phoneNumber || !message) {
      return NextResponse.json({ error: 'phoneNumber y message son requeridos' }, { status: 400 });
    }

    console.log(`[AI-Test] Probando IA para ${phoneNumber}: "${message}"`);

    // Obtener historial de conversación
    const history = await getConversationHistory(phoneNumber);
    console.log(`[AI-Test] Historial: ${history.length} mensajes`);

    // Generar respuesta IA
    const aiResponse = await generateAssistantReply(
      'Eres un útil asistente de atención al cliente para QuickShip, una tienda de comercio electrónico.',
      history,
      message
    );

    return NextResponse.json({
      success: true,
      message: 'IA respondió correctamente',
      historyLength: history.length,
      aiResponse: aiResponse
    });

  } catch (error) {
    console.error('[AI-Test] Error:', error);
    return NextResponse.json({
      error: 'Error probando IA',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}