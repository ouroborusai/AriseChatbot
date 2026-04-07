# 📋 PLAN DE ANÁLISIS - AriseChatbot WhatsApp

## 📊 VISIÓN GENERAL DEL PROYECTO

**AriseChatbot** es un sistema de chat automático con WhatsApp que:
- Recibe mensajes desde WhatsApp Cloud API
- Procesa los mensajes con IA (Gemini/OpenAI)
- Guarda toda la conversación en Supabase
- Envía respuestas automáticas de vuelta a WhatsApp

---

## 🏗️ ARQUITECTURA DEL SISTEMA

```
WhatsApp Cloud API
        ↓ (webhook POST)
   [API Route: /api/webhook]
        ↓
   [Webhook Handler]
        ├─→ 1. getOrCreateContact()         [DB: contacts]
        ├─→ 2. getOrCreateConversation()   [DB: conversations]
        ├─→ 3. saveMessage(user)           [DB: messages]
        ├─→ 4. getConversationHistory()    [DB: messages]
        ├─→ 5. generateAssistantReply()    [AI: Gemini/OpenAI/Ollama]
        ├─→ 6. saveMessage(assistant)      [DB: messages]
        └─→ 7. sendWhatsAppMessage()       [WhatsApp API]
```

---

## 🔑 COMPONENTES CLAVE

### 1️⃣ ENTRYPOINT: `/api/webhook` (route.ts)
**Ubicación:** `app/api/webhook/route.ts`

**Responsabilidades:**
- GET: Verifica credenciales al conectar con WhatsApp
- POST: Recibe eventos de mensajes de WhatsApp

**Variables de entorno requeridas:**
```
WHATSAPP_VERIFY_TOKEN      # Token para verificación del webhook
WHATSAPP_ACCESS_TOKEN      # Token para enviar mensajes
WHATSAPP_PHONE_NUMBER_ID   # ID de número de teléfono en Meta
```

**Flujo:**
1. Extrae array de `entry` del payload
2. Itera sobre `changes` → `messages`
3. Filtra solo mensajes de tipo "text"
4. Llama a `handleInboundUserMessage()`

---

### 2️⃣ CORE LOGIC: `handleInboundUserMessage()` (webhook-handler.ts)
**Ubicación:** `lib/webhook-handler.ts`

**7 Pasos en secuencia:**

| Paso | Función | Tabla DB | Descripción |
|------|---------|----------|-------------|
| 1 | `getOrCreateContact()` | contacts | Busca/crea contacto por teléfono |
| 2 | `getOrCreateConversation()` | conversations | Busca/crea conversación |
| 3 | `saveMessage('user')` | messages | Guarda mensaje del usuario |
| 4 | `getConversationHistory()` | messages | Obtiene historial completo |
| 5 | `generateAssistantReply()` | N/A (IA) | Genera respuesta con IA |
| 6 | `saveMessage('assistant')` | messages | Guarda respuesta del bot |
| 7 | `sendWhatsAppMessage()` | N/A (API) | Envía respuesta a WhatsApp |

**Validaciones:**
- Solo procesa mensajes de tipo "text"
- Valida que tenga teléfono y contenido
- Ignora números configurados en `WHATSAPP_IGNORE_INBOUND_FROM`

---

### 3️⃣ SERVICIO WhatsApp: `whatsapp-service.ts`
**Ubicación:** `lib/whatsapp-service.ts`

**Función Principal:** `sendWhatsAppMessage(phoneNumber, message)`

**Proceso:**
1. Valida token y credenciales
2. Formatea número (elimina ceros iniciales)
3. Construye payload para Meta Graph API v25.0
4. Maneja errores específicos (tokens expirados)
5. Trunca mensajes a 4096 caracteres

**Endpoint Meta:**
```
POST https://graph.facebook.com/v25.0/{PHONE_NUMBER_ID}/messages
Authorization: Bearer {ACCESS_TOKEN}
```

**Error handling:**
- Código 190 + subcode 463 = Token expirado
- Incluye logs detallados para debugging

---

### 4️⃣ SERVICIO IA: `ai-service.ts`
**Ubicación:** `lib/ai-service.ts`

**Backends soportados (en este orden de intento):**

| Backend | Enviroment Variable | Modelo |
|---------|-------------------|--------|
| **Gemini** | `GEMINI_API_KEY` | Configurable en `gemini-model.ts` |
| **OpenAI** | `OPENAI_API_KEY` | `gpt-4` (default) |
| **Ollama** | `OLLAMA_API_URL` | Local `http://127.0.0.1:11434` |

**Función:** `generateAssistantReply(systemPrompt, history, latestUserText)`

**Parámetros:**
- `systemPrompt`: Instrucciones del sistema (from `AGENT_PROMPT.md`)
- `history`: Array de mensajes previos `[{role, content}, ...]`
- `latestUserText`: Último mensaje del usuario

**Fallback automático:**
- Si `AI_BACKEND` = "gemini" pero falla → NO intenta fallback
- Si `AI_BACKEND` not set → intenta Gemini primero, luego OpenAI
- Si ambas fallan → error

---

### 5️⃣ SERVICIO BD: `database-service.ts`
**Ubicación:** `lib/database-service.ts`

**Funciones principales:**

#### `getOrCreateContact(phoneNumber)`
- Busca contacto en tabla `contacts`
- Si existe: actualiza `last_message_at`
- Si no existe: crea uno nuevo
- Retorna: `Contact` object

#### `getOrCreateConversation(phoneNumber, contactId)`
- Busca conversación por `phone_number`
- Si existe: actualiza metadatos
- Si no existe: crea con `is_open: true`
- Retorna: `conversationId` (UUID)

#### `getConversationHistory(phoneNumber)`
- Obtiene todos los mensajes de la conversación
- Retorna ordenados por `created_at` (ascendente)
- Formato: `[{role: 'user'|'assistant', content}, ...]`

#### `saveMessage(conversationId, role, content)`
- Inserta mensaje en tabla `messages`
- `role`: 'user' o 'assistant'
- Se usa en pasos 3 y 6 del webhook

---

### 6️⃣ ADMINISTRACIÓN SUPABASE: `supabase-admin.ts`
**Ubicación:** `lib/supabase-admin.ts`

**Variables de entorno:**
```
SUPABASE_URL      # https://xxxx.supabase.co
SUPABASE_ANON_KEY # Token público (JWT-based)
```

**Función:** `getSupabaseAdmin()`
- Retorna cliente Supabase con credenciales admin
- Usa `@supabase/ssr` para manejo seguro
- Todas las operaciones lo usan

---

## 🗄️ BASE DE DATOS (SCHEMA)

**Ubicación:** `supabase/schema.sql`

### Tabla: `contacts`
```sql
id              UUID PRIMARY KEY
phone_number    TEXT UNIQUE NOT NULL
name            TEXT
email           TEXT
segment         TEXT (sector/categoría del contacto)
location        TEXT
tags            TEXT[] (etiquetas)
notes           TEXT
is_blocked      BOOLEAN (para bloquear contactos)
last_message_at TIMESTAMPTZ (última interacción)
purchase_history JSONB (historial de compras)
metadata        JSONB (datos adicionales)
created_at      TIMESTAMPTZ (auto)
updated_at      TIMESTAMPTZ (auto - con TRIGGER)
```

### Tabla: `conversations`
```sql
id               UUID PRIMARY KEY
phone_number     TEXT UNIQUE NOT NULL
contact_id       UUID FK → contacts(id)
is_open          BOOLEAN
first_response_at TIMESTAMPTZ
last_response_at TIMESTAMPTZ
message_count    INT (se actualiza con trigger)
created_at       TIMESTAMPTZ (auto)
updated_at       TIMESTAMPTZ (auto - con TRIGGER)
```

### Tabla: `messages`
```sql
id              UUID PRIMARY KEY
conversation_id UUID FK → conversations(id) ON DELETE CASCADE
role            TEXT CHECK IN ('user', 'assistant')
content         TEXT
created_at      TIMESTAMPTZ (auto)
```

**Índices:**
```sql
idx_contacts_phone              → rápido buscar por teléfono
idx_conversations_phone         → rápido buscar conversación
idx_messages_conversation_id    → rápido buscar mensajes de una conversación
```

**TRIGGERS:**
```sql
update_contacts_updated_at      → Actualiza updated_at al modificar
update_conversations_updated_at → Actualiza updated_at al modificar
```

**RLS:** DESHABILITADO en desarrollo (revisar para producción)

---

## 🔧 FLUJOS DE DATOS

### ➡️ FLUJO ENTRADA: WhatsApp → Bot → BD → IA → WhatsApp

```
1. WEBHOOK RECIBIDO
   POST /api/webhook
   {
     "entry": [{
       "changes": [{
         "field": "messages",
         "value": {
           "messages": [{
             "id": "wamid.xxx",
             "from": "5491234567890",
             "type": "text",
             "text": { "body": "Hola, necesito ayuda" }
           }],
           "contacts": [{
             "profile": { "name": "Juan" }
           }]
         }
       }]
     }]
   }

2. EXTRACCIÓN
   ├─ msgId: "wamid.xxx"
   ├─ phoneNumber: "5491234567890"
   ├─ type: "text"
   └─ text: "Hola, necesito ayuda"

3. VALIDACIONES
   ├─ ¿Es texto? ✓
   ├─ ¿Tiene teléfono? ✓
   ├─ ¿No es número ignorado? ✓
   └─ → Procesar

4. BD - CREAR/BUSCAR CONTACTO
   SELECT * FROM contacts WHERE phone_number = '5491234567890'
   → Si no existe: INSERT con phone_number + last_message_at
   → Retorna: contact.id = 'uuid-xxx'

5. BD - CREAR/BUSCAR CONVERSACIÓN
   SELECT * FROM conversations WHERE phone_number = '5491234567890'
   → Si no existe: INSERT con contact_id + is_open: true
   → Retorna: conversation.id = 'conv-uuid-yyy'

6. BD - GUARDAR MENSAJE USUARIO
   INSERT INTO messages (conversation_id, role, content)
   VALUES ('conv-uuid-yyy', 'user', 'Hola, necesito ayuda')

7. BD - OBTENER HISTORIAL
   SELECT role, content FROM messages
   WHERE conversation_id = 'conv-uuid-yyy'
   ORDER BY created_at ASC
   → Retorna: [
       {role: 'user', content: 'Mensaje anterior 1'},
       {role: 'assistant', content: 'Respuesta anterior 1'},
       {role: 'user', content: 'Hola, necesito ayuda'}
     ]

8. IA - GENERAR RESPUESTA
   generateAssistantReply(
     systemPrompt: "Eres un asistente...",
     history: [... 3 mensajes],
     latestUserText: "Hola, necesito ayuda"
   )
   → Backend: Gemini/OpenAI/Ollama
   → Modelo: Envía systemPrompt + history + latest
   → Respuesta: "Claro, ¿en qué puedo ayudarte?"

9. BD - GUARDAR RESPUESTA BOT
   INSERT INTO messages (conversation_id, role, content)
   VALUES ('conv-uuid-yyy', 'assistant', 'Claro, ¿en qué puedo ayudarte?')

10. WHATSAPP - ENVIAR RESPUESTA
    POST https://graph.facebook.com/v25.0/{PHONE_NUMBER_ID}/messages
    {
      "messaging_product": "whatsapp",
      "to": "5491234567890",
      "type": "text",
      "text": {
        "preview_url": false,
        "body": "Claro, ¿en qué puedo ayudarte?"
      }
    }
    → Status: 200 OK
    → Response: { "message_id": "xxx", "contacts": [...] }
```

---

## 📡 API ROUTES (Otros endpoints)

### `GET/POST /api/contacts`
**Para:** Listar/crear contactos manualmente
**Variables:** Requiere `SUPABASE_ANON_KEY`

### `POST /api/test-ai`
**Para:** Probar IA sin WhatsApp
**Payload:** `{ "message": "Tu mensaje", "backend": "gemini" }`

### `POST /api/test-message`
**Para:** Test completo (guardar + responder)
**No necesita:** Token WhatsApp

### `GET /api/metrics`
**Para:** Estadísticas del sistema
**Retorna:** `{ totalContacts, totalMessages, activeConversations, ... }`

### `GET /api/health`
**Para:** Verificar si el sistema está UP
**Retorna:** Status, variables de entorno validadas

---

## 🔑 VARIABLES DE ENTORNO REQUERIDAS

### WhatsApp
```
WHATSAPP_ACCESS_TOKEN         # Token para enviar mensajes (Bearer)
WHATSAPP_PHONE_NUMBER_ID      # ID del teléfono en Meta
WHATSAPP_VERIFY_TOKEN         # Token para verificación del webhook
WHATSAPP_IGNORE_INBOUND_FROM  # (Opcional) Números a ignorar
```

### IA
```
# Uno de estos es REQUERIDO:
GEMINI_API_KEY        # Google Gemini
OPENAI_API_KEY        # OpenAI
OLLAMA_API_URL        # Local Ollama (opcional)
OLLAMA_MODEL          # Modelo de Ollama (default: llama2)

# Control de
 backend:
AI_BACKEND            # Fuerza: "gemini" | "openai" | "ollama"
OPENAI_MODEL          # Modelo OpenAI (default: gpt-4)
```

### Supabase
```
SUPABASE_URL          # https://xxxx.supabase.co
SUPABASE_ANON_KEY     # Clave pública (JWT)
```

### Sistema
```
NODE_ENV              # "development" | "production"
```

---

## 🎯 PUNTOS CLAVE PARA MODIFICACIÓN

### ❌ CAMBIAR: Lógica de procesamiento de mensajes
**Archivo:** `lib/webhook-handler.ts`
**Líneas:** 25-75
- Aquí es donde se definen los 7 pasos
- Puedes agregar validaciones adicionales
- Puedes cambiar el orden de operaciones

### ❌ CAMBIAR: Formato de envío a WhatsApp
**Archivo:** `lib/whatsapp-service.ts`
**Líneas:** 55-80
- Estructura del payload
- Truncamiento de mensajes (4096 chars)
- Manejo de números telefónicos

### ❌ CAMBIAR: Lógica de IA
**Archivo:** `lib/ai-service.ts`
**Líneas:** 15-80
- Qué backend usar
- Parámetros de temperatura, modelos
- Manejo de fallbacks

### ❌ CAMBIAR: Prompt del sistema
**Archivo:** `AGENT_PROMPT.md`
- Define el comportamiento del IA
- Cómo responde a los usuarios
- Instrucciones específicas

### ❌ AGREGAR: Nuevas campos a contactos
**Archivo:** `supabase/schema.sql`
- Tabla `contacts` ya tiene: `metadata JSONB`
- Puedes guardar datos adicionales ahí
- O agregar nuevas columnas

### ⚠️ IMPORTANTE: RLS (Row Level Security)
**Estado actual:** DESHABILITADO (desarrollo)
**Para Producción:**
- Habilitar RLS en Supabase console
- Definir políticas por rol
- Proteger acceso a datos

---

## 🐛 DEBUGGING: Dónde buscar logs

### Webhook recibido
```
app/api/webhook/route.ts → console.log('Webhook recibido')
```

### Procesamiento mensaje
```
lib/webhook-handler.ts → console.log con numerados (1-7)
```

### Database
```
lib/database-service.ts → console.log con [DB]
```

### IA
```
lib/ai-service.ts → console.log con [AI]
lib/gemini-model.ts → console.log con [AI/Gemini]
```

### WhatsApp
```
lib/whatsapp-service.ts → console.log con [WhatsApp]
```

---

## 🚀 TECNOLOGÍAS USADAS

| Tecnología | Versión | Propósito |
|------------|---------|----------|
| **Next.js** | 14.2.15 | Framework fullstack |
| **React** | 18 | UI/Frontend |
| **TypeScript** | 5 | Type safety |
| **Supabase** | 2.45.4 | Database + Auth |
| **Gemini AI** | 0.24.1 | IA generativa (opción 1) |
| **OpenAI** | 4.77.0 | IA generativa (opción 2) |
| **Tailwind CSS** | 3.4.19 | Estilos |

---

## 📝 TAREAS COMUNES

### ✅ Agregar nuevo campo a contacto
1. Editar `supabase/schema.sql` → ADD COLUMN
2. Ejecutar en SQL Editor de Supabase
3. Usar `metadata JSONB` en lugar de columnas (más flexible)

### ✅ Cambiar prompt del IA
1. Editar `AGENT_PROMPT.md`
2. Cambios aplicados al siguiente mensaje recibido
3. NO requiere restart

### ✅ Cambiar backend de IA
1. Editar `.env.local` → `AI_BACKEND`
2. O agregar condición en `lib/ai-service.ts`

### ✅ Ver historial de conversación de un contacto
1. Supabase Console → `messages` table
2. Filter: `conversation_id` (obtener de `conversations`)
3. O usar API `/api/contacts?phone=xxx`

### ✅ Debug de un webhook fallido
1. Ver logs en terminal (`npm run dev`)
2. Buscar `[Webhook]` logs
3. Verificar que `WHATSAPP_*` env vars estén configuradas

---

## 🔐 SEGURIDAD - CHECKLIST

- [ ] `WHATSAPP_ACCESS_TOKEN` no está en código
- [ ] `GEMINI_API_KEY` / `OPENAI_API_KEY` no están en código
- [ ] RLS habilitado en Supabase (producción)
- [ ] `.env.local` en `.gitignore`
- [ ] Tokens rotados regularmente
- [ ] Solo números autorizados pueden enviar mensajes

---

**Documento actualizado:** 2026-04-05
**Versión:** 1.0
