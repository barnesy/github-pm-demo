const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define log colors
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

// Tell winston about the colors
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Define format for console output in development
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.printf(
        ({ timestamp, level, message, ...metadata }) => {
            let msg = `${timestamp} [${level}]: ${message}`;
            if (Object.keys(metadata).length > 0) {
                msg += '\n' + JSON.stringify(metadata, null, 2);
            }
            return msg;
        }
    )
);

// Define which transports the logger must use
const transports = [];

// Console transport for all environments
if (process.env.NODE_ENV !== 'production') {
    transports.push(
        new winston.transports.Console({
            format: consoleFormat,
            level: process.env.LOG_LEVEL || 'debug'
        })
    );
} else {
    // In production, use structured JSON logs
    transports.push(
        new winston.transports.Console({
            format,
            level: process.env.LOG_LEVEL || 'info'
        })
    );
}

// File transports with daily rotation
const logDir = process.env.LOG_DIR || path.join(__dirname, '..', 'logs');

// Error log file - only errors
transports.push(
    new DailyRotateFile({
        filename: path.join(logDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        level: 'error',
        format
    })
);

// Combined log file - all logs
transports.push(
    new DailyRotateFile({
        filename: path.join(logDir, 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format
    })
);

// Performance log file - for performance metrics
transports.push(
    new DailyRotateFile({
        filename: path.join(logDir, 'performance-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '7d',
        level: 'info',
        format,
        // Filter to only include performance logs
        filter: (info) => info.type === 'performance'
    })
);

// Security log file - for security events
transports.push(
    new DailyRotateFile({
        filename: path.join(logDir, 'security-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        level: 'info',
        format,
        // Filter to only include security logs
        filter: (info) => info.type === 'security'
    })
);

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    format,
    transports,
    exitOnError: false, // do not exit on handled exceptions
});

// Create a stream object for Morgan HTTP logger
logger.stream = {
    write: (message) => {
        // Remove newline character from Morgan message
        logger.http(message.trim());
    }
};

// Add custom logging methods
logger.security = function(message, meta = {}) {
    this.info(message, { ...meta, type: 'security' });
};

logger.performance = function(message, duration, meta = {}) {
    this.info(message, { 
        ...meta, 
        type: 'performance', 
        duration: `${duration}ms`,
        durationMs: duration 
    });
};

// Request ID tracking
let currentRequestId = null;

logger.setRequestId = function(requestId) {
    currentRequestId = requestId;
};

logger.clearRequestId = function() {
    currentRequestId = null;
};

// Override log methods to include request ID
const originalLog = logger.log.bind(logger);
logger.log = function(level, message, ...args) {
    if (currentRequestId && args[0] && typeof args[0] === 'object') {
        args[0].requestId = currentRequestId;
    } else if (currentRequestId && (!args[0] || typeof args[0] !== 'object')) {
        args.unshift({ requestId: currentRequestId });
    }
    return originalLog(level, message, ...args);
};

// Log HTTP requests (can be used as middleware)
logger.logRequest = function(req, res, next) {
    const start = Date.now();
    
    // Generate or use existing request ID
    const requestId = req.headers['x-request-id'] || 
                     req.headers['x-correlation-id'] || 
                     require('uuid').v4();
    
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    
    // Set request ID for this request
    this.setRequestId(requestId);
    
    // Log request
    this.http(`Incoming ${req.method} ${req.url}`, {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            durationMs: duration,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            requestId: requestId
        };

        if (res.statusCode >= 400) {
            this.error(`HTTP ${res.statusCode} Error`, logData);
        } else if (duration > 1000) {
            this.warn('Slow request detected', logData);
        } else {
            this.http('Request completed', logData);
        }
        
        // Clear request ID after response
        this.clearRequestId();
    });

    next();
};

module.exports = logger;