# Skill: Gestión y Sincronización de Plantillas (WhatsApp SSOT)

## Descripción
Esta habilidad (skill) instruye a Antigravity (u otros flujos) sobre cómo crear, editar y sincronizar plantillas de WhatsApp dentro de la arquitectura SSOT (Single Source of Truth) de AriseChatbot.

## Reglas Críticas para la IA
1. **SSOT Estricto:** Toda plantilla nueva DEBE crearse como un archivo `.json` en `supabase/templates/XX_categoria/`. NUNCA proveas comandos SQL RAW para crear plantillas, porque se perderán tras una sincronización en Vercel.
2. **Límites de Meta:**
   - `id` de botones: máximo 200 caracteres.
   - `title` de botones/listas: máximo 24 caracteres (¡Cuidado con los Emojis múltiples como 👨‍💼!).
   - `description` de listas: máximo 72 caracteres.
3. **Flujos (Next Templates):** La variable `next_template_id` dentro del `action` define hacia dónde navega el usuario al interactuar. Siempre debe apuntar a un ID `template_id` existente.

## Procedimiento para Crear una Plantilla
1. Revisa qué plantillas existen usando el explorador de archivos.
2. Crea el archivo `XX_nombre.json`. Asegúrate de poner el `segment` correcto (`cliente`, `prospecto` o `todos`).
3. Empuja a Git.
4. Instruye al Usuario: "Ve al Dashboard de MTZ > Plantillas > Presiona ✨ Recuperar JSONs".

## Procedimiento de QA de WhatsApp
Si el usuario reporta que una plantilla "no aparece" en su teléfono:
1. Verifica si el usuario intentó responder a un mensaje de hace más de 24 horas (Regla MKT de Meta).
2. Revisa la longitud en caracteres del `title` de la botonera.
3. Revisa la consola Vercel en la pestaña Functions por errores `code: 190` o validaciones de tipo `Bad Request`.
