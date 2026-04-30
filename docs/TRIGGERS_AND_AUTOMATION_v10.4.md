# ⚙️ LOOP AUTOMATION & TRIGGERS MANIFEST v10.4

Este documento detalla la lógica de disparadores (triggers) y automatización del sistema LOOP Business OS Platinum v10.4 para su procesamiento en **NotebookLM**.

## 1. Triggers Existentes (Producción)

### 1.1 `on_document_created`
- **Tabla:** `public.client_documents`
- **Acción:** `INSERT`
- **Función Vinculada:** Edge Function `document-processor`.
- **Propósito:** Realizar limpieza de datos, validación de montos y fragmentación semántica para RAG.

### 1.2 `on_inventory_update`
- **Tabla:** `public.inventory_items`
- **Acción:** `UPDATE`
- **Propósito:** Validar umbrales de stock bajo.

## 2. Arquitectura: Shadow PDF Generation (Platinum)

### 2.1 `trigger_pdf_pregeneration`
- **Tabla:** `public.financial_summaries`
- **Acción:** `INSERT` o `UPDATE`
- **Lógica de Ejecución:**
  1. Cuando un proceso contable actualiza un resumen.
  2. El trigger dispara una llamada asíncrona a la Edge Function `loop-neural-engine` (o servicio de PDF).
  3. La función utiliza `src/lib/pdf/pipeline.tsx` para renderizar el PDF.
  4. El archivo se sube a Meta WhatsApp Media.
  5. El `media_id` resultante se guarda en la tabla `prepared_reports`.

## 3. Flujo de Entrega en WhatsApp (Cero Latencia)
1. Usuario solicita reporte interactivo.
2. Webhook consulta tabla `prepared_reports`.
3. Si existe un `media_id` válido:
   - Se envía el documento **instantáneamente**.
4. Si no existe:
   - Se dispara el pipeline en tiempo real (fallback).

## 4. Instrucciones para NotebookLM
- **Seguridad:** Todas las llamadas a Edge Functions desde Triggers deben usar el header `Authorization: Bearer ARISE_MASTER_SERVICE_KEY`.

---
**SSOT Validation:** v10.4 Platinum / Luminous Pure Protocol.
