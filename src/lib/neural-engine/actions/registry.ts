import { SupabaseClient } from '@supabase/supabase-js';
import { NeuralActionResult, NeuralActionPayload } from '@/lib/whatsapp/types';
import { handleInventoryAction } from './inventory';
import { handleTaskAction } from './task';
import { handlePdfAction } from './pdf';
import { handleDirectoryAction } from './directory';
import { handleCreditAction } from './credit';
import { handlePaymentAction } from './payment';
import { handleOfferMenusAction } from './menus';
import { handleEmployeeAction } from './employee';

/**
 * ARISE ACTION REGISTRY v12.0
 * Desacoplamiento estratégico de manejadores de acciones neurales.
 */

type ActionHandler = (
  supabase: SupabaseClient,
  actionData: NeuralActionPayload,
  companyId: string,
  messageId: string
) => Promise<NeuralActionResult[]>;

export const ACTION_REGISTRY: Record<string, ActionHandler> = {
  // Inventory
  'inventory_create': handleInventoryAction,
  'inventory_add': handleInventoryAction,
  'inventory_remove': handleInventoryAction,
  'inventory_log': handleInventoryAction,
  'inventory_scan': handleInventoryAction,

  // Tasks & Reminders
  'task_create': handleTaskAction,
  'reminder_create': handleTaskAction,
  'reminder_set': handleTaskAction,

  // Employees
  'employee_register': handleEmployeeAction,
  'employee_update': handleEmployeeAction,

  // PDF
  'pdf_generate': handlePdfAction,
  'pdf_send': handlePdfAction,

  // Directory
  'directory_search': handleDirectoryAction,
  'register_client': handleDirectoryAction,

  // Financial
  'credit_limit_set': handleCreditAction,
  'payment_link_generate': handlePaymentAction,
  'payment_link': handlePaymentAction,

  // Menus
  'offer_menus': handleOfferMenusAction,
};

/**
 * Resuelve el manejador apropiado basado en el tipo de acción.
 * Soporta prefijos para mayor flexibilidad.
 */
export function resolveHandler(actionType: string): ActionHandler | null {
  // Búsqueda directa
  if (ACTION_REGISTRY[actionType]) {
    return ACTION_REGISTRY[actionType];
  }

  // Búsqueda por prefijo
  const prefixMatch = Object.keys(ACTION_REGISTRY).find(key => 
    actionType.startsWith(key.split('_')[0] + '_')
  );

  if (prefixMatch) {
    return ACTION_REGISTRY[prefixMatch];
  }

  return null;
}
