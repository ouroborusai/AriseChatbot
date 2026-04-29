# 🏛️ ARISE CORE MANIFEST v10.2 (Diamond Industrial)

Este documento es el **Single Source of Truth (SSOT)** para la arquitectura de generación y entrega de documentos en Arise Business OS.

## 1. Arquitectura del Pipeline de PDF
El sistema ha evolucionado de un modelo basado en microservicios HTTP internos a un **Pipeline Nativo Centralizado**.

### Componente Core: `src/lib/pdf/pipeline.ts`
- **Motor de Renderizado:** `@react-pdf/renderer` (Generación de PDF en memoria).
- **Flujo de Datos:** 
  1. Identifica el `reportType` (8-columnas, inventario, etc.).
  2. Obtiene datos desde `financial_summaries` o fallbacks hardcoded.
  3. Renderiza a un `Buffer`.
  4. Sube el archivo al API de Meta WhatsApp (`/media`).
  5. Envía el mensaje con el `mediaId` al usuario.

## 2. Webhook Integration (WhatsApp)
Ubicación: `src/app/api/webhook/whatsapp/route.ts`

### El problema de Vercel (Solucionado)
Anteriormente, el webhook llamaba a `/api/pdf` vía `fetch`. Vercel terminaba el proceso antes de que el PDF se generara.
**Solución v10.2:**
- Uso de `waitUntil(pdfPromise)` de `@vercel/functions`.
- Invocación directa de la función `executePDFPipeline` sin saltos de red.
- Esto garantiza que el worker de Vercel permanezca activo hasta que el PDF sea entregado a Meta.

## 3. Estrategia de "Generación Automática" (Próximos Pasos)
Para reducir la latencia de 15s a <2s, se recomienda la **Pre-generación (Shadow PDF)**:
1. **Trigger de Supabase:** Escuchar cambios en `financial_summaries`.
2. **Generación en Background:** Una Edge Function genera el PDF en el momento en que los datos cambian.
3. **Storage:** Guardar el `media_id` de Meta en una tabla `prepared_documents`.
4. **Entrega Instantánea:** Cuando el usuario pide el reporte, el webhook solo envía el `media_id` ya existente.

## 4. Variables de Entorno Críticas
- `ARISE_MASTER_SERVICE_KEY`: Permisos totales para bypass de RLS.
- `META_API_VERSION`: v23.0 (Recomendado).
- `WHATSAPP_ACCESS_TOKEN`: Token de sistema permanente.

## 5. Limpieza y Mantenimiento
- Se eliminó la carpeta `scratch/` y archivos temporales.
- El endpoint `/api/pdf` queda como un proxy ligero para compatibilidad externa.
- Toda la lógica reside en `src/lib/pdf/`.

---
**Instrucción para NotebookLM:** Utiliza este manifiesto para guiar cualquier modificación en el sistema de reportes. Prioriza siempre la ejecución nativa sobre llamadas HTTP internas en Vercel.
