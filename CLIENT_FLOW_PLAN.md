# CLIENT FLOW PLAN - MTZ Consultores Tributarios

> Estado: implementación iniciada. Se agregó detección de cliente conocido, bienvenida personalizada con botones y un endpoint básico de documentos.

## Objetivo
Diseñar el mejor flujo de atención para clientes de MTZ Consultores Tributarios usando WhatsApp + dashboard + Supabase, minimizando el uso de Gemini/OpenAI y maximizando respuestas rápidas y personalizadas.

---

## 1. Análisis del estado actual

### Lo que ya existe en el proyecto
- `app/api/webhook/route.ts`: recibe mensajes WhatsApp desde Meta.
- `lib/webhook-handler.ts`: procesa el flujo de mensaje en 7 pasos.
- `lib/database-service.ts`: guarda contactos, conversaciones y mensajes en Supabase.
- `lib/whatsapp-service.ts`: envía texto y botones interactivos a WhatsApp.
- `lib/ai-service.ts`: genera respuestas con Gemini/OpenAI/Ollama.
- `app/api/contacts/route.ts`: permite listar y crear contactos.
- `app/api/metrics/route.ts`: métricas de mensajes y conversaciones.
- `app/dashboard/page.tsx`: dashboard de conversaciones actualizado en vivo.

### Fortalezas del sistema actual
- Reconoce contactos por teléfono y guarda en `contacts`.
- Puede enviar respuestas con botones interactivos para guiar al cliente.
- Soporta lógica local previa a la IA, lo que reduce consumo.
- Actualiza el dashboard en vivo con nuevos mensajes usando Supabase Realtime.

### Oportunidades de mejora para MTZ
- Identificar automáticamente si el número es de un cliente existente.
- Personalizar bienvenida según cliente conocido.
- Ofrecer rutas distintas para clientes y prospectos.
- Entregar información específica de clientes: estado de cuenta, impuestos, documentos.
- Evitar llamadas innecesarias a Gemini mediante respuestas predefinidas y botones.
- Agregar soporte para enviar archivos/PDF cuando corresponda.
- Mejorar el monitoreo de estado de la API y del webhook.

---

## 2. Flujo recomendado para clientes MTZ

### 2.1. Fase 1: Identificación del cliente
1. El webhook recibe un mensaje.
2. `getOrCreateContact(phoneNumber)` normaliza el teléfono y busca en `contacts`.
3. Si el contacto existe y tiene `name`, se marca como cliente conocido.
4. Si no existe, se crea un prospecto nuevo en `contacts`.

**Resultado:** el sistema sabe si el número pertenece a un cliente existente.

### 2.2. Fase 2: Bienvenida personalizada con botones
- Si es cliente conocido:
  - Mensaje: `Hola {Nombre}, bienvenido de nuevo a MTZ Consultores Tributarios.`
  - Botones:
    - `📄 Mi estado de cuenta`
    - `🧾 Mis impuestos`
    - `📎 Enviar documento`
- Si es prospecto:
  - Mensaje: `Hola 👋 Bienvenido a MTZ Consultores Tributarios. ¿Cómo te gustaría iniciar?`
  - Botones:
    - `💼 Quiero cotizar`
    - `📝 Más información`
    - `📞 Hablar con asesor`

### 2.3. Fase 3: Manejo de la selección con lógica local
Al presionar un botón, se captura `button_reply.id` y se responde con texto fijo o formulario:
- `btn_client_info` → `¿Quieres un resumen por WhatsApp o un PDF?`
- `btn_client_tax` → `¿Sobre qué periodo o documento necesitas asesoría?`
- `btn_client_docs` → `Envíame el nombre del documento o el número de expediente.`
- `btn_new_quote` → `¿Cuál es tu giro principal o actividad económica?`
- `btn_new_info` → `¿Te interesa asesoría fiscal, contable o de nómina?`
- `btn_new_contact` → `Por favor confirma tu nombre y el mejor número de contacto.`

### 2.4. Fase 4: Formularios ligeros dentro de WhatsApp
Para recopilar datos útiles sin IA podemos usar preguntas directas:
- `Por favor, envía el RFC de tu empresa.`
- `¿En qué año fiscal necesitas asesoría?`
- `¿Quieres que te enviemos un PDF con tu estado actual?`

Esto se puede hacer sin IA, con reglas en `lib/webhook-handler.ts`.

### 2.5. Fase 5: Entrega de información específica
- Si el cliente pide `estado de cuenta`, se puede responder con datos guardados en `contacts` o en una nueva tabla `client_documents`.
- Si pide `mis impuestos`, se puede solicitar el período y usar un resumen prearmado.
- Si pide `enviar documento`, se puede enviar un PDF desde Supabase Storage.

**Nota:** WhatsApp permite enviar `document`, `image`, `audio`, `video`.
Para PDFs se puede agregar un endpoint que devuelva la URL segura de Supabase Storage.

### 2.6. Fase 6: Uso mínimo de Gemini/OpenAI
Usar IA solo cuando:
- no hay match con botones ni reglas predefinidas,
- el usuario hace una consulta abierta muy específica,
- se necesita resumir o contextualizar datos del cliente.

Siempre priorizar:
- respuestas predefinidas,
- menús con botones,
- preguntas directas de formulario.

---

## 3. Qué podemos crear con lo que ya tenemos

### 3.1. Menú de cliente vs prospecto
- `welcome inbound` → detecta `contact.name`
- si existe: menú cliente
- si no existe: menú prospecto

### 3.2. Campos clave en `contacts`
Asegúrate de cargar:
- `phone_number`
- `name`
- `email`
- `segment` (cliente/prospecto)
- `location`
- `metadata` con datos fiscales o notas

### 3.3. Endpoint de carga masiva de clientes
Crear un endpoint o usar `POST /api/contacts` para cargar clientes desde CSV o formulario.

### 3.4. Tabla adicional para archivos y PDFs
Crear una tabla nueva opcional, por ejemplo:
- `client_documents`
  - `id`
  - `contact_id`
  - `file_name`
  - `file_type`
  - `storage_url`
  - `description`
  - `created_at`

Esto permite entregar PDFs específicos a cada cliente.

### 3.5. Endpoint para descargar/visualizar archivos
- `GET /api/client-documents?contact_id=...`
- `GET /api/document/:id`

Esta API se integra con WhatsApp enviando la URL segura.

### 3.6. Dashboard de gestión y estado
- Aumentar el dashboard actual para mostrar:
  - `contactos clientes` vs `prospectos`
  - `mensajes por cliente`
  - `último mensaje recibido`
  - `último estado de API / webhook`
  - `errores recientes de WhatsApp o IA`

---

## 4. Plan de análisis y pasos a seguir

### Paso 1: Revisar y documentar el flujo actual
- Confirmar que `contacts` reconoce números con o sin formato.
- Confirmar `webhook-handler.ts` puede personalizar saldos según `contact.name`.
- Confirmar `sendWhatsAppInteractiveButtons` está funcionando.
- Confirmar el dashboard actual refresca mensajes en vivo.

### Paso 2: Definir rutas de atención para MTZ
- Cliente existente:
  1. `Mi estado de cuenta`
  2. `Mis impuestos`
  3. `Enviar documento`
- Prospecto:
  1. `Quiero cotizar`
  2. `Más información`
  3. `Hablar con asesor`

### Paso 3: Implementar detección de cliente por teléfono
- Usar la tabla `contacts` y campos `name` / `segment`.
- Si el contacto existe, marcarlo como cliente conocido.
- Si no, crear prospecto automáticamente.

### Paso 4: Evitar IA innecesaria
- Agregar reglas de respuesta para palabras clave comunes.
- Usar botones antes de llamar a Gemini.
- Reducir el historial enviado a la IA (ya hay límite de 10 mensajes).
- Usar prompts compactos en `AGENT_PROMPT.md`.

### Paso 5: Entregar información de cliente
- Cargar datos reales de clientes en `contacts`.
- Crear un flujo que permita pedir PDFs/documentos.
- Usar Supabase Storage o `metadata` para archivos.
- Generar respuestas personalizadas con datos propios antes de IA.

### Paso 6: Monitoreo y estado del sistema
- Usar `GET /api/health` para saber si WhatsApp y Supabase están OK.
- Extender `GET /api/metrics` con estado del webhook y token.
- Mostrar en el dashboard si la API de WhatsApp/IA está caída.

---

## 5. Prioridades recomendadas

### Alta prioridad
1. Identificar cliente por teléfono.
2. Bienvenida personalizada con botones.
3. Lógica local para atender opciones de cliente.
4. Reducir llamadas a Gemini para respuestas comunes.

### Media prioridad
1. Cargar base de clientes existentes en `contacts`.
2. Crear un endpoint `POST /api/contacts` más robusto.
3. Implementar envíos de archivos/PDF desde Supabase.

### Baja prioridad
1. Plantillas de WhatsApp aprobadas por Meta.
2. Menús desplegables `list messages`.
3. Feedback con botones de satisfacción.

---

## 6. Opciones de interacción fuera de WhatsApp
No es necesario hacer todo dentro de WhatsApp. Estas opciones agregan valor:

- Formulario web ligero para clientes que necesiten subir documentos.
- Panel de cliente en el dashboard para ver su información y estado.
- Correo automático de confirmación cuando se solicite un PDF.
- Enlace de descarga segura a través de Supabase Storage.

Esto permite que WhatsApp sirva como canal de primera respuesta y guía, y el dashboard o formularios web se usen para trámites más complejos.

---

## 7. Recomendación final para MTZ Consultores Tributarios

### Mejor enfoque de atención
1. **Detección temprana de cliente existente**.
2. **Saludo personalizado con 3 botones**.
3. **Respuestas predefinidas para filtros iniciales**.
4. **Uso de IA solo para consultas abiertas o análisis de textos largos**.
5. **Entrega de información concreta con documentos en Supabase cuando sea necesario**.

### Para el ahorro de tokens
- No usar Gemini en saludos ni menús.
- Priorizar botones y reglas locales.
- Mantener el historial de conversación corto.
- Usar `AGENT_PROMPT.md` solo cuando sea estrictamente necesario.

### Para la mejor experiencia de cliente
- Cliente conocido recibe opciones directas de su servicio.
- Prospecto recibe opciones claras de cotización y asesoría.
- Cada acción en WhatsApp debe conducir a un siguiente paso simple.
- Registrar siempre el número y el nombre en `contacts`.

---

## 8. Documentos existentes relacionados
- `ANALYSIS_PLAN.md` → flujo general del bot y arquitectura.
- `WHATSAPP_UX_STRATEGY.md` → estrategias de UX, botones y plantillas.
- `WHATSAPP_ASSISTANT_SKILL.md` → cómo el agente debe interpretar el código.
- `README.md` → setup y endpoints básicos.

---

## 9. Próximo paso sugerido
Implementar el flujo cliente/prospecto en `lib/webhook-handler.ts` y cargar el catálogo de clientes en `contacts`. Luego, extender el dashboard con un módulo de `Clientes MTZ` y `Documentos/PDF`.
