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
 * Valida que las variables de entorno críticas estén configuradas
 */
export function validateEnvVars(vars: string[]): string[] {
  const missing = vars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    console.warn(`[Utils] Variables de entorno faltantes: ${missing.join(', ')}`);
  }
  return missing;
}
