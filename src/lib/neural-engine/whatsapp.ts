// src/lib/neural-engine/whatsapp.ts (v10.4 Platinum - Certificado por NotebookLM)
import { createClient } from '@supabase/supabase-js';
import { ICON_MAP, WHATSAPP_LIMITS, SYSTEM_STRINGS } from '@/lib/neural-engine/constants';
import { SuggestedOption } from '@/types/api';
import { logEvent } from '@/lib/webhook/utils';

function createSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.ARISE_MASTER_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!; 
    return createClient(supabaseUrl, supabaseKey);
}

export function enrichText(text: string): string {
    const hasEmoji = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u.test(text);
    if (hasEmoji) return text;
    const key = Object.keys(ICON_MAP).find(k => text.toLowerCase().includes(k));
    return key ? `${ICON_MAP[key]} ${text}` : `🔹 ${text}`;
}

export async function sendWhatsAppMessage(params: {
    to: string;
    text?: string;
    options?: (string | { id: string; title: string; description?: string })[];
    template?: { name: string; language: string; variables: string[]; };
    flow?: { id: string; cta: string; token: string; screen: string; data?: any };
    catalog?: { catalogId: string; body: string; footer?: string };
    phoneNumberId: string;
    whatsappToken: string;
    companyId: string;
}) {
    const { to, text, options, template, flow, catalog, phoneNumberId, whatsappToken, companyId } = params;
    let payload: any = { messaging_product: 'whatsapp', to };

    if (template) {
        payload.type = 'template';
        payload.template = {
            name: template.name,
            language: { code: template.language },
            components: [{
                type: 'body',
                parameters: template.variables.map(v => ({ type: 'text', text: v }))
            }]
        };
    } else if (options && options.length > 0) {
        payload.type = 'interactive';
        if (options.length <= 3 && options.every(o => typeof o === 'string' || !o.description)) {
            payload.interactive = {
                type: 'button',
                body: { text: text || 'Selecciona una opción' },
                action: {
                    buttons: options.map((opt, i) => ({
                        type: 'reply',
                        reply: {
                            id: typeof opt === 'string' ? `btn_${i}` : opt.id,
                            title: (typeof opt === 'string' ? opt : opt.title).substring(0, 20)
                        }
                    }))
                }
            };
        } else {
            payload.interactive = {
                type: 'list',
                header: { type: 'text', text: 'Opciones LOOP 🟢' },
                body: { text: text || 'Selecciona una opción de la lista' },
                action: {
                    button: 'Ver Opciones',
                    sections: [{
                        title: 'Principales',
                        rows: options.map((opt, i) => ({
                            id: typeof opt === 'string' ? `item_${i}` : opt.id,
                            title: (typeof opt === 'string' ? opt : opt.title).substring(0, 24),
                            description: typeof opt === 'string' ? undefined : opt.description?.substring(0, 72)
                        }))
                    }]
                }
            };
        }
    } else if (flow) {
        payload.type = 'interactive';
        payload.interactive = {
            type: 'flow',
            body: { text: text || 'Formulario Interactivo' },
            action: {
                name: 'flow',
                parameters: {
                    flow_token: flow.token,
                    flow_id: flow.id,
                    flow_cta: flow.cta,
                    flow_action: 'navigate',
                    flow_action_payload: { screen: flow.screen, data: flow.data }
                }
            }
        };
    } else if (catalog) {
        payload.type = 'interactive';
        payload.interactive = {
            type: 'catalog_message',
            body: { text: catalog.body },
            footer: catalog.footer ? { text: catalog.footer } : undefined,
            action: { name: 'catalog_message' }
        };
    } else if (text) {
        payload.type = 'text';
        payload.text = { body: text };
    }

    const response = await fetch(`https://graph.facebook.com/v23.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
        await logEvent({ 
            companyId, 
            action: 'WH_SEND_ERROR', 
            details: { error: result, payload } 
        });
        throw new Error(result.error?.message || 'Error sending WhatsApp message');
    }

    return result;
}

export async function generateAndSendAIResponse(params: {
    content: string;
    companyId: string;
    contactId: string;
    conversationId: string;
    sender: string;
    phoneNumberId: string;
    whatsappToken: string;
}) {
    const { content, companyId, contactId, conversationId, sender, phoneNumberId, whatsappToken } = params;

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/neural-processor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: content,
            company_id: companyId,
            contact_id: contactId,
            conversation_id: conversationId,
            phone_number: sender
        })
    });

    const { response: aiText } = await response.json();

    return sendWhatsAppMessage({
        to: sender,
        text: aiText,
        phoneNumberId,
        whatsappToken,
        companyId
    });
}
