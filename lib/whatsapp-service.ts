import { WHATSAPP_CONSTRAINTS, sanitizeWhatsAppText } from './services/whatsapp-skill';
import { digitsOnly, validateEnvVars } from './utils';

export interface WhatsAppSendResponse {
  message_id?: string;
  raw?: string;
}

function formatWhatsAppRecipient(phone: string): string {
  let d = digitsOnly(phone);
  if (d.startsWith('0')) d = d.replace(/^0+/, '');
  return d;
}

/**
 * Valida credenciales de WhatsApp al inicio
 */
function validateWhatsAppConfig(): void {
  const missing = validateEnvVars([
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID'
  ]);
  
  if (missing.length > 0) {
    console.warn('[WhatsApp] Faltan variables:', missing.join(', '));
  }
}

// Validar al cargar
validateWhatsAppConfig();

async function callWhatsAppAPI(endpoint: string, payload: any): Promise<WhatsAppSendResponse> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const raw = await response.text();
  if (!response.ok) {
    console.error('[WhatsApp] API Error:', raw);
    throw new Error(`WhatsApp API error: ${raw}`);
  }

  return JSON.parse(raw);
}

export async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<WhatsAppSendResponse> {
  const to = formatWhatsAppRecipient(phoneNumber);
  const body = sanitizeWhatsAppText(message, WHATSAPP_CONSTRAINTS.TEXT.MAX_LENGTH);

  return callWhatsAppAPI('messages', {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body }
  });
}

export async function sendWhatsAppInteractiveButtons(
  phoneNumber: string,
  bodyText: string,
  buttons: { id: string, title: string }[]
): Promise<WhatsAppSendResponse> {
  const to = formatWhatsAppRecipient(phoneNumber);
  
  const validButtons = buttons.slice(0, WHATSAPP_CONSTRAINTS.BUTTONS.MAX_COUNT).map(btn => ({
    type: 'reply',
    reply: {
      id: btn.id,
      title: sanitizeWhatsAppText(btn.title, WHATSAPP_CONSTRAINTS.BUTTONS.TITLE_MAX_LENGTH)
    }
  }));

  return callWhatsAppAPI('messages', {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: { buttons: validButtons }
    }
  });
}

export async function sendWhatsAppListMessage(
  phoneNumber: string,
  list: { body: string, buttonText: string, sections: any[] }
): Promise<WhatsAppSendResponse> {
  const to = formatWhatsAppRecipient(phoneNumber);
  
  const sections = list.sections.slice(0, WHATSAPP_CONSTRAINTS.LISTS.MAX_SECTIONS).map(sec => ({
    title: sanitizeWhatsAppText(sec.title, WHATSAPP_CONSTRAINTS.LISTS.SECTION_TITLE_MAX_LENGTH),
    rows: sec.rows.slice(0, 10).map((row: any) => ({
      id: row.id,
      title: sanitizeWhatsAppText(row.title, WHATSAPP_CONSTRAINTS.LISTS.ROW_TITLE_MAX_LENGTH),
      description: row.description ? sanitizeWhatsAppText(row.description, WHATSAPP_CONSTRAINTS.LISTS.ROW_DESC_MAX_LENGTH) : undefined
    }))
  }));

  return callWhatsAppAPI('messages', {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: list.body },
      action: {
        button: sanitizeWhatsAppText(list.buttonText, WHATSAPP_CONSTRAINTS.LISTS.BUTTON_TEXT_MAX_LENGTH),
        sections
      }
    }
  });
}

export async function sendWhatsAppDocument(
  phoneNumber: string,
  url: string,
  filename: string,
  caption?: string
): Promise<WhatsAppSendResponse> {
  const to = formatWhatsAppRecipient(phoneNumber);
  return callWhatsAppAPI('messages', {
    messaging_product: 'whatsapp',
    to,
    type: 'document',
    document: {
      link: url,
      filename: sanitizeWhatsAppText(filename, WHATSAPP_CONSTRAINTS.MEDIA.FILENAME_MAX_LENGTH),
      caption: caption ? sanitizeWhatsAppText(caption, WHATSAPP_CONSTRAINTS.MEDIA.CAPTION_MAX_LENGTH) : undefined
    }
  });
}

/**
 * Skill: Envía una imagen por WhatsApp con validación de subtítulo
 */
export async function sendWhatsAppImage(
  phoneNumber: string,
  url: string,
  caption?: string
): Promise<WhatsAppSendResponse> {
  const to = formatWhatsAppRecipient(phoneNumber);
  return callWhatsAppAPI('messages', {
    messaging_product: 'whatsapp',
    to,
    type: 'image',
    image: {
      link: url,
      caption: caption ? sanitizeWhatsAppText(caption, WHATSAPP_CONSTRAINTS.MEDIA.CAPTION_MAX_LENGTH) : undefined
    }
  });
}
