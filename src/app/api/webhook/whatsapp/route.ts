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

        if (message.type === 'text' && message.text) {
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

        const { data: userMsg, error: insertError } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_type: 'user',
                content: content,
                external_id: message.id,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (insertError || !userMsg) {
            throw new Error('Error al registrar mensaje en DB');
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
