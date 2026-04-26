/**
 * ARISE WHATSAPP BUILDERS Diamond v10.1
 * Utilidades para construir mensajes de WhatsApp
 */

import type {
  TextMessage,
  ButtonInteractive,
  ListInteractive,
  DocumentMessage,
  InteractiveButton,
} from './types';
import { WHATSAPP_LIMITS } from './constants';

/**
 * Construye un mensaje de texto válido para WhatsApp
 */
export function buildTextMessage(phone: string, text: string): TextMessage {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'text',
    text: {
      body: text.substring(0, WHATSAPP_LIMITS.MAX_TEXT_LENGTH),
    },
  };
}

/**
 * Construye un mensaje con botones interactivos (máx 3 botones)
 */
export function buildButtonMessage(
  phone: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>,
  footer?: string
): ButtonInteractive {
  const validButtons = buttons
    .slice(0, WHATSAPP_LIMITS.MAX_BUTTONS)
    .map((btn): InteractiveButton => ({
      type: 'reply' as const,
      reply: {
        id: btn.id,
        title: btn.title.substring(0, WHATSAPP_LIMITS.MAX_BUTTON_TITLE_LENGTH),
      },
    }));

  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: bodyText.substring(0, WHATSAPP_LIMITS.MAX_TEXT_BODY_LENGTH),
      },
      ...(footer && {
        footer: {
          text: footer.substring(0, WHATSAPP_LIMITS.MAX_FOOTER_LENGTH),
        },
      }),
      action: {
        buttons: validButtons,
      },
    },
  };
}

/**
 * Construye un mensaje con lista interactiva (hasta 10 secciones, 10 rows c/u)
 */
export function buildListMessage(
  phone: string,
  bodyText: string,
  sections: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>,
  button: string,
  header?: string,
  footer?: string
): ListInteractive {
  const validSections = sections
    .slice(0, WHATSAPP_LIMITS.MAX_LIST_SECTIONS)
    .map(section => ({
      title: section.title.substring(0, WHATSAPP_LIMITS.MAX_SECTION_TITLE_LENGTH),
      rows: section.rows
        .slice(0, WHATSAPP_LIMITS.MAX_ROWS_PER_SECTION)
        .map(row => ({
          id: row.id,
          title: row.title.substring(0, WHATSAPP_LIMITS.MAX_ROW_TITLE_LENGTH),
          ...(row.description && {
            description: row.description.substring(0, WHATSAPP_LIMITS.MAX_ROW_DESCRIPTION_LENGTH),
          }),
        })),
    }));

  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'interactive',
    interactive: {
      type: 'list',
      ...(header && {
        header: {
          type: 'text' as const,
          text: header.substring(0, WHATSAPP_LIMITS.MAX_HEADER_TEXT_LENGTH),
        },
      }),
      body: {
        text: bodyText.substring(0, WHATSAPP_LIMITS.MAX_TEXT_BODY_LENGTH),
      },
      ...(footer && {
        footer: {
          text: footer.substring(0, WHATSAPP_LIMITS.MAX_FOOTER_LENGTH),
        },
      }),
      action: {
        button: button.substring(0, WHATSAPP_LIMITS.MAX_LIST_BUTTON_TEXT),
        sections: validSections,
      },
    },
  };
}

/**
 * Construye un mensaje de documento (PDF, etc) para WhatsApp
 */
export function buildDocumentMessage(
  phone: string,
  link: string,
  filename?: string,
  caption?: string
): DocumentMessage {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'document',
    document: {
      link,
      filename,
      caption,
    },
  };
}
