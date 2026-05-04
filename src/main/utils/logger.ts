/**
 * Main process logger.
 * In dev: logs to console with color.
 * In prod: logs to file via electron-log (future) — currently console only.
 */

const isDev = process.env.NODE_ENV === 'development'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // cyan
  info:  '\x1b[32m', // green
  warn:  '\x1b[33m', // yellow
  error: '\x1b[31m', // red
}
const RESET = '\x1b[0m'

function log(level: LogLevel, context: string, message: string, ...args: unknown[]): void {
  if (!isDev && level === 'debug') { return }

  const timestamp = new Date().toISOString()
  const color     = COLORS[level]
  const prefix    = `${color}[${level.toUpperCase()}]${RESET} ${timestamp} [${context}]`

  if (level === 'error') {
    console.error(prefix, message, ...args)
  } else if (level === 'warn') {
    console.warn(prefix, message, ...args)
  } else {
    console.log(prefix, message, ...args)
  }
}

export const logger = {
  debug: (ctx: string, msg: string, ...args: unknown[]) => log('debug', ctx, msg, ...args),
  info:  (ctx: string, msg: string, ...args: unknown[]) => log('info',  ctx, msg, ...args),
  warn:  (ctx: string, msg: string, ...args: unknown[]) => log('warn',  ctx, msg, ...args),
  error: (ctx: string, msg: string, ...args: unknown[]) => log('error', ctx, msg, ...args),
}
