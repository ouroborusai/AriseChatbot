# Notas de Integración - List Messages

**Fecha:** 2026-04-09  
**Proyecto:** MTZ Chatbot (AriseChatbot)

---

## Resumen

Se implementó la integración de **List Messages** de WhatsApp para menús con más de 3 opciones, superando el límite de botones interactivos.

---

## 🎯 Problema Anterior

- WhatsApp Interactive Buttons máximo 3 opciones
- Menús grandes (ej: 12 IVAs, muchos documentos) no cabían
- Plantillas con tipo "list" no tenían UI de configuración

---

## ✅ Solución Implementada

### 1. Envío de List Messages

**Menu Handler** (`lib/handlers/menu-handler.ts`):
```typescript
// Si hay más de 3 documentos, usa List Message
if (docs.length > 3) {
  await sendWhatsAppListMessage(phoneNumber, {
    body: `📄 Tienes ${docs.length} documentos disponibles...`,
    buttonText: 'Ver documento',
    sections: [{ title: 'Mis Documentos', rows: [...] }]
  });
}
```

**Documents Handler** (`lib/handlers/documents-handler.ts`):
```typescript
// Si hay más de 3 IVAs, usa List Message
if (ivaDocs.length > 3) {
  await sendWhatsAppListMessage(phoneNumber, {
    body: `🧾 Tienes ${ivaDocs.length} IVAs disponibles...`,
    buttonText: 'Ver IVA',
    sections: [{ title: 'Mis IVAs', rows: [...] }]
  });
}
```

### 2. Webhook: Búsqueda por Trigger

Nueva lógica en `lib/webhook-handler.ts`:
```typescript
// Buscar plantilla por trigger (palabras clave)
const matchedTemplate = await findTemplateByTrigger(text, segment);
if (matchedTemplate) {
  await sendWhatsAppMessage(phoneNumber, matchedTemplate.content);
  await sendTemplateActions(phoneNumber, matchedTemplate.actions);
}
```

**Trigger:** palabras separadas por coma en campo `trigger` de la plantilla.
**Ejemplo:** `trigger: "iva,impuesto,declaración"`

### 3. Navegación entre Plantillas

```typescript
// Si el usuario hace click en un botón de plantilla
const nextTemplate = await findTemplateByActionId(actionId, segment);
if (nextTemplate) {
  await sendWhatsAppMessage(phoneNumber, nextTemplate.content);
  await sendTemplateActions(phoneNumber, nextTemplate.actions);
}
```

**Campo:** `next_template_id` en cada acción conecta a otra plantilla.

### 4. Editor de Plantillas

En `app/components/templates/TemplateEditor.tsx`:
- Tipo de acción: "button" o "list"
- Para listas: hasta 10 opciones (ID, título, descripción)
- Las opciones se guardan en JSON en campo `description` del action

---

## 📊 Tipos de Actions

```typescript
type Action = {
  type: 'button' | 'list';
  id: string;           // Identificador único
  title: string;        // Texto del botón / título de la lista
  description?: string; // Para listas: JSON con opciones [{id, title, description}]
  next_template_id?: string; // Plantilla a navegar después
};
```

---

## 🔄 Flujo del Usuario

```
1. Usuario envía mensaje con trigger "iva"
2. Webhook busca plantillas con trigger que coincida
3. Encuentra "Información IVA" con action tipo "list"
4. Envía mensaje de contenido + List Message con opciones
5. Usuario selecciona opción
6. Webhook recibe list_reply con ID
7. Busca plantilla destino por next_template_id
8. Envía contenido de siguiente plantilla
```

---

## 📁 Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `lib/handlers/menu-handler.ts` | Usa `sendWhatsAppListMessage` para >3 docs |
| `lib/handlers/documents-handler.ts` | Usa `sendWhatsAppListMessage` para >3 IVAs |
| `lib/webhook-handler.ts` | Nuevas funciones: `findTemplateByTrigger`, `findTemplateByActionId`, `sendTemplateActions` |
| `app/components/templates/TemplateEditor.tsx` | UI para configurar opciones de lista |

---

## 🧪 Cómo Probar

1. **Crear plantilla con trigger:**
   - Ir a `/dashboard/templates`
   - Nueva plantilla con `trigger: "test"`
   - Agregar action tipo "list" con opciones

2. **Enviar mensaje de prueba:**
   - Enviar "test" al número de WhatsApp

3. **Ver menús con muchos documentos:**
   - Agregar más de 3 documentos a un cliente
   - Verificar que aparece List Message

---

## ⚠️ Consideraciones

- **WhatsApp límite:** 10 secciones, 10 rows por sección
- **Triggers:** separadores por coma (`,`)
- **Segmento:** plantillas pueden filtrar por cliente/prospecto/todos
- **Prioridad:** plantillas se ordenan por campo `priority` (desc)

---

## 📈 Métricas a Monitorear

- Uso de List Messages vs Buttons
- Conversiones (selección → siguiente paso)
- Tiempo de respuesta por tipo de mensaje