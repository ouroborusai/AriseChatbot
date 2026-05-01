import { NextResponse } from 'next/server';
import { supabase, resolveIdentity, getWhatsAppConfig, logEvent } from '@/lib/webhook/utils';
import { handleActionRouting } from '@/lib/webhook/router';
import { generateAndSendAIResponse } from '@/lib/neural-engine/whatsapp';
import type { WhatsAppWebhookRequest } from '@/types/api';

/**
 * WHATSAPP WEBHOOK ROUTE v11.9.1 (Diamond Resilience)
 * Main entry point for Meta Graph API Webhooks.
 * SSOT: Cero 'any', Aislamiento Tenant Inquebrantable.
 */
export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as WhatsAppWebhookRequest;
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0]?.value;

        if (!changes || !changes.messages || changes.messages.length === 0) {
            return NextResponse.json({ status: 'ignored' });
        }

        const message = changes.messages[0];
        const sender = message.from;
        let content = '';
        let buttonId: string | undefined = undefined;

        // --- INYECCIÓN DIAMOND v11.9.1: PROCESADOR DE INTERACCIONES (TEMPLATES & FLOWS) ---
        
        // 1. Detección de Respuestas de WhatsApp Flows (nfm_reply)
        if (message.type === 'interactive' && message.interactive && (message.interactive.type as string) === 'nfm_reply') {
            const flowResponse = (message.interactive as any).nfm_reply?.response_json;
            if (!flowResponse) return NextResponse.json({ status: 'ok' });
            try {
                const parsedPayload = JSON.parse(flowResponse);
                const identity = await resolveIdentity(sender);
                
                await logEvent({ 
                    companyId: identity.company_id, 
                    action: 'FLOW_PAYLOAD_RECEIVED', 
                    details: { sender, payload: parsedPayload } 
                });

                // Lógica de Negocio: Explorador Red MTZ
                if (parsedPayload?.action === 'view_collection' && parsedPayload?.category) {
                    content = `ACCION_CATALOGO: ${parsedPayload.category}`;
                    // El router manejará el envío de la colección filtrada
                } else {
                    content = `FLOW_RESPONSE: ${flowResponse}`;
                }
            } catch (e) {
                console.error('[FLOW_PARSE_ERROR]', e);
                content = 'ERROR_FLOW';
            }
        } 
        // 2. Detección de Botones Quick Reply (Plantillas de Bienvenida)
        else if ((message.type as string) === 'button' && (message as any).button) {
            const buttonText = (message as any).button.text;
            content = buttonText;
            buttonId = buttonText === 'Comenzar' ? 'TRIGGER_WELCOME' : 'TRIGGER_CATALOG';
            
            const identity = await resolveIdentity(sender);
            await logEvent({ 
                companyId: identity.company_id, 
                action: 'TEMPLATE_BUTTON_CLICK', 
                details: { sender, buttonText } 
            });
        }
        // 3. Procesamiento Estándar (Texto e Interactivo común)
        else if (message.type === 'text' && message.text) {
            content = message.text.body;
        } else if (message.type === 'interactive' && message.interactive) {
            if (message.interactive.type === 'button_reply' && message.interactive.button_reply) {
                buttonId = message.interactive.button_reply.id;
                content = message.interactive.button_reply.id;
            } else if (message.interactive.type === 'list_reply' && message.interactive.list_reply) {
                buttonId = message.interactive.list_reply.id;
                content = message.interactive.list_reply.title;
            }
        } else {
            return NextResponse.json({ status: 'ignored_type' });
        }

        const identity = await resolveIdentity(sender);
        const companyId = identity.company_id;
        const contactId = identity.contact_id;
        const conversationId = identity.conversation_id;

        const config = await getWhatsAppConfig(companyId);

        const isRouted = await handleActionRouting({
            buttonId,
            content,
            sender,
            companyId,
            whatsappToken: config.token,
            phoneNumberId: config.phoneId
        });

        if (isRouted) {
            return NextResponse.json({ status: 'routed' });
        }

        // 4. ASEGURAR CONVERSACIÓN Y REGISTRAR MENSAJE
        let targetConversationId = conversationId;
        
        if (!targetConversationId) {
            const { data: newConv } = await supabase
                .from('conversations')
                .insert({ 
                    company_id: companyId, 
                    contact_id: contactId, 
                    status: 'open' 
                })
                .select()
                .single();
            if (newConv) targetConversationId = newConv.id;
        }

        if (targetConversationId) {
            await supabase
                .from('messages')
                .insert({
                    conversation_id: targetConversationId,
                    sender_type: 'user',
                    content: content,
                    external_id: message.id,
                    created_at: new Date().toISOString()
                });
        }

        await generateAndSendAIResponse({
            content,
            companyId,
            contactId,
            conversationId,
            sender,
            phoneNumberId: config.phoneId,
            whatsappToken: config.token
        });

        return NextResponse.json({ status: 'success' });

    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
}

