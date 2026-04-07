/**
 * Logger - Wrapper around console.log para desarrollo y producción
 * En desarrollo: printa todo
 * En producción: solo errores
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  log: (prefix: string, message: string, data?: any) => {
    if (isDev) {
      if (data) {
        console.log(`[${prefix}] ${message}`, data);
      } else {
        console.log(`[${prefix}] ${message}`);
      }
    }
  },

  warn: (prefix: string, message: string, data?: any) => {
    if (isDev) {
      if (data) {
        console.warn(`[${prefix}] ⚠️ ${message}`, data);
      } else {
        console.warn(`[${prefix}] ⚠️ ${message}`);
      }
    }
  },

  error: (prefix: string, message: string, error?: any) => {
    console.error(`[${prefix}] ❌ ${message}`, error);
  },

  debug: (prefix: string, message: string, data?: any) => {
    if (isDev) {
      if (data) {
        console.debug(`[${prefix}] 🔍 ${message}`, data);
      } else {
        console.debug(`[${prefix}] 🔍 ${message}`);
      }
    }
  },
};
