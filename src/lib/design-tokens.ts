/**
 * ARISE DESIGN TOKENS v9.0
 * Sistema unificado de diseño para Arise Business OS
 *
 * Documentación: src/components/ui/README.md
 */

// ════════════════════════════════════════════════════════════════════════════
// COLORES
// ════════════════════════════════════════════════════════════════════════════

export const colors = {
  // Primarios
  primary: {
    main: '#0045bd',        // Neural Core - Acción principal
    light: '#135bec',       // Electric Blue Spark - Hover/Accent
    dark: '#003da1',        // Deep Navy - Estados active
    glow: 'rgba(0, 69, 189, 0.3)',
  },

  // Neutros (Slate)
  neutral: {
    50: '#f8fafc',          // Background base
    100: '#f1f5f9',         // Superficies secundarias
    200: '#e2e8f0',         // Bordes sutiles
    300: '#cbd5e1',         // Placeholders
    400: '#94a3b8',         // Texto secundario
    500: '#64748b',         // Texto muted
    600: '#475569',         // Iconos
    700: '#334155',         // Texto body
    800: '#1e293b',         // Texto heading
    900: '#0f172a',         // Texto principal
  },

  // Estado
  status: {
    success: '#4ade80',     // Emerald - Operaciones completadas
    warning: '#fbbf24',     // Amber - Alertas
    error: '#f87171',       // Red - Errores críticos
    info: '#60a5fa',        // Blue - Información
  },

  // Funcionales
  functional: {
    background: '#f7f9fb',  // BG principal app
    surface: '#ffffff',     // Cards, modales
    overlay: 'rgba(7, 9, 13, 0.6)',  // Backdrops
  },
} as const;

// ════════════════════════════════════════════════════════════════════════════
// SOMBRAS
// ════════════════════════════════════════════════════════════════════════════

export const shadows = {
  // Arise Signature Shadow
  arise: '0 4px 24px -6px rgba(0, 69, 189, 0.08), 0 1px 4px -2px rgba(0, 0, 0, 0.02)',
  ariseHover: '0 30px 80px -20px rgba(0, 69, 189, 0.15)',

  // Glow Effects
  glowPrimary: '0 0 25px rgba(0, 69, 189, 0.3)',
  glowEmerald: '0 0 25px rgba(74, 222, 163, 0.3)',
  glowRed: '0 0 25px rgba(248, 113, 113, 0.3)',

  // Elevation
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
} as const;

// ════════════════════════════════════════════════════════════════════════════
// BORDER RADIUS
// ════════════════════════════════════════════════════════════════════════════

export const radius = {
  // Signature Arise
  ariseCard: '40px',        // Cards principales
  ariseButton: '18px',      // Botones
  ariseInput: '20px',       // Inputs

  // System
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  '3xl': '32px',
  full: '9999px',
} as const;

// ════════════════════════════════════════════════════════════════════════════
// TIPOGRAFÍA
// ════════════════════════════════════════════════════════════════════════════

export const typography = {
  // Font Families
  fontFamily: {
    sans: '"Inter", system-ui, -apple-system, sans-serif',
    mono: '"JetBrains Mono", monospace',
  },

  // Font Sizes (Mobile-first)
  fontSize: {
    xs: '0.75rem',          // 12px - Texto pequeño
    sm: '0.875rem',         // 14px - Body secundario
    base: '1rem',           // 16px - Body principal
    lg: '1.125rem',         // 18px - Heading pequeño
    xl: '1.25rem',          // 20px - Subheading
    '2xl': '1.5rem',        // 24px - Heading
    '3xl': '1.875rem',      // 30px - Display pequeño
    '4xl': '2.25rem',       // 36px - Display
    '5xl': '3rem',          // 48px - Hero
  },

  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',           // Arise signature
  },

  // Letter Spacing
  letterSpacing: {
    tight: '-0.025em',      // Headings
    normal: '0',            // Body
    wide: '0.025em',        // Labels
    wider: '0.05em',        // Badges
    widest: '0.1em',        // Overlines
    extreme: '0.3em',       // Decorative
  },
} as const;

// ════════════════════════════════════════════════════════════════════════════
// ANIMACIONES
// ════════════════════════════════════════════════════════════════════════════

export const animations = {
  // Durations
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '700ms',
    instant: '75ms',
  },

  // Easing
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    arise: 'cubic-bezier(0.23, 1, 0.32, 1)',  // Signature Arise
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Keyframes (para usar con CSS modules o Tailwind)
  keyframes: {
    shimmer: 'shimmer 1.5s infinite',
    pulse: 'pulse 2s infinite',
    fadeIn: 'fadeIn 0.5s ease-out',
    slideIn: 'slideIn 0.3s ease-out',
  },
} as const;

// ════════════════════════════════════════════════════════════════════════════
// SPACING
// ════════════════════════════════════════════════════════════════════════════

export const spacing = {
  // Base scale (8px grid)
  0: '0',
  1: '0.25rem',   // 2px
  2: '0.5rem',    // 4px
  3: '0.75rem',   // 6px
  4: '1rem',      // 8px
  5: '1.25rem',   // 10px
  6: '1.5rem',    // 12px
  8: '2rem',      // 16px
  10: '2.5rem',   // 20px
  12: '3rem',     // 24px
  16: '4rem',     // 32px
  20: '5rem',     // 40px
  24: '6rem',     // 48px
} as const;

// ════════════════════════════════════════════════════════════════════════════
// GLASSMORPHISM
// ════════════════════════════════════════════════════════════════════════════

export const glassmorphism = {
  bg: 'rgba(255, 255, 255, 0.8)',
  border: 'rgba(255, 255, 255, 0.5)',
  blur: 'blur(20px)',

  // Classes completas para usar
  card: {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
  },

  dark: {
    background: 'rgba(7, 9, 13, 0.8)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
} as const;

// ════════════════════════════════════════════════════════════════════════════
// Z-INDEX
// ════════════════════════════════════════════════════════════════════════════

export const zIndex = {
  base: '0',
  dropdown: '1000',
  sticky: '1100',
  fixed: '1200',
  modalBackdrop: '1300',
  modal: '1400',
  popover: '1500',
  skipLink: '1600',
  toast: '1700',
} as const;

// ════════════════════════════════════════════════════════════════════════════
// BREAKPOINTS (Tailwind)
// ════════════════════════════════════════════════════════════════════════════

export const breakpoints = {
  sm: '640px',    // Mobile landscape
  md: '768px',    // Tablet
  lg: '1024px',   // Desktop
  xl: '1280px',   // Desktop large
  '2xl': '1536px', // Desktop xl
} as const;

// ════════════════════════════════════════════════════════════════════════════
// UTILIDADES DE CLASES (Tailwind-ready)
// ════════════════════════════════════════════════════════════════════════════

export const componentClasses = {
  // Arise Card
  ariseCard: 'arise-card p-6 md:p-8 bg-white/80 rounded-[40px] shadow-arise transition-all duration-500 border border-white/50 backdrop-blur-xl',

  // Botones
  btnPrimary: 'bg-primary text-white px-8 py-3.5 rounded-[18px] font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-accent hover:scale-[1.03] active:scale-95 shadow-lg shadow-primary/20',
  btnSecondary: 'border-2 border-slate-100 text-primary px-8 py-3.5 rounded-[18px] font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-primary/5 hover:border-primary/20',

  // Inputs
  ariseInput: 'bg-slate-50 border-none rounded-2xl px-6 py-4 text-xs font-bold text-slate-900 outline-none ring-primary/5 focus:ring-4 focus:bg-white transition-all placeholder:text-slate-300',

  // Badges
  badgeSuccess: 'bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-[0_0_25px_rgba(74,222,163,0.3)]',
  badgeWarning: 'bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest',
  badgeError: 'bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-red-100/50',
} as const;

// ════════════════════════════════════════════════════════════════════════════
// EXPORT POR DEFECTO
// ════════════════════════════════════════════════════════════════════════════

export const designTokens = {
  colors,
  shadows,
  radius,
  typography,
  animations,
  spacing,
  glassmorphism,
  zIndex,
  breakpoints,
  componentClasses,
} as const;

export type DesignTokens = typeof designTokens;
