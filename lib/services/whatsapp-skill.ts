/**
 * WhatsApp Message Skill & Constraints
 * Este archivo sirve como referencia técnica para el Agente y los Handlers
 */

export const WHATSAPP_CONSTRAINTS = {
  TEXT: {
    MAX_LENGTH: 4096,
  },
  BUTTONS: {
    MAX_COUNT: 3,
    TITLE_MAX_LENGTH: 20,
    ID_MAX_LENGTH: 128,
  },
  LISTS: {
    BUTTON_TEXT_MAX_LENGTH: 20,
    SECTION_TITLE_MAX_LENGTH: 24,
    ROW_TITLE_MAX_LENGTH: 24,
    ROW_DESC_MAX_LENGTH: 72,
    MAX_SECTIONS: 10,
    MAX_TOTAL_ROWS: 10,
  },
  MEDIA: {
    CAPTION_MAX_LENGTH: 1024,
    FILENAME_MAX_LENGTH: 255,
  }
};

/**
 * Skill: Decide el mejor formato de mensaje basado en la cantidad de acciones
 */
export function getRecommendedMessageType(actionCount: number): 'text' | 'button' | 'list' {
  if (actionCount === 0) return 'text';
  if (actionCount <= 3) return 'button';
  return 'list';
}

/**
 * Skill: Limpia y valida textos para cumplir con WhatsApp
 */
export function sanitizeWhatsAppText(text: string, limit: number): string {
  if (!text) return '';
  const cleanText = text.trim();
  return cleanText.length > limit ? cleanText.substring(0, limit - 3) + '...' : cleanText;
}

/**
 * Guía de "Tone of Voice" para MTZ Consultores
 */
export const MTZ_WHATSAPP_STYLE = {
  EMOJIS: true,
  FORMALITY: 'profesional_cercano',
  STRUCTURE: 'directo_y_espaciado',
  BRANDING: 'MTZ Consultores 🇨🇱',
};
