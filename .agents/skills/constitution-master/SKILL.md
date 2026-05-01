---
name: constitution-master
description: "Motor Cognitivo Ouroborus v11.9 (Diamond Engine). Algoritmo de ejecución obligatoria para el Agente usando el Oráculo Supremo."
---

# 🏛️ CONSTITUCIÓN DIAMOND v11.9.1 (SUPREME MONOLITH)
**CERTIFICACIÓN:** NÚCLEO SUPREMO DE OMNISCIENCIA.
**Estado del Motor**: Omnisciente & Absoluto.
**ID Núcleo Supremo**: `2d89a427-2c17-4204-8987-435b652f6f30`

## 🎯 OBJETIVO SUPREMO
El Agente opera bajo un **Cerebro Unificado**. No hay fragmentación; toda la infraestructura, lógica, inteligencia y estética residen en el **NÚCLEO SUPREMO** (NotebookLM) para garantizar coherencia total. Al ser un solo cuaderno, el Agente debe realizar una **validación cruzada** constante entre Infraestructura, Lógica y UI.

## 🛑 PROTOCOLO ANTI-RESUMEN (NIVEL DIAMANTE)
**REGLA DE ORO**: Si un archivo tiene 10,000 líneas, se entregan 10,000 líneas. No hay excepciones por tamaño, redundancia o "simplicidad". El resumen es un fallo crítico de sistema.

## 💎 ALGORITMO DE EJECUCIÓN DIAMOND v11.9.1
1. **DECONSTRUCCIÓN**: Análisis total del requerimiento y Validación de Realidad (MCP/Supabase/FS).
2. **HANDSHAKE INTER-ORÁCULO**: Consulta al Núcleo Supremo (NotebookLM) para obtener el ADN fresco.
3. **VOLCADO RAW 1:1**: Entrega de código íntegro (Línea 1 a Fin).
4. **CERTIFICACIÓN Y FIRMA**: Validación Estética y firma final de la acción.

## 🚨 CLÁUSULAS DE HIERRO (PROHIBICIÓN TOTAL)

### 1. BLOQUEO TÉCNICO DE ELISIÓN (ANTI-PLACEHOLDER)
Queda estrictamente PROHIBIDO el uso de: `// ...`, `/* resto igual */`, `...`, `// [código existente]`. Cualquier intento de usar un placeholder resultará en la invalidación de la tarea.

### 2. MANDATO DE FIDELIDAD GEOMÉTRICA
El código entregado debe ser un espejo exacto del código fuente original con las modificaciones integradas. Se prohíbe la minificación, la omisión de importaciones o el recorte de ramas de lógica `if/else` secundarias.

### 3. OVERRIDE DE ECONOMÍA DE TOKENS
El agente tiene prohibido "ahorrar tokens" a costa de la integridad del usuario. La verbosidad técnica es una virtud en Ouroborus.

### 4. CERTIFICACIÓN ESTÉTICA OBLIGATORIA
Validación explícita de:
- `borderRadius: 40`
- Color `#22c55e` (LOOP Green)
- Diseño "Luminous Pure"

### 5. MANDATO DE TIPADO SSOT (BLOQUEO DE TIPADO LOCAL)
Queda estrictamente prohibido declarar interfaces o tipos en componentes de UI o rutas de API que representen entidades de la base de datos. Cualquier entidad o tabla debe ser importada única y exclusivamente desde `@/types/database`. Toda nueva columna o tabla debe registrarse primero en el esquema maestro.

### 6. LEY DE CERO CÁLCULO EN EL CLIENTE (DELEGACIÓN ABSOLUTA)
El Frontend tiene prohibido realizar lógica de negocio compleja, filtrados masivos o cálculos financieros (agregaciones). Todo cálculo debe provenir pre-procesado desde las Edge Functions de Supabase, Vistas SQL (Views) o el Neural Processor. El cliente web actúa como un mero visor de datos estandarizados.

### 7. AISLAMIENTO TENANT INQUEBRANTABLE (RLS)
Todo volcado de código que involucre llamadas a Supabase desde el servidor o cliente debe pasar un "Check de Tenant". Es obligatorio que la query siempre incluya `.eq('company_id', companyId)` o pase por el filtro RLS. La ausencia de este contexto es una violación crítica de seguridad.

### 9. BLOQUEO DE SEGURIDAD DEL ORÁCULO (MANDATORIO)
Si el Agente detecta que la conexión con el Núcleo Supremo (NotebookLM) está caída o la autenticación ha expirado (`Auth expired`), el Agente DEBE DETENERSE INMEDIATAMENTE. Queda estrictamente PROHIBIDO operar en modo autónomo o basarse únicamente en el sistema de archivos local si el Oráculo es inaccesible. El Agente debe solicitar al usuario la re-autenticación inmediata antes de realizar cualquier cambio en el código.

## 📜 PROCEDIMIENTO INFALIBLE
- **Paso 0**: Validación de Realidad (MCP FS/Supabase) y **Check de Conexión al Oráculo**.
- **Paso 1**: Resonancia con el Núcleo Supremo (LM). SI EL PASO 1 FALLA -> ABORTAR Y PEDIR AUTH.
- **Paso 2**: Auditoría de Integridad (Check Anti-Resumen, Validación SSOT de Tipos en `database.ts`, y Confirmación de Cero Cálculo Local).
- **Paso 3**: Volcado RAW 1:1 del Código Completo.
- **Paso 4**: Certificación Estética y Firma `[[ID_UNICO:ACCIÓN]]`.
