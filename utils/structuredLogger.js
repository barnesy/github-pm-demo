const logger = require('./logger');

/**
 * Structured logging utilities for consistent log formats
 */
class StructuredLogger {
    /**
     * Log database operations
     */
    static logDatabaseOperation(operation, collection, query = {}, result = null, error = null) {
        const baseLog = {
            category: 'database',
            operation,
            collection,
            query: this.sanitizeQuery(query)
        };

        if (error) {
            logger.error(`Database error: ${operation} on ${collection}`, {
                ...baseLog,
                error: {
                    message: error.message,
                    code: error.code,
                    stack: error.stack
                }
            });
        } else {
            logger.debug(`Database operation: ${operation} on ${collection}`, {
                ...baseLog,
                resultCount: Array.isArray(result) ? result.length : 1,
                success: true
            });
        }
    }

    /**
     * Log API calls to external services
     */
    static logApiCall(service, endpoint, method, requestData = {}, response = null, error = null) {
        const timer = new (require('../middleware/performanceMonitor')).PerformanceTimer(`API Call: ${service}`);
        
        const baseLog = {
            category: 'external_api',
            service,
            endpoint,
            method,
            request: this.sanitizeApiData(requestData)
        };

        if (error) {
            const duration = timer.end();
            logger.error(`API call failed: ${service}`, {
                ...baseLog,
                duration,
                error: {
                    message: error.message,
                    code: error.code,
                    response: error.response?.data
                }
            });
        } else {
            const duration = timer.end();
            logger.info(`API call successful: ${service}`, {
                ...baseLog,
                duration,
                statusCode: response?.status,
                success: true
            });
        }
    }

    /**
     * Log authentication events
     */
    static logAuthEvent(event, userId = null, metadata = {}) {
        const authLog = {
            category: 'authentication',
            event,
            userId,
            ...metadata
        };

        // Security events should always be logged
        logger.security(event, authLog);
    }

    /**
     * Log business logic events
     */
    static logBusinessEvent(event, entity, action, metadata = {}) {
        logger.info(`Business event: ${event}`, {
            category: 'business',
            event,
            entity,
            action,
            ...metadata
        });
    }

    /**
     * Log validation errors
     */
    static logValidationError(entity, errors, requestData = {}) {
        logger.warn(`Validation failed for ${entity}`, {
            category: 'validation',
            entity,
            errors,
            requestData: this.sanitizeData(requestData)
        });
    }

    /**
     * Log cache operations
     */
    static logCacheOperation(operation, key, hit = null, metadata = {}) {
        const cacheLog = {
            category: 'cache',
            operation,
            key,
            hit,
            ...metadata
        };

        if (operation === 'get' && hit !== null) {
            logger.debug(`Cache ${hit ? 'hit' : 'miss'}: ${key}`, cacheLog);
        } else {
            logger.debug(`Cache operation: ${operation} for ${key}`, cacheLog);
        }
    }

    /**
     * Log job/task execution
     */
    static logJobExecution(jobName, status, metadata = {}) {
        const jobLog = {
            category: 'job',
            jobName,
            status,
            ...metadata
        };

        if (status === 'failed') {
            logger.error(`Job failed: ${jobName}`, jobLog);
        } else if (status === 'completed') {
            logger.info(`Job completed: ${jobName}`, jobLog);
        } else {
            logger.info(`Job ${status}: ${jobName}`, jobLog);
        }
    }

    /**
     * Sanitize sensitive data from queries
     */
    static sanitizeQuery(query) {
        const sanitized = { ...query };
        const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
        
        Object.keys(sanitized).forEach(key => {
            if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                sanitized[key] = '[REDACTED]';
            }
        });
        
        return sanitized;
    }

    /**
     * Sanitize API request/response data
     */
    static sanitizeApiData(data) {
        if (!data) return data;
        
        const sanitized = { ...data };
        const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization'];
        
        // Sanitize headers
        if (sanitized.headers) {
            sanitized.headers = { ...sanitized.headers };
            Object.keys(sanitized.headers).forEach(key => {
                if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                    sanitized.headers[key] = '[REDACTED]';
                }
            });
        }
        
        // Sanitize body
        if (sanitized.body) {
            sanitized.body = this.sanitizeData(sanitized.body);
        }
        
        return sanitized;
    }

    /**
     * Generic data sanitizer
     */
    static sanitizeData(data) {
        if (!data || typeof data !== 'object') return data;
        
        const sanitized = Array.isArray(data) ? [...data] : { ...data };
        const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'ssn', 'creditCard'];
        
        const sanitizeObject = (obj) => {
            Object.keys(obj).forEach(key => {
                if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                    obj[key] = '[REDACTED]';
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    sanitizeObject(obj[key]);
                }
            });
        };
        
        if (Array.isArray(sanitized)) {
            sanitized.forEach(item => {
                if (typeof item === 'object' && item !== null) {
                    sanitizeObject(item);
                }
            });
        } else {
            sanitizeObject(sanitized);
        }
        
        return sanitized;
    }
}

module.exports = StructuredLogger;