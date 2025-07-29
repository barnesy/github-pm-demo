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

module.exports = logger;