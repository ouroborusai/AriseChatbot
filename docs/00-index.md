# AriseChatbot - Índice de Documentación

| # | Documento | Descripción |
|---|------------|-------------|
| 00 | [00-index.md](./00-index.md) | Índice y resumen |
| 01 | [01-database-schema.md](./01-database-schema.md) | Estructura de Base de Datos (Supabase) |
| 02 | [02-webhook-whatsapp.md](./02-webhook-whatsapp.md) | Webhook de WhatsApp (entrada de mensajes) |
| 03 | [03-whatsapp-sending.md](./03-whatsapp-sending.md) | Envío a WhatsApp (Meta Graph API) |
| 04 | [04-gemini-ai.md](./04-gemini-ai.md) | Gemini AI (System Prompt) |
| 05 | [05-media-images.md](./05-media-images.md) | Gestión de Imágenes y Media |
| 06 | [06-templates-actions.md](./06-templates-actions.md) | Templates y Actions (botones/listas) |
| 07 | [07-meta-auth.md](./07-meta-auth.md) | Autenticación y Tokens de Meta |
| 08 | [08-supabase-storage.md](./08-supabase-storage.md) | Supabase Storage (upload/download) |
| 09 | [09-24-hour-window.md](./09-24-hour-window.md) | Ventana de 24 Horas |
| 10 | [10-gemini-structured.md](./10-gemini-structured.md) | Gemini Structured Outputs |

---

## Resumen por Función

### Recepción de Mensajes (Entrada)
- **02-webhook-whatsapp.md**: Recibe mensajes de WhatsApp Cloud API
- Valida webhook con token
- Extrae text, interactive, image, document

### Envío de Mensajes (Salida)
- **03-whatsapp-sending.md**: Envia texto, botones, listas, documentos, imágenes
- Meta Graph API v25.0
- Límites: 3 botones, 4096 caracteres

### IA (Fallback)
- **04-gemini-ai.md**: System Prompt + Gemini API
- AGENT_PROMPT.md define comportamiento
- Fallback a OpenAI si falla

### Media (Imágenes)
- **05-media-images.md**: Por implementar (descarga)
- Envío ya implementado en 03

### Templates (Flujo)
- **06-templates-actions.md**: Plantillas con acciones
- Condiciones en actions (requires_document, etc.)
- Navegación por next_template_id

### Datos
- **01-database-schema.md**: Todas las tablas
- contacts, companies, conversations, messages, client_documents, templates

---

## Flujo Principal

```
┌─────────────────────────────────────┐
│  WhatsApp Cloud API                 │
│  (Meta servidor)                    │
└─────────────────┬───────────────────┘
                  │
                  ▼ POST /api/webhook
┌─────────────────────────────────────┐
│  02-webhook-whatsapp.md             │
│  handleInboundUserMessage()        │
└─────────────────┬───────────────────┘
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
   Clasificación  Templates   Gemini
        │    (06)    │   (04)
        ▼           ▼         ▼
┌─────────────────────────────────────┐
│  03-whatsapp-sending.md             │
│  sendWhatsAppMessage()              │
│  sendWhatsAppInteractiveButtons()  │
│  sendWhatsAppListMessage()         │
└─────────────────┬───────────────────┘
                  │
                  ▼ POST Meta Graph API
┌─────────────────────────────────────┐
│  WhatsApp del Usuario              │
└─────────────────────────────────────┘
```

---

## Variables de Entorno

| # | Variable | Archivo | Descripción |
|---|----------|---------|-------------|
| 1 | WHATSAPP_ACCESS_TOKEN | 02, 03 | Token de Meta |
| 2 | WHATSAPP_PHONE_NUMBER_ID | 02, 03 | Phone ID |
| 3 | WHATSAPP_VERIFY_TOKEN | 02 | Verificación webhook |
| 4 | WHATSAPP_WEBHOOK_SECRET | 02 | Firma seguridad |
| 5 | GEMINI_API_KEY | 04 | Google AI |
| 6 | AI_BACKEND | 04 | gemini/openai/ollama |
| 7 | OPENAI_API_KEY | 04 | OpenAI (respaldo) |
| 8 | SUPABASE_URL | 01 | URL Supabase |
| 9 | SUPABASE_SERVICE_KEY | 01 | Service role key |