import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Necesario para bypass de RLS en ejecución de sistema
);

/**
 * NEURAL PROCESSOR v7.9
 * Procesa bloques de acción [[ { "action": "..." } ]] en mensajes de la IA.
 */
export async function POST(req: Request) {
  try {
    const { messageId, companyId } = await req.json();

    if (!messageId || !companyId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Obtener el contenido del mensaje
    const { data: message, error: fError } = await supabase
      .from('messages')
      .select('content')
      .eq('id', messageId)
      .single();

    if (fError || !message) throw new Error('Message not found');

    const content = message.content;

    // 2. Buscar bloques de acción [[ ... ]]
    const actionBlocks = content.match(/\[\[([\s\S]*?)\]\]/g);
    if (!actionBlocks) {
      return NextResponse.json({ status: 'no_actions_detected' });
    }

    const results = [];

    // 3. Ejecutar cada bloque detectado
    for (const block of actionBlocks) {
      try {
        const cleanJson = block.replace('[[', '').replace(']]', '').trim();
        const actionData = JSON.parse(cleanJson);

        console.log(`[NEURAL_PROCESSOR] Processing action: ${actionData.action}`);

        // --- ACCIÓN: INVENTORY_ADD / INVENTORY_REMOVE ---
        if ((actionData.action === 'inventory_add' || actionData.action === 'inventory_remove') && actionData.sku) {
          // Buscar el ítem por SKU (sensible a la empresa)
          const { data: item } = await supabase
            .from('inventory_items')
            .select('id')
            .ilike('sku', actionData.sku)
            .eq('company_id', companyId)
            .maybeSingle();

          if (item) {
            const quantity = parseFloat(actionData.quantity) || 1;
            const type = actionData.action === 'inventory_add' ? 'in' : 'out';

            const { error: tError } = await supabase
              .from('inventory_transactions')
              .insert({
                company_id: companyId,
                item_id: item.id,
                quantity: quantity,
                type: type
              });

            if (!tError) {
              results.push({ action: actionData.action, status: 'success', sku: actionData.sku });
            } else {
              results.push({ action: actionData.action, status: 'failed', error: tError.message });
            }
          } else {
             results.push({ action: actionData.action, status: 'item_not_found', sku: actionData.sku });
          }
        }

        // --- ACCIÓN: TASK_CREATE ---
        if (actionData.action === 'task_create' && actionData.title) {
           await supabase.from('service_requests').insert({
             company_id: companyId,
             title: actionData.title,
             description: actionData.description || 'Creado vía Neural AI',
             status: 'pending'
           });
           results.push({ action: 'task_create', status: 'success' });
        }

        // --- ACCIÓN: PDF_GENERATE ---
        if (actionData.action === 'pdf_generate') {
          // Re-fetch del mensaje para obtener el remitente
          const { data: msgInfo } = await supabase.from('messages').select('conversation_id').eq('id', messageId).single();
          if (msgInfo) {
            const { data: contactInfo } = await supabase.from('conversations').select('contacts(phone)').eq('id', msgInfo.conversation_id).single() as any;

            if (contactInfo?.contacts?.phone) {
              console.log(`[NEURAL_PROCESSOR] Triggering PDF generation for ${contactInfo.contacts.phone}`);
              
              // Usar URL local para el worker
              await fetch('http://localhost:3000/api/pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  targetPhone: contactInfo.contacts.phone,
                  whatsappToken: process.env.WHATSAPP_ACCESS_TOKEN,
                  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
                  reportType: actionData.type || 'balance'
                })
              }).catch(e => console.error('[NEURAL_PROCESSOR] PDF API Call Failed:', e));
              
              results.push({ action: 'pdf_generate', status: 'triggered', to: contactInfo.contacts.phone });
            }
          }
        }

      } catch (parseError) {
        console.error('[NEURAL_PROCESSOR] JSON Parse Error:', parseError);
      }
    }

    return NextResponse.json({ status: 'completed', results });

  } catch (error: any) {
    console.error('[NEURAL_PROCESSOR] Critical Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
