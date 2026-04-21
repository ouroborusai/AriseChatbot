import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type {
  NeuralProcessorRequest,
  NeuralProcessorResponse,
  NeuralAction,
} from '@/types/api';

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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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
      await new Promise(resolve => setTimeout(resolve, 1000));
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

    // 2. Buscar bloques de acción [[ ... ]]
    const actionBlocks = message.content.match(/\[\[([\s\S]*?)\]\]/g);

    if (!actionBlocks || actionBlocks.length === 0) {
      return NextResponse.json({ status: 'no_actions_detected' });
    }

    const results: NeuralAction[] = [];

    // 3. Ejecutar cada bloque detectado
    for (const block of actionBlocks) {
      try {
        let cleanJson = block.replace('[[', '').replace(']]', '').trim();

        // Fix: Unescape quotes from database storage (\" -> ")
        cleanJson = cleanJson.replace(/\\"/g, '"');

        // Fix: Remove escaped newlines that break JSON
        cleanJson = cleanJson.replace(/\\n/g, '').replace(/\\r/g, '');

        // Fix: Normalize multiple spaces to single space
        cleanJson = cleanJson.replace(/\s+/g, ' ');

        console.log(`[NEURAL_PROCESSOR] Raw block: ${block}`);
        console.log(`[NEURAL_PROCESSOR] Clean JSON: ${cleanJson}`);

        const actionData = JSON.parse(cleanJson);

        console.log(`[NEURAL_PROCESSOR] Processing action: ${actionData.action}`);

        // ─────────────────────────────────────────────────────────────────────
        // ACCIÓN: INVENTORY_CREATE
        // ─────────────────────────────────────────────────────────────────────
        if (actionData.action === 'inventory_create' && actionData.name) {
          const sku = actionData.sku || `SKU-${Date.now()}`;
          const currentStock = parseFloat(actionData.stock) || 0;

          const { data: newItem, error: insertError } = await supabase
            .from('inventory_items')
            .insert({
              company_id: companyId,
              name: actionData.name,
              sku,
              current_stock: currentStock,
              category: actionData.category || 'Varios',
              unit: actionData.unit || 'uds',
            })
            .select('id')
            .single();

          if (insertError) {
            results.push({
              action: 'inventory_create',
              status: 'failed',
              error: insertError.message,
            });
            continue;
          }

          if (newItem && currentStock > 0) {
            await supabase.from('inventory_transactions').insert({
              company_id: companyId,
              item_id: newItem.id,
              quantity: currentStock,
              type: 'in',
            });
          }

          results.push({
            action: 'inventory_create',
            status: 'success',
            name: actionData.name,
            sku,
          });
        }

        // ─────────────────────────────────────────────────────────────────────
        // ACCIÓN: INVENTORY_ADD / INVENTORY_REMOVE
        // ─────────────────────────────────────────────────────────────────────
        if (
          (actionData.action === 'inventory_add' ||
            actionData.action === 'inventory_remove') &&
          actionData.sku
        ) {
          const { data: item } = await supabase
            .from('inventory_items')
            .select('id')
            .ilike('sku', actionData.sku)
            .eq('company_id', companyId)
            .maybeSingle();

          if (!item) {
            results.push({
              action: actionData.action,
              status: 'item_not_found',
              sku: actionData.sku,
            });
            continue;
          }

          const quantity = parseFloat(actionData.quantity) || 1;
          const type = actionData.action === 'inventory_add' ? 'in' : 'out';

          const { error: transactionError } = await supabase
            .from('inventory_transactions')
            .insert({
              company_id: companyId,
              item_id: item.id,
              quantity,
              type,
            });

          results.push({
            action: actionData.action,
            status: transactionError ? 'failed' : 'success',
            sku: actionData.sku,
            error: transactionError?.message,
          });
        }

        // ─────────────────────────────────────────────────────────────────────
        // ACCIÓN: TASK_CREATE
        // ─────────────────────────────────────────────────────────────────────
        if (actionData.action === 'task_create' && actionData.title) {
          await supabase.from('service_requests').insert({
            company_id: companyId,
            title: actionData.title,
            description: actionData.description || 'Creado vía Neural AI',
            status: 'pending',
          });

          results.push({
            action: 'task_create',
            status: 'success',
          });
        }

        // ─────────────────────────────────────────────────────────────────────
        // ACCIÓN: PDF_GENERATE
        // ─────────────────────────────────────────────────────────────────────
        if (actionData.action === 'pdf_generate') {
          const { data: msgInfo } = await supabase
            .from('messages')
            .select('conversation_id')
            .eq('id', messageId)
            .single();

          if (msgInfo) {
            const { data: contactInfo } = await supabase
              .from('conversations')
              .select('contacts(phone)')
              .eq('id', msgInfo.conversation_id)
              .single();

            const phone = (contactInfo as unknown as { contacts?: { phone: string } })?.contacts?.phone;

            if (phone) {
              console.log(
                `[NEURAL_PROCESSOR] Triggering PDF generation for ${phone}`
              );

              const appUrl = process.env.APP_URL || 'http://localhost:3000';

              fetch(`${appUrl}/api/pdf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  targetPhone: phone,
                  whatsappToken: process.env.WHATSAPP_ACCESS_TOKEN,
                  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
                  reportType: actionData.type || 'balance',
                }),
              }).catch(err =>
                console.error('[NEURAL_PROCESSOR] PDF API Call Failed:', err)
              );

              results.push({
                action: 'pdf_generate',
                status: 'triggered',
                to: phone,
              });
            }
          }
        }
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
