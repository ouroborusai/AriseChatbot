# 🎯 ESTRATEGIA DE UX CON WHATSAPP - Mejora de Interacción

**Fecha:** 2026-04-07  
**Estado:** Plan de implementación  
**Enfoque:** Mejorar respuestas de bot + reducir fricción del usuario

---

## 📊 ANÁLISIS: Opciones de Interacción en WhatsApp

### Lo que tienes AHORA (Básico)
```
Bot: "Eres un asistente de atención al cliente..."
User: Escribe algo
Bot: Responde con texto plano
```
**Pros:**
- ✅ Simple, funcional
- ✅ Funciona con cualquier texto

**Contras:**
- ❌ No hay guía visual
- ❌ Usuario escribe más de lo necesario
- ❌ No hay selección rápida
- ❌ Conversación larga = más tokens

---

### OPCIÓN 1: Interactive Messages con Botones (⭐ RECOMENDADA)
```
Bot responde:
┌─────────────────────────┐
│ ¿En qué puedo ayudarte? │
├─────────────────────────┤
│ [📋 Ver pedidos]        │
│ [🆘 Soporte técnico]    │
│ [💰 Promociones]        │
│ [📞 Hablar con humano]  │
└─────────────────────────┘
```

**API Meta (WhatsApp Cloud):**
```json
{
  "messaging_product": "whatsapp",
  "to": "5491234567890",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": {
      "text": "¿En qué puedo ayudarte?"
    },
    "action": {
      "buttons": [
        {
          "type": "reply",
          "reply": {
            "id": "btn_orders",
            "title": "📋 Ver pedidos"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "btn_support",
            "title": "🆘 Soporte técnico"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "btn_promotions",
            "title": "💰 Promociones"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "btn_human",
            "title": "📞 Hablar con humano"
          }
        }
      ]
    }
  }
}
```

**Ventajas:**
- ✅ Usuario elige entre opciones (menos escritura)
- ✅ Respuesta predeterminada automática
- ✅ Menos tokens (respuestas cortas y predefinidas)
- ✅ Mejor UX (guía visual clara)
- ✅ Datos estructurados (fácil registrar qué eligió)

**Desventajas:**
- ❌ Max 3-10 botones (depende de longitud)
- ❌ Requiere lógica para manejar respuestas

**Integración:**
- ⏱️ Medio (cambiar tipo de payload)
- 💰 Gratis (no costo adicional)

---

### OPCIÓN 2: Template Messages (Mensajes Pre-Aprobados)
```
Ejemplo: "Hola {{nombre}}, tu pedido #{{order_id}} está {{status}}"
```

**Meta requiere pre-aprobar templates:**
```
1. Crear template en Meta Business Manager
2. Meta aprueba (48-72 horas)
3. Enviar se vuelve más barato/rápido
```

**Ventajas:**
- ✅ Respuestas configuradas de antemano
- ✅ Más rápidas
- ✅ Más baratas (50% dscto vs mensajes normales)
- ✅ Pro-branded (llevan logo)

**Desventajas:**
- ❌ Necesita pre-aprobación de Meta
- ❌ Menos flexible
- ❌ Solo para respuestas comunes (status, confirmaciones)
- ❌ No interactivo como botones

**Templates que podrías usar:**
```
1. "greeting" - Saludo inicial
2. "order_confirmation" - Confirmación de pedido
3. "order_status" - Estado de pedido
4. "appointment_reminder" - Recordatario de cita
5. "support_escalation" - Escalado a soporte humano
```

**Integración:**
- ⏱️ Largo (requiere aprobación Meta)
- 💰 Más barato una vez aprobado

---

### OPCIÓN 3: List Messages (Menús Desplegables)
```
┌──────────────────────┐
│ Elegir categoría:    │
├──────────────────────┤
│ ▼ Productos          │
  ├─ Ropa              │
  ├─ Electrónica       │
  ├─ Hogar             │
│ ▼ Consultas          │
  ├─ Facturación       │
  ├─ Technical         │
│ ▼ Mi cuenta          │
  ├─ Perfil            │
  ├─ Historial         │
└──────────────────────┘
```

**API Meta:**
```json
{
  "type": "interactive",
  "interactive": {
    "type": "list",
    "body": { "text": "Elegir categoría:" },
    "action": {
      "button": "Opciones",
      "sections": [
        {
          "title": "Productos",
          "rows": [
            { "id": "prod_clothing", "title": "Ropa", "description": "Ver colección" },
            { "id": "prod_electronics", "title": "Electrónica" }
          ]
        },
        {
          "title": "Consultas",
          "rows": [
            { "id": "help_billing", "title": "Facturación" },
            { "id": "help_tech", "title": "Soporte técnico" }
          ]
        }
      ]
    }
  }
}
```

**Ventajas:**
- ✅ Más opciones que botones (unlimited items)
- ✅ Organizadas en secciones
- ✅ Mejor para catálogos

**Desventajas:**
- ❌ Más complejo
- ❌ Requiere más estructura de datos

**Integración:**
- ⏱️ Largo
- 💰 Gratis

---

### OPCIÓN 4: Mensajes Predeterminados con Reglas
```
Lógica:
IF usuario dice "horarios" → Enviar horario predefinido
IF usuario dice "precio" → Enviar precio predefinido
IF usuario dice "ayuda" → Enviar menú con botones
ELSE → Usar IA (Gemini)
```

**Ventajas:**
- ✅ Reduce uso de IA para preguntas comunes
- ✅ Respuesta instant (sin latencia)
- ✅ Costo ~0 (sin usar Gemini)
- ✅ Fácil de mantener

**Desventajas:**
- ❌ Requiere mantener lista de palabras clave
- ❌ No es inteligente

**Integración:**
- ⏱️ Corto
- 💰 Gratis (solo tokens keywords)

---

### OPCIÓN 5: Reacciones Rápidas (Emoji + Acción)
```
Bot: "¿Satisfecho con mi respuesta?"
👍 (Thumbs up)
👎 (Thumbs down)

Acción:
👍 → Registrar satisfacción (feedback)
👎 → Escalar a soporte humano
```

**Ventajas:**
- ✅ Quick feedback sin escribir
- ✅ Datos de satisfacción
- ✅ Autoescalado si usuario insatisfecho

**Desventajas:**
- ❌ Solo para feedback simple

**Integración:**
- ⏱️ Muy corto
- 💰 Gratis

---

## 🎯 MI RECOMENDACIÓN: Estrategia Híbrida (3 CAPAS)

```
┌────────────────────────────────────────────────────┐
│            USUARIO ENVÍA MENSAJE                    │
└────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────┐
│ CAPA 1: PALABRAS CLAVE PREDETERMINADAS            │
│ (Horarios, Precios, FAQs, Promociones)            │
├────────────────────────────────────────────────────┤
│ IF palabra_clave encontrada:                       │
│   → Respuesta predefinida instant (0 tokens) ✅    │
│ ELSE:                                              │
│   → Continuar a CAPA 2                             │
└────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────┐
│ CAPA 2: CATEGORIZACIÓN CON BOTONES                │
│ (Menú inicial de opciones)                        │
├────────────────────────────────────────────────────┤
│ IF primera vez OR sin coincidencia:                │
│   → Enviar button message (4-6 opciones)          │
│   → Usuario elige botón → respuesta predefinida   │
│   (~100 tokens si necesita IA de nuevo)            │
│ ELSE:                                              │
│   → Continuar a CAPA 3                             │
└────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────┐
│ CAPA 3: IA INTELIGENTE (GEMINI)                   │
│ (Preguntas complejas / conversación abierta)      │
├────────────────────────────────────────────────────┤
│ IF no coincide capa 1 ni 2:                        │
│   → Llamar a Gemini (~500 tokens)                 │
│   → Respuesta + Botón "¿Útil?" (feedback)        │
│   IF usuario dice "no":                            │
│     → Escalar a soporte humano                    │
└────────────────────────────────────────────────────┘
```

---

## 📈 IMPACTO ESPERADO

### Métrica: Uso de Tokens Gemini (100 msgs/día)

```
ANTES (Solo IA):
100 msgs/día × ~500 tokens = 50K tokens/día
= 1.5M tokens/mes
Costo: $0.74/mes (Gemini)

CON ESTRATEGIA HÍBRIDA:
- 30% palabras clave (gratis)  → 0 tokens
- 40% botones (predefinido)    → 100 tokens c/u = 20% uso
- 30% preguntas complejas (IA) → 500 tokens c/u = 80% uso

30 msgs × 0 = 0
40 msgs × 100 = 4K
30 msgs × 500 = 15K
= 19K tokens/día
= 570K tokens/mes (70% REDUCCIÓN)

Costo: $0.20/mes
```

---

## 🛠️ ROADMAP DE IMPLEMENTACIÓN

### FASE 1 (Esta semana) - OPCIÓN 4
```
Agregar palabras clave comunes:
- "horarios" → Respuesta predefinida
- "precio" → Respuesta predefinida  
- "promocion" → Respuesta predefinida
- "ayuda" → Mostrar botones

Esfuerzo: 1-2 horas
Impacto: -30% tokens
Costo: $0
```

> ✅ Estado: Fase 1 implementada. El webhook ahora detecta palabras clave básicas y envía respuestas predefinidas sin llamar a la IA para esos casos.

### FASE 2 (Implementada) - OPCIÓN 1
```
Interactive Buttons implementados:
- Menú inicial
- Respuestas predefinidas por botón
- Estadísticas de qué botón seleccionan

Esfuerzo: 3-4 horas
Impacto: -40% tokens adicional
Costo: $0 (Meta no cobra por botones)
```

### FASE 3 (Mes siguiente) - OPCIÓN 2
```
Setup Templates pre-aprobados:
- Template para confirmaciones
- Template para estados
- Template para promociones

Esfuerzo: 2 horas (esperar aprobación Meta)
Impacto: -20% en costo (50% dscto templates)
Costo: $0 (pero más barato)
```

---

## 📋 PALABRAS CLAVE SUGERIDAS (FASE 1)

```
Palabras clave que deberían ir a respuesta predefinida:

CONSULTAS COMUNES:
- "horarios" / "horario" → "Estamos abiertos L-V 9AM-6PM, Sáb 10AM-2PM"
- "ubicación" / "donde" → "Ubicados en [dirección]"
- "telefono" / "contacto" → "Llamanos al [número]"
- "precio" / "costo" → "Nuestros precios van desde $[X] a $[Y]"
- "garantia" / "devolución" → "Garantía 30 días, devolución sin preguntas"

ACCIONES:
- "hablar con persona" / "soporte" / "ayuda" → Mostrar botones + escalar
- "queja" / "reclamo" → Escalar a gerente
- "promocion" / "descuento" / "oferta" → Mostrar promociones actuales

CONFIRMACIONES:
- "si" / "ok" / "dale" / "bueno" → Procesar + mostrar botones
- "no" / "nope" / "negativo" → "¿Hay algo más que pueda hacer?"
```

---

## 💬 EJEMPLO DE CONVERSACIÓN CON ESTRATEGIA HÍBRIDA

```
USER: "Hola, ¿cuál es el horario?"
[CAPA 1 - Palabra clave detectada]
BOT: "Estamos abiertos L-V 9AM-6PM, Sáb 10AM-2PM ☕
¿Hay algo más?"

USER: "Necesito ayuda con mi pedido"
[CAPA 1 - "pedido" no es palabra clave común]
[CAPA 2 - Usuario necesita orientación]
BOT: "Entendido, ¿qué necesitas?
┌──────────────────────┐
│ [📦 Ver mi pedido]   │
│ [🔄 Cambiar pedido]  │
│ [❌ Cancelar pedido]  │
│ [📞 Hablar humano]   │
└──────────────────────┘"

USER: "[📦 Ver mi pedido]"
[CAPA 2 - Botón predefinido]
BOT: "Tu pedido #12345 está en ruta 🚚
Llega mañana 3PM ✅"

USER: "¿Puedo cambiar la dirección de entrega si llega a otra ciudad?"
[CAPA 1 - No coincide]
[CAPA 2 - No es botón simple]
[CAPA 3 - Llamar Gemini]
BOT: "[AI genera respuesta inteligente]
Sí, podemos cambiar dirección antes de entregar.
Contacta a soporte urgentemente → [📞 Llamar]"
```

---

## 🔧 CÓDIGO: Implementación FASE 1 (Pseudocódigo)

```typescript
// En lib/webhook-handler.ts, antes de llamar IA:

async function handleInboundUserMessage(messageData: InboundMessage) {
  const text = messageData.text?.body?.trim().toLowerCase();
  
  // CAPA 1: Palabras clave predefinidas
  const predefinedResponses: Record<string, string> = {
    'horarios': 'Estamos abiertos L-V 9AM-6PM, Sáb 10AM-2PM ☕',
    'ubicación': 'Ubicados en Calle Principal 123',
    'precio': 'Nuestros precios van desde $10 a $500',
    'garantía': 'Garantía 30 días, devolución sin problema',
    'ayuda': '[MOSTRAR BOTONES]',
  };
  
  // Buscar coincidencia
  for (const [keyword, response] of Object.entries(predefinedResponses)) {
    if (text.includes(keyword)) {
      console.log(`[Predefined] Palabra clave detectada: ${keyword}`);
      await sendWhatsAppMessage(phoneNumber, response);
      await saveMessage(conversationId, 'assistant', response);
      return;  // ← NO USAR IA, TERMINAR AQUÍ
    }
  }
  
  // CAPA 2 & 3: Continuar con flujo normal (botones + IA)
  // ... resto del código existente
}
```

---

## 📊 COMPARATIVA: Opciones por Caso de Uso

```
┌──────────────────────┬───────────────┬──────────┬─────────┬─────────┐
│ Caso de Uso          │ Capa 1        │ Opción   │ Tokens  │ Tiempo  │
├──────────────────────┼───────────────┼──────────┼─────────┼─────────┤
│ Pregunta horario     │ ✅ Palabra cla│ #4       │ 0       │ Inmediato
│ ¿Cuál producto?      │ ✅ Botones    │ #1       │ 50-100  │ 1-2 seg
│ Confirmación pedido  │ ✅ Template   │ #2       │ 0       │ <1 seg
│ Consulta compleja    │ ❌ IA         │ #3       │ 500     │ 3-5 seg
│ Feedback post-chat   │ ✅ Emoji      │ #5       │ 0       │ Inmediato
└──────────────────────┴───────────────┴──────────┴─────────┴─────────┘
```

---

## ✅ DECISIÓN RECOMENDADA

**Implementar FASE 1 + FASE 2 simultáneamente:**

1. **FASE 1 (Palabras clave predefinidas)**
   - Archivo: Agregar en `lib/webhook-handler.ts` (antes de IA)
   - Tiempo: ~1 hora
   - Ahorro: ~30% tokens
   - Costo: $0

2. **FASE 2 (Interactive Buttons)**
   - Archivo: Crear `lib/whatsapp-interactive.ts` (nueva función)
   - Modificar `lib/whatsapp-service.ts` para soportar tipo "interactive"
   - Tiempo: ~3 horas
   - Ahorro: Adicional 40% tokens
   - Costo: $0

**Resultado:**
- 100 msgs/día con estrategia híbrida = ~19K tokens/día (~570K/mes)
- Costo mensual: ~$0.20 en Gemini (vs $0.74 sin optimizar)
- **Mejora UX:** Botones intuitivos, respuestas rápidas, menos fricción

---

**¿Implementamos FASE 1 + FASE 2?** (Puedo empezar hoy)

