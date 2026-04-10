/**
 * WhatsApp API Service
 * Maneja todas las interacciones con WhatsApp Cloud API
 */

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
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_VERIFY_TOKEN'
  ]);
  
  if (missing.length > 0) {
    console.warn('[WhatsApp] Algunas variables faltantes. El sistema puede no funcionar correctamente.');
  }
}

function parseWhatsAppGraphError(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as {
      error?: {
        message?: string;
        code?: number;
        error_subcode?: number;
      };
    };
    if (parsed?.error) {
      const code = parsed.error.code ?? 'n/a';
      const subcode = parsed.error.error_subcode ?? 'n/a';
      const base = parsed.error.message || raw;
      if (code === 190 && subcode === 463) {
        return `${base} (code=${code}, subcode=${subcode}) - Token expirado. Actualiza WHATSAPP_ACCESS_TOKEN en .env.local.`;
      }
      return `${base} (code=${code}, subcode=${subcode})`;
    }
  } catch {
    // raw no es JSON
  }
  return raw;
}

// Validar al cargar el módulo
validateWhatsAppConfig();

export async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<WhatsAppSendResponse> {
  try {
    console.log('[WhatsApp] 📤 Iniciando envío de mensaje...');
    
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    
    // Validar credenciales ANTES de usarlas
    if (!accessToken) {
      throw new Error('[WhatsApp] WHATSAPP_ACCESS_TOKEN no configurado en .env.local');
    }
    if (!phoneNumberId) {
      throw new Error('[WhatsApp] WHATSAPP_PHONE_NUMBER_ID no configurado en .env.local');
    }
    
    const to = formatWhatsAppRecipient(phoneNumber);
    console.log('[WhatsApp] Número destino:', to);

    if (!to || to.length < 8) {
      throw new Error(`Número destino inválido para WhatsApp API: "${phoneNumber}" → "${to}"`);
    }

    const bodyText = message.length > 4096 ? message.slice(0, 4093) + '...' : message;
    console.log('[WhatsApp] Tamaño del mensaje:', bodyText.length, 'chars');

    const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
    console.log('[WhatsApp] URL:', url.replace(phoneNumberId, 'REDACTED'));

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { preview_url: false, body: bodyText },
    };
    console.log('[WhatsApp] Payload:', JSON.stringify(payload));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('[WhatsApp] Status HTTP:', response.status);

    const raw = await response.text();
    if (!response.ok) {
      const detail = parseWhatsAppGraphError(raw);
      console.error('[WhatsApp] ❌ Graph API error:', response.status, detail);
      throw new Error(`WhatsApp send failed: ${detail}`);
    }

    console.log('[WhatsApp] ✅ Respuesta correcta de Meta');
    try {
      return JSON.parse(raw) as WhatsAppSendResponse;
    } catch {
      return { raw };
    }
  } catch (error) {
    console.error('[WhatsApp] ❌ Error en sendWhatsAppMessage:', error);
    if (error instanceof Error) {
      console.error('[WhatsApp] Message:', error.message);
    }
    throw error;
  }
}

export interface WhatsAppInteractiveButton {
  id: string;
  title: string;
}

export async function sendWhatsAppInteractiveButtons(
  phoneNumber: string,
  bodyText: string,
  buttons: WhatsAppInteractiveButton[]
): Promise<WhatsAppSendResponse> {
  try {
    console.log('[WhatsApp] 📤 Iniciando envío de buttons interactivos...');

    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken) {
      throw new Error('[WhatsApp] WHATSAPP_ACCESS_TOKEN no configurado en .env.local');
    }
    if (!phoneNumberId) {
      throw new Error('[WhatsApp] WHATSAPP_PHONE_NUMBER_ID no configurado en .env.local');
    }

    const to = formatWhatsAppRecipient(phoneNumber);
    if (!to || to.length < 8) {
      throw new Error(`Número destino inválido para WhatsApp API: "${phoneNumber}" → "${to}"`);
    }

    const validButtons = buttons.slice(0, 3).map((button) => ({
      type: 'reply' as const,
      reply: {
        id: button.id,
        title: button.title,
      },
    }));

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: { buttons: validButtons },
      },
    };

    console.log('[WhatsApp] Payload interactivo:', JSON.stringify(payload));

    const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const raw = await response.text();
    if (!response.ok) {
      const detail = parseWhatsAppGraphError(raw);
      console.error('[WhatsApp] ❌ Graph API error:', response.status, detail);
      throw new Error(`WhatsApp send failed: ${detail}`);
    }

    console.log('[WhatsApp] ✅ Buttons interactivos enviados');
    try {
      return JSON.parse(raw) as WhatsAppSendResponse;
    } catch {
      return { raw };
    }
  } catch (error) {
    console.error('[WhatsApp] ❌ Error en sendWhatsAppInteractiveButtons:', error);
    if (error instanceof Error) {
      console.error('[WhatsApp] Message:', error.message);
    }
    throw error;
  }
}

export async function sendWhatsAppDocument(
  phoneNumber: string,
  documentUrl: string,
  filename: string,
  caption?: string
): Promise<WhatsAppSendResponse> {
  try {
    console.log('[WhatsApp] 📤 Iniciando envío de documento...');

    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken) {
      throw new Error('[WhatsApp] WHATSAPP_ACCESS_TOKEN no configurado en .env.local');
    }
    if (!phoneNumberId) {
      throw new Error('[WhatsApp] WHATSAPP_PHONE_NUMBER_ID no configurado en .env.local');
    }

    const to = formatWhatsAppRecipient(phoneNumber);
    if (!to || to.length < 8) {
      throw new Error(`Número destino inválido para WhatsApp API: "${phoneNumber}" → "${to}"`);
    }

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'document',
      document: {
        link: documentUrl,
        filename,
        caption: caption || 'Documento solicitado',
      },
    };

    console.log('[WhatsApp] Payload documento:', JSON.stringify(payload));

    const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const raw = await response.text();
    if (!response.ok) {
      const detail = parseWhatsAppGraphError(raw);
      console.error('[WhatsApp] ❌ Graph API error:', response.status, detail);
      throw new Error(`WhatsApp send failed: ${detail}`);
    }

    console.log('[WhatsApp] ✅ Documento enviado');
    try {
      return JSON.parse(raw) as WhatsAppSendResponse;
    } catch {
      return { raw };
    }
  } catch (error) {
    console.error('[WhatsApp] ❌ Error en sendWhatsAppDocument:', error);
    if (error instanceof Error) {
      console.error('[WhatsApp] Message:', error.message);
    }
    throw error;
  }
}

export async function sendWhatsAppImage(
  phoneNumber: string,
  imageUrl: string,
  caption?: string
): Promise<WhatsAppSendResponse> {
  try {
    console.log('[WhatsApp] 📤 Iniciando envío de imagen...');

    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken) {
      throw new Error('[WhatsApp] WHATSAPP_ACCESS_TOKEN no configurado en .env.local');
    }
    if (!phoneNumberId) {
      throw new Error('[WhatsApp] WHATSAPP_PHONE_NUMBER_ID no configurado en .env.local');
    }

    const to = formatWhatsAppRecipient(phoneNumber);
    if (!to || to.length < 8) {
      throw new Error(`Número destino inválido para WhatsApp API: "${phoneNumber}" → "${to}"`);
    }

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: {
        link: imageUrl,
        caption: caption || 'Imagen enviada desde MTZ',
      },
    };

    console.log('[WhatsApp] Payload imagen:', JSON.stringify(payload));

    const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const raw = await response.text();
    if (!response.ok) {
      const detail = parseWhatsAppGraphError(raw);
      console.error('[WhatsApp] ❌ Graph API error:', response.status, detail);
      throw new Error(`WhatsApp send failed: ${detail}`);
    }

    console.log('[WhatsApp] ✅ Imagen enviada');
    try {
      return JSON.parse(raw) as WhatsAppSendResponse;
    } catch {
      return { raw };
    }
  } catch (error) {
    console.error('[WhatsApp] ❌ Error en sendWhatsAppImage:', error);
    if (error instanceof Error) {
      console.error('[WhatsApp] Message:', error.message);
    }
    throw error;
  }
}

export interface WhatsAppListSection {
  title: string;
  rows: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}

export interface WhatsAppListMessage {
  header?: string;
  body: string;
  footer?: string;
  buttonText: string;
  sections: WhatsAppListSection[];
}

export async function sendWhatsAppListMessage(
  phoneNumber: string,
  listMessage: WhatsAppListMessage
): Promise<WhatsAppSendResponse> {
  try {
    console.log('[WhatsApp] 📤 Iniciando envío de mensaje de lista...');

    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken) {
      throw new Error('[WhatsApp] WHATSAPP_ACCESS_TOKEN no configurado en .env.local');
    }
    if (!phoneNumberId) {
      throw new Error('[WhatsApp] WHATSAPP_PHONE_NUMBER_ID no configurado en .env.local');
    }

    const to = formatWhatsAppRecipient(phoneNumber);
    if (!to || to.length < 8) {
      throw new Error(`Número destino inválido para WhatsApp API: "${phoneNumber}" → "${to}"`);
    }

    const sections = listMessage.sections.slice(0, 10).map(section => ({
      title: section.title,
      rows: section.rows.slice(0, 10).map(row => ({
        id: row.id,
        title: row.title.substring(0, 24),
        description: row.description?.substring(0, 72),
      })),
    }));

    const interactive: any = {
      type: 'list',
      body: { text: listMessage.body },
      action: {
        button: listMessage.buttonText.substring(0, 20),
      },
    };

    if (sections.length > 0) {
      interactive.action.sections = sections;
    }

    if (listMessage.header) {
      interactive.header = { type: 'text', text: listMessage.header.substring(0, 60) };
    }
    if (listMessage.footer) {
      interactive.footer = { text: listMessage.footer.substring(0, 60) };
    }

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive,
    };

    console.log('[WhatsApp] Payload lista:', JSON.stringify(payload));

    const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const raw = await response.text();
    if (!response.ok) {
      const detail = parseWhatsAppGraphError(raw);
      console.error('[WhatsApp] ❌ Graph API error:', response.status, detail);
      throw new Error(`WhatsApp send failed: ${detail}`);
    }

    console.log('[WhatsApp] ✅ Mensaje de lista enviado');
    try {
      return JSON.parse(raw) as WhatsAppSendResponse;
    } catch {
      return { raw };
    }
  } catch (error) {
    console.error('[WhatsApp] ❌ Error en sendWhatsAppListMessage:', error);
    if (error instanceof Error) {
      console.error('[WhatsApp] Message:', error.message);
    }
    throw error;
  }
}
