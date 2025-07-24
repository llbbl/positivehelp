// Client-side logger that works in the browser
export interface LogData {
  [key: string]: any;
}

class ClientLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  info(message: string, data?: LogData) {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, data || '');
    }
  }

  warn(message: string, data?: LogData) {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  }

  error(message: string, data?: LogData) {
    console.error(`[ERROR] ${message}`, data || '');
    
    // In production, you might want to send errors to a logging service
    if (!this.isDevelopment) {
      this.sendToLoggingService('error', message, data);
    }
  }

  debug(message: string, data?: LogData) {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }

  private sendToLoggingService(level: string, message: string, data?: LogData) {
    // Placeholder for production error logging service
    // You could integrate with services like Sentry, LogRocket, etc.
    try {
      // Example: Send to your logging endpoint
      // fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ level, message, data, timestamp: new Date().toISOString() })
      // }).catch(() => {}); // Fail silently for logging
    } catch {
      // Fail silently - don't let logging errors break the app
    }
  }
}

const clientLogger = new ClientLogger();
export default clientLogger;