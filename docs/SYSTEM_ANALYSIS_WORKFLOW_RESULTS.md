# Resultados del Análisis de Sistema (Basado en ANALYSIS_WORKFLOW.md)

## 1. Fase de Reconocimiento
El sistema **Agente MTZ** es una solución de chatbot empresarial con las siguientes características:
- **Core**: Next.js 14.
- **Data Layer**: Supabase (PostgreSQL).
- **Communication Layer**: WhatsApp Cloud API.
- **AI Layer**: Gemini / OpenAI (configurable vía `AI_BACKEND`).

## 2. Fase de Flujo de Datos

### Orquestación Determinística vs Probabilística
El sistema implementa un modelo híbrido:
1.  **Detección Determinística**: Primero busca en `templates` mediante `triggers` o IDs de botones interactivos (`handleInboundUserMessage` en `lib/webhook-handler.ts`).
2.  **Detección Probabilística**: Si falla la detección exacta, delega a Gemini para clasificar la intención y responder.

### Interacción con Base de Datos
- Se utiliza un singleton de Supabase Admin para evitar sobrecarga de conexiones.
- **Crítico**: La persistencia de mensajes se realiza *después* de recibir y *después* de enviar, lo que garantiza trazabilidad pero añade latencia técnica.

## 3. Auditoría de Comandos Slash (`/`)

### Análisis del Fallo Reportado
El usuario indica que los comandos que inician con `/` no funcionan correctamente.

#### Diagnóstico Técnico:
1.  **En el Chatbot**:
    - El archivo `lib/services/template-service.ts` busca gatillos (`triggers`) usando `.includes()`.
    - Si un trigger en BD está definido como `menu` y el usuario escribe `/menu`, funcionará. Pero si el trigger está definido estrictamente como `/menu`, y el código limpia el texto excesivamente o no está normalizado, podría fallar.
    - **Solución Propuesta**: Implementar un `CommandService` específico que maneje el prefijo `/` de forma prioritaria antes de pasar al motor de IA.

2.  **En el Workflow de Antigravity (IDE)**:
    - Si el comando `/` no despliega el workflow en la interfaz de chat, es debido a que el archivo `ANTIGRAVITY_ANALYZE.skill` o `ANALYSIS_WORKFLOW.md` no está siendo reconocido como un "Plan de Acción" válido por el motor de búsqueda de esta interfaz.
    - **Acción Senior**: Asegurarse de que el archivo tenga el formato correcto y esté en el root si es necesario.

## 4. Conclusiones y Recomendaciones Senior

1.  **Normalización de Entrada**: Implementar un middleware que detecte el prefijo `/` en `webhook-handler.ts` y fuerce una búsqueda de comandos.
2.  **Optimización de Prompts**: El `AGENT_PROMPT.md` actual es demasiado descriptivo. Se recomienda pasar a un formato de "Instrucciones de Sistema" con ejemplos Few-Shot para mejorar la coherencia de Gemini.
3.  **Sistema de Workflows**: Integrar los resultados de `ANALYSIS_WORKFLOW.md` en el README principal para que sea el punto de partida oficial de cualquier desarrollador.
