# ⚙️ ARISE AUTOMATION & TRIGGERS MANIFEST v10.2

Este documento detalla la lógica de disparadores (triggers) y automatización del sistema Arise Business OS Diamond v10.2 para su procesamiento en **NotebookLM**.

## 1. Triggers Existentes (Producción)

### 1.1 `on_document_created`
- **Tabla:** `public.client_documents`
- **Acción:** `INSERT`
- **Función Vinculada:** Edge Function `document-processor`.
- **Propósito:** Realizar limpieza de datos, validación de montos y fragmentación semántica para RAG (document_sections).
- **Impacto:** Permite que la IA "lea" las facturas y documentos subidos para responder consultas sobre gastos.

### 1.2 `on_inventory_update`
- **Tabla:** `public.inventory_items`
- **Acción:** `UPDATE`
- **Propósito:** Validar umbrales de stock bajo (`low_stock_threshold`).
- **Lógica:** Si `quantity` < `threshold`, genera una entrada en `audit_logs` con la acción `LOW_STOCK_ALERT`.

## 2. Nueva Arquitectura: Shadow PDF Generation (Propuesta)

Para eliminar la latencia en WhatsApp, se propone la implementación del siguiente trigger:

### 2.1 `trigger_pdf_pregeneration`
- **Tabla:** `public.financial_summaries`
- **Acción:** `INSERT` o `UPDATE`
- **Lógica de Ejecución:**
  1. Cuando un proceso contable actualiza un resumen (ej: balance de 8 columnas).
  2. El trigger dispara una llamada asíncrona a la Edge Function `generate-pdf`.
  3. La función utiliza `src/lib/pdf/pipeline.ts` para renderizar el PDF.
  4. El archivo se sube a Meta WhatsApp Media.
  5. El `media_id` resultante se guarda en una tabla de caché `prepared_reports`.

### 2.2 Tabla `prepared_reports` (Esquema)
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK |
| `company_id` | uuid | FK Companies |
| `report_type` | text | Identificador (8-columnas, inventario, etc) |
| `media_id` | text | ID devuelto por Meta Graph API |
| `expires_at` | timestamp | 30 días (límite de Meta para media) |
| `checksum` | text | Hash de los datos para detectar cambios |

## 3. Flujo de Entrega en WhatsApp (Cero Latencia)
1. Usuario presiona botón `pdf_8columnas`.
2. Webhook consulta tabla `prepared_reports`.
3. Si existe un `media_id` válido y el checksum coincide:
   - Se envía el documento **instantáneamente** usando el ID existente.
4. Si no existe:
   - Se dispara el pipeline en tiempo real (fallback).

## 4. Instrucciones para NotebookLM
- **Decisión Operativa:** LM debe decidir si este flujo de pre-generación se aplica a todos los reportes o solo a los más pesados (8-columnas y Remuneraciones).
- **Seguridad:** Todas las llamadas a Edge Functions desde Triggers deben usar el header `Authorization: Bearer ARISE_MASTER_SERVICE_KEY`.

---
**SSOT Validation:** v10.2 Diamond / Luminous Pure Protocol.
