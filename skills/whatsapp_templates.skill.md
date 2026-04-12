# Skill: Gestión y Sincronización de Plantillas (WhatsApp SSOT)

## Descripción
Esta habilidad (skill) instruye a Antigravity (u otros flujos) sobre cómo crear, editar y sincronizar plantillas de WhatsApp dentro de la arquitectura SSOT (Single Source of Truth) de AriseChatbot.

## Reglas Críticas para la IA
1. **SSOT Estricto:** Toda plantilla nueva DEBE crearse como un archivo `.json` en `supabase/templates/XX_categoria/`. NUNCA proveas comandos SQL RAW para crear plantillas.
2. **Límites de Meta (Cloud API):**
   - `id` de botones/filas: máximo 128 caracteres. **¡USA IDs CORTOS!** (ej: `doc_iva`). Evita poner textos largos en el ID ya que WhatsApp los trunca y rompe la lógica de navegación.
   - `title` de botones/listas: máximo **24 caracteres** (¡Cuidado con los Emojis! cuentan como varios caracteres).
   - `description` de listas: máximo 72 caracteres.
   - `body` de mensajes interactivos: máximo **1024 caracteres**. El sistema recortará el excedente automáticamente.
3. **Prefijos de Sistema (Obligatorios):** Para que los manejadores automáticos funcionen, usa estos prefijos en los IDs:
   - `iva_` + ID: Para formularios e impuestos mensuales.
   - `doc_` + ID: Para documentos generales.
   - `btn_` + ID: Para botones de navegación de plantillas.
4. **Segmentación Case-Insensitive:** Los campos `segment` pueden escribirse como "Cliente" o "cliente", el sistema normaliza todo a minúsculas internamente.
5. **Navegación (Next Templates):** La variable `next_template_id` dentro del `action` define hacia dónde navega el usuario al interactuar. Siempre debe apuntar a un ID `template_id` existente.

## Procedimiento para Crear una Plantilla
1. Revisa qué plantillas existen usando el explorador de archivos.
2. Crea el archivo `XX_nombre.json`. Asegúrate de poner el `segment` correcto (`cliente`, `prospecto` o `todos`).
3. Empuja a Git.
4. Instruye al Usuario: "Ve al Dashboard de MTZ > Plantillas > Presiona ✨ Recuperar JSONs".

## Manejo de Nombres
- El sistema extrae automáticamente el nombre de perfil de WhatsApp.
- **Sanitización:** Solo se utiliza el primer nombre (ej: "Juan Pérez" -> "Juan") para mantener un tono cercano y evitar nombres de perfil excesivamente largos o corporativos.
- Usa la variable `{{nombre}}` en el contenido de las plantillas para saludar al usuario.

## Procedimiento de QA de WhatsApp
Si el usuario reporta errores o respuestas repetidas:
1. Verifica si el `id` de la acción coincide con el `next_template_id` de la plantilla destino.
2. Verifica si el `title` de la lista supera los 24 caracteres.
3. Revisa la consola Vercel por errores `code: 190` o `Bad Request`.
4. Asegúrate que el usuario no tiene una ventana de 24 horas cerrada.
