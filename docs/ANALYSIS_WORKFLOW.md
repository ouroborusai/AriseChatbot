# Antigravity Analysis Workflow & Project Documentation

Este documento define el workflow estándar para el análisis y documentación sistemática del proyecto **AriseChatbot (MTZ Consultores)**.

## 1. Workflow de Análisis (ANTIGRAVITY_ANALYSIS_WORKFLOW)

Este workflow debe seguirse cada vez que se realice un análisis profundo del sistema.

### Fase 1: Reconocimiento (Investigación)
1.  **Listar Estructura**: Mapear directorios y archivos críticos.
2.  **Identificar Puntos de Entrada**: Localizar Webhooks, APIs y triggers.
3.  **Mapear Dependencias**: Revisar `package.json` y flujos de importación.

### Fase 2: Flujo de Datos
1.  **Seguimiento del Webhook**: Rastrear una petición desde `app/api/webhook/route.ts` hasta su respuesta.
2.  **Interacción con DB**: Analizar esquemas de Supabase y funciones en `lib/database-service.ts`.
3.  **Lógica de IA**: Revisar prompts, modelos y orquestación en `lib/ai-service.ts`.

### Fase 3: Documentación
1.  **Actualizar README**: Reflejar el estado actual del proyecto.
2.  **Documentar APIs**: Crear/Actualizar especificaciones de endpoints.
3.  **Mapeo de Errores**: Identificar puntos de fallo comunes y manejadores de excepciones.

---

## 2. Documentación del Sistema Actual

### Estructura de Directorios Críticos

| Directorio | Propósito |
| :--- | :--- |
| `app/api/webhook` | Punto de entrada principal para WhatsApp Cloud API. |
| `lib/` | Núcleo de la lógica del sistema (IA, DB, WhatsApp). |
| `lib/handlers/` | Manejadores específicos para diferentes tipos de mensajes/eventos. |
| `supabase/` | Migraciones y configuraciones de la base de datos. |

### Flujo de Mensajes (7 Pasos)

1.  **Recepción**: Webhook recibe POST de Meta.
2.  **Validación**: `webhook-handler.ts` verifica la integridad del mensaje.
3.  **Persistencia Inicial**: Se guarda el mensaje entrante en Supabase.
4.  **Recuperación de Contexto**: Se obtiene el historial del usuario.
5.  **Procesamiento IA**: `ai-service.ts` genera una respuesta basada en `AGENT_PROMPT.md`.
6.  **Envío**: `whatsapp-service.ts` entrega la respuesta a Meta.
7.  **Persistencia Final**: Se guarda la respuesta enviada en Supabase.

### Puntos de Mejora Detectados
*   [ ] Centralizar la configuración de modelos de IA.
*   [ ] Mejorar el logging en `webhook-handler.ts` para debugging en producción.
*   [ ] Implementar validación estricta de tipos en los payloads de WhatsApp.
