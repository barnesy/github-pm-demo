const logger = require('../utils/logger');

/**
 * Middleware to monitor and log performance metrics
 */
const performanceMonitor = (req, res, next) => {
    const start = process.hrtime.bigint();
    
    // Track memory usage at request start
    const startMemory = process.memoryUsage();
    
    // Override res.json to capture response size
    const originalJson = res.json;
    res.json = function(data) {
        res.responseSize = JSON.stringify(data).length;
        return originalJson.call(this, data);
    };
    
    // Log metrics when response finishes
    res.on('finish', () => {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000; // Convert to milliseconds
        
        // Memory usage at request end
        const endMemory = process.memoryUsage();
        const memoryDelta = {
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            external: endMemory.external - startMemory.external,
            rss: endMemory.rss - startMemory.rss
        };
        
        // Performance metrics
        const metrics = {
            url: req.url,
            method: req.method,
            statusCode: res.statusCode,
            duration: Math.round(duration * 100) / 100, // Round to 2 decimal places
            responseSize: res.responseSize || res.get('content-length') || 0,
            memoryDelta: {
                heapUsedMB: Math.round(memoryDelta.heapUsed / 1024 / 1024 * 100) / 100,
                externalMB: Math.round(memoryDelta.external / 1024 / 1024 * 100) / 100,
                rssMB: Math.round(memoryDelta.rss / 1024 / 1024 * 100) / 100
            }
        };
        
        // Log performance data
        logger.performance('Request Performance', duration, metrics);
        
        // Alert on slow requests
        if (duration > 5000) {
            logger.warn('Very slow request detected', {
                ...metrics,
                threshold: '5000ms',
                severity: 'high'
            });
        } else if (duration > 2000) {
            logger.warn('Slow request detected', {
                ...metrics,
                threshold: '2000ms',
                severity: 'medium'
            });
        }
        
        // Alert on high memory usage
        if (memoryDelta.heapUsed > 50 * 1024 * 1024) { // 50MB
            logger.warn('High memory usage detected', {
                url: req.url,
                method: req.method,
                memoryDelta: metrics.memoryDelta,
                threshold: '50MB'
            });
        }
    });
    
    next();
};

/**
 * Middleware to log route-specific performance metrics
 */
const routePerformanceLogger = (routeName) => {
    return (req, res, next) => {
        const start = process.hrtime.bigint();
        
        res.on('finish', () => {
            const end = process.hrtime.bigint();
            const duration = Number(end - start) / 1000000; // Convert to milliseconds
            
            logger.performance(`Route: ${routeName}`, duration, {
                route: routeName,
                method: req.method,
                statusCode: res.statusCode,
                params: req.params,
                query: req.query
            });
        });
        
        next();
    };
};

/**
 * Create a performance timer for specific operations
 */
class PerformanceTimer {
    constructor(operation, metadata = {}) {
        this.operation = operation;
        this.metadata = metadata;
        this.start = process.hrtime.bigint();
    }
    
    end(additionalMetadata = {}) {
        const end = process.hrtime.bigint();
        const duration = Number(end - this.start) / 1000000; // Convert to milliseconds
        
        logger.performance(this.operation, duration, {
            ...this.metadata,
            ...additionalMetadata
        });
        
        return duration;
    }
}

module.exports = {
    performanceMonitor,
    routePerformanceLogger,
    PerformanceTimer
};