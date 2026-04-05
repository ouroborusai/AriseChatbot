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
      let detail = raw;
      try {
        const j = JSON.parse(raw) as { error?: { message?: string; code?: number; error_subcode?: number } };
        if (j?.error) {
          detail = `${j.error.message || raw} (code=${j.error.code}, subcode=${j.error.error_subcode ?? 'n/a'})`;
        }
      } catch {
        /* raw no es JSON */
      }
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
