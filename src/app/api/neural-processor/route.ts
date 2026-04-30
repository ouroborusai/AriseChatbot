import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type {
  NeuralProcessorRequest,
  NeuralProcessorResponse,
  NeuralActionResult,
} from '@/lib/neural-engine/interfaces/actions';
import { requireAuth, verifyCompanyAccess } from '@/lib/api-auth';
import { handleInventoryAction } from '@/lib/neural-engine/actions/inventory';
import { handleTaskAction } from '@/lib/neural-engine/actions/task';
import { handlePdfAction } from '@/lib/neural-engine/actions/pdf';
import { handleDirectoryAction } from '@/lib/neural-engine/actions/directory';
import { handleCreditAction } from '@/lib/neural-engine/actions/credit';
import { handlePaymentAction } from '@/lib/neural-engine/actions/payment';
import { handleOfferMenusAction } from '@/lib/neural-engine/actions/menus';

/**
 *  NEURAL PROCESSOR ORCHESTRATOR v11.9.1 (Diamond Resilience)
 *  Enrutador puro para bloques de acción [[ { "action": "..." } ]].
 *  Aislamiento Tenant Estricto y Cero 'any'.
 */

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;
if (!INTERNAL_API_KEY) throw new Error('[NEURAL_PROCESSOR] INTERNAL_API_KEY env var is not set');

export async function POST(req: Request) {
  // Autenticación dual: sesión de usuario O clave interna master
  const internalKey = req.headers.get('x-api-key');
  const isInternalCall = internalKey === INTERNAL_API_KEY;

  let userId: string | null = null;

  if (!isInternalCall) {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    userId = authResult.user.id;
  }

  // Validación de infraestructura crítica
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.ARISE_MASTER_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[NEURAL_PROCESSOR] Missing Supabase credentials');
    return NextResponse.json(
      { error: 'Server configuration error: Missing Supabase credentials' },
      { status: 500 }
    );
  }

  const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

  try {
    const body = (await req.json()) as NeuralProcessorRequest;
    
    // 🛡️ PROPAGACIÓN COMPLETA DIAMOND (Corrección de campos muertos)
    const { 
      messageId, 
      companyId, 
      contact_id, 
      conversation_id, 
      phone_number, 
      payload 
    } = body;

    if (!messageId || !companyId) {
      return NextResponse.json(
        { error: 'Missing required parameters: messageId and companyId' },
        { status: 400 }
      );
    }

    // 🛡️ Aislamiento Tenant: Verificar acceso (si no es interno)
    if (!isInternalCall && userId) {
      const hasAccess = await verifyCompanyAccess(userId, companyId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied to this company' },
          { status: 403 }
        );
      }
    }

    // 1. Recuperación del mensaje con Reintento por Latencia de Replicación
    let messageContent: string | null = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', messageId)
        .eq('company_id', companyId)
        .single();

      if (data) {
        messageContent = data.content;
        break;
      }

      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    if (!messageContent) {
      return NextResponse.json({ error: 'Message content not resolved' }, { status: 404 });
    }

    // 2. Validación de Estado de Conversación (Anti-Handoff)
    const { data: msgData, error: msgError } = await supabase
      .from('messages')
      .select('conversation_id, conversations!inner(status)')
      .eq('id', messageId)
      .eq('company_id', companyId)
      .single();

    if (msgError || !msgData) {
      return NextResponse.json({ error: 'Conversation mapping failed' }, { status: 404 });
    }

    const conversation = msgData.conversations as unknown as { status: string };
    const convStatus = conversation.status;

    if (convStatus !== 'open') {
      console.log(`[NEURAL_PROCESSOR] Handoff activo (${convStatus}). Abortando acciones.`);
      return NextResponse.json({ response: 'Handoff_Active', action_results: [] });
    }

    // 3. Extracción de bloques de acción (Protocolo Multi-formato)
    const actionBlocks = messageContent.match(/\[\[([\s\S]*?)\]\]/g) || 
                        messageContent.match(/```json([\s\S]*?)```/g);

    if (!actionBlocks || actionBlocks.length === 0) {
      return NextResponse.json({ response: 'No_Actions_Detected', action_results: [] });
    }

    const results: NeuralActionResult[] = [];

    // 4. Orquestación y Delegación a Dominios
    for (const block of actionBlocks) {
      try {
        let cleanJson = '';
        if (block.startsWith('[[')) {
          cleanJson = block.slice(2, -2).trim();
        } else if (block.startsWith('```json')) {
          cleanJson = block.slice(7, -3).trim();
        }

        if (!cleanJson) continue;

        const sanitized = cleanJson
          .replace(/\r\n/g, ' ')
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        const parsedData = JSON.parse(sanitized);
        const actionArray = Array.isArray(parsedData) ? parsedData : [parsedData];

        for (const actionData of actionArray) {
          // Inyección de contexto Diamond en el actionData
          const extendedActionData = {
            ...actionData,
            company_id: companyId,
            contact_id: actionData.contact_id || contact_id,
            conversation_id: actionData.conversation_id || conversation_id,
            phone_number: actionData.phone_number || phone_number,
            meta_payload: payload
          };

          const actionType = actionData.action || '';
          let actionResults: NeuralActionResult[] = [];

          if (actionType.startsWith('inventory_')) {
            actionResults = await handleInventoryAction(supabase, extendedActionData, companyId, messageId);
          } else if (actionType.startsWith('task_') || actionType.startsWith('reminder_')) {
            actionResults = await handleTaskAction(supabase, extendedActionData, companyId, messageId);
          } else if (actionType === 'pdf_generate' || actionType === 'pdf_send') {
            actionResults = await handlePdfAction(supabase, extendedActionData, companyId, messageId);
          } else if (actionType.startsWith('directory_') || actionType === 'register_client') {
            actionResults = await handleDirectoryAction(supabase, extendedActionData, companyId, messageId);
          } else if (actionType === 'credit_limit_set') {
            actionResults = await handleCreditAction(supabase, extendedActionData, companyId, messageId);
          } else if (actionType === 'payment_link_generate' || actionType === 'payment_link') {
            actionResults = await handlePaymentAction(supabase, extendedActionData, companyId, messageId);
          } else if (actionType === 'offer_menus') {
            actionResults = await handleOfferMenusAction(supabase, extendedActionData, companyId, messageId);
          } else if (actionType === 'whatsapp_flow_init' || actionType === 'commerce_catalog_send') {
            actionResults = [{ action: actionType, status: 'pending_execution' }];
          } else {
            actionResults = [{ action: 'unknown', status: 'error', error: `Unsupported_Action: ${actionType}` }];
          }

          results.push(...actionResults);
        }
      } catch (err: unknown) {
        const error = err as Error;
        results.push({ action: 'parser_failure', status: 'error', error: error.message });
      }
    }

    return NextResponse.json({
      response: 'Actions_Processed',
      action_results: results,
    } as NeuralProcessorResponse);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[NEURAL_PROCESSOR] Fatal Failure:', err.message);
    return NextResponse.json({ error: 'Internal server failure' }, { status: 500 });
  }
}
