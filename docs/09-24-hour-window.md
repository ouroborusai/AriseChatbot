# AriseChatbot - 09. Ventana de 24 Horas

## 1. La Regla de WhatsApp

WhatsApp impone una **ventana de 24 horas** para enviar mensajes de texto libre:

| # | Tipo de Mensaje | Ventana |
|---|----------------|----------|
| 1 | Texto libre (Template) | 📛 NO tiene límite |
| 2 | Texto libre (mensaje normales) | ✅ Dentro de 24 horas |
| 3 | Mensajes con botones/listas | 📛 NO tiene límite |
| 4 | Mensajes multimedia | 📛 NO tiene límite |

**FUERA de la ventana:**
- Solo se pueden enviar **Messages Templates** (con botones pre-aprobados)
- O el mensaje **fallará con error 130.472**

---

## 2. Cómo funcionaba antes (Deprecated)

```
Sistema legacy:
- Usuario envía "Hola"
- Bot responde dentro de 24h → ✅ Funciona
- Usuario no responde en 25h
- Bot intenta responder → ❌ Error 130.472

Meta deprecated "1 session window" en 2024.
```

---

## 3. Solución ACTUAL (WhatsApp Template Messages)

Ahora WhatsApp **no requiere ventana** porque envía mediante **Template Messages**:

```typescript
// Tipo de mensaje: "template" en lugar de "text"
const payload = {
  messaging_product: 'whatsapp',
  to: '569912345678',
  type: 'template',
  template: {
    name: 'hello_world',  // Template pre-aprobado por Meta
    language: { code: 'es_CL' },
    components: [...]  // Parámetros dinámicos
  }
};
```

### Cuándo usar cada tipo:

| # | Escenario | Tipo de mensaje |
|---|----------|-----------------|
| 1 | Respuesta normal del bot | template (con botones/listas) |
| 2 | Notificación programada | template |
| 3 | Fuera de conversación activa | template |
| 4 | Conversation started | template |

---

## 4. Nuestra Implementación Actual

### 4.1 Usamos Interactive Messages (funcionan como templates)

```typescript
// WhatsApp interactive = treated as template
// Puede enviarse en cualquier momento

// Botones (type: interactive)
await sendWhatsAppInteractiveButtons(phoneNumber, body, buttons);

// Lista (type: interactive)
await sendWhatsAppListMessage(phoneNumber, listMessage);
```

### 4.2 Por eso no tenemos el problema

```
WhatsApp Cloud API → Interactive Messages = siempre permitidos
         │
         ▼
No necesitamos calcular ventana de 24h
         │
         ▼
Envíamos botones/listas → siempre funciona
```

---

## 5. Validación (por si acaso)

Si en algún momento necesitas validar la ventana:

```typescript
interface ConversationWindow {
  lastUserMessageAt: Date | null;
  isExpired: boolean;
}

/**
 * Verifica si la conversación está dentro de la ventana de 24h
 */
export async function checkConversationWindow(
  conversationId: string
): Promise<ConversationWindow> {
  const supabase = getSupabaseAdmin();
  
  // Obtener último mensaje del usuario
  const { data: lastMessage } = await supabase
    .from('messages')
    .select('created_at')
    .eq('conversation_id', conversationId)
    .eq('role', 'user')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastMessage) {
    return {
      lastUserMessageAt: null,
      isExpired: false
    };
  }

  const lastUserMessageAt = new Date(lastMessage.created_at);
  const now = new Date();
  const hoursDiff = (now.getTime() - lastUserMessageAt.getTime()) / (1000 * 60 * 60);
  const isExpired = hoursDiff > 24;

  return {
    lastUserMessageAt,
    isExpired
  };
}

/**
 * Decide qué tipo de mensaje enviar según la ventana
 */
export async function sendMessageWithWindowCheck(
  phoneNumber: string,
  conversationId: string,
  message: string,
  buttons?: { id: string; title: string }[]
): Promise<void> {
  const { isExpired } = await checkConversationWindow(conversationId);

  if (buttons && buttons.length > 0) {
    // Siempre usamos interactive → no hay límite
    await sendWhatsAppInteractiveButtons(phoneNumber, message, buttons);
  } else if (isExpired) {
    // Fuera de ventana: forzar template
    // Por ahora, mensaje de texto simple (se puede usar interactive empty)
    await sendWhatsAppInteractiveButtons(phoneNumber, message, [
      { id: 'continue', title: 'Continuar' }
    ]);
  } else {
    // Dentro de ventana: texto normal
    await sendWhatsAppMessage(phoneNumber, message);
  }
}
```

---

## 6. Errores Relacionados

| # | Error | Código | Descripción |
|---|-------|--------|------------|
| 1 | 130.472 | "Messages outside session window" |
| 2 | 131.045 | "Parameter mismatch" |
| 3 | 131.056 | "Invalid header" |

---

## 7. Resumen

```
¿Necesitamos validar 24h?
├── SI: si usamos texto libre pura (type: "text")
└── NO: si usamos interactive (botones/listas)

NUESTRO SISTEMA ACTUAL:
└── Solo usa interactive buttons/listas
    └── ✅ NO tiene límite de ventana
    └── ✅ Siempre funciona
```

**CONCLUSIÓN:** El sistema actual **NO necesita** validación de 24h porque:
1. Las respuestas del bot van por `sendWhatsAppInteractiveButtons()` o `sendWhatsAppListMessage()`
2. Estos son treated como **Template Messages** por WhatsApp
3. No hay límite de tiempo