# AriseChatbot - 03. Envío a WhatsApp (Meta Graph API)

## 1. Servicio de WhatsApp

**Archivo:** `lib/whatsapp-service.ts`

### 1.1 Enviar Mensaje de Texto

```typescript
export async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string
): Promise<WhatsAppSendResponse> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  const to = formatWhatsAppRecipient(phoneNumber);

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: message }
  };

  const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return response.json();
}
```

---

### 1.2 Enviar Botones Interactivos (Máximo 3)

```typescript
export async function sendWhatsAppInteractiveButtons(
  phoneNumber: string,
  bodyText: string,
  buttons: { id: string; title: string }[]
): Promise<WhatsAppSendResponse> {
  const validButtons = buttons.slice(0, 3).map(button => ({
    type: 'reply' as const,
    reply: {
      id: button.id,
      title: button.title.substring(0, 25) // Máximo 25 caracteres
    }
  }));

  const payload = {
    messaging_product: 'whatsapp',
    to: formatWhatsAppRecipient(phoneNumber),
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: { buttons: validButtons }
    }
  };

  const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return response.json();
}
```

---

### 1.3 Enviar Mensaje de Lista (Más de 3 opciones)

```typescript
interface WhatsAppListSection {
  title: string;
  rows: { id: string; title: string; description?: string }[];
}

interface WhatsAppListMessage {
  body: string;
  buttonText: string;
  sections: WhatsAppListSection[];
}

export async function sendWhatsAppListMessage(
  phoneNumber: string,
  message: WhatsAppListMessage
): Promise<WhatsAppSendResponse> {
  const payload = {
    messaging_product: 'whatsapp',
    to: formatWhatsAppRecipient(phoneNumber),
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: message.body },
      action: {
        button: message.buttonText,
        sections: message.sections
      }
    }
  };

  const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return response.json();
}
```

---

### 1.4 Enviar Documento

```typescript
export async function sendWhatsAppDocument(
  phoneNumber: string,
  documentUrl: string,
  caption: string,
  fileName?: string
): Promise<WhatsAppSendResponse> {
  const payload = {
    messaging_product: 'whatsapp',
    to: formatWhatsAppRecipient(phoneNumber),
    type: 'document',
    document: {
      link: documentUrl,
      caption: caption,
      filename: fileName
    }
  };

  const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return response.json();
}
```

---

### 1.5 Enviar Imagen

```typescript
export async function sendWhatsAppImage(
  phoneNumber: string,
  imageUrl: string,
  caption?: string
): Promise<WhatsAppSendResponse> {
  const payload = {
    messaging_product: 'whatsapp',
    to: formatWhatsAppRecipient(phoneNumber),
    type: 'image',
    image: {
      link: imageUrl,
      caption: caption
    }
  };

  const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return response.json();
}
```

---

## 2. Endpoints de Meta Graph API

| # | Endpoint | Método | Propósito |
|---|---------|--------|----------|
| 1 | `/{phoneNumberId}/messages` | POST | Enviar cualquier mensaje |
| 2 | `/{phoneNumberId}/message_templates` | GET | Listar templates |
| 3 | `/{phoneNumberId}/template_namespace` | GET | Info de template |
| 4 | `/{mediaId}` | GET | Obtener URL de media |
| 5 | `/{phoneNumberId}/register` | POST | Registrar número |
| 6 | `/{phoneNumberId}/unregister` | DELETE | Desregistrar |

**Base URL:** `https://graph.facebook.com/v25.0`

---

## 3. Formato de Número

```typescript
function formatWhatsAppRecipient(phoneNumber: string): string {
  // Eliminar caracteres no numéricos
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Si ya tiene código de país (569...), déjalo
  if (cleaned.startsWith('569')) {
    return cleaned;
  }
  
  // Si es número local chileno, agregar 569
  if (cleaned.startsWith('9') && cleaned.length === 9) {
    return '569' + cleaned;
  }
  
  // Agregar código por defecto
  return '569' + cleaned;
}
```

---

## 4. Tipos de Mensajes Soportados

| # | Type | Payload Key | Descripción |
|---|------|-------------|------------|
| 1 | text | text.body | Mensaje de texto |
| 2 | interactive/button | interactive.button | Botones (máx 3) |
| 3 | interactive/list | interactive.list | Lista de opciones |
| 4 | document | document | Archivo PDF/DOC |
| 5 | image | image | Imagen JPG/PNG |
| 6 | audio | audio | Audio (OGG) |
| 7 | video | video | Video (MP4) |
| 8 | sticker | sticker | Sticker |

---

## 5. Límites de WhatsApp

| # | Elemento | Límite |
|---|----------|--------|
| 1 | Botones por mensaje | 3 |
| 2 | Título de botón | 25 caracteres |
| 3 | Lista - secciones | 10 |
| 4 | Lista - filas por sección | 10 |
| 5 | Título de lista | 24 caracteres |
| 6 | Cuerpo de mensaje | 4096 caracteres |
| 7 | Documento | 100 MB |
| 8 | Imagen | 16 MB |

---

## 6. Respuesta de API

```typescript
interface WhatsAppSendResponse {
  messaging_product: 'whatsapp';
  to: string;
  type: string;
  interactive?: any;
  document?: any;
  image?: any;
  text?: any;
}
```

---

## 7. Formato del Payload JSON

### Botones:
```json
{
  "messaging_product": "whatsapp",
  "to": "569912345678",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": {
      "text": "Selecciona una opción:"
    },
    "action": {
      "buttons": [
        {
          "type": "reply",
          "reply": {
            "id": "btn_documents",
            "title": "📄 Mis Documentos"
          }
        }
      ]
    }
  }
}
```

### Lista:
```json
{
  "messaging_product": "whatsapp",
  "to": "569912345678",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "body": {
      "text": "Selecciona una categoría:"
    },
    "action": {
      "button": "Ver opciones",
      "sections": [
        {
          "title": "Impuestos",
          "rows": [
            { "id": "iva", "title": "Declaración IVA" },
            { "id": "renta", "title": "Declaración Renta" }
          ]
        }
      ]
    }
  }
}
```