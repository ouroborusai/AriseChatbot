/**
 * WhatsApp API Service
 * Maneja todas las interacciones con WhatsApp Cloud API
 */

export interface WhatsAppSendResponse {
  message_id?: string;
  raw?: string;
}

function formatWhatsAppRecipient(phone: string): string {
  let d = digitsOnly(phone);
  if (d.startsWith('0')) d = d.replace(/^0+/, '');
  return d;
}

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}

export async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<WhatsAppSendResponse> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = formatWhatsAppRecipient(phoneNumber);

  if (!to || to.length < 8) {
    throw new Error(`Número destino inválido para WhatsApp API: "${phoneNumber}" → "${to}"`);
  }

  const bodyText = message.length > 4096 ? message.slice(0, 4093) + '...' : message;

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { preview_url: false, body: bodyText },
      }),
    }
  );

  const raw = await response.text();
  if (!response.ok) {
    let detail = raw;
    try {
      const j = JSON.parse(raw) as { error?: { message?: string; code?: number; error_subcode?: number } };
      if (j?.error) {
        detail = `${j.error.message || raw} (code=${j.error.code}, subcode=${j.error.error_subcode ?? 'n/a'})`;
      }
    } catch {
      /* raw no es JSON */
    }
    console.error('[WhatsApp] Graph API send error:', response.status, detail);
    throw new Error(`WhatsApp send failed: ${detail}`);
  }

  try {
    return JSON.parse(raw) as WhatsAppSendResponse;
  } catch {
    return { raw };
  }
}

export function shouldReleaseDedupOnSendFailure(): boolean {
  return false;
}
