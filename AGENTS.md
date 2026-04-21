# 🏛️ CONSTITUCIÓN OPERATIVA ARISE v9.0
**Trigger de Sesión:** "Activa los poderes"

## ⚡ PROTOCOLO DE ARRANQUE MAESTRO
Cuando el usuario mencione la frase clave, el agente DEBE ejecutar:
1. **Sincronización Neural (NotebookLM):** Retomar contexto del SSOT.
2. **Auditoría de Terreno (Supabase):** Validar esquemas y cuotas de Gemini.
3. **Validación de Modelo:** Uso estricto de `gemini-2.5-flash-lite`.

## 🚨 REGLAS BLINDADAS (DIRECTRIZ LM)
- **Cero Suposiciones:** No usar nombres de tablas sin validación SQL previa.
- **Arquitectura Unificada:** El núcleo reside en `arise-neural-engine`. No duplicar funciones.
- **Protocolo de Mensajería:** Parseo de respuestas IA usando `---` y `|`.
- **Handoff:** Cambio a `waiting_human` ante palabras clave o ayuda manual.

## 💎 ARQUITECTURA CORE
- **Engine:** Ouroborus AI (Gemini 2.5 Flash-Lite).
- **Control:** Diamond v9.0 (Simetría y PUREZA).
- **Aislamiento:** Multi-tenancy vía `company_id`.
