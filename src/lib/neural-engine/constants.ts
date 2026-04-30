/**
 * LOOP NEURAL ENGINE CONSTANTS Platinum v10.4
 * Centralización de configuraciones y valores mágicos
 */

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE IA
// ════════════════════════════════════════════════════════════════════════════

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE EMPRESA
// ════════════════════════════════════════════════════════════════════════════

// SuperAdmin / Global Company ID
export const SUPER_ADMIN_COMPANY_ID = 'ca69f43b-7b11-4dd3-abe8-8338580b2d84';

// ════════════════════════════════════════════════════════════════════════════
// WHATSAPP - PREFIJOS DE ACCIONES
// ════════════════════════════════════════════════════════════════════════════

export const ACTION_PREFIXES = {
  TECHNICAL: 'gen_',
  LIST: 'lst_',
  BUTTON: 'btn_',
} as const;

// ════════════════════════════════════════════════════════════════════════════
// WHATSAPP - LÍMITES DE API
// ════════════════════════════════════════════════════════════════════════════

export const WHATSAPP_LIMITS = {
  MAX_OPTIONS: 10,
  MAX_TITLE_LENGTH: 24,
  MAX_DESCRIPTION_LENGTH: 72,
  MAX_BODY_LENGTH: 1024,
} as const;

// ════════════════════════════════════════════════════════════════════════════
// EMOJIS PARA INTERFAZ
// ════════════════════════════════════════════════════════════════════════════

export const ICON_MAP: Record<string, string> = {
  'inv': '📦', 'stock': '📦', 'fin': '💰', 'pag': '💰', 'adm': '⚙️',
  'ajust': '⚙️', 'rrhh': '👥', 'person': '👥', 'rec': '🔔', 'tarea': '📌',
  'vol': '⬅️', 'men': '🏠', 'ini': '🏠', 'repo': '📊', 'doc': '📄',
  'fac': '🧾', 'cli': '🤝', 'ven': '💵', 'cot': '📋', 'aud': '🔎',
  'tal': '🛠️', 'man': '🛠️', 'ser': '🛠️', 'con': '✅'
} as const;

// ════════════════════════════════════════════════════════════════════════════
// TIMEOUTS INDUSTRIALES
// ════════════════════════════════════════════════════════════════════════════

export const TIMEOUTS = {
  PDF_GENERATION: 30000,      // 30s para generación de PDF
  NEURAL_PROCESSOR: 30000,    // 30s para procesamiento neural
  API_REQUEST: 10000,         // 10s para requests genéricos
  RETRY_DELAY: 1000,          // 1s entre retries
  MAX_RETRY_ATTEMPTS: 3,      // 3 intentos máximos
} as const;

// ════════════════════════════════════════════════════════════════════════════
// STRINGS DE SISTEMA
// ════════════════════════════════════════════════════════════════════════════

export const SYSTEM_STRINGS = {
  DEFAULT_SYSTEM_PROMPT: 'Eres LOOP Director AI. "Cierra el ciclo de tus tareas con Loop".',
  NEURAL_AI_CREATED: 'Creado vía LOOP Neural AI',
  FALLBACK_RESPONSE: 'LOOP Neural Engine: Fallo de percepción.',
} as const;
