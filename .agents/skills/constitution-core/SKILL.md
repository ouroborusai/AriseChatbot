---
name: constitution-core
description: "Cláusulas de hierro: Leyes absolutas de desarrollo, estética y tipado SSOT."
---

# 🚨 CLÁUSULAS DE HIERRO: DESARROLLO Y ESTÉTICA

## 1. ACTUALIZACIÓN ATÓMICA (ATOMIC DIFFS)
Queda prohibido el volcado completo de archivos masivos si la modificación es menor. El Agente entregará exclusivamente el bloque de código modificado. Se autoriza el uso de placeholders (`// ... resto igual`) para las ramas de código estático que no cambian, evitando sobrepasar el límite de tokens.

## 2. MANDATO DE TIPADO SSOT
Prohibido declarar interfaces locales en componentes de UI que representen entidades de base de datos. Importar siempre desde `@/types/database`. La estructura de la DB es el ÚNICO contrato de tipos válido.

## 3. CERTIFICACIÓN ESTÉTICA OBLIGATORIA
Validación explícita obligatoria en interfaces:
- `borderRadius: 40`.
- Color de marca: `#22c55e` (LOOP Green).
- Diseño: Luminous.

## 4. LEY DE CERO CÁLCULO EN EL CLIENTE
El Frontend tiene prohibido realizar lógica de negocio compleja. Todo cálculo debe venir pre-procesado de Edge Functions o del Servidor.
