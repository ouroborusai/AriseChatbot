---
name: audit-system
description: Ejecuta un protocolo de auditoría de integridad del sistema, verificando variables de entorno, esquemas de base de datos y consistencia del código frente a la Constitución Arise v12.0.
license: MIT
metadata:
  author: Arise Intelligence
  version: "12.0"
  type: skill
  executable: true
---

# 🔍 SYSTEM INTEGRITY AUDIT (Diamond v12.0)

Este skill activa un protocolo de diagnóstico profundo para asegurar que el entorno de desarrollo y producción esté alineado con el SSOT (Single Source of Truth).

## 🛠️ PUNTOS DE CONTROL
1. **Infraestructura (Vercel/Supabase):** Verificación de conectividad y latencia del cluster.
2. **Seguridad (RLS):** Validación de políticas de aislamiento por `company_id`.
3. **Neural Engine (Gemini):** Auditoría de rotación de llaves y cuotas de inferencia.
4. **Code Quality:** Escaneo de tipos `any` y placeholders tóxicos.

## ⚡ COMANDOS DE AUDITORÍA
- `npm run test:neural`
- `mcp_supabase_list_tables`
- `git status` (Check for architectural drift)

---
*[[ID_UNICO:AUDIT_SYSTEM_V12]]*
