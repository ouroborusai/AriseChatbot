# AriseChatbot - 08. Supabase Storage

## 1. Configuración de Storage

### 1.1 Bucket Requerido

```sql
-- Crear bucket 'documents'
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true);
```

### 1.2 Políticas de Acceso

```sql
-- Permitir lectura pública
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT
USING (bucket_id = 'documents');

-- Permitir escritura solo con service role
CREATE POLICY "Service Role Insert" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND 
  (select auth.role() = 'service_role')
);

-- Permitir actualización solo con service role
CREATE POLICY "Service Role Update" ON storage.objects
FOR UPDATE
USING (bucket_id = 'documents' AND 
  (select auth.role() = 'service_role'));
```

---

## 2. Código de Storage Service

**Archivo:** `lib/storage-service.ts`

```typescript
import { getSupabaseAdmin } from './supabase-admin';

interface UploadResult {
  url: string;
  path: string;
}

/**
 * Sube un archivo a Supabase Storage
 */
export async function uploadToStorage(
  contactId: string,
  binary: Blob,
  fileName: string,
  mimeType: string,
  bucketName: string = 'documents'
): Promise<UploadResult> {
  const supabase = getSupabaseAdmin();
  
  // Generar path único
  const path = `${contactId}/${Date.now()}_${fileName}`;
  
  // Subir archivo
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(path, binary, {
      contentType: mimeType,
      upsert: false
    });

  if (error) {
    throw new Error(`Storage upload error: ${error.message}`);
  }

  // Obtener URL pública
  const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(path);

  return {
    url: urlData.publicUrl,
    path: data.path
  };
}

/**
 * Elimina un archivo de Storage
 */
export async function deleteFromStorage(
  path: string,
  bucketName: string = 'documents'
): Promise<void> {
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase.storage
    .from(bucketName)
    .remove([path]);

  if (error) {
    throw new Error(`Storage delete error: ${error.message}`);
  }
}

/**
 * Obtiene URL temporalSigned URL)
 */
export async function getSignedUrl(
  path: string,
  expiresIn: number = 3600, // 1 hora por defecto
  bucketName: string = 'documents'
): Promise<string> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Signed URL error: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Descarga un archivo desde Storage
 */
export async function downloadFromStorage(
  path: string,
  bucketName: string = 'documents'
): Promise<Blob> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase.storage
    .from(bucketName)
    .download(path);

  if (error) {
    throw new Error(`Storage download error: ${error.message}`);
  }

  return data;
}
```

---

## 3. Integración con Imágenes Entrantes

### 3.1 Flujo completo

```
Usuario envía imagen por WhatsApp
         │
         ▼
Webhook detecta message.image
         │
         ▼
1. getWhatsAppMediaUrl(mediaId) → URL de descarga
         │
         ▼
2. fetch(URL) → binary (Blob)
         │
         ▼
3. uploadToStorage(contactId, binary, filename, mimeType)
         │
         ▼
4. Guardar en client_documents
```

### 3.2 Código completo

```typescript
// lib/whatsapp-media-handler.ts

import { getWhatsAppMediaUrl, downloadWhatsAppMedia } from './whatsapp-service';
import { uploadToStorage } from './storage-service';
import { getSupabaseAdmin } from './supabase-admin';

export async function processIncomingMedia(
  phoneNumber: string,
  mediaData: {
    id: string;
    mime_type?: string;
    caption?: string;
    filename?: string;
  }
): Promise<void> {
  const contact = await getOrCreateContact(phoneNumber);
  
  // 1. Obtener URL de descarga
  console.log('[Media] Obteniendo URL para media:', mediaData.id);
  const mediaUrl = await getWhatsAppMediaUrl(mediaData.id);
  
  // 2. Descargar contenido binario
  console.log('[Media] Descargando contenido...');
  const binary = await downloadWhatsAppMedia(mediaUrl);
  
  // 3. Determinar extensión
  const mimeType = mediaData.mime_type || 'application/octet-stream';
  const extension = getExtensionFromMime(mimeType);
  const fileName = mediaData.filename || `file_${Date.now()}.${extension}`;
  
  // 4. Subir a Supabase Storage
  console.log('[Media] Subiendo a Storage...');
  const { url, path } = await uploadToStorage(
    contact.id,
    binary,
    fileName,
    mimeType
  );
  
  // 5. Determinar tipo de archivo
  const fileType = getFileTypeFromMime(mimeType);
  
  // 6. Guardar en tabla
  await getSupabaseAdmin()
    .from('client_documents')
    .insert({
      contact_id: contact.id,
      title: mediaData.caption || fileName,
      file_name: fileName,
      file_url: url,
      storage_bucket: 'documents',
      storage_path: path,
      file_type: fileType
    });
  
  console.log('[Media] ✅ Guardado:', path);
}

/**
 * Determina extensión desde MIME type
 */
function getExtensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
  };
  return map[mimeType] || 'bin';
}

/**
 * Determina tipo desde MIME
 */
function getFileTypeFromMime(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'document';
}
```

---

## 4. Integración en Webhook

```typescript
// app/api/webhook/route.ts

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  for (const entry of body.entry) {
    for (const change of entry.changes) {
      const messages = change?.value?.messages;
      
      for (const msg of messages) {
        // Procesar imagen
        if (msg.image) {
          await processIncomingMedia(msg.from, {
            id: msg.image.id,
            mime_type: msg.image.mime_type
          });
        }
        // Procesar documento
        else if (msg.document) {
          await processIncomingMedia(msg.from, {
            id: msg.document.id,
            mime_type: msg.document.mime_type,
            filename: msg.document.filename
          });
        }
        // Procesar audio
        else if (msg.audio) {
          await processIncomingMedia(msg.from, {
            id: msg.audio.id,
            mime_type: msg.audio.mime_type
          });
        }
      }
    }
  }
  
  return new NextResponse('OK', { status: 200 });
}
```

---

## 5. Tabla client_documents (Referencia)

| # | Columna | Tipo | Descripción |
|---|--------|------|-------------|
| 1 | id | uuid | PK |
| 2 | contact_id | uuid | FK a contacts |
| 3 | company_id | uuid | FK a companies |
| 4 | title | text | Título |
| 5 | description | text | Descripción |
| 6 | file_name | text | Nombre original |
| 7 | file_url | text | URL pública |
| 8 | storage_bucket | text | Bucket ("documents") |
| 9 | storage_path | text | Path en bucket |
| 10 | file_type | text | Tipo (iva, renta, image, audio, pdf...) |
| 11 | created_at | timestamptz | Fecha |

---

## 6. Manejo de Errores

```typescript
// Errores comunes

// 1. Bucket no existe
throw new Error('Bucket not found: documents');

// 2. Permisos denegados
throw new Error('Storage upload error: permission denied');

// 3. Archivo muy grande (max 100MB en Supabase)
throw new Error('File too large');

// 4. Tipo MIME no permitido
throw new Error('File type not allowed');

// 5. URL expirada (signed URL)
throw new Error('Signed URL expired');
```

---

## 7. Límites de Supabase Storage

| # | Límite | Valor |
|---|--------|-------|
| 1 | Tamaño máximo por archivo | 100 MB |
| 2 | Ancho de banda | Ilimitado (plan Pro) |
| 3 | Almacenamiento |Según plan |
| 4 | URLs públicas | Permanentes |
| 5 | Signed URLs | Máx 1 año |