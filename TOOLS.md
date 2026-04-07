# Registro de Herramientas y Scripts - AriseChatbot

Este archivo lista las herramientas y scripts existentes en el proyecto para tareas de desarrollo y pruebas.

## Scripts y pruebas disponibles

### `test-ai.js`
- Propósito: Probar la generación de respuestas de IA sin enviar mensaje a WhatsApp.
- Uso típico: `node test-ai.js "Hola, ¿puedes ayudarme?"`
- Ideal para: Validar que Gemini/OpenAI responda correctamente.

### `test-gemini.js`
- Propósito: Pruebas específicas de Gemini.
- Uso típico: `node test-gemini.js`
- Ideal para: Confirmar que el backend de Gemini esté configurado y funcionando.

### `test-message.js`
- Propósito: Probar flujo completo de guardar mensaje y generar respuesta.
- Uso típico: `node test-message.js`
- Ideal para: Validar la integración de DB + IA.

### `test-webhook-meta.js`
- Propósito: Simular un webhook de Meta/WhatsApp.
- Uso típico: `node test-webhook-meta.js`
- Ideal para: Validar el endpoint `/api/webhook` y el procesamiento de mensajes.

### `test-webhook.json`
- Propósito: Payload de ejemplo para webhook.
- Uso típico: Revisar estructura para pruebas manuales o scripts.
- Ideal para: Construir payloads de prueba o debugging.

## Documentación interna útil

- `WHATSAPP_ASSISTANT_SKILL.md` — Guía para el asistente y patrones de código.
- `WHATSAPP_UX_STRATEGY.md` — Estrategia de UX para mejorar respuestas de WhatsApp.
- `ANALYSIS_PLAN.md` — Análisis completo del sistema.
- `QUICK_REFERENCE.md` — Guía rápida y mapa de archivos.
- `TOOLBOX_INVENTORY.md` — Dependencias y herramientas del proyecto.

## Comandos de desarrollo

### Next.js
- `npm run dev` — Inicia el servidor local de desarrollo.
- `npm run build` — Compila el proyecto para producción.
- `npm run start` — Arranca el servidor en modo producción.
- `npm run lint` — Ejecuta el linting.

## Recomendaciones de uso

- Actualiza `.env.local` localmente para pruebas.
- Si estás en Vercel, también debes actualizar las variables de entorno en el dashboard.
- Usa el archivo `WHATSAPP_UX_STRATEGY.md` antes de cambiar flujo de interacción.
- Mantén el prompt en `AGENT_PROMPT.md` corto y directo.
