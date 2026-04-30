/**
 * LOOP WHATSAPP MODULE Platinum v10.4
 * Exportaciones unificadas para el módulo de WhatsApp
 */

// Tipos
export * from './types';

// Constantes
export { WHATSAPP_LIMITS, TEMPLATES } from './constants';

// Builders
export {
  buildTextMessage,
  buildButtonMessage,
  buildListMessage,
  buildDocumentMessage,
  buildCatalogMessage,
  buildProductMessage,
  buildTemplateMessage,
} from './builders';
