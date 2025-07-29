// Simple logger utility for error tracking
// In production, use winston, bunyan, or pino

const logLevels = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

class Logger {
    constructor() {
        this.level = process.env.LOG_LEVEL || 'INFO';
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const environment = process.env.NODE_ENV || 'development';
        
        return {
            timestamp,
            level,
            environment,
            message,
            ...meta
        };
    }

    error(message, error = null) {
        const logData = this.formatMessage('ERROR', message, {
            error: error ? {
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                code: error.code,
                statusCode: error.statusCode
            } : undefined
        });

        console.error(JSON.stringify(logData, null, 2));
        
        // In production, send to error tracking service
        // Example: Sentry.captureException(error);
    }

    warn(message, meta = {}) {
        if (logLevels[this.level] >= logLevels.WARN) {
            const logData = this.formatMessage('WARN', message, meta);
            console.warn(JSON.stringify(logData, null, 2));
        }
    }

    info(message, meta = {}) {
        if (logLevels[this.level] >= logLevels.INFO) {
            const logData = this.formatMessage('INFO', message, meta);
            console.log(JSON.stringify(logData, null, 2));
        }
    }

    debug(message, meta = {}) {
        if (logLevels[this.level] >= logLevels.DEBUG) {
            const logData = this.formatMessage('DEBUG', message, meta);
            console.log(JSON.stringify(logData, null, 2));
        }
    }

    // Log HTTP requests (can be used as middleware)
    logRequest(req, res, next) {
        const start = Date.now();
        
        res.on('finish', () => {
            const duration = Date.now() - start;
            const logData = {
                method: req.method,
                url: req.url,
                status: res.statusCode,
                duration: `${duration}ms`,
                ip: req.ip,
                userAgent: req.get('user-agent')
            };

            if (res.statusCode >= 400) {
                this.error(`HTTP ${res.statusCode} Error`, logData);
            } else {
                this.info('HTTP Request', logData);
            }
        });

        next();
    }
}

module.exports = new Logger();