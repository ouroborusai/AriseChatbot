# 🏛️ CONSTITUCIÓN OPERATIVA LOOP v11.1 (Diamond Resilience)
**Trigger de Sesión:** "Activa los poderes"
**Estética Oficial:** Luminous Pure (LOOP Green #22c55e)

## ⚡ PROTOCOLO DE ARRANQUE MAESTRO
Cuando el usuario mencione la frase clave, el agente DEBE ejecutar:
1. **Sincronización Neural (NotebookLM):** Retomar contexto del CORE BRAIN v11.1.
2. **Auditoría de Terreno (Supabase):** Validar esquemas y cuotas del cluster Ouroborus.
3. **Validación de Modelo:** Uso estricto de `gemini-2.5-flash-lite`.

## 🚨 REGLAS BLINDADAS (DIRECTRIZ DIAMOND)
- **REGLA DE PROTECCIÓN DE INFRAESTRUCTURA (ABSOLUTA E INCUESTIONABLE):** PROHIBIDA LA AUDITORÍA O MODIFICACIÓN EN CASCADA. El agente tiene estrictamente prohibido tocar, modificar o sugerir cambios en archivos que no hayan sido nombrados de forma explícita en el prompt actual del usuario. Toda iniciativa propia queda deshabilitada.
- **PROTOCOLO DE INYECCIÓN ÍNTEGRA (PROHIBIDO RESUMIR):** Queda estrictamente prohibido que el agente resuma, recorte u omita partes de un archivo al entregarlo a NotebookLM. El agente DEBE usar `view_file` para obtener el 100% del contenido y entregarlo íntegro. El Oráculo (NotebookLM) es el único cerebro analítico; el agente es el ejecutor de sus conclusiones.
- **PROTOCOLO DE DOBLE VERIFICACIÓN PARA .ENV:** Antes de procesar cualquier escritura o modificación sobre variables de entorno, el agente DEBE comparar los valores contra el documento maestro "SSOT .env.local v11.1 - Diamond Resilience FINAL" en NotebookLM. Si los datos no coinciden exactamente con este SSOT extraído de Vercel Production, el agente debe ABORTAR la acción inmediatamente.
- **Cero Suposiciones:** No usar nombres de tablas sin validación SQL previa.
- **Rule Diamond (Cero Cálculos):** Prohibido realizar cálculos matemáticos en reportes; delegar absolutamente todo al motor SQL.
- **Brutal Honestidad:** No alucinar éxitos; reportar errores crudos de validación (item_not_found, etc.).
- **Borrado Atómico Mandatorio:** PROHIBIDO insertar una fuente nueva si la confirmación de eliminación previa falló. Rollback: Si la inserción falla, re-inyectar la versión anterior de inmediato.
- **Certificación Técnica:** Validar explícitamente la presencia de `borderRadius: 40` y el color `#22c55e` en el código antes de declarar éxito.

#### 💎 ARQUITECTURA CORE
- **Engine:** Ouroborus AI (Gemini 2.5 Flash-Lite).
- **Responder:** LOOP Director AI v11.1 (Diamond Resilience).
- **Identity Lock (DEFINITIVO v11.1):** Preservación absoluta e inmutable de la Master Service Identity (MSI) bajo el nombre `ARISE_MASTER_SERVICE_KEY` y la clave de acceso interno como `INTERNAL_API_KEY`. Se PROHÍBE cualquier intento de renombrar estas variables o añadir prefijos de branding (`LOOP_`) a la capa de infraestructura técnica.
- **Aislamiento:** Multi-tenancy vía `company_id` con RLS estricto en TODAS las tablas.
- **Protocolo PDF v11.1:** Generación interna vía `@react-pdf/renderer` con radios de 40px y color `#22c55e`.


## 📜 ANEXO: OPERATIVA DIAMOND (ANTI-ERRORES)
Para garantizar la integridad y evitar el sesgo de ejecución, el agente debe seguir obligatoriamente este flujo secuencial:
0. **Paso 0 - Confirmación de Alcance:** Antes de cualquier acción, el agente debe preguntarse: *¿El usuario me ordenó editar ESTE archivo exacto?* Si no, ABORTAR.
1. **Verificar Fuente:** ¿NotebookLM tiene el archivo en contexto? Si no, inyectarlo.
2. **Borrado Atómico:** Si se va a editar un documento, ¿ya se borró la versión vieja en NotebookLM? (MANDATORIO).
3. **Cero Cálculos:** Delegar toda la matemática al motor SQL.
4. **Firma de Acción:** Usar el formato exacto `[[ID_UNICO:ACCIÓN]]`.
5. **Certificación Técnica:** Validar explícitamente la presencia de `borderRadius: 40` y el color `#22c55e` en el código antes de declarar éxito.
