# AriseChatbot - 05. Gestión de Imágenes y Media

## 1. Estado Actual

**PENDIENTE DE IMPLEMENTACIÓN**

Actualmente el sistema:
- ✅ ENVÍA imágenes a WhatsApp
- ❌ NO descarga imágenes de WhatsApp

---

## 2. Funcionalidad de Envío (Ya implementada)

**Archivo:** `lib/whatsapp-service.ts`

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
      link: imageUrl,  // URL pública o URL de Supabase Storage
      caption: caption
    }
  };

  const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
  
  return fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  }).then(r => r.json());
}
```

---

## 3. Descarga de Imágenes (Por implementar)

### 3.1 Flujo completo

```
Usuario envía imagen por WhatsApp
         │
         ▼
WhatsApp Cloud API → Webhook con message.image
         │
         ▼
1. Obtener media_id del mensaje
2. GET /{mediaId} → obtener URL de descarga
3. Fetch URL → obtener binary
4. Subir a Supabase Storage
5. Guardar en tabla client_documents
```

### 3.2 Código a implementar

```typescript
// lib/whatsapp-media.ts

interface WhatsAppMediaInfo {
  id: string;
  mime_type: string;
  file_size: number;
}

interface WhatsAppMediaUrl {
  url: string;
}

/**
 * Descarga media de WhatsApp y lo sube a Supabase Storage
 */
export async function downloadAndSaveMedia(
  phoneNumber: string,
  mediaId: string,
  mimeType: string
): Promise<{ url: string; path: string }> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  
  // 1. Obtener URL de descarga
  const mediaInfo = await fetch(
    `https://graph.facebook.com/v25.0/${mediaId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  ).then(r => r.json()) as WhatsAppMediaInfo;

  // 2. Descargar contenido binario
  const binary = await fetch(mediaInfo.url).then(r => r.blob());

  // 3. Generar nombre de archivo
  const extension = mimeType.split('/')[1] || 'jpg';
  const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${extension}`;

  // 4. Subir a Supabase Storage
  const { data, error } = await getSupabaseAdmin()
    .storage
    .from('documents')
    .upload(fileName, binary, {
      contentType: mimeType,
      upsert: false
    });

  if (error) throw new Error(`Storage error: ${error.message}`);

  // 5. Obtener URL pública
  const { data: urlData } = getSupabaseAdmin()
    .storage
    .from('documents')
    .getPublicUrl(fileName);

  return {
    url: urlData.publicUrl,
    path: data.path
  };
}

/**
 * Procesar mensaje de imagen entrante
 */
export async function handleIncomingImage(
  phoneNumber: string,
  messageData: {
    image?: { id: string; mime_type?: string; caption?: string };
    document?: { id: string; mime_type?: string; filename?: string };
    audio?: { id: string };
  }
): Promise<void> {
  const contact = await getOrCreateContact(phoneNumber);

  // Determinar tipo de media
  let mediaId: string | undefined;
  let mimeType = 'image/jpeg';
  let fileName = 'image.jpg';

  if (messageData.image) {
    mediaId = messageData.image.id;
    mimeType = messageData.image.mime_type || 'image/jpeg';
  } else if (messageData.document) {
    mediaId = messageData.document.id;
    mimeType = messageData.document.mime_type || 'application/pdf';
    fileName = messageData.document.filename || 'document.pdf';
  } else if (messageData.audio) {
    mediaId = messageData.audio.id;
    mimeType = messageData.audio.mime_type || 'audio/ogg';
  }

  if (!mediaId) return;

  // Descargar y guardar
  const { url, path } = await downloadAndSaveMedia(phoneNumber, mediaId, mimeType);

  // Guardar en tabla
  await getSupabaseAdmin()
    .from('client_documents')
    .insert({
      contact_id: contact.id,
      title: fileName,
      file_name: fileName,
      file_url: url,
      storage_path: path,
      file_type: getFileTypeFromMime(mimeType)
    });

  console.log(`[Media] Guardado: ${url}`);
}
```

---

## 4. Tipos de Media Soportados

| # | Tipo | mime_type | Extensión |
|---|---------|----------|----------|
| 1 | image/jpeg | .jpg, .jpeg |
| 2 | image/png | .png |
| 3 | image/webp | .webp |
| 4 | audio/ogg | .ogg |
| 5 | audio/mpeg | .mp3 |
| 6 | application/pdf | .pdf |
| 7 | application/msword | .doc |
| 8 | application/vnd.openxmlformats-officedocument.wordprocessingml.document | .docx |

---

## 5. Integración en Webhook

```typescript
// En lib/webhook-handler.ts

async function handleInboundUserMessage(messageData) {
  // ... existentes ...

  // Procesar imagen
  if (messageData.image || messageData.document || messageData.audio) {
    await handleIncomingImage(phoneNumber, messageData);
    return;
  }
}
```

---

## 6. Tabla client_documents (Referencia)

| # | Columna | Tipo | Descripción |
|---|--------|------|------------|
| 1 | id | uuid | Identificador |
| 2 | contact_id | uuid | FK a contacts |
| 3 | company_id | uuid | FK a companies |
| 4 | title | text | Título |
| 5 | file_name | text | Nombre archivo |
| 6 | file_url | text | URL pública |
| 7 | storage_path | text | Path en bucket |
| 8 | file_type | text | Tipo (iva, renta, image, etc.) |
| 9 | created_at | timestamptz | Fecha |

---

## 7. Supabase Storage

```typescript
// Bucket: 'documents'
// Política: anyone can view
// policy: allow anyone to view files in 'documents'

// policy.sql:
// CREATE POLICY "Public Access" ON storage.objects
// FOR SELECT USING (bucket_id = 'documents');
```