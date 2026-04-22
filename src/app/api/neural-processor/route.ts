import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type {
  NeuralProcessorRequest,
  NeuralProcessorResponse,
  NeuralAction,
} from '@/types/api';
import { requireAuth, verifyCompanyAccess } from '@/lib/api-auth';
import { handleInventoryAction } from '@/lib/neural-engine/actions/inventory';
import { handleTaskAction } from '@/lib/neural-engine/actions/task';
import { handlePdfAction } from '@/lib/neural-engine/actions/pdf';

/**
 * NEURAL PROCESSOR v9.0 Industrial CORE
 * Procesa bloques de acción [[ { "action": "..." } ]] en mensajes de la IA.
 *
 * Acciones soportadas:
 * - inventory_create: Crear nuevo ítem de inventario
 * - inventory_add: Sumar stock existente
 * - inventory_remove: Restar stock existente
 * - task_create: Crear tarea/recordatorio
 * - pdf_generate: Generar y enviar PDF por WhatsApp
 */
export async function POST(req: Request) {
  // Verificar autenticación
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  // Validación crítica: Service Role Key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[NEURAL_PROCESSOR] Missing Supabase credentials');
    return NextResponse.json(
      { error: 'Server configuration error: Missing Supabase credentials' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    const { messageId, companyId } = body as NeuralProcessorRequest;

    // Validación de parámetros
    if (!messageId || !companyId) {
      return NextResponse.json(
        { error: 'Missing required parameters: messageId and companyId' },
        { status: 400 }
      );
    }

    // Verificar acceso a la compañía
    const hasAccess = await verifyCompanyAccess(authResult.user.id, companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this company' },
        { status: 403 }
      );
    }

    // 1. Obtener contenido del mensaje con retry por latencia de replicación
    let message: { content: string } | null = null;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', messageId)
        .single();

      if (data) {
        message = data;
        break;
      }

      lastError = error;
      console.warn(`[NEURAL_PROCESSOR] Attempt ${attempt}/3: Message ${messageId} not found yet...`);

      // Backoff exponencial: 1s → 2s → 4s
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    if (!message) {
      console.error(
        `[NEURAL_PROCESSOR] Failed to find message ${messageId} after 3 attempts. Error:`,
        lastError
      );
      return NextResponse.json(
        { error: 'Message not found after retries' },
        { status: 404 }
      );
    }

    // 2. Obtener estado de la conversación para validar Handoff
    const { data: msgConv, error: convError } = await supabase
      .from('messages')
      .select('conversation_id, conversations(status)')
      .eq('id', messageId)
      .single();

    const conversation = msgConv as any;
    const status = conversation?.conversations?.status;

    if (convError || !status) {
      return NextResponse.json({ error: 'Conversation status not found' }, { status: 404 });
    }

    // --- CLÁUSULA DE GUARDA v9.0 ---
    if (status !== 'open') {
      console.log(`[NEURAL_PROCESSOR] Handoff detected (Status: ${status}). Aborting actions for message ${messageId}`);
      return NextResponse.json({ status: 'aborted_handoff_active' });
    }

    // 3. Buscar bloques de acción [[ ... ]]
    const actionBlocks = message.content.match(/\[\[([\s\S]*?)\]\]/g);

    if (!actionBlocks || actionBlocks.length === 0) {
      return NextResponse.json({ status: 'no_actions_detected' });
    }

    const results: NeuralAction[] = [];

    // 3. Ejecutar cada bloque detectado
    for (const block of actionBlocks) {
      try {
        // Limpieza robusta de JSON
        let cleanJson = block
          .replace(/^\[\[/, '')     // Remover apertura [[
          .replace(/\]\]$/, '')     // Remover cierre ]]
          .trim();

        // Normalizar escapes y caracteres de control
        cleanJson = cleanJson
          .replace(/\\"/g, '"')     // Unescape quotes
          .replace(/\\n/g, ' ')     // Newlines → espacios
          .replace(/\\r/g, '')      // Carriage returns → eliminar
          .replace(/\s+/g, ' ')     // Múltiples espacios → uno solo
          .trim();

        console.log(`[NEURAL_PROCESSOR] Clean JSON: ${cleanJson}`);

        const actionData = JSON.parse(cleanJson);
        const actionType = actionData.action || '';

        console.log(`[NEURAL_PROCESSOR] Processing action: ${actionType}`);

        let actionResults: NeuralAction[] = [];

        // 1. Handlers por Dominio (Strategy Pattern)
        if (actionType.startsWith('inventory_')) {
          actionResults = await handleInventoryAction(supabase, actionData, companyId, messageId);
        } else if (actionType.startsWith('task_') || actionType.startsWith('reminder_')) {
          actionResults = await handleTaskAction(supabase, actionData, companyId, messageId);
        } else if (actionType === 'pdf_generate') {
          actionResults = await handlePdfAction(supabase, actionData, companyId, messageId);
        } else {
          console.warn(`[NEURAL_PROCESSOR] Unsupported action type: ${actionType}`);
          actionResults = [{ action: 'unknown', status: 'failed', error: `Unsupported action type: ${actionType}` }];
        }

        results.push(...actionResults);
      } catch (parseError) {
        const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parse error';
        console.error(
          `[NEURAL_PROCESSOR] JSON Parse Error for block: ${block}`
        );
        console.error(
          `[NEURAL_PROCESSOR] Error details: ${errorMessage}`
        );
        results.push({
          action: 'unknown',
          status: 'failed',
          error: `JSON parse failed: ${errorMessage}`,
        });
      }
    }

    const response: NeuralProcessorResponse = {
      status: 'completed',
      results,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[NEURAL_PROCESSOR] Critical Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
