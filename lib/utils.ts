/**
 * Utilities
 * Funciones compartidas
 */

/**
 * Extrae solo dígitos de una cadena
 */
export function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}

/**
 * Normaliza número de teléfono (elimina espacios, guiones, +56 -> 56)
 */
export function normalizePhoneNumber(phone: string): string {
  // Eliminar espacios, guiones, paréntesis
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Si empieza con +56, cambiar a 56
  if (cleaned.startsWith('+56')) {
    cleaned = '56' + cleaned.slice(3);
  }
  
  // Si empieza con 569, mantener
  // Si empieza con 9 y tiene 8 dígitos, agregar 56 al inicio
  if (cleaned.startsWith('9') && cleaned.length === 9) {
    cleaned = '56' + cleaned;
  }
  
  return cleaned;
}

/**
 * Valida que las variables de entorno críticas estén configuradas
 */
export function validateEnvVars(vars: string[]): string[] {
  const missing = vars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    console.warn(`[Utils] Variables de entorno faltantes: ${missing.join(', ')}`);
  }
  return missing;
}
