# 🗺️ Arquitectura de Plantillas y Flujos (SSOT Json)

**MTZ Consultores Tributarios** - Última actualización: Abril 2026

---

## 🏛️ 1. Single Source of Truth (SSOT)

Las plantillas del Chatbot NO SE ENCUENTRAN HARDCODEADAS EN EL CÓDIGO NI EN SQL.
Toda la fuente de verdad está en el directorio `supabase/templates/`.

**Estructura de Carpetas:**
```
supabase/
 └── templates/
      ├── 01_bienvenida/
      │    ├── 01_A_bienvenida_prospecto.json
      │    └── 01_B_menu_principal_cliente.json
      ├── 02_documentos/
      ├── 02_prospectos/
      │    ├── 02_B_prospecto_faq.json
      │    └── 02_D_inicio_actividades.json
      ├── 03_clientes/
      │    ├── 03_A_bandeja_documentos.json
      │    ├── 03_D_solicitud_tramite.json
      │    ├── 03_F_datos_bancarios.json
      │    ├── 03_H_agendar_cita.json
      │    └── ... (Total 10 archivos)
      └── index.ts (Índice Maestro)
```

### Reglas de Modificación de Plantillas
1. **Edición:** Nunca editar la base de datos SQL manualmente. Las plantillas se editan vía `TemplateEditor.tsx` en el UI o editando los `.json` locales.
2. **Sincronización:** Una vez editado el JSON, se debe apretar el botón "Recuperar JSONs del Sistema" en el Dashboard de Vercel. Esto ejecuta el POST a `/api/setup-templates` y vuelca los .json en Supabase.
3. **Nomenclatura:** Los archivos json deben empezar con `XX_` para asegurar orden numérico. Sus 'ids' son planos, ej. `bienvenida_prospecto`.

---

## ⚡ 2. Escalabilidad Industrial: Listas v/s Botones

Para asegurar la estabilidad en despliegues a gran escala (MTZ 110+ clientes):
1. **Límite de Botones:** WhatsApp solo permite **3 botones** en mensajes tipo 'button'.
2. **Uso de Listas:** Para menús con más de 3 opciones (como el Menú Principal), se debe usar obligatoriamente el tipo **'list'** con el contenido formateado en JSON en el campo `content`. 
3. **Circularidad Obligatoria:** Toda plantilla "final" debe poseer un botón de retorno:
   - `menu_principal_cliente` (Para Clientes)
   - `bienvenida_prospecto` (Para Prospectos)

---

## ⚙️ 3. Captura Industrial de Trámites

El sistema posee un motor de escucha inteligente en el `WebhookHandler`:
- Si `lastAction === 'solicitud_tramite'`, el texto del usuario se guarda directamente como un registro de `service_requests`.
- **Media Support:** El bot puede recibir comprobantes de pago (Imágenes) y documentos contables (PDF), vinculándolos al buzón de recepción del cliente.

---

## 🟢 4. Flujo Dinámico UI (Canvas)

El Builder UI en el Dashboard lee los "flujos" trazando la variable `next_template_id`.
*   El Canvas tiene pestañas para separar visualmente: `[ 🔍 Prospectos ]` vs `[ 👤 Clientes ]` vs `[ Global ]`.
*   Las posiciones `X/Y` se guardan en el `localStorage`.
*   Al apretar **✨ Auto** en el UI, el Canvas lee las conexiones reales (flechas lógicas) basándose puramente en lo guardado en Supabase, y las dibuja cayendo desde Y=80.

---

## 🧑‍💻 4. Lógica de Perfiles de WhatsApp

Desde Abril 2026, el sistema usa `contacts[].profile.name` directamente del webhook de la API de Cloud de WhatsApp para extraer el nombre Real de WhatsApp del contacto.
* Se removió el antiguo parche temporal de revisar el campo inválido `customers` de Meta.
* La ruta `/api/webhook/route.ts` mapea la `wa_id` y captura el nombre.
* Todo cae a `database-service.ts` -> `getOrCreateContact(phone, profileName)` para guardar de forma permanente su nombre en vez de decirle "cliente".
* Las condicionales en el webhook permiten doble fallo. Si el webhook de un prospecto no halla la plantilla por el `id` exacto (Ej: fue renombrado), buscará en la base de datos la primer coincidencia de "hola" para un Prospecto como mecanismo redundante de seguridad.
