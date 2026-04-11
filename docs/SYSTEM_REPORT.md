# Informe Técnico de Análisis del Sistema - Agente MTZ

**Fecha:** 2026-04-11
**Responsable:** Antigravity (Senior AI Developer)
**Estado del Proyecto:** Operativo - Fase de Optimización

## 1. Arquitectura del Núcleo (Core Architecture)

El sistema está construido sobre **Next.js 14** (App Router) y utiliza **Supabase** como backend-as-a-service y **WhatsApp Cloud API** para la capa de presentación.

### Orquestación de Mensajes (`lib/webhook-handler.ts`)
El flujo de entrada sigue una arquitectura de "Manejadores en Cascada" (Chain of Handlers):
1.  **Filtro Inbound**: Descarta mensajes de números ignorados.
2.  **Recuperación de Estado**: Sincroniza contacto, conversación y empresas en Supabase.
3.  **Manejo Interactivo**: Si el `id` de un botón coincide con un handler específico (RUT, Documentos, Clasificación), se interrumpe y responde.
4.  **Motor de Plantillas**: Si el `id` coincide con una `Template`, dispara el motor de condiciones.
5.  **Procesamiento de Lenguaje Natural (IA)**: Como último recurso, si no hay coincidencia determinística, se delega a `handleAI`.

## 2. Componentes Críticos y Riesgos

### Motor de Condiciones (`lib/services/condition-engine.ts`)
*   **Función**: Evalúa si un usuario `prospecto` puede acceder a funciones de `cliente`.
*   **Riesgo**: La lógica de condiciones fragmentada en múltiples servicios puede causar incoherencias si no se centraliza.

### Manejo de la Persistencia (`lib/database-service.ts`)
*   **Función**: Abstracción total sobre las tablas `contacts`, `conversations`, `messages`, `companies`.
*   **Obervación Senior**: Se recomienda implementar una capa de cache (Redis o Memoria Local con TTL corto) para `getActiveCompanyForConversation` para reducir latencia en ráfagas de mensajes.

### Integración con AI (`lib/ai-service.ts`)
*   **Función**: Orquestación de Gemini/OpenAI.
*   **Estado**: Actualmente configurado con `AGENT_PROMPT.md` como base.
*   **Mejora**: Falta un sistema de "Tool Calling" robusto para que la IA dispare acciones de base de datos directamente (ej: "Muestra mis facturas" -> la IA llama a `getDocuments`).

## 3. Estado de la Documentación

| Documento | Estado | Calidad |
| :--- | :--- | :--- |
| `.instructions.md` | Actualizado | Alta (Define el flujo de 7 pasos) |
| `AGENT_PROMPT.md` | Actualizado | Media (Requiere ejemplos de One-shot) |
| `ANALYSIS_WORKFLOW.md` | **NUEVO** | Senior (Define cómo analizar el proyecto) |
| `CONTRIBUTING.md` | Pendiente | - |

## 4. Próximos Pasos Recomendados (Roadmap)

1.  **Refactorización de Logger**: Sustituir `console.log` por un logger estructurado (Winston o similar) que envíe trazas a Supabase o un servicio externo de monitoreo.
2.  **Validación de Payloads**: Implementar Zod para validar los objetos que llegan del Webhook de Meta.
3.  **Manual de Operaciones**: Crear una guía de solución rápida para errores comunes (`401 Unauthorized` de Meta, fallos de conexión de Supabase).

---
*Este análisis fue generado siguiendo el workflow de Antigravity.*
