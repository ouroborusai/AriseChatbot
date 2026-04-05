import { NextRequest, NextResponse } from 'next/server';
import { handleInboundUserMessage } from '@/lib/webhook-handler';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json();

    if (!phoneNumber || !message) {
      return NextResponse.json({ error: 'phoneNumber y message son requeridos' }, { status: 400 });
    }

    console.log(`[Test] Enviando mensaje de prueba a ${phoneNumber}: "${message}"`);

    // Crear un mensaje simulado como si viniera de WhatsApp
    const testMessage = {
      id: `test_${Date.now()}`,
      type: 'text',
      from: phoneNumber,
      timestamp: Math.floor(Date.now() / 1000).toString(),
      text: {
        body: message
      }
    };

    await handleInboundUserMessage(testMessage);

    return NextResponse.json({
      success: true,
      message: 'Mensaje de prueba enviado',
      data: testMessage
    });

  } catch (error) {
    console.error('[Test] Error:', error);
    return NextResponse.json({
      error: 'Error procesando mensaje de prueba',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}