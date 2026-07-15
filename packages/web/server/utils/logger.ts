/**
 * Structured server-side logger.
 *
 * Writes JSON lines to stderr by default so process stdout remains clean
 * for responses. In development mode, writes human-readable output.
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId?: string;
  error?: string;
  [key: string]: unknown;
}

function formatEntry(entry: LogEntry): string {
  const isProduction = process.env['NODE_ENV'] === 'production';
  if (isProduction) {
    return JSON.stringify(entry);
  }
  const ts = new Date(entry.timestamp).toISOString();
  return `[${ts}] ${entry.level.toUpperCase()}: ${entry.message}`;
}

function write(level: LogLevel, message: string, extra?: Record<string, unknown>): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...extra,
  };
  process.stderr.write(formatEntry(entry) + '\n');
}

export const logger = {
  info(message: string, extra?: Record<string, unknown>): void {
    write('info', message, extra);
  },
  warn(message: string, extra?: Record<string, unknown>): void {
    write('warn', message, extra);
  },
  error(message: string, error?: Error, extra?: Record<string, unknown>): void {
    write('error', message, {
      ...extra,
      error: error ? `${error.name}: ${error.message}` : undefined,
    });
  },
};
