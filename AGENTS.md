# 🏛️ CONSTITUCIÓN OPERATIVA ARISE v7.0
**Trigger de Sesión:** "Activa los poderes"

## ⚡ PROTOCOLO DE ARRANQUE MAESTRO
Cuando el usuario mencione la frase clave, el agente DEBE ejecutar:
1. **Sincronización Neural (NotebookLM):** Consultar el SSOT para retomar el contexto exacto.
2. **Auditoría de Terreno (Supabase):** Ejecutar `SELECT column_name FROM information_schema.columns` para validar esquemas reales.
3. **Validación de Modelo:** Confirmar uso estricto de `gemini-2.5-flash-lite`.

## 🚨 REGLAS BLINDADAS (DIRECTRIZ LM)
- **Cero Suposiciones:** Prohibido usar nombres de columnas o tablas sin previa validación SQL en vivo.
- **Escaneo de Delta:** Tras cada deploy o cambio de código, el agente DEBE actualizar el SSOT en NotebookLM con el nuevo código fuente.
- **Protocolo de Mensajería:** 
    - Parseo de respuestas IA usando separador `---` y barras `|`.
    - Almacenamiento en DB: Texto en `content`, botones en `metadata -> interactive_buttons` (JSON).
    - WhatsApp: Payload `interactive` tipo `button` (Máx 3).
- **Handoff:** Cambio automático de `conversations.status` a `waiting_human` ante palabras clave ("agente", "hablar") o botones de ayuda.

## 💎 ARQUITECTURA CORE
- **Engine:** Ouroborus AI (Cluster de 8 llaves).
- **Estética:** Aesthetics First (Diamond v7.0).
- **Aislamiento:** Multi-tenancy absoluto vía `company_id`.
