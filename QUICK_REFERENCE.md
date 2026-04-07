# 🗺️ GUIA DE REFERENCIA RÁPIDA - AriseChatbot

## MAPA DE ARCHIVOS (Dónde buscar qué)

```
c:\Users\s_pk_\Desktop\AgenteMTZ\
│
├─ 📄 DOCUMENTACIÓN
│  ├─ ANALYSIS_PLAN.md              👈 LEE PRIMERO: Plan completo
│  ├─ WHATSAPP_ASSISTANT_SKILL.md   👈 Guía para el asistente IA
│  ├─ TOOLBOX_INVENTORY.md          👈 Herramientas y dependencias
│  ├─ THIS FILE (QUICK_REFERENCE.md) 👈 Guía rápida (ESTE archivo)
│  ├─ README.md                      Setup inicial
│  ├─ AGENT_PROMPT.md                Prompt del sistema IA
│  ├─ SUPABASE_SQL_GUIDE.md          Guía SQL
│  └─ package.json                   Dependencies
│
├─ 🚀 CÓDIGO - BACKEND (lib/)
│  ├─ webhook-handler.ts       ⭐ CORE: 7 pasos de procesamiento
│  ├─ whatsapp-service.ts      ⭐ Envía a Meta API (messaging)
│  ├─ ai-service.ts            ⭐ Orquesta Gemini/OpenAI/Ollama
│  ├─ database-service.ts      ⭐ CRUD de BD (contacts, messages)
│  ├─ gemini-model.ts          Configuración específica de Gemini
│  ├─ supabase-admin.ts        Cliente de Supabase (bajo nivel)
│  ├─ utils.ts                 Utilidades (formateo, validación)
│  └─ supabase/
│     ├─ client.ts             Cliente Supabase browser
│     └─ server.ts             Cliente Supabase servidor
│
├─ 🔌 CÓDIGO - API ROUTES (app/api/)
│  ├─ webhook/
│  │  └─ route.ts              ⭐ GET/POST webhook de WhatsApp
│  ├─ contacts/
│  │  └─ route.ts              GET contactos, POST crear
│  ├─ test-ai/
│  │  └─ route.ts              POST test de IA sin WhatsApp
│  ├─ metrics/
│  │  └─ route.ts              GET estadísticas
│  └─ health/
│     └─ route.ts              GET health status
│
├─ 🎨 CÓDIGO - FRONTEND (app/)
│  ├─ page.tsx                 Home page
│  ├─ layout.tsx               Layout base
│  ├─ globals.css              Estilos globales
│  ├─ middleware.ts            Middleware de autenticación
│  ├─ login/
│  │  └─ page.tsx              Login page
│  ├─ dashboard/
│  │  ├─ page.tsx              Dashboard principal
│  │  ├─ layout.tsx            Layout del dashboard
│  │  ├─ system-status-panel    Panel de estado
│  │  └─ metrics/
│  │     └─ page.tsx           Página de métricas
│  └─ components/
│     ├─ ConversationList.tsx  Lista de conversaciones
│     └─ MessageView.tsx       Vista de mensajes
│
├─ 🗄️ DATABASE SCHEMA (supabase/)
│  ├─ schema.sql               ⭐ Estructura 3 tablas (READ FIRST!)
│  └─ cleanup-database.sql     Script para limpiar datos
│
├─ ⚙️ CONFIG
│  ├─ tsconfig.json            TypeScript config
│  ├─ next.config.js           Next.js config
│  ├─ tailwind.config.ts       Tailwind CSS
│  ├─ postcss.config.mjs       PostCSS config
│  └─ .env.local               👈 SECRETO: Variables de entorno
│
└─ 🧪 TESTING
   ├─ test-webhook.json        Payload de ejemplo
   ├─ test-ai.js               Test IA
   ├─ test-message.js          Test completo
   └─ test-gemini.js           Test Gemini
```

---

## ⚡ RESPUESTAS RÁPIDAS

### Q: "¿Cómo funcionan los mensajes de WhatsApp?"
**A:** 
1. Llegan POST a `/api/webhook/route.ts` (línea 15)
2. Se procesan en `lib/webhook-handler.ts` (7 pasos)
3. Se guardan en BD y se responde con IA
4. Se envía respuesta vía `lib/whatsapp-service.ts`

**Mapa:**
```
WhatsApp POST → route.ts → webhook-handler.ts → [4 servicios] → WhatsApp response
```

---

### Q: "¿Dónde está el prompt del IA?"
**A:** `AGENT_PROMPT.md`
```
Cambios aplican al SIGUIENTE mensaje (sin restart)
Solo si modificas el archivo
```

---

### Q: "¿Cómo cambio de Gemini a OpenAI?"
**A:** Dos opciones:

**Opción 1 - Rápida (env variable):**
```
.env.local:
AI_BACKEND=openai
OPENAI_API_KEY=sk-...
```

**Opción 2 - Permanente (código):**
```
lib/ai-service.ts línea 22
Editar la lógica de fallback
```

---

### Q: "¿Dónde está el historial de mensajes?"
**A:** 
```
Supabase → tabla "messages"
Filtrar por conversation_id
SELECT role, content FROM messages 
WHERE conversation_id = 'xxx' 
ORDER BY created_at ASC
```

---

### Q: "¿Cómo agregar un nuevo campo a contactos?"
**A:** 

**Opción FLEXIBLE (recomendada):**
```
Usa: contacts.metadata (JSONB)
Archivo: lib/database-service.ts línea 50
Guardar: metadata: { campo_nuevo: value }
No requiere migración SQL
```

**Opción PERMANENTE:**
```
1. Editar: supabase/schema.sql
2. ADD COLUMN nuevo_campo TEXT;
3. Ejecutar en Supabase SQL Editor
4. Actualizar lib/database-service.ts
```

---

### Q: "¿Cómo debug si algo falla?"
**A:**
```
Terminal: npm run dev
Busca logs por prefijo:
  [Webhook] - Payload got
  [DB] - Database operations
  [WhatsApp] - API errors
  [AI] - IA generation
  [AI/Gemini] - Específico Gemini
```

---

### Q: "¿Dónde está el mecanismo de validación?"
**A:**
```
webhook-handler.ts líneas 10-25
- Valida que sea texto
- Valida que tenga phone_number
- Puede ignorar números específicos
Agrega más validaciones allí
```

---

### Q: "¿Cómo limitar respuestas de IA a X caracteres?"
**A:**
```
lib/whatsapp-service.ts líneas 70-75
Actualmente: trunca a 4096 char (límite Meta)
Editar: const bodyText = message.length > [NÚMERO] ? message.slice(0, [NÚMERO]) + '...' : message;
```

---

### Q: "¿Cómo ver las métricas?"
**A:**
```
Endpoint: GET /api/metrics
URL: http://localhost:3000/api/metrics
Dashboard: http://localhost:3000/dashboard/metrics
```

---

## 🔥 CAMBIOS MÁS COMUNES

| Quiero... | Archivo | Línea | Dificultad |
|-----------|---------|-------|-----------|
| Cambiar prompt IA | AGENT_PROMPT.md | Todo | ⭐ Fácil |
| Cambiar backend IA | .env.local | - | ⭐ Fácil |
| Agregar validación | webhook-handler.ts | 10-25 | ⭐ Fácil |
| Cambiar formato mensaje | whatsapp-service.ts | 55-80 | ⭐ Fácil |
| Agregar campo contacto | database-service.ts | 50 | ⭐⭐ Medio |
| Nueva tabla BD | supabase/schema.sql | - | ⭐⭐ Medio |
| Cambiar lógica core | webhook-handler.ts | 25-75 | ⭐⭐⭐ Difícil |
| Agregar nueva API | app/api/[nueva] | - | ⭐⭐⭐ Difícil |

---

## 🧭 NAVEGACIÓN VISUAL

### Entrada de un mensaje
```
┌──────────────────────────────────────────────┐
│ WhatsApp envia mensaje a tu número           │
└──────────────────────────────────────────────┘
                    ⬇️
┌──────────────────────────────────────────────┐
│ app/api/webhook/route.ts                     │
│ Verifica token, extrae payload               │
└──────────────────────────────────────────────┘
                    ⬇️
┌──────────────────────────────────────────────┐
│ lib/webhook-handler.ts                       │
│ 7 pasos: contacto → conversación → IA → send│
└──────────────────────────────────────────────┘
          ⬇️         ⬇️        ⬇️      ⬇️
    Paso 1-3   Paso 4      Paso 5   Paso 6-7
          │       │          │        │
          ▼       ▼          ▼        ▼
┌─────────────┐ BD  ┌──────────────┐ Send
│  database   │◄────│  ai-service  │ Message
│  -service   │     │  (Gemini)    │  ▼
└─────────────┘     └──────────────┘ whatsapp
      BD                  IA          -service
  (save/read)         (generate)    (send to Meta)
```

---

## 🎯 PUNTOS CRÍTICOS DE MODIFICACIÓN

### 1. VALIDACIONES (Bloquea mensajes)
```typescript
// lib/webhook-handler.ts línea 10-25
if (msgType !== 'text') return;         // Solo texto
if (!text || !phoneNumber) return;      // Valida campos
if (ignoreFrom && ...) return;          // Ignora números
// AGREGAR AQUÍ nuevas validaciones
```

### 2. FLUJO DE 7 PASOS (Procesamiento)
```typescript
// lib/webhook-handler.ts línea 30-75
// 1. getOrCreateContact()              # BD: find/create contacto
// 2. getOrCreateConversation()         # BD: find/create conversación
// 3. saveMessage('user')               # BD: guardar mensaje
// 4. getConversationHistory()          # BD: obtener historial
// 5. generateAssistantReply()          # IA: generar respuesta
// 6. saveMessage('assistant')          # BD: guardar respuesta
// 7. sendWhatsAppMessage()             # API: enviar a WhatsApp
// NO CAMBIES EL ORDEN sin entender consecuencias
```

### 3. CREDENCIALES (NUNCA HARDCODE)
```typescript
// lib/ai-service.ts línea 22
const backend = process.env.AI_BACKEND?.trim().toLowerCase();

// lib/whatsapp-service.ts línea 30-31
const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

// SIEMPRE USA process.env, NUNCA hardcode
```

### 4. TABLA HISTÓRICO (Core DB)
```typescript
// lib/database-service.ts línea 115-125
// Esta tabla guarda TODO el historial de mensajes
// Es el "cerebro" de la conversación
// Si la corrupts, pierde contexto
// Hacer backup antes de modificar schema
```

---

## 🚀 WORKFLOW: CAMBIO TÍPICO

### Cambio: "Quiero que el bot responda diferente"

**Paso 1: UBICAR**
```
¿Es cambio de comportamiento? → AGENT_PROMPT.md
¿Es cambio de lógica? → lib/ai-service.ts
¿Es cambio de formato? → lib/whatsapp-service.ts
```

**Paso 2: ENCONTRAR LÍNEA**
```
Abrir archivo
Buscar (Ctrl+F): palabra clave
```

**Paso 3: ENTENDER CONTEXTO**
```
Leer 10 líneas antes y después
Entender qué hace
```

**Paso 4: MODIFICAR**
```
Cambiar código
Guardar archivo
```

**Paso 5: TESTING**
```
npm run dev
Enviar mensaje de prueba a WhatsApp
Ver logs en terminal
```

**Paso 6: SI FALLA**
```
Buscar error en logs
Revertir cambio
Intentar de nuevo
```

---

## ⚖️ TABLA COMPARATIVA: Archivos vs Responsabilidad

```
┌────────────────────────────────────────────────────────────┐
│ ARCHIVO                  │ RESPONSABILIDAD                  │
├────────────────────────────────────────────────────────────┤
│ route.ts (webhook)       │ Recibir POST → validar token    │
│ webhook-handler.ts       │ Orquestar 7 pasos              │
│ database-service.ts      │ Guardar/leer en BD             │
│ ai-service.ts            │ Llamar backend IA              │
│ whatsapp-service.ts      │ Enviar a Meta API              │
│ gemini-model.ts          │ Config específica de Gemini    │
│ AGENT_PROMPT.md          │ Instrucciones del sistema      │
│ schema.sql               │ Estructura de BD               │
└────────────────────────────────────────────────────────────┘
```

---

## 🆘 TROUBLESHOOTING RÁPIDO

### "El webhook no recibe mensajes"
```
1. ¿Está corriendo el servidor? npm run dev
2. ¿El endpoint es correcto? https://TU_DOMINIO/api/webhook
3. ¿WHATSAPP_VERIFY_TOKEN es igual? Ver .env.local vs Meta console
4. ¿Está configurado en Meta? Meta → WhatsApp Settings → Webhooks
5. Ver logs: busca [Webhook] en terminal
```

### "La IA no responde"
```
1. ¿Tiene API key? Ver .env.local
2. ¿TOKEN expiró? Leer error [WhatsApp] code 190
3. ¿Es backend correcto? Ver AI_BACKEND
4. ¿La consulta llegó? Buscar [AI] en logs
5. Test directamente: POST /api/test-ai
```

### "BD tiene error"
```
1. ¿Las variables están OK? SUPABASE_URL, SUPABASE_ANON_KEY
2. ¿Las tablas existen? Supabase console → tables
3. ¿RLS bloqueando? ALTER TABLE ... DISABLE RLS
4. Ver error exacto: busca [DB] Error en logs
5. Ejecutar schema.sql de nuevo: supabase/schema.sql
```

### "No aparece logging"
```
1. El logger usa prefijo [Componente]
2. Buscar por [Webhook], [DB], [AI], [WhatsApp]
3. Terminal debe mostrar console.log
4. Si no ve logs: npm run dev (no en produción)
```

---

## 📱 TESTEO RÁPIDO

### Test Sin WhatsApp (Gemini)
```bash
node test-ai.js
# Testea generación de respuesta directamente
```

### Test Con Webhook Simulado
```bash
node test-webhook-meta.js
# Simula un mensaje de WhatsApp
```

### Test Completo
```bash
curl -X POST http://localhost:3000/api/test-message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola", "phone": "5491234567890"}'
```

### Ver Logs en Vivo
```bash
npm run dev  # Abre terminal 1
# Envía mensajes en terminal 2, ve logs en terminal 1
```

---

## 📖 DOCUMENTACIÓN INTERNA

| Archivo | Para Qué | Cuándo Leer |
|---------|----------|------------|
| ANALYSIS_PLAN.md | Entender la arquitectura completa | Antes de cualquier cambio |
| WHATSAPP_ASSISTANT_SKILL.md | Guide al asistente IA | Input al agente GitHub Copilot |
| TOOLBOX_INVENTORY.md | Ver qué tecnologías se usan | Para agregar nuevas herramientas |
| QUICK_REFERENCE.md | Buscar algo rápido (ESTE ARCHIVO) | Búsquedas rápidas |
| AGENT_PROMPT.md | Ver/cambiar comportamiento del bot | Para tuning del IA |
| README.md | Setup y overview | Primera vez |

---

## 🎓 APRENDIZAJE PROGRESIVO

### Nivel 1: Usuario (Lo mínimo)
- Cambiar prompt → AGENT_PROMPT.md
- Ver configuración → .env.local
- Ver logs → npm run dev

### Nivel 2: Modificador (Cambios simples)
- Validaciones → webhook-handler.ts
- Formato → whatsapp-service.ts
- Backend IA → .env.local

### Nivel 3: Developer (Entender flujo completo)
- Leer: ANALYSIS_PLAN.md (1-2 horas)
- Entender BD → supabase/schema.sql
- Tracer flujo completo → workflow diagram

### Nivel 4: Architect (Agregar funcionalidad)
- Diseñar nuevas tablas
- Cambiar flujo de 7 pasos
- Agregar nuevas APIs
- Implementar microservicios

---

**Guía rápida actualizada:** 2026-04-05
**Versión:** 1.0
**Acesibilidad:** 📱 Móvil-friendly (MD format)
