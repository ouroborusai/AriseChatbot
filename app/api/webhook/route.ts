import { NextRequest, NextResponse } from 'next/server';
import { handleInboundUserMessage } from '@/lib/webhook-handler';
import { InboundMessage } from '@/lib/dedupe-service';

export async function GET(request: NextRequest) {
  console.log('[Webhook] GET - Verificación de webhook');

  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[Webhook] ✓ Verificación exitosa');
    return new NextResponse(challenge, { status: 200 });
  }

  console.log('[Webhook] ✗ Verificación fallida');
  return new NextResponse('Verification failed', { status: 403 });
}

export async function POST(request: NextRequest) {
  console.log('[Webhook] POST - Payload recibido');

  try {
    const body = await request.json();
    console.log('[Webhook] Payload:', JSON.stringify(body, null, 2));

    const entries = body.entry;
    if (!Array.isArray(entries)) {
      return new NextResponse('OK', { status: 200 });
    }

    for (const entry of entries) {
      const changes = entry?.changes;
      if (!Array.isArray(changes)) continue;

      for (const change of changes) {
        if (change?.field !== 'messages') {
          console.log('[Webhook] Campo ignorado:', change?.field);
          continue;
        }

        const messages = change?.value?.messages;
        if (!Array.isArray(messages) || messages.length === 0) {
          continue;
        }

        // Procesar cada mensaje
        for (const messageData of messages) {
          await handleInboundUserMessage(messageData as InboundMessage);
        }
      }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('[Webhook] ❌ Error procesando payload:', error);
    
    // Log detallado del error
    if (error instanceof Error) {
      console.error('[Webhook] Error message:', error.message);
      console.error('[Webhook] Error stack:', error.stack);
    }
    
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
