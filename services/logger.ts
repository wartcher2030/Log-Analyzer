/**
 * Logger Service - Centralized logging and error tracking
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  url?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;
  private isDevelopment = process.env.NODE_ENV === 'development';

  log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      url: window.location.href
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    const style = this.getConsoleStyle(level);
    if (this.isDevelopment) {
      console[level === 'debug' ? 'log' : level](
        `[${level.toUpperCase()}] ${message}`,
        data || ''
      );
    }

    // Store in localStorage for debugging
    this.persistLogs();
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error | any) {
    this.log('error', message, {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    
    // Track in production error service
    if (!this.isDevelopment && error) {
      this.reportError(message, error);
    }
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem('app_logs');
    } catch (e) {
      // localStorage not available
    }
  }

  private persistLogs() {
    try {
      localStorage.setItem('app_logs', JSON.stringify(this.logs));
    } catch (e) {
      // localStorage quota exceeded, ignore
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles: Record<LogLevel, string> = {
      debug: 'color: #94a3b8; font-weight: bold;',
      info: 'color: #3b82f6; font-weight: bold;',
      warn: 'color: #f59e0b; font-weight: bold;',
      error: 'color: #ef4444; font-weight: bold;'
    };
    return styles[level];
  }

  private reportError(message: string, error: any) {
    // Send to error tracking service (e.g., Sentry, LogRocket)
    // Example:
    // fetch('/api/logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ message, error, timestamp: new Date() })
    // }).catch(() => {});
  }
}

export const logger = new Logger();

// Global error handlers
window.addEventListener('error', (event) => {
  logger.error('Uncaught error', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', event.reason);
});

export default logger;
