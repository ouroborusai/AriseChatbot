# AriseChatbot - 07. Autenticación y Tokens de Meta

## 1. Variables de Entorno

| # | Variable | Descripción | Ejemplo |
|---|----------|-------------|---------|
| 1 | WHATSAPP_ACCESS_TOKEN | Token permanente de Meta | EAA... |
| 2 | WHATSAPP_PHONE_NUMBER_ID | ID del número de teléfono | 1234567890... |
| 3 | WHATSAPP_VERIFY_TOKEN | Token para verificar webhook | MIFTZ2024 |
| 4 | WHATSAPP_WEBHOOK_SECRET | Secret para verificar firma | abc123... |

---

## 2. Obtención del Token

### 2.1 Pasos en Meta Developer

```
1. Ir a https://developers.facebook.com/
2. Crear o seleccionar App (Tipo: "Negocios")
3. Agregar producto "WhatsApp"
4. Configurar Webhook
5. En Configuración de WhatsApp → API de WhatsApp
6. Obtener Token de acceso temporal o permanente
```

### 2.2 Diferencia entre Tokens

| # | Tipo | Duración | Uso |
|---|------|---------|------|
| 1 | Temporal | ~24 horas | Desarrollo |
| 2 | Permanente | Indefinido | Producción |

**NOTA:** Meta ha elimin gradualmente los tokens permanentes. Ahora se usa:
- Token de acceso de sistema (-System User Access Token)
- O token de cuenta de desarrollo

---

## 3. Uso del Token en el Código

### 3.1 Envío de Mensajes

```typescript
// lib/whatsapp-service.ts
const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

const payload = {
  messaging_product: 'whatsapp',
  to: '569912345678',
  type: 'text',
  text: { body: 'Hola!' }
};

const response = await fetch(
  `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  }
);
```

### 3.2 Verificación de Webhook

```typescript
// app/api/webhook/route.ts
const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

if (mode === 'subscribe' && token === verifyToken) {
  return new NextResponse(challenge, { status: 200 });
}
```

---

## 4. Obtención de URL de Media (para descarga)

### 4.1 Flujo completo

```
Usuario envía imagen
         │
         ▼
Webhook recibe message.image
         │
         ▼
1. Obtener media_id (ej: "abc123...")
2. GET /{mediaId} → obtener URL de descarga
3. Fetch URL → descargar binario
```

### 4.2 Código para obtener URL

```typescript
/**
 * Obtiene la URL de descarga de un media de WhatsApp
 */
export async function getWhatsAppMediaUrl(mediaId: string): Promise<string> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  
  // 1. Obtener info del media (incluye URL de descarga)
  const response = await fetch(
    `https://graph.facebook.com/v25.0/${mediaId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get media info: ${response.status}`);
  }

  const data = await response.json();
  
  // La URL está en data.url (solo dura ~5 minutos)
  return data.url;
}

/**
 * Descarga el contenido binario del media
 */
export async function downloadWhatsAppMedia(mediaUrl: string): Promise<Blob> {
  const response = await fetch(mediaUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to download media: ${response.status}`);
  }

  return response.blob();
}
```

### 4.3 Uso completo

```typescript
/**
 * Procesar imagen recibida
 */
export async function handleIncomingImage(
  phoneNumber: string,
  imageData: { id: string; mime_type?: string }
): Promise<void> {
  const contact = await getOrCreateContact(phoneNumber);
  
  // 1. Obtener URL de descarga
  const mediaUrl = await getWhatsAppMediaUrl(imageData.id);
  
  // 2. Descargar contenido binario
  const binary = await downloadWhatsAppMedia(mediaUrl);
  
  // 3. Determinar tipo MIME
  const mimeType = imageData.mime_type || 'image/jpeg';
  const extension = mimeType.split('/')[1] || 'jpg';
  
  // 4. Subir a Storage
  const { url, path } = await uploadToStorage(
    contact.id,
    binary,
    `image_${Date.now()}.${extension}`,
    mimeType
  );
  
  // 5. Guardar en tabla
  await getSupabaseAdmin()
    .from('client_documents')
    .insert({
      contact_id: contact.id,
      title: `Imagen ${new Date().toLocaleDateString()}`,
      file_name: `image_${Date.now()}.${extension}`,
      file_url: url,
      storage_path: path,
      storage_bucket: 'documents',
      file_type: 'image'
    });
}
```

---

## 5. Errores Comunes de Autenticación

| # | Error | Código | Solución |
|---|-------|--------|---------|
| 1 | Token expirado | 190/463 | Renovar token en Meta |
| 2 | Permisos insufficiency | 200 | Agregar permisos al token |
| 3 | IP no autorizada | 4 | Agregar IP a whitelist |
| 4 | Phone Number no verificado | 1310306 | Verificar número en Meta |


---

## 6. Renovación Automática de Token

```typescript
// NO implementable actualmente
// Meta ya no ofrece tokens temporales que expiren
// 
// SOLUCIÓN:
// Usar System User Access Token (másstable)
// o token de cuenta de desarrollo
```

---

## 7. Notas Importantes

### 7.1 Token vs Phone Number ID

| # | Variable | Dónde obtenerlo |
|---|------------------|
| WHATSAPP_ACCESS_TOKEN | Meta Business Manager → WhatsApp → Configuración |
| WHATSAPP_PHONE_NUMBER_ID | Meta Business Manager → WhatsApp → Números de teléfono |

### 7.2 Formato del Token

```
WHATSAPP_ACCESS_TOKEN = EAA... (comienza con "EAA")
```

### 7.3 Seguridad

- **NUNCA** exponer token en frontend (env vars de servidor)
- Usar solo en Server-Side (API routes)
- No incluir en logs