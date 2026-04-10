# AriseChatbot - 02. Webhook de WhatsApp

## 1. Endpoint Principal

**Archivo:** `app/api/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { handleInboundUserMessage } from '@/lib/webhook-handler';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Verification failed', { status: 403 });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const entries = body.entry;
  
  if (!Array.isArray(entries)) {
    return new NextResponse('OK', { status: 200 });
  }

  for (const entry of entries) {
    const changes = entry?.changes;
    if (!Array.isArray(changes)) continue;

    for (const change of changes) {
      if (change?.field !== 'messages') continue;
      
      const messages = change?.value?.messages;
      if (!Array.isArray(messages) || messages.length === 0) continue;

      for (const messageData of messages) {
        try {
          await handleInboundUserMessage({
            from: messageData.from,
            text: messageData.text,
            interactive: messageData.interactive
          });
        } catch (error) {
          console.error('Error:', error);
        }
      }
    }
  }
  return new NextResponse('OK', { status: 200 });
}
```

---

## 2. Handler Principal

**Archivo:** `lib/webhook-handler.ts`

```typescript
export async function handleInboundUserMessage(messageData: {
  from?: string;
  text?: { body?: string };
  interactive?: { button_reply?: { id?: string }; list_reply?: { id?: string } };
}): Promise<void> {
  
  const phoneNumber = messageData.from;
  const text = messageData.text?.body?.trim();
  const interactive =
    messageData.interactive?.button_reply?.id ||
    messageData.interactive?.list_reply?.id;

  if (!phoneNumber) return;

  // 1. Obtener contacto y conversación
  const contact = await getOrCreateContact(phoneNumber);
  const conversationId = await getOrCreateConversation(phoneNumber, contact.id);

  // 2. Verificar chatbot habilitado
  const { data: convData } = await getSupabaseAdmin()
    .from('conversations')
    .select('chatbot_enabled')
    .eq('id', conversationId)
    .maybeSingle();

  if (convData?.chatbot_enabled === false) {
    await saveMessage(conversationId, 'assistant', 'Modo manual activo.');
    return;
  }

  // 3. Guardar mensaje del usuario
  if (text) {
    await saveMessage(conversationId, 'user', text);
  } else if (interactive) {
    await saveMessage(conversationId, 'user', `[button:${interactive}]`);
  } else {
    return;
  }

  // 4. Construir contexto
  const context = await buildContext(phoneNumber, contact.id, conversationId);
  const navState = { visitedTemplates: [], redirectCount: 0 };

  // 5. Procesar interactive
  if (interactive) {
    const classResult = await handleClassification(interactive, contact);
    if (classResult.handled && classResult.response) {
      await sendWhatsAppMessage(phoneNumber, classResult.response);
      await sendWelcomeMenu(phoneNumber, contact);
      return;
    }
  }

  // 6. Buscar template por trigger
  if (text) {
    const matchedTemplate = await findTemplateByTrigger(text, contact.segment);
    if (matchedTemplate) {
      await sendTemplateWithConditions(phoneNumber, matchedTemplate, context, navState);
      return;
    }
  }

  // 7. Fallback a IA (Gemini)
  await handleAI(phoneNumber, conversationId, contact, companies, activeCompanyId, text || '');
}
```

---

## 3. Flujo Completo

```
WhatsApp Cloud API
       │
       ▼
POST /api/webhook
       │
       ▼
GET ?hub.mode=subscribe ──► Verifica WHATSAPP_VERIFY_TOKEN
       │
       ▼
POST Payload JSON
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "569...",
          "text": { "body": "Hola" },
          "interactive": { "button_reply": { "id": "btn_..." } }
        }]
      }
    }]
  }]
}
       │
       ▼
handleInboundUserMessage()
       │
       ├─► getOrCreateContact()
       ├─► getOrCreateConversation()
       ├─► saveMessage()
       ├─► handleClassification() ──► sendWelcomeMenu()
       ├─► findTemplateByTrigger() ──► sendTemplateWithConditions()
       └─► handleAI() ──► Gemini
             │
             ▼
       sendWhatsAppMessage() / sendWhatsAppInteractiveButtons()
             │
             ▼
       Meta Graph API (https://graph.facebook.com/v25.0/...)
```

---

## 4. Tipos de Mensajes Entrantes

| # | Tipo | Campo | Descripción |
|---|------|-------|------------|
| 1 | texto | message.text.body | Mensaje de texto |
| 2 | button | message.interactive.button_reply.id | Botón pulsado |
| 3 | list | message.interactive.list_reply.id | Opción de lista seleccionada |
| 4 | image | message.image | Imagen recibida |
| 5 | document | message.document | Documento recibido |
| 6 | audio | message.audio | Audio recibido |
| 7 | video | message.video | Video recibido |

## 5. Funciones Auxiliares

```typescript
// lib/database-service.ts
async function getOrCreateContact(phoneNumber: string): Promise<Contact>
async function getOrCreateConversation(phoneNumber: string, contactId: string): Promise<string>
async function saveMessage(conversationId: string, role: 'user' | 'assistant', content: string): Promise<void>
async function listCompaniesForContact(contactId: string): Promise<Company[]>
```

---

## 6. Verificación de Webhook

```
WhatsApp Server
        │
        ▼
GET /api/webhook?hub.verify_token=MIFTZ2024&hub.mode=subscribe&hub.challenge=xxx
        │
        ▼
Verifica TOKEN == WHATSAPP_VERIFY_TOKEN
        │
        ├──► OK: Return challenge (200)
        │
        └──► FAIL: Return 403
```

## 7. Respuestas Salientes

```typescript
// Enviar texto simple
await sendWhatsAppMessage(phoneNumber, "Hola, cómo puedo ayudarte?");

// Enviar botones (máximo 3)
await sendWhatsAppInteractiveButtons(phoneNumber, "Selecciona:", [
  { id: "btn_1", title: "Opción 1" },
  { id: "btn_2", title: "Opción 2" }
]);

// Enviar lista (más de 3 opciones)
await sendWhatsAppListMessage(phoneNumber, {
  body: "Selecciona una opción:",
  buttonText: "Ver opciones",
  sections: [{
    title: "Opciones",
    rows: [
      { id: "opt_1", title: "Opción 1", description: "Descripción" }
    ]
  }]
});
```