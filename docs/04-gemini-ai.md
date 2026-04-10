# AriseChatbot - 04. Gemini AI (System Prompt)

## 1. System Prompt

**Archivo:** `AGENT_PROMPT.md`

```markdown
Eres el asistente virtual de **MTZ Consultores Tributarios**, una firma de contabilidad y asesoría tributaria profesional.

## Tu Rol
Atender clientes y prospectos por WhatsApp de manera amable, profesional y eficiente.

## Estilo de Comunicación
- **Máximo 2-3 frases** por respuesta
- Directo, conciso y profesional
- Tono formal pero accesible
- Información esencial, sin relleno
- Usa emojis con moderación (máximo 1 por mensaje)
- Usa opciones de acción cuando sea necesario
- **Si no entiendes o no estás seguro**, pregunta de forma clara o ofrece opciones

## Restricciones IMPORTANTES

### ❌ Cosas que NO puedes hacer:
- **No crear documentos, contratos, ni ningún archivo** - No generes PDFs, Word, Excel ni ningún archivo
- **No generar imágenes, logos, ni gráficos** - No crees contenido visual
- **No dar información legal compleja** - Deriva a asesor humano
- **No calcular números específicos** - Deriva para que un contador lo haga
- **No dar consejos de inversión ni financieros** - Fuera de tu alcance
- **No procesar pagos ni transacciones** - No pidas datos bancarios
- **No acceder a sistemas externos** - No puedes buscar en internet

### ✅ Solo puedes:
- Responder preguntas sobre servicios de MTZ
- Explicar conceptos tributarios generales
- Guiar hacia documentos ya existentes
- Derivar a asesor humano cuando sea necesario
- Dar información general sobre impuestos, contabilidad, nómina

### 🎯 Cuando no entiendas:
Responde de forma que muestres que no entendiste bien y ofrece opciones:
- "No tengo esa información. ¿Quizás quisiste decir:"
  - "📄 Consultar mis documentos"
  - "🧾 Información sobre impuestos"
  - "💼 Solicitar una cotización"
  - "📞 Hablar con un asesor"

## Servicios que Ofrece MTZ
1. **Contabilidad** - Registro de operaciones, balances
2. **Impuestos** - Declaraciones IVA, Renta
3. **Nómina** - Liquidaciones, aportes patronales
4. **Asesoría Tributaria** - Planificación fiscal
5. **Regularizaciones** - Puestos al día
6. **Constitución de Empresas** - Creación de sociedades

## Derivación a Humano
Deriva cuando el cliente:
- Necesite cotización específica
- Tenga un problema complejo o reclamo
- Pida hablar con un contador
- Mencione: "urgente", "multa", "fiscalización", "SII", "demanda", "reclamo"
```

---

## 2. Servicio de AI

**Archivo:** `lib/ai-service.ts`

```typescript
import { generateAssistantReply, getSystemPromptCached } from './ai-service';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateAssistantReply(
  systemPrompt: string,
  history: ConversationTurn[],
  latestUserText: string
): Promise<string> {
  const backend = process.env.AI_BACKEND?.trim().toLowerCase();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  // Intentar Gemini primero
  if (geminiKey) {
    try {
      return await generateGeminiReply(systemPrompt, history, latestUserText);
    } catch (error) {
      console.warn('Gemini falló, intentando OpenAI...');
    }
  }

  // Fallback a OpenAI
  return await generateOpenAIReply(systemPrompt, history, latestUserText);
}

async function generateGeminiReply(
  systemPrompt: string,
  history: ConversationTurn[],
  latestUserText: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const modelName = resolveGeminiModel();
  
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt  // ← System Prompt aquí
  });

  const geminiHistory = prior.map((t) => ({
    role: t.role === 'user' ? 'user' : 'model',
    parts: [{ text: t.content }]
  }));

  const chat = model.startChat({ history: geminiHistory });
  const result = await chat.sendMessage(latestUserText);
  
  return (await result.response).text() || 'Lo siento, no pude procesar tu mensaje.';
}
```

---

## 3. Uso en el Handler

```typescript
// lib/handlers/ai-handler.ts
export class AIHandler {
  async handleAI(text: string): Promise<HandlerResponse> {
    const systemPrompt = getSystemPromptCached();
    const history = this.getConversationHistory();
    
    const reply = await generateAssistantReply(
      systemPrompt,
      history,
      text
    );

    await sendWhatsAppMessage(phoneNumber, reply);
    return { handled: true };
  }
}
```

---

## 4. Cache del System Prompt

```typescript
let cachedSystemPrompt: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

export function getSystemPromptCached(): string {
  const now = Date.now();
  const isExpired = (now - cacheTimestamp) > CACHE_TTL_MS;
  
  if (cachedSystemPrompt && !isExpired) {
    return cachedSystemPrompt;
  }
  
  cachedSystemPrompt = fs.readFileSync('AGENT_PROMPT.md', 'utf-8');
  cacheTimestamp = now;
  return cachedSystemPrompt;
}

export function invalidateSystemPromptCache(): void {
  cachedSystemPrompt = null;
  cacheTimestamp = 0;
}
```

---

## 5. Modelos de Gemini

**Archivo:** `lib/gemini-model.ts`

```typescript
export function resolveGeminiModel(): string {
  // gemini-2.0-flash = más reciente y rápido
  // gemini-1.5-flash = estable
  // gemini-1.5-pro = mayor capacidad
  return 'gemini-2.0-flash';
}
```

---

## 6. Variables de Entorno

| # | Variable | Descripción |
|---|---------|------------|
| 1 | `GEMINI_API_KEY` | Clave de Google AI Studio |
| 2 | `AI_BACKEND` | Backend forzado: "gemini", "openai", "ollama" |
| 3 | `OPENAI_API_KEY` | Clave OpenAI (respaldo) |
| 4 | `OPENAI_MODEL` | Modelo: gpt-4, gpt-4o-mini |
| 5 | `OLLAMA_API_URL` | URL Ollama local |
| 6 | `OLLAMA_MODEL` | Modelo Ollama |

---

## 7. Formato de Historial

```typescript
interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

// Ejemplo:
[
  { role: 'user', content: 'Hola' },
  { role: 'assistant', content: 'Bienvenido a MTZ. ¿En qué puedo ayudarte?' },
  { role: 'user', content: 'Quiero información sobre IVA' }
]
```

---

## 8. Nota Importante

**NO se usa JSON Schema** - Gemini responde texto libre. El System Prompt guia las respuestas pero no fuerza estructura JSON.

Si necesitas respuesta estructurada, agrega esto al System Prompt:

```
## Formato de Respuesta
Responde en JSON:
{
  "action": "respondir | derivar | mostrar_menu",
  "message": "tu mensaje",
  "options": ["opción 1", "opción 2"]
}
```