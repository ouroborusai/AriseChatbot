# 🎨 Mejoras de UI/UX - Editor de Plantillas WhatsApp

**Fecha:** 2026-04-11  
**Estado:** ✅ Implementadas

---

## 📋 Resumen de Mejoras

| # | Mejora | Archivo(s) | Estado |
|---|--------|------------|--------|
| 1 | Headers con gradientes en FlowNode | `FlowNode.tsx` | ✅ |
| 2 | Preview de variables en TemplateDetailPanel | `TemplateDetailPanel.tsx` | ✅ |
| 3 | Validación de duplicados en TemplateEditor | `TemplateEditor.tsx` | ✅ |
| 4 | Exportar/Importar plantillas | `page.tsx` | ✅ |
| 5 | Leyenda de colores en FlowCanvas | `FlowCanvas.tsx` | ✅ |

---

## 1. 🎨 Headers con Gradientes en FlowNode

**Archivo:** `app/components/templates/FlowNode.tsx`

### Cambio
Los headers de los nodos ahora usan gradientes CSS en lugar de colores planos, con efectos de sombra y transición suave.

### Antes
```typescript
style={{ backgroundColor: selected ? '#10b981' : cat.colorHex }}
```

### Ahora
```typescript
className={`... ${
  selected
    ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg'
    : cat.id === 'bienvenida'
      ? 'bg-gradient-to-r from-green-500 to-green-600'
      : cat.id === 'documentos'
        ? 'bg-gradient-to-r from-orange-400 to-orange-500'
        : // ... más categorías
}`}>
```

### Beneficios
- **Mejor contraste visual** entre nodos seleccionados y no seleccionados
- **Identificación rápida** de categoría por color
- **Efecto premium** con gradientes y sombras
- **Indicador de estado** más visible (punto blanco animado)

---

## 2. 📌 Preview de Variables en TemplateDetailPanel

**Archivo:** `app/components/templates/TemplateDetailPanel.tsx`

### Cambio
Se agregó un panel informativo que muestra las variables `{{...}}` que serán reemplazadas en runtime.

### Código Agregado
```typescript
{/* Preview de variables */}
{template.content.includes('{{') && (
  <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
    <p className="text-[10px] font-black text-blue-600 uppercase mb-1">
      📌 Variables a reemplazar:
    </p>
    <div className="flex flex-wrap gap-1">
      {Array.from(template.content.matchAll(/\{\{([^}]+)\}\}/g)).map((match, idx) => (
        <span key={idx} className="text-[10px] bg-white text-blue-700 px-2 py-0.5 rounded border border-blue-200">
          {match[1]}
        </span>
      ))}
    </div>
    <p className="text-[9px] text-blue-500 mt-1">
      ℹ️ Estas variables se reemplazarán con datos reales cuando se envíe el mensaje
    </p>
  </div>
)}
```

### Beneficios
- **Transparencia**: El usuario sabe qué datos se inyectarán
- **Debugging**: Fácil identificar variables mal escritas
- **Documentación**: Recordatorio de variables disponibles

### Variables Soportadas
| Variable | Descripción |
|----------|-------------|
| `{{nombre}}` | Nombre del contacto |
| `{{telefono}}` | Teléfono del contacto |
| `{{segmento}}` | Segmento (cliente/prospecto) |
| `{{document_count}}` | Cantidad de documentos |
| `{{documents_list}}` | Lista JSON de documentos |
| `{{iva_list}}` | Lista JSON de IVAs |

---

## 3. ⚠️ Validación de Duplicados en TemplateEditor

**Archivo:** `app/components/templates/TemplateEditor.tsx`

### Cambios

#### 3.1 Validación de Nombre Duplicado
```typescript
const duplicateName = allTemplates.find(
  t => t.name.toLowerCase() === form.name.toLowerCase() && t.id !== form.id
);
if (duplicateName) {
  alert(`⚠️ Ya existe una plantilla con el nombre "${duplicateName.name}"...`);
  return;
}
```

#### 3.2 Validación de Opciones de Lista sin Enlace
```typescript
if (responseType === 'list' && listOptions.length > 0) {
  const emptyOptions = listOptions.filter(opt => opt.title && !opt.next_template_id);
  if (emptyOptions.length > 0) {
    const confirm = window.confirm(
      `⚠️ Tienes ${emptyOptions.length} opción(es) con título pero sin enlace...`
    );
    if (!confirm) return;
  }
}
```

### Beneficios
- **Previene errores**: Evita plantillas con nombres repetidos
- **Mejora UX**: Advierte sobre listas incompletas
- **Consistencia**: Mantiene la integridad del flujo de navegación

---

## 4. 💾 Exportar/Importar Plantillas

**Archivo:** `app/dashboard/templates/page.tsx`

### Funcionalidades Agregadas

#### 4.1 Exportar a JSON
```typescript
const handleExportTemplates = () => {
  const dataStr = JSON.stringify(templates, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mtz-plantillas-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
};
```

#### 4.2 Importar desde JSON
```typescript
const handleImportTemplates = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  const reader = new FileReader();
  reader.onload = async (e) => {
    const imported = JSON.parse(e.target?.result as string);
    // Validar y crear con IDs únicos
    for (const tpl of imported) {
      await saveTemplate({
        ...tpl,
        id: `imported_${tpl.id}_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  };
  reader.readAsText(file);
};
```

### UI Agregada
```tsx
<button onClick={handleExportTemplates} className="...">
  💾 Exportar
</button>
<label className="...">
  📥 Importar
  <input type="file" accept=".json" onChange={handleImportTemplates} />
</label>
```

### Beneficios
- **Backup**: Respalda tus plantillas antes de cambios grandes
- **Migración**: Mueve plantillas entre entornos (dev → prod)
- **Colaboración**: Comparte plantillas con el equipo
- **Recuperación**: Restaura después de un accidente

---

## 5. 📊 Leyenda de Colores en FlowCanvas

**Archivo:** `app/components/templates/FlowCanvas.tsx`

### Cambio
Se agregó un panel de ayuda en la esquina inferior izquierda con:
- Controles de navegación
- Leyenda de categorías por color
- Estados de plantillas

### UI Agregada
```tsx
<div className="absolute bottom-2 left-2 z-20 space-y-2">
  {/* Controles */}
  <div className="...">
    🎮 Controles: 🖱️ Arrastra = Mover | 🎯 Click = Seleccionar | ...
  </div>

  {/* Leyenda de Colores */}
  <div className="...">
    📊 Categorías:
    <span>🟢 Bienvenida</span>
    <span>🟠 Documentos</span>
    <span>🟣 Trámites</span>
    <span>🔴 Cobranza</span>
    <span>⚫ General</span>
  </div>

  {/* Estados */}
  <div className="...">
    💡 Estados:
    <span>🟢 Activo</span>
    <span>⚪ Inactivo</span>
    <span>⸺ Conexión</span>
  </div>
</div>
```

### Beneficios
- **Onboarding**: Nuevos usuarios entienden la UI rápidamente
- **Referencia**: No necesitas memorizar los colores
- **Accesibilidad**: Más claro para usuarios con daltonismo

---

## 📸 Capturas de Pantalla (Descripción)

### FlowNode con Gradiente
- Header verde degradado para "Bienvenida"
- Header naranja degradado para "Documentos"
- Punto blanco animado (pulse) para "Activo"

### TemplateDetailPanel con Variables
- Panel azul con badges blancos mostrando `{{nombre}}`, `{{document_count}}`
- Texto explicativo: "Estas variables se reemplazarán..."

### TemplateEditor con Validación
- Alerta amarilla: "⚠️ Ya existe una plantilla con el nombre..."
- Confirmación: "⚠️ Tienes 2 opciones con título pero sin enlace"

### Botones de Exportar/Importar
- 💾 Exportar (azul)
- 📥 Importar (índigo)
- 🗑️ Limpiar Todo (rojo)
- 🔄 Restaurar (gris)

### FlowCanvas con Leyenda
- 3 paneles apilados en esquina inferior izquierda
- Iconos emoji + texto descriptivo
- Círculos de color para cada categoría

---

## 🔧 Cómo Probar las Mejoras

1. **Reiniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Navegar a `/dashboard/templates`**

3. **Probar cada mejora:**
   - ✅ Ver gradientes en los nodos
   - ✅ Click en un nodo → ver panel con variables
   - ✅ Crear plantilla con nombre duplicado → ver alerta
   - ✅ Crear lista sin enlaces → ver advertencia
   - ✅ Click en "💾 Exportar" → descargar JSON
   - ✅ Ver leyenda en esquina inferior del Canvas

---

## 📝 Notas Técnicas

### Gradientes CSS
Se usaron gradientes `to-r` (izquierda a derecha) para dar sensación de movimiento y modernidad.

### Validación de Duplicados
La comparación es **case-insensitive** (`toLowerCase()`) para evitar `Menu` vs `menu`.

### Export/Import
- Los IDs importados reciben prefijo `imported_` + timestamp para evitar colisiones
- El formato de exportación es JSON con indentación de 2 espacios

### Leyenda
Los paneles de ayuda tienen `z-20` para estar sobre el Canvas pero bajo los controles de zoom (`z-20`).

---

## 🚀 Próximas Mejoras Sugeridas

1. **Búsqueda/Filtrado**: Buscar plantillas por nombre, trigger o categoría
2. **Vista de Lista**: Alternar entre vista Canvas y vista de lista
3. **Historial de Cambios**: Undo/redo en el editor
4. **Colaboración**: Comentarios en plantillas
5. **Analytics**: Ver cuántas veces se usa cada plantilla

---

**Documento creado:** 2026-04-11  
**Autor:** Claude Code Assistant
