---
name: arise_standards_v9
description: Reglas fundamentales de arquitectura para Ouroborus AI y Diamond v9.0
type: project
---

# 🏛️ ESTÁNDARES DE ARISE v9.0

## 1. Arquitectura de Mensajería (Neural Engine)
- **Centralización**: Todo el procesamiento neural debe ocurrir en `src/app/api/neural-processor/route.ts`.
- **Formato**: Uso estricto de separadores `---` y `|` para el parseo de respuestas de la IA.
- **Multitenancy**: Uso obligatorio de `company_id` para aislar datos.

## 2. Higiene de Dependencias
- **Auditoría**: Usar siempre `scripts/dependency-check.ts` (v9.3) antes de grandes commits.
- **Producción**: Minimizar el uso de dependencias en `dependencies`. Todo lo que sea build-time debe ir a `devDependencies`.
- **Eliminación**: No borrar `react-dom` aunque el auditor lo marque, ya que Next.js lo requiere internamente.

## 3. Calidad de Código (Clean Code Arise)
- **Cero Suposiciones**: Validar esquemas SQL antes de proponer consultas.
- **Build First**: No dar una tarea por terminada sin un `npm run build` exitoso.

**Why:** Estos estándares garantizan que el sistema no colapse bajo su propia complejidad y que la IA Gemini mantenga la coherencia en las respuestas de WhatsApp.

**How to apply:** Consultar estas reglas antes de cada refactorización mayor.
