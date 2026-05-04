/**
 * 🌊 FLOW DATA HANDLER v12.0 (Diamond Resilience)
 * Interceptor maestro de respuestas de WhatsApp Flows (nfm_reply).
 * Cero 'any': catch (error: unknown) con casteo explícito a Error.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { handleInventoryAction } from '../../neural-engine/actions/inventory';
import { handleEmployeeAction } from '../../neural-engine/actions/employee';
import { handleTaskAction } from '../../neural-engine/actions/task';
import { logEvent } from '../utils';

export async function handleFlowResponse(params: {
  supabase: SupabaseClient;
  responseJson: string;
  sender: string;
  companyId: string;
  messageId: string;
}): Promise<boolean> {
  const { supabase, responseJson, sender, companyId, messageId } = params;

  try {
    const data = typeof responseJson === 'string' ? JSON.parse(responseJson) : responseJson;
    
    await logEvent({ 
      companyId, 
      action: 'FLOW_RESPONSE_RECEIVED', 
      details: { sender, data } 
    });

    // 1. CASE: INVENTARIO (v12.0 Normalizado)
    const sku = data.product_sku || data.sku || data.SKU;
    const action = data.action_type || data.action || (data.quantity ? 'inventory_add' : null);
    const quantity = Number(data.quantity || data.current_stock || 0);

    if (action && sku) {
      await logEvent({ companyId, action: 'FLOW_TYPE_DETECTED', details: { type: 'INVENTORY', sku, action } });
      await handleInventoryAction(
        supabase,
        { 
          action: action === 'new' ? 'inventory_create' : 'inventory_add', 
          sku: sku, 
          name: data.product_name || data.name, 
          current_stock: quantity, 
          params: { type: (action === 'remove' || action === 'out') ? 'out' : 'in' } 
        },
        companyId, 
        messageId
      );
      return true;
    }

    // 2. CASE: EXPLORADOR DE SERVICIOS / CALIFICACIÓN LEAD
    if (data.report_type || data.product_id) {
      await logEvent({ companyId, action: 'FLOW_TYPE_DETECTED', details: { type: 'EXPLORER', product_id: data.product_id } });
      
      // Persistimos la metadata del lead en el contacto para uso del motor neural
      const { error: contactError } = await supabase
        .from('contacts')
        .update({ 
          metadata: { 
            last_explorer_payload: data,
            preferred_category: data.category,
            last_report_requested: data.report_type 
          } 
        })
        .eq('phone', sender)
        .eq('company_id', companyId);

      if (contactError) throw contactError;

      // Si pide PDF, activamos la bandera de reporte en la conversación
      if (data.report_type === 'PDF') {
        await supabase
          .from('conversations')
          .update({ 
            metadata: { 
              pending_action: 'GENERATE_REPORT',
              report_context: data 
            } 
          })
          .eq('contact_id', (await supabase.from('contacts').select('id').eq('phone', sender).eq('company_id', companyId).single()).data?.id)
          .eq('company_id', companyId);
      }

      return true;
    }

    // 3. CASE: RRHH / EMPLEADOS
    if (data.full_name && data.position) {
      await logEvent({ companyId, action: 'FLOW_TYPE_DETECTED', details: { type: 'EMPLOYEE' } });
      await handleEmployeeAction(
        supabase,
        { 
          action: 'employee_create', 
          full_name: data.full_name, 
          position: data.position, 
          contract_type: data.contract_type, 
          notes: data.notes 
        },
        companyId, 
        messageId
      );
      return true;
    }

    // 3. CASE: TAREAS / RECORDATORIOS
    if (data.task_title || data.reminder_text) {
      await logEvent({ companyId, action: 'FLOW_TYPE_DETECTED', details: { type: 'TASK' } });
      await handleTaskAction(
        supabase,
        { 
          action: 'task_create', 
          name: data.task_title || data.reminder_text, 
          params: { 
            priority: data.priority || 'medium', 
            due_date: data.due_date 
          } 
        },
        companyId, 
        messageId
      );
      return true;
    }

    await logEvent({ companyId, action: 'FLOW_TYPE_UNKNOWN', details: { data } });
    return false;

  } catch (error: unknown) {
    const err = error as Error;
    await logEvent({ 
      companyId, 
      action: 'FLOW_PROCESSING_ERROR', 
      details: { error: err.message, responseJson } 
    });
    return false;
  }
}
