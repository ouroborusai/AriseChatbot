import { NextRequest, NextResponse } from 'next/server';
import { handleInboundUserMessage } from '@/lib/webhook-handler';

type InboundMessage = {
  id?: string;
  from?: string;
  type?: string;
  text?: { body?: string };
};

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
    console.log('[Webhook] ====== PAYLOAD COMPLETO ======');
    console.log(JSON.stringify(body, null, 2));
    console.log('[Webhook] ====== FIN PAYLOAD ======');

    const entries = body.entry;
    if (!Array.isArray(entries)) {
      console.log('[Webhook] ⚠️ Campo "entry" no es un array');
      return new NextResponse('OK', { status: 200 });
    }

    console.log('[Webhook] Procesando', entries.length, 'entrada(s)');

    for (const entry of entries) {
      const changes = entry?.changes;
      if (!Array.isArray(changes)) {
        console.log('[Webhook] ⚠️ Campo "changes" no es array en entrada');
        continue;
      }

      console.log('[Webhook] Entrada tiene', changes.length, 'cambio(s)');

      for (const change of changes) {
        console.log('[Webhook] Campo:', change?.field);
        
        if (change?.field !== 'messages') {
          console.log('[Webhook] ℹ️ Campo ignorado (no es messages):', change?.field);
          continue;
        }

        const messages = change?.value?.messages;
        const customers = change?.value?.customers;
        const statuses = change?.value?.statuses;

        console.log('[Webhook] Messages:', messages ? messages.length : 0);
        console.log('[Webhook] Customers:', customers ? customers.length : 0);
        console.log('[Webhook] Statuses:', statuses ? statuses.length : 0);

        if (!Array.isArray(messages) || messages.length === 0) {
          console.log('[Webhook] ℹ️ Sin mensajes para procesar');
          continue;
        }

        // Procesar cada mensaje
        for (const messageData of messages) {
          console.log('[Webhook] 📨 Mensaje:', JSON.stringify(messageData, null, 2));
          
          try {
            await handleInboundUserMessage(messageData as InboundMessage);
          } catch (msgError) {
            console.error('[Webhook] ❌ Error procesando mensaje:', msgError instanceof Error ? msgError.message : String(msgError));
            // Continuar con el siguiente mensaje
          }
        }
      }
    }

    console.log('[Webhook] ✅ Webhook procesado exitosamente');
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
