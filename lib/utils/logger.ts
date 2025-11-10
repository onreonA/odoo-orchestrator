/**
 * Logger Utility
 * 
 * Structured logging for production
 * Sprint 5 - Monitoring Setup
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  error?: {
    message: string
    stack?: string
    name?: string
  }
}

class Logger {
  private shouldLogToService(): boolean {
    return process.env.NODE_ENV === 'production' && !!process.env.LOGGING_ENDPOINT
  }

  private async sendToLoggingService(entry: LogEntry): Promise<void> {
    if (!this.shouldLogToService()) {
      return
    }

    try {
      await fetch(process.env.LOGGING_ENDPOINT!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })
    } catch (error) {
      // Fallback to console if logging service fails
      console.error('Failed to send log to service:', error)
      console[entry.level](entry)
    }
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    }

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      }
    }

    return entry
  }

  async info(message: string, context?: Record<string, any>): Promise<void> {
    const entry = this.createLogEntry('info', message, context)
    
    if (this.shouldLogToService()) {
      await this.sendToLoggingService(entry)
    } else {
      console.info(entry)
    }
  }

  async warn(message: string, context?: Record<string, any>): Promise<void> {
    const entry = this.createLogEntry('warn', message, context)
    
    if (this.shouldLogToService()) {
      await this.sendToLoggingService(entry)
    } else {
      console.warn(entry)
    }
  }

  async error(message: string, error?: Error, context?: Record<string, any>): Promise<void> {
    const entry = this.createLogEntry('error', message, context, error)
    
    if (this.shouldLogToService()) {
      await this.sendToLoggingService(entry)
    } else {
      console.error(entry)
    }
  }

  async debug(message: string, context?: Record<string, any>): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      return // Don't log debug in production
    }

    const entry = this.createLogEntry('debug', message, context)
    console.debug(entry)
  }
}

export const logger = new Logger()

