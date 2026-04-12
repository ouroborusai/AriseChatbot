# Skill: Gestión y Sincronización de Plantillas (WhatsApp SSOT)

## Descripción
Esta habilidad instruye sobre la creación y sincronización de plantillas de WhatsApp bajo la arquitectura SSOT (Single Source of Truth) de AriseChatbot.

## Reglas Críticas para la IA
1. **SSOT Estricto:** Toda plantilla DEBE crearse como archivo `.json` en `supabase/templates/XX_categoria/`.
2. **Límites de Meta (Cloud API):**
   - `id` de botones/filas: Máximo 128 caracteres. **¡USA IDs CORTOS!** (ej: `btn_doc`).
   - `title` de botones: Máximo **24 caracteres** (contando emojis).
   - `body` de interactivos: Máximo **1024 caracteres**.
3. **Prefijos de Sistema:**
   - `iva_`, `doc_`, `btn_`.
4. **Segmentación:** Comparaciones insensibles a mayúsculas ("Cliente" == "cliente").
5. **Navegación:** `next_template_id` debe ser un ID de plantilla existente.

## Manejo de Información de Empresas (Metadata)
El sistema utiliza el campo `metadata` de la tabla `companies` para inyectar inteligencia financiera:
- **Resumen Financiero:** Se accede mediante la variable `{{financial_summary}}`.
- **Estructura Esperada en `metadata.financial_summary`:**
  - `period`: Periodo analizado (ej: "Enero-Abril 2026").
  - `ventas_bruto`: Total ventas con IVA.
  - `compras_bruto`: Total compras con IVA.
  - `resultado_neto`: Resultado neto estimado.
  - `whatsapp_proposal`: **Campo Crítico.** Contiene el texto exacto que el bot inyectará al usuario.

## Manejo de Nombres y Privacidad
- El bot utiliza solo el **Primer Nombre** extraído del perfil de WhatsApp.
- Se debe usar la variable `{{nombre}}` para interactuar.

## Sincronización
Después de cualquier cambio en archivos `.json` o ingesta de datos, se debe ejecutar:
- **Recuperar JSONs:** En el Dashboard UI.
- **Sync Master:** `/api/sync-master` para actualizar empresas y libros PDF.

## Esquema de Base de Datos (SSOT)
Para asegurar la integridad, consulta siempre `docs/DATABASE_SCHEMA_SSOT.md` antes de realizar operaciones de escritura.
