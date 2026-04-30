# 🏛️ LOOP CORE MANIFEST v10.4 (Platinum)

Este documento es el **Single Source of Truth (SSOT)** para la arquitectura de generación y entrega de documentos en LOOP Business OS.

## 1. Arquitectura del Pipeline de PDF
El sistema utiliza un **Pipeline Nativo Centralizado** para máxima eficiencia.

### Componente Core: `src/lib/pdf/pipeline.tsx`
- **Motor de Renderizado:** `@react-pdf/renderer` (Generación de PDF en memoria).
- **Flujo de Datos:** 
  1. Identifica el `reportType` (8-columnas, inventario, etc.).
  2. Obtiene datos desde `financial_summaries` o fallbacks.
  3. Renderiza a un `Buffer`.
  4. Sube el archivo al API de Meta WhatsApp (`/media`).
  5. Envía el mensaje con el `mediaId` al usuario.

## 2. Webhook Integration (WhatsApp)
Ubicación: `src/app/api/webhook/whatsapp/route.ts`

### Estabilidad en Vercel (Protocolo Platinum)
- Uso de `waitUntil(pdfPromise)` de `@vercel/functions`.
- Invocación directa de la función `executePDFPipeline` sin saltos de red.
- Esto garantiza que el worker de Vercel permanezca activo hasta que el PDF sea entregado a Meta.

## 3. Estrategia de "Generación Automática"
Para reducir la latencia al mínimo, el sistema implementa la **Pre-generación (Shadow PDF)**:
1. **Trigger de Supabase:** Escucha cambios en `financial_summaries`.
2. **Generación en Background:** Una Edge Function genera el PDF en el momento en que los datos cambian.
3. **Storage:** Guarda el `media_id` de Meta en la tabla `prepared_reports`.
4. **Entrega Instantánea:** Cuando el usuario pide el reporte, el webhook solo envía el `media_id` ya existente.

## 4. Variables de Entorno Críticas
- `ARISE_MASTER_SERVICE_KEY`: Permisos totales para bypass de RLS.
- `META_API_VERSION`: v23.0 (Recomendado).
- `WHATSAPP_ACCESS_TOKEN`: Token de sistema permanente.

## 5. Limpieza y Mantenimiento
- Toda la lógica reside en `src/lib/pdf/`.
- El sistema ha sido purgado de branding legado y archivos basura.

---
## 6. Estado Operativo Platinum v10.4
- [x] **Identidad Visual (Luminous Pure):** Radios de 40px, fondos LOOP_GREEN, purga total de activos Arise.
- [x] **Regla Diamante:** PDF Pipeline delegando 100% de cálculos al motor SQL via financial_summaries.
- [x] **Identidad de Mensajería:** Footers "LOOP Platinum v10.4" y correos "agent@loop-os.ai".
- [ ] **Migración de Infraestructura:** Transición de ARISE_MASTER_SERVICE_KEY a LOOP_MASTER_SERVICE_KEY. [PENDIENTE - Prioridad Transitoria]

---
**Instrucción para NotebookLM:** Utiliza este manifiesto para guiar cualquier modificación en el sistema de reportes. Prioriza siempre la ejecución nativa sobre llamadas HTTP internas en Vercel.
