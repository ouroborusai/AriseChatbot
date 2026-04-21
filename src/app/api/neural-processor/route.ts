import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type {
  NeuralProcessorRequest,
  NeuralProcessorResponse,
  NeuralAction,
} from '@/types/api';
import { requireAuth, verifyCompanyAccess } from '@/lib/api-auth';

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
            .select()
            .single();

          if (!insertError && newItem) {
            await supabase.from('audit_logs').insert({
              company_id: companyId,
              action: 'NEURAL_INVENTORY_CREATE',
              table_name: 'inventory_items',
              record_id: newItem.id,
              new_data: actionData
            });
          }

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
        // ACCIÓN: INVENTORY_SCAN (Consulta de Stock con Feedback)
        // ─────────────────────────────────────────────────────────────────────
        if (actionData.action === 'inventory_scan' && (actionData.sku || actionData.name)) {
          const { data: items } = await supabase
            .from('inventory_items')
            .select('id, name, sku, current_stock')
            .eq('company_id', companyId)
            .or(`sku.ilike.${actionData.sku || 'none'},name.ilike.%${actionData.name || 'none'}%`)
            .limit(3);

          // Obtener datos para WhatsApp Feedback
          const { data: msgInfo } = await supabase.from('messages').select('conversation_id').eq('id', messageId).single();
          const { data: conv } = await supabase.from('conversations').select('contacts(phone)').eq('id', msgInfo?.conversation_id).single();
          const { data: company } = await supabase.from('companies').select('settings').eq('id', companyId).single();
          
          const phone = (conv as any)?.contacts?.phone;
          const token = company?.settings?.whatsapp?.access_token || process.env.WHATSAPP_ACCESS_TOKEN;
          const phoneId = company?.settings?.whatsapp?.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID;

          if (items && items.length > 0) {
            const feedback = `🔍 *Consulta de Stock Arise*\n\n` + 
              items.map(i => `• *${i.name}*\n  SKU: ${i.sku}\n  Stock: ${i.current_stock} uds.`).join('\n\n');
            
            if (phone) {
              fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ messaging_product: 'whatsapp', to: phone, type: 'text', text: { body: feedback } })
              });
            }

            for (const item of items) {
              results.push({ action: 'inventory_scan', status: 'success', sku: item.sku, name: item.name });
              await supabase.from('audit_logs').insert({
                company_id: companyId, action: 'NEURAL_INVENTORY_SCAN', table_name: 'inventory_items',
                record_id: item.id, new_data: { query: actionData, found: item }
              });
            }
          } else if (phone) {
            fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ messaging_product: 'whatsapp', to: phone, type: 'text', text: { body: `❌ Arise: No hallamos productos para "${actionData.sku || actionData.name}".` } })
            });
          }
          continue;
        }

        // ─────────────────────────────────────────────────────────────────────
        // ACCIÓN: TASK_CREATE
        // ─────────────────────────────────────────────────────────────────────
        if (actionData.action === 'task_create' && actionData.title) {
          const { data: newTask } = await supabase.from('service_requests').insert({
            company_id: companyId,
            title: actionData.title,
            description: actionData.description || 'Creado vía Neural AI',
            status: 'pending',
          }).select().single();

          if (newTask) {
            await supabase.from('audit_logs').insert({
              company_id: companyId,
              action: 'NEURAL_TASK_CREATE',
              table_name: 'service_requests',
              record_id: newTask.id,
              new_data: actionData
            });
          }

          results.push({
            action: 'task_create',
            status: 'success',
          });
        }

        if (actionData.action === 'reminder_create' && actionData.content) {
          const { data: currentMsg } = await supabase.from('messages').select('conversation_id').eq('id', messageId).single();
          const { data: conv } = await supabase.from('conversations').select('contact_id').eq('id', currentMsg?.conversation_id).single();
          
          const { data: newReminder } = await supabase.from('reminders').insert({
            company_id: companyId,
            contact_id: conv?.contact_id,
            content: actionData.content,
            due_at: actionData.due_at || new Date(Date.now() + 86400000).toISOString(),
            status: 'active'
          }).select().single();

          if (newReminder) {
            await supabase.from('audit_logs').insert({
              company_id: companyId,
              action: 'NEURAL_REMINDER_CREATE',
              table_name: 'reminders',
              record_id: newReminder.id,
              new_data: actionData
            });
          }
          results.push({ action: 'reminder_create', status: 'success' });
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
                  companyId: companyId,
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
