/**
 * Production-ready logging utility with log levels and environment filtering
 * Automatically filters logs based on environment and configured log level
 * 
 * @example
 * ```ts
 * import { logger } from '@/lib/logger';
 * 
 * // Development: all logs shown
 * logger.debug('Starting pitch detection', { frequency: 440 });
 * logger.info('User logged in', { userId: '123' });
 * logger.warn('High latency detected', { latency: 150 });
 * logger.error('API request failed', error);
 * 
 * // Production: only errors shown (configurable)
 * logger.error('Critical error', new Error('Database connection failed'));
 * ```
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  level: LogLevel;
  enableInProduction: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level || 'info',
      enableInProduction: config.enableInProduction ?? false,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    const isDevelopment = import.meta.env.DEV;
    
    // In production, only log if explicitly enabled
    if (!isDevelopment && !this.config.enableInProduction) {
      return false;
    }

    // Check if log level meets threshold
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return `${prefix} ${message}`;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, error?: Error | any, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), error, ...args);
    }
  }
}

// Export singleton instance
export const logger = new Logger({
  level: import.meta.env.DEV ? 'debug' : 'error',
  enableInProduction: false,
});
