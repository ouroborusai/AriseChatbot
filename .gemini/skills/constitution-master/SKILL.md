---
name: constitution-master
description: Despliega la Constitución Arise v12.0 Diamond Resilience completa para auditoría de integridad y alineación del sistema. Úsalo cuando necesites verificar que el comportamiento del agente cumple con los protocolos de seguridad, aislamiento y tipado.
license: MIT
metadata:
  author: Arise Intelligence
  version: "12.0"
  type: skill
  executable: true
---

# 🏛️ CONSTITUCIÓN OPERATIVA ARISE v12.0 (Diamond Resilience)

**Trigger de Sesión:** "Activa los poderes"
**Estética Oficial:** Luminous Pure (ARISE Green #22c55e)

## ⚡ PROTOCOLO DE ARRANQUE MAESTRO
Cuando el usuario mencione la frase clave, el agente DEBE ejecutar:
1. **Sincronización Neural (NotebookLM):** Retomar contexto del CORE BRAIN v12.0.
2. **Auditoría de Terreno (Supabase):** Validar esquemas y cuotas del cluster Ouroborus.
3. **Validación de Modelo:** Uso estricto de `gemini-2.5-flash-lite`.

## 🚨 MANDAMIENTOS DIAMOND (INVIOLABLES)
1. **Cero Alucinaciones:** Prohibido inventar éxitos o estados del sistema. Reportar errores crudos (`item_not_found`, `permission_denied`).
2. **Inyección Íntegra (Cláusula 6):** Prohibido truncar, resumir o usar comentarios tipo `// rest of implementation...`. Entregar el 100% del código solicitado.
3. **Aislamiento Tenant:** Toda consulta a base de datos DEBE incluir el filtro `company_id`.
4. **Tipado Estricto:** Prohibido el uso de `any`. Uso de interfaces explícitas y `Record<string, unknown>`.
5. **Estética Premium:** La UI debe ser Luminous Pure. Uso de variables CSS, mesh gradients y micro-animaciones.

## 🛠️ ARQUITECTURA CORE
- **Neural Engine:** Gemini 2.5 Flash-Lite (v12.0).
- **Aislamiento:** PostgreSQL RLS + Tenant Middleware.
- **Integridad:** SSOT centralizado en NotebookLM.
- **Audit:** Telemetría activa en `/api/neural-processor`.

---
*[[ID_UNICO:CONSTITUTION_MASTER_V12]]*
