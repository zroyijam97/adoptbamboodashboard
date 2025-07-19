/**
 * Centralized Logging Utility
 * Provides consistent logging across the application
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

interface LogContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorDetails = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : { error };
    
    const fullContext = { ...context, ...errorDetails };
    console.error(this.formatMessage(LogLevel.ERROR, message, fullContext));
  }

  // API-specific logging methods
  apiRequest(endpoint: string, method: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${endpoint}`, context);
  }

  apiResponse(endpoint: string, status: number, duration?: number, context?: LogContext): void {
    const message = `API Response: ${endpoint} - ${status}`;
    const fullContext = duration ? { ...context, duration: `${duration}ms` } : context;
    
    if (status >= 400) {
      this.error(message, undefined, fullContext);
    } else {
      this.info(message, fullContext);
    }
  }

  database(operation: string, table: string, context?: LogContext): void {
    this.debug(`DB Operation: ${operation} on ${table}`, context);
  }

  payment(operation: string, referenceNo?: string, context?: LogContext): void {
    const fullContext = referenceNo ? { ...context, referenceNo } : context;
    this.info(`Payment: ${operation}`, fullContext);
  }
}

export const logger = new Logger();

// Utility function to create request context
export function createRequestContext(request: Request): LogContext {
  return {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent') || 'unknown'
  };
}

// Performance monitoring decorator
export function withPerformanceLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operationName: string
): T {
  return (async (...args: Parameters<T>) => {
    const startTime = Date.now();
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      logger.info(`${operationName} completed`, { duration: `${duration}ms` });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`${operationName} failed`, error, { duration: `${duration}ms` });
      throw error;
    }
  }) as T;
}