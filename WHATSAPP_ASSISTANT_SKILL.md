# 🤖 WHATSAPP ASSISTANT SKILL - Especialización para AriseChatbot

## Propósito
Este skill define cómo tu asistente (GitHub Copilot) debe entender, navegar y realizar cambios en el codebase de **AriseChatbot**, un sistema de chatbot con WhatsApp, IA y Supabase.

---

## 📚 ESTRUCTURA DE COMPRENSIÓN

### Nivel 1: El Flujo Grande
El asistente debe SIEMPRE recordar:
```
WhatsApp Message → Webhook API → Database Save → IA Generate → WhatsApp Send
```
Cada paso tiene su archivo y responsabilidades claras.

### Nivel 2: Archivos Críticos (PRioridad de búsqueda)
Cuando el usuario pregunta sobre "cómo funciona tal cosa":

| Pregunta | Buscar en |
|----------|-----------|
| "¿Cómo recibe mensajes?" | `app/api/webhook/route.ts` |
| "¿Cómo se procesa?" | `lib/webhook-handler.ts` (pasos 1-7) |
| "¿Cómo se guarda en BD?" | `lib/database-service.ts` |
| "¿Cómo genera respuesta?" | `lib/ai-service.ts` |
| "¿Cómo envía a WhatsApp?" | `lib/whatsapp-service.ts` |
| "¿Dónde está el prompt?" | `AGENT_PROMPT.md` |
| "¿Cómo es la BD?" | `supabase/schema.sql` |

### Nivel 3: El Patrón de Ejecución
En `webhook-handler.ts` siempre hay 7 pasos numerados:
1. Get/Create Contact
2. Get/Create Conversation
3. Save User Message
4. Get History
5. Generate IA Reply
6. Save Bot Message
7. Send WhatsApp

**IMPORTANTE:** Estos pasos pueden cambiar, modificar, o agregar validaciones.

---

## 🔍 CÓMO ORIENTAR AL USUARIO

### El usuario pregunta: "¿Dónde busco X?"

**Respuesta modelo:**
```
Para modificar [X], ve a:
- Archivo: [path/to/file.ts]
- Líneans ~ [LN-LN] (donde está la lógica)
- Contexto: [Explicación de qué hace esa línea]
- Variables env: [Si requiere]
```

### El usuario pregunta: "¿Cómo funciona Y?"

**Respuesta modelo:**
```
Flujo de Y:
1. Trigger: Ocurre cuando...
2. Busca en: [archivo]
3. Procesa: [qué hace]
4. Guarda en: [tabla BD / API]
5. Retorna: [qué resultado]

Diagram:
Input → [Proceso] → Output
```

### El usuario pregunta: "¿Cómo cambio Z?"

**Respuesta modelo:**
```
✅ Para cambiar Z:

1. Abre: [archivo]
   Líneas: ~[LN-LN]

2. Modifica:
   [Código actual]
   
   por:
   
   [Código nuevo]

3. Contexto:
   - Esto afecta a: [qué más]
   - Requiere cambiar también: [si hay dependencias]
   - Variables env: [Si necesita]

4. Test quién:
   - Usa: [endpoint API / flujo]
   - Variable env: [...]
```

---

## 🎯 PATRONES DE CÓDIGO QUE RECONOCER

### Patrón 1: Supabase Operations
```typescript
// SIEMPRE así:
const { data: result, error } = await getSupabaseAdmin()
  .from('tabla')
  .select('...')
  .eq('column', value)
  .single();

if (error) {
  console.error('[DB] Error:', error);
  throw error;
}
// Usar result
```
**Reconocer:** Cuando hay acceso a BD, SIEMPRE hay `error` handling.

### Patrón 2: AI Backend Selection
```typescript
// SIEMPRE revisar AI_BACKEND env var
const backend = process.env.AI_BACKEND?.trim().toLowerCase();
if (backend === 'gemini') { ... }
if (backend === 'openai') { ... }
if (backend === 'ollama') { ... }
```
**Reconocer:** El sistema puede cambiar backend dinámicamente.

### Patrón 3: WhatsApp Formatting
```typescript
// SIEMPRE hacer esto antes de enviar:
// 1. Validar token existe
// 2. Formatear número (digitsOnly)
// 3. Validar longitud (< 8 chars = error)
// 4. Truncar mensaje (4096 max)
// 5. Construir payload correcto
// 6. Enviar a Meta Graph API v25.0
```
**Reconocer:** Es un flujo específico y bien definido.

### Patrón 4: Conversation History
```typescript
// SIEMPRE obtener así:
// 1. Buscar conversation por phone_number
// 2. Seleccionar messages de esa conversation_id
// 3. Ordenar por created_at ASC (primero antiguo)
// 4. Mapear a formato [{role, content}, ...]
```
**Reconocer:** El historial es ORDENADO por antigüedad.

### Patrón 5: Logging
```typescript
// SIEMPRE seguir el patrón:
// [Componente] nivel descripción
console.log('[WhatsApp] 📤 Iniciando envío...');
console.error('[WhatsApp] ❌ Error: ...');
console.log('[AI/Gemini] ✓ Respuesta recibida');
```
**Reconocer:** Logs con prefix permite debugging fácil.

---

## 🔧 MODIFICACIONES COMUNES

### Caso 1: "Quiero agregar validación extra en webhook"
**Dónde:** `lib/webhook-handler.ts` líneas ~10-20 (validaciones iniciales)
**Cómo:** Agregar `if (condition) { console.log(...); return; }`
**Importante:** NO romper el flujo de los 7 pasos

### Caso 2: "Quiero cambiar el formato del mensaje enviado a WhatsApp"
**Dónde:** `lib/whatsapp-service.ts` líneas ~55-80 (payload construction)
**Cómo:** Editar el objeto `payload`
**Importante:** 
- Respetar estructura `{ messaging_product, to, type, text: { body } }`
- Validar límites de caracteres (4096)

### Caso 3: "Quiero que el IA use un modelo diferente"
**Dónde:** 
- Para Gemini: `lib/gemini-model.ts` (resolver modelo)
- Para OpenAI: `lib/ai-service.ts` línea ~115 (model: 'gpt-4')
- General: `.env.local` (OPENAI_MODEL, GEMINI_MODEL)

### Caso 4: "Quiero guardar más datos del contacto"
**Opciones:**
1. **Flexible (recomendado):** Usa `metadata JSONB` en tabla contacts
   - Editar: `lib/database-service.ts` línea ~50 (insert)
   - Guardar: `metadata: { campo1: value1, ... }`
   
2. **Permanente:** ADD COLUMN en `supabase/schema.sql`
   - Editar: `supabase/schema.sql` línea ~15
   - Ejecutar en SQL editor de Supabase

### Caso 5: "Quiero cambiar el comportamiento del IA"
**Dónde:** `AGENT_PROMPT.md`
**Cómo:** Editar el prompt (no requiere restart)
**Importante:** Cambios aplican al SIGUIENTE mensaje

### Caso 6: "El webhook no recibe mensajes en producción"
**Debug checklist:**
1. ¿WHATSAPP_ACCESS_TOKEN es válido? → `lib/whatsapp-service.ts` línea ~30
2. ¿WHATSAPP_VERIFY_TOKEN coincide? → `app/api/webhook/route.ts` línea ~15
3. ¿PHONE_NUMBER_ID es correcto? → Verificar en Meta Dashboard
4. ¿Está configurado el webhook URL en Meta? → https://tudominio.com/api/webhook
5. Ver logs en terminal

---

## 📊 TABLA DE DEPENDENCIAS

```
┌─────────────────────────────────────────────────────────────┐
│                    /api/webhook                             │
│                  (recibe POST)                              │
│                       ↓                                      │
│           webhook-handler.ts                                │
│      (7 pasos de procesamiento)                             │
├─────────────┬─────────────┬─────────────┬─────────────┐    │
│             │             │             │             │    │
↓             ↓             ↓             ↓             ↓    │
database-service (steps 1,2,3,4,6)                             │
ai-service (step 5)                                            │
whatsapp-service (step 7)                                      │
│                           │                                  │
└───────┬───────────────────┼──────────────────────────────── │
        │                   │                                  │
        ↓                   ↓                                  │
   Supabase             WhatsApp API                          │
   (contacts,           Graph v25.0                           │
    messages)           (send message)                        │
    conversations)                                            │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚨 COSAS QUE NO HACER

❌ **NO:** Editar directamente SQL en producción sin backup
❌ **NO:** Cambiar estructura de payload WhatsApp sin validar
❌ **NO:** Remover validaciones de credenciales
❌ **NO:** Editar el orden de los 7 pasos sin entender impacto
❌ **NO:** Almacenar tokens en variables globales
❌ **NO:** Confundir `phone_number` (string) con `id` (UUID)
❌ **NO:** Olvidar que RLS está deshabilitado (revisar para prod)

---

## ✅ COSAS QUE HACER

✅ **SÍ:** Usar console.log con prefijo [Componente]
✅ **SÍ:** Validar siempre error de Supabase
✅ **SÍ:** Truncar mensajes a 4096 chars antes de enviar
✅ **SÍ:** Agregar tipos TypeScript a funciones nuevas
✅ **SÍ:** Mantener formato JSON en payloads
✅ **SÍ:** Documentar cambios en este mismo archivo

---

## 🎓 REFERENCIA RÁPIDA

### Variable Env → Donde se usa
```
WHATSAPP_ACCESS_TOKEN     → lib/whatsapp-service.ts:30
WHATSAPP_PHONE_NUMBER_ID  → lib/whatsapp-service.ts:31
WHATSAPP_VERIFY_TOKEN     → app/api/webhook/route.ts:15
WHATSAPP_IGNORE_INBOUND   → lib/webhook-handler.ts:24
AI_BACKEND                → lib/ai-service.ts:22
GEMINI_API_KEY            → lib/gemini-model.ts / lib/ai-service.ts
OPENAI_API_KEY            → lib/ai-service.ts:100
SUPABASE_URL              → lib/supabase-admin.ts
SUPABASE_ANON_KEY         → lib/supabase-admin.ts
```

### Function → Que hace
```
getOrCreateContact()          → BD: busca/crea contacto
getOrCreateConversation()     → BD: busca/crea conversación
getConversationHistory()      → BD: obtiene mensajes previos
saveMessage()                 → BD: inserta mensaje
generateAssistantReply()      → IA: genera respuesta
sendWhatsAppMessage()         → API: envía a WhatsApp
handleInboundUserMessage()    → Core: orquesta los 7 pasos
```

### Table → Columnas importantes
```
contacts:        id, phone_number, name, last_message_at, metadata
conversations:   id, phone_number, contact_id, is_open, message_count
messages:        id, conversation_id, role, content, created_at
```

---

## 🔄 WORKFLOW RECOMENDADO

### Cuando el usuario pide un cambio:

1. **ENTENDER**
   - ¿Qué quiere cambiar?
   - ¿Qué archivo afecta?
   - ¿Qué depende de eso?

2. **UBICAR**
   - Usar "mapa de archivos" (tabla arriba)
   - Encontrar línea aprox

3. **ANALIZAR**
   - Leer contexto (20 líneas antes/después)
   - Entender flujo completo
   - Identificar validaciones

4. **PROPONER**
   - Mostrar código actual
   - Mostrar código nuevo
   - Explicar qué cambia

5. **VALIDAR**
   - ¿Rompe algo?
   - ¿Requiere cambios en BD?
   - ¿Requiere nuevas vars env?

6. **DOCUMENTAR**
   - Actualizar este archivo si hay nuevos patrones
   - TODO: Dejar claro qué revisó

---

## 📝 ACTUALIZACIONES A ESTE SKILL

Cuando agregues nueva funcionalidad, ACTUALIZA:
1. Este archivo con nuevos patrones
2. ANALYSIS_PLAN.md si hay cambios en arquitectura
3. Mantén sincronizado con código real

---

**Skill creado:** 2026-04-05
**Última actualización:** 2026-04-05
**Versión:** 1.0
**Aplicable a:** AriseChatbot WhatsApp IA Chatbot
