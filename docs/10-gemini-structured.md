# AriseChatbot - 10. Gemini Structured Outputs (Extracción de Datos)

## 1. El Problema

Gemini responde con texto libre. Para extraer datos estructurados (RUT, monto, fecha) necesitamos forzar un formato JSON específico.

---

## 2. Solución: Structured Outputs con JSON Schema

### 2.1 Código Actual

```typescript
// lib/ai-service.ts
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  systemInstruction: systemPrompt  // Solo texto libre
});

const chat = model.startChat({ history: geminiHistory });
const result = await chat.sendMessage(userMessage);
const textResponse = (await result.response).text();  // ← Texto libre
```

### 2.2 Modificado para Structured Outputs

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

// Schema para extraer datos de factura
const invoiceSchema = {
  type: 'object' as const,
  properties: {
    rut: { type: 'string' as const, description: 'RUT del emisor (ej: 12345678-9)' },
    razon_social: { type: 'string' as const, description: 'Razón social o nombre empresa' },
    monto_total: { type: 'number' as const, description: 'Monto total con IVA en pesos chilenos' },
    fecha_emision: { type: 'string' as const, description: 'Fecha en formato YYYY-MM-DD' },
    tipo_documento: { type: 'string' as const, description: 'Tipo: factura, boleta, nota_credito, etc.' },
    numero_documento: { type: 'string' as const, description: 'Número del documento' },
    contiene_errores: { type: 'boolean' as const, description: 'Si hay datos incompletos o illegibles' },
    errores_detalle: { type: 'string' as const, description: 'Lista de errores encontrados' }
  },
  required: ['monto_total', 'contiene_errores']
};

// Generación con forced JSON
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    responseSchema: invoiceSchema,
    responseMimeType: 'application/json'
  }
});

const result = await model.generateContent(promptWithImage);
const response = result.response;
const jsonData = JSON.parse(response.text());  // ← JSON forzado
```

---

## 3. Extracción de Datos de Facturas

### 3.1 Código Completo

```typescript
// lib/invoice-extractor.ts

interface ExtractedInvoice {
  rut: string;
  razon_social: string;
  monto_total: number;
  fecha_emision: string;
  tipo_documento: string;
  numero_documento: string;
  contiene_errores: boolean;
  errores_detalle: string;
}

// Schema de extracción
const invoiceExtractionSchema = {
  type: 'object' as const,
  properties: {
    rut: { 
      type: 'string' as const, 
      description: 'RUT del emisor en formato XX.XXX.XXX-X' 
    },
    razon_social: { 
      type: 'string' as const, 
      description: 'Nombre o razón social de la empresa' 
    },
    monto_total: { 
      type: 'number' as const, 
      description: 'Monto total incluyendo IVA' 
    },
    fecha_emision: { 
      type: 'string' as const, 
      description: 'Fecha de emisión en formato YYYY-MM-DD' 
    },
    tipo_documento: { 
      type: 'string' as const, 
      description: 'Tipo: factura Electrónica, Boleta, Nota de Crédito' 
    },
    numero_documento: { 
      type: 'string' as const, 
      description: 'Número sequential del documento' 
    },
    contiene_errores: { 
      type: 'boolean' as const, 
      description: 'true si hay datos illegibles o incompletos' 
    },
    errores_detalle: { 
      type: 'string' as const, 
      description: 'Descripción de errores si aplica' 
    }
  },
  required: ['monto_total', 'contiene_errores']
};

/**
 * Extrae datos de factura usando Gemini Vision
 */
export async function extractInvoiceData(
  imageUrl: string
): Promise<ExtractedInvoice> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  
  const prompt = `Analiza esta imagen de factura o boleta electrónica chilena.
Extrae la siguiente información:
- RUT del emisor
- Razón social
- Monto total (incluye IVA)
- Fecha de emisión
- Tipo de documento
- Número del documento

Si no puedes leer algún dato, marca contiene_errores: true.`;

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseSchema: invoiceExtractionSchema,
      responseMimeType: 'application/json'
    }
  });

  const result = await model.generateContent([
    { text: prompt },
    { inlineData: { mimeType: 'image/jpeg', data: imageUrl } }
  ]);

  const text = result.response.text();
  return JSON.parse(text) as ExtractedInvoice;
}

/**
 * Extrae datos de imagen dada una URL pública
 */
export async function extractFromUrl(imageUrl: string): Promise<ExtractedInvoice> {
  // Descargar imagen primero
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const base64 = await blobToBase64(blob);
  
  return extractInvoiceData(base64);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
```

### 3.2 Flujo de trabajo

```
Usuario envía imagen de factura
         │
         ▼
Webhook detecta message.image
         │
         ▼
1. Descargar imagen de WhatsApp
         │
         ▼
2. extractInvoiceData(imageBase64)
         │
         ▼
3. Gemini retorna JSON con datos
         │
         ▼
4. Guardar en client_documents + metadata
         │
         ▼
5. Responder al usuario
```

---

## 4. Otros Esquemas Útiles

### 4.1 Extracción de RUT

```typescript
const rutExtractionSchema = {
  type: 'object' as const,
  properties: {
    rut: { type: 'string' as const, description: 'RUT en formato XX.XXX.XXX-X' },
    dv: { type: 'string' as const, description: 'Dígito verificador (0-9 o K)' },
    nombre: { type: 'string' as const, description: 'Nombre o razón social' },
    es_valido: { type: 'boolean' as const, description: 'Si el RUT tiene formato válido' }
  },
  required: ['rut', 'es_valido']
};
```

### 4.2 Extracción de Contacto

```typescript
const contactExtractionSchema = {
  type: 'object' as const,
  properties: {
    nombre: { type: 'string' as const },
    telefono: { type: 'string' as const },
    email: { type: 'string' as const, description: 'Correo electrónico' },
    empresa: { type: 'string' as const },
    cargo: { type: 'string' as const }
  },
  required: []
};
```

### 4.3 Clasificación de Intención

```typescript
const intentClassificationSchema = {
  type: 'object' as const,
  properties: {
    intencion: { 
      type: 'string' as const, 
      enum: ['consulta_documento', 'solicitar_documento', 'cotizacion', 'soporte', 'saludo', 'otro'],
      description: 'Intención detectada del usuario'
    },
    urgencia: { 
      type: 'string' as const, 
      enum: ['baja', 'media', 'alta'],
      description: 'Nivel de urgencia' 
    },
    requiere_humano: { type: 'boolean' as const, description: 'Si necesita derivación' }
  },
  required: ['intencion']
};
```

---

## 5. Guardar Datos extraídos en Supabase

```typescript
// Metadata en client_documents
await getSupabaseAdmin()
  .from('client_documents')
  .insert({
    contact_id: contact.id,
    title: `${extracted.tipo_documento} ${extracted.numero_documento}`,
    description: extracted.razon_social,
    file_url: imageUrl,
    storage_path: storagePath,
    storage_bucket: 'documents',
    file_type: extracted.tipo_documento,
    metadata: {
      rut: extracted.rut,
      monto: extracted.monto_total,
      fecha: extracted.fecha_emision,
      extracted_at: new Date().toISOString()
    }
  });
```

---

## 6. Notas Importantes

### 6.1 Modelos Soportados

| # | Modelo | Soporta Structured Output |
|---|--------|------------------------|
| 1 | gemini-2.0-flash | ✅ |
| 2 | gemini-1.5-flash | ✅ |
| 3 | gemini-1.5-pro | ✅ |

### 6.2 Limitaciones

- Solo funciona con modelos Gemini (no OpenAI)
- El schema debe ser JSON Schema válido
- Maximum 10 propiedades en schema

### 6.3 Ejemplo de Prompt

```
Analiza la imagen adjunta y extrae los datos en formato JSON.
Si no puedes leer un dato, usa null.
Para monto_total, incluye el IVA (19% si aplica).
```