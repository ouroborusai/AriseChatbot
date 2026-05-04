/**
 * ARISE Structured Logger v1.0
 * Logger centralizado para reemplazar console.log dispersos
 */

const isDev = process.env.NODE_ENV === 'development';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  data?: unknown;
}

const formatLog = (level: LogLevel, source: string, message: string, data?: unknown): string => {
  const timestamp = new Date().toISOString();
  const prefix = `[${level.toUpperCase()}] ${timestamp} - [${source}]`;

  if (data !== undefined) {
    return `${prefix} - ${message} ${JSON.stringify(data, null, 2)}`;
  }

  return `${prefix} - ${message}`;
};

export const logger = {
  info: (message: string, source = 'APP', data?: unknown) => {
    console.log(formatLog('info', source, message, data));
  },

  warn: (message: string, source = 'APP', data?: unknown) => {
    console.warn(formatLog('warn', source, message, data));
  },

  error: (message: string, source = 'APP', data?: unknown) => {
    console.error(formatLog('error', source, message, data));
  },

  debug: (message: string, source = 'APP', data?: unknown) => {
    if (isDev) {
      console.log(formatLog('debug', source, message, data));
    }
  },

  // Helper para logs estructurados en formato JSON (útil para producción)
  json: (level: LogLevel, context: Omit<LogContext, 'timestamp' | 'level'>) => {
    const log: LogContext = {
      timestamp: new Date().toISOString(),
      level,
      ...context,
    };

    if (level === 'error') {
      console.error(JSON.stringify(log));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(log));
    } else if (isDev) {
      console.log(JSON.stringify(log));
    }
  },
};
