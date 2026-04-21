# 🏛️ ARISE DESIGN SYSTEM v9.0

Sistema de diseño unificado para **Arise Business OS** - OuroborusAI

---

## 📦 ÍNDICE

1. [Tokens de Diseño](#tokens-de-diseño)
2. [Componentes UI](#componentes-ui)
3. [Patrones de Uso](#patrones-de-uso)
4. [Accesibilidad](#accesibilidad)

---

## 🎨 TOKENS DE DISEÑO

Los tokens están centralizados en `src/lib/design-tokens.ts`

### Colores

```typescript
import { colors } from '@/lib/design-tokens';

// Primarios
colors.primary.main    // #0045bd - Acción principal
colors.primary.light   // #135bec - Hover/Accent
colors.primary.dark    // #003da1 - Estados active

// Neutros (Slate)
colors.neutral[50]     // #f8fafc - Background base
colors.neutral[900]    // #0f172a - Texto principal

// Estado
colors.status.success  // #4ade80 - Completado
colors.status.warning  // #fbbf24 - Alertas
colors.status.error    // #f87171 - Errores
```

### Sombras

```typescript
import { shadows } from '@/lib/design-tokens';

// Signature Arise
shadows.arise          // Sombra base para cards
shadows.ariseHover     // Sombra para hover states

// Glow Effects
shadows.glowPrimary    // Glow azul para acciones
shadows.glowEmerald    // Glow verde para éxito
```

### Border Radius

```typescript
import { radius } from '@/lib/design-tokens';

radius.ariseCard       // 40px - Cards principales
radius.ariseButton     // 18px - Botones
radius.ariseInput      // 20px - Inputs
```

---

## 🧩 COMPONENTES UI

### MetricSmall

**Ubicación:** `src/components/ui/MetricSmall.tsx`

**Props:**
```typescript
interface MetricSmallProps {
  title: string;      // Label del metric
  value: string | number;
  icon: LucideIcon;
  active?: boolean;   // Estado destacado (azul)
  warning?: boolean;  // Estado alerta (rojo)
  loading?: boolean;
  drift?: string;     // Badge opcional
  className?: string;
}
```

**Uso:**
```tsx
import { MetricSmall } from '@/components/ui/MetricSmall';
import { Users } from 'lucide-react';

<MetricSmall
  title="CONTACTOS"
  value={stats.total}
  icon={Users}
  active={true}
  drift="+12%"
/>
```

### Arise Card (Clase CSS)

```tsx
// Clase base para cualquier card
<div className="arise-card p-6 md:p-8 bg-white border-none shadow-arise">
  {/* Contenido */}
</div>
```

**Características:**
- Glassmorphism con `backdrop-blur-xl`
- Transición suave de 500ms
- Hover con elevación y sombra aumentada

---

## 📐 PATRONES DE USO

### 1. Cards de Dashboard

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
  <MetricSmall title="USUARIOS" value={users} icon={Users} active />
  <MetricSmall title="INGRESOS" value={revenue} icon={DollarSign} />
  <MetricSmall title="ALERTAS" value={alerts} icon={Bell} warning />
</div>
```

### 2. Botones

```tsx
// Primario (acción principal)
<button className="btn-arise">
  ACCIÓN PRINCIPAL
</button>

// Secundario (acciones secundarias)
<button className="btn-arise-outline">
  CANCELAR
</button>
```

### 3. Inputs

```tsx
<input
  type="text"
  className="arise-input"
  placeholder="Ingresa valor..."
/>
```

### 4. Badges de Estado

```tsx
<span className="badge-arise-success">
  ACTIVO
</span>

<span className="badge-arise-danger">
  ERROR
</span>
```

---

## ♿ ACCESIBILIDAD

### Contraste de Colores

Todos los colores cumplen con **WCAG AA** para texto normal:

| Combinación | Ratio | Cumple |
|-------------|-------|--------|
| primary/main sobre blanco | 8.0:1 | ✅ AAA |
| neutral[900] sobre blanco | 15.3:1 | ✅ AAA |
| neutral[400] sobre blanco | 3.4:1 | ✅ AA |

### Focus States

Todos los elementos interactivos incluyen:
- `focus:ring-4` para visibilidad
- `outline-none` solo con ring alternativo
- Transición suave de 300ms

### Texto

- Tamaño mínimo: `12px` (text-xs)
- Heading usan `tracking-tight` para mejor legibilidad
- Body usa `tracking-normal`

---

## 🚀 QUICK START

### 1. Importar tokens

```tsx
import { designTokens } from '@/lib/design-tokens';
```

### 2. Usar en componentes

```tsx
const MyComponent = () => {
  return (
    <div
      className="arise-card"
      style={{
        background: designTokens.glassmorphism.card.background,
      }}
    >
      {/* ... */}
    </div>
  );
};
```

### 3. Seguir patrones existentes

Revisa los componentes en:
- `src/components/ui/` - Componentes base
- `src/components/crm/` - Ejemplos CRM
- `src/components/inventory/` - Ejemplos Inventario

---

## 📝 NOTAS DE VERSIÓN

| Versión | Cambios |
|---------|---------|
| v9.0 | Sistema unificado de tokens |
| v9.0 | Glassmorphism actualizado |
| v9.0 | Sombras signature Arise |

---

**Mantenimiento:** Equipo Arise Intelligence
**Última actualización:** 2026-04-20
