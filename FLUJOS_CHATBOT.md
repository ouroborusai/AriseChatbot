# 🤖 Estrategia de Flujos del Chatbot

**Fecha:** 2026-04-07  
**Versión:** 2.0 - Con clasificación automática

---

## 📋 Resumen Ejecutivo

El chatbot ahora **clasifica automáticamente** al usuario en el **primer mensaje**:
- **Si es cliente de MTZ** → Menú predefinido + Gemini para preguntas
- **Si es nuevo/prospect** → Menú de información + Gemini para consultas

Ambos flujos usan **Gemini API**, pero con diferentes contextos de sistema prompt.

---

## 🔄 Flujo de Clasificación (Primer Mensaje)

```
Usuario envía primer mensaje
         ⬇️
¿Es el primer mensaje?
         ⬇️ Sí
¿Eres cliente de MTZ?
    ⬇️           ⬇️
   Sí            No
    ⬇️           ⬇️
CLIENTE      PROSPECT
```

### Paso 1: Detectar Primer Mensaje
```typescript
const isFirstMsg = await isFirstMessage(conversationId);
if (isFirstMsg && !contact.segment) {
  await sendClassificationMenu(phoneNumber);
  return;
}
```

### Paso 2: Usuario Elige
- **Botón "Sí, soy cliente"** → `btn_is_client_yes`
- **Botón "No, soy nuevo"** → `btn_is_client_no`

### Paso 3: Guardar Clasificación
```typescript
// Si es cliente
await updateContactSegment(contact.id, 'cliente');

// Si es nuevo
await updateContactSegment(contact.id, 'prospect');
```

---

## 👥 FLUJO 1: CLIENTE DE MTZ

### Menú Principal
```
Hola [Nombre]. ¿Qué necesitas hoy?

📄 Mis documentos      (si tiene docs) / 📎 Solicitar documento
🧾 Mis impuestos
📞 Hablar con asesor
```

### Opciones Disponibles (Respuestas Predefinidas)

#### 📄 Mis Documentos
1. Seleccionar categoría:
   - 🧾 Impuestos → IVA, Renta, Balance
   - 📚 Contabilidad → Estados financieros
   - 💼 Nómina/Contratos → Liquidaciones, Contratos

2. Sistema busca documento en BD
3. **Si existe**: Envía PDF directamente (respuesta predefinida)
4. **Si no existe**: Derivar a asesor

#### 🧾 Mis Impuestos
- **Contexto**: Si el cliente pregunta sobre sus impuestos, usa Gemini
- **Prompt del sistema**: Contexto centrado en **su situación tributaria específica**
- **Ejemplo**: "You are a MTZ tax expert. Help this existing client with their tax situation."

#### 💼 Seleccionar Empresa
- Si tiene múltiples empresas vinculadas
- Mostrar botones con nombre de empresa
- Sistema automáticamente cambia contexto

### Flujo Interno

```python
1. Usuario hace click en botón predefinido
2. Sistema verifica si hay respuesta predefinida
   - ¿Es solicitud de documento? → Buscar en BD
   - ¿Es selección de empresa? → Cambiar contexto
   - ¿Está pidiendo información? → Gemini
3. Si es texto libre → Gemini con contexto de CLIENTE
```

---

## 🆕 FLUJO 2: PROSPECT/NUEVO

### Menú Principal
```
Hola. Bienvenido a MTZ. ¿Cómo te gustaría iniciar?

💼 Quiero cotizar
📝 Más información
📞 Hablar con asesor
```

### Opciones Disponibles

#### 💼 Quiero Cotizar
1. Sistema recopila información:
   - Tipo de negocio
   - Ingresos aproximados
   - Necesidades específicas

2. **¿Respuesta predefinida o Gemini?**
   - **Predefinida**: Template básico de cotización
   - **Gemini**: Para responder preguntas sobre qué incluye la cotización

#### 📝 Más Información
1. Usuario pregunta qué servicios ofrece MTZ
2. **Gemini responde** con contexto de PROSPECT
3. Prompt del sistema: "You are a MTZ consultant. Explain our services to a potential client."

#### 📞 Hablar con Asesor
- Mensaje: "Un asesor de MTZ te contactará en breve"
- Sistema marca como "solicitud de derivación"

### Flujo Interno

```python
1. Usuario hace click en botón
2. Si es "Más información" o preguntas libres → Gemini
   - Contexto: PROSPECT (nuevo cliente)
3. Si es "Quiero cotizar" → 
   - Recopilar datos (predefinido)
   - Generar cotización (Gemini + template)
```

---

## 🤖 GEMINI API: Uso en Ambos Flujos

### ¿Se usa Gemini en ambos?
**SÍ. Absolutamente.**

### ¿Respuestas siempre predefinidas?
**NO. Se usan según el contexto:**

| Situación | Respuesta | Quién |
|-----------|-----------|-------|
| "Envíame mi F29" | Predefinida (BD) | Sistema |
| "¿Cómo declaro mis impuestos?" | IA | Gemini |
| "¿Qué servicios ofrecen?" | IA | Gemini |
| "Quiero cambiar de empresa" | Predefinida (menú) | Sistema |
| "¿Cuánto cuesta el servicio?" | IA+Predefinida | Gemini + bases de datos |

### System Prompts Diferentes

#### Para CLIENTES (Existing)
```
Eres un experto tributario de MTZ Consultores Tributarios.
Este es un cliente existente con las siguientes empresas: [LISTA DE EMPRESAS]
Documentos disponibles: [LISTA DE DOCS]

Prioridades:
1. Ayuda con gestión tributaria
2. Acceso a documentos
3. Cambios en configuración
4. Derivación a asesor si es urgente

Tono: Profesional, directamente familiar con la situación del cliente.
```

#### Para PROSPECTS (Nuevos)
```
Eres un especialista en consultoría tributaria de MTZ Consultores Tributarios.
El usuario es un nuevo cliente potencial sin empresas vinculadas aún.

Prioridades:
1. Explicar servicios MTZ
2. Generar interés en cotización
3. Responder preguntas sobre servicios
4. Derivar a asesor para cotización personalizada

Tono: Cálido, profesional, informativo. Enfocado en convertir prospect a cliente.
```

### Lógica de Selección

```typescript
async function generateAssistantReply(
  systemPrompt: string,
  history: ConversationTurn[],
  latestUserText: string
): Promise<string> {
  // El system prompt CAMBIA según el segment del contacto
  let finalPrompt = systemPrompt;
  
  if (contact.segment === 'cliente') {
    finalPrompt = SYSTEM_PROMPT_FOR_CLIENTS;
  } else if (contact.segment === 'prospect') {
    finalPrompt = SYSTEM_PROMPT_FOR_PROSPECTS;
  }
  
  return await generateGeminiReply(finalPrompt, history, latestUserText);
}
```

---

## 📊 Tabla de Decisión: Predefinida vs Gemini

```
┌─────────────────────────────────────┬───────────────┬──────────┐
│ Tipo de Solicitud                   │ Predefinida   │ Gemini   │
├─────────────────────────────────────┼───────────────┼──────────┤
│ Enviar documento específico         │ ✅ SÍ         │          │
│ Seleccionar empresa                 │ ✅ SÍ (botón) │          │
│ Solicitar documento genérico        │              │ ✅ SÍ    │
│ Pregunta tributaria                 │              │ ✅ SÍ    │
│ Preguntas sobre servicios           │              │ ✅ SÍ    │
│ Derivación a humano                 │ ✅ SÍ (msg)   │          │
│ Cotización                          │ ✅ (template) │ ✅ (info)│
│ "Hola" / Saludos                    │ ✅ SÍ (menú)  │          │
└─────────────────────────────────────┴───────────────┴──────────┘
```

---

## 🚀 Beneficios de Esta Arquitectura

1. **Respuestas Rápidas**: Documentos se envían sin latencia de IA
2. **Contexto Relevante**: Gemini conoce si es cliente o prospect
3. **Escalable**: Agregar nuevas respuestas predefinidas sin tocar IA
4. **Hybrid**: Lo mejor de ambos mundos (reglas + IA)
5. **Auditable**: Respuestas predefinidas quedan en historial claro

---

## 🔧 Cómo Agregar Nuevas Respuestas Predefinidas

### Ejemplo: Agregar "Consultar Saldo"

1. **Agregar botón**: Editar `sendWelcomeMenu()` o crear nuevo menú
2. **Agregar constante**: `const BTN_CHECK_BALANCE = 'btn_check_balance';`
3. **Agregar handler**:
```typescript
if (interactive === BTN_CHECK_BALANCE) {
  const balance = await getClientBalance(contact.id); // BD
  const msg = `Tu saldo pendiente: $${balance}`;
  await saveMessage(conversationId, 'assistant', msg);
  await sendWhatsAppMessage(phoneNumber, msg);
  return;
}
```

---

## 📈 Próximas Mejoras

- [ ] A/B testing: ¿Menú predefinido vs Gemini para cotización?
- [ ] Machine learning: Predecir qué tipo de respuesta el usuario quiere
- [ ] Feedback loop: Mejorar prompts basado en satisfacción
- [ ] Integración con calendar: Agendar asesoría directamente
- [ ] Análisis de satisfacción: NPS por tipo de solicitud

---

## 📞 Resumen de Respuesta a tu Pregunta

> "¿Usaría respuestas predefinidas o Gemini? ¿La API se sigue usando?"

**Respuesta: AMBAS**

- **Respuestas predefinidas**: Para acciones estructuradas (documentos, empresas, menús)
- **Gemini**: Para conversación natural, preguntas abiertas, asesoramiento
- **API Gemini**: ✅ Se sigue usando en ambos flujos, con prompts contextualizados

El sistema es **"mejor de lo mejor"** - combina la velocidad del predefinida con la inteligencia de IA.

