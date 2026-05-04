/**
 * ARISE NEURAL ENGINE - EXPORTS Diamond v12.0
 * Punto único de importación para el motor neural
 */

// Core
export { generateGeminiResponse } from './gemini';
export { sendWhatsAppMessage, enrichText } from './whatsapp';

// Action Handlers
export { handleInventoryAction } from './actions/inventory';
export { handleTaskAction } from './actions/task';
export { handlePdfAction } from './actions/pdf';

// Constants
export {
  GEMINI_MODEL,
  SUPER_ADMIN_COMPANY_ID,
  ACTION_PREFIXES,
  WHATSAPP_LIMITS,
  ICON_MAP,
  TIMEOUTS,
  SYSTEM_STRINGS,
} from './constants';

// Types
export type { GeminiResponse, GeminiContext, NeuralProcessorRequest, NeuralProcessorResponse, NeuralActionResult } from '@/lib/whatsapp/types';
