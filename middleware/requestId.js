const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Middleware to attach a unique request ID to each request
 * This helps with request tracing across logs
 */
const requestIdMiddleware = (req, res, next) => {
    // Check if request already has an ID (from proxy/load balancer)
    const requestId = req.headers['x-request-id'] || 
                     req.headers['x-correlation-id'] || 
                     uuidv4();
    
    // Attach to request and response
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    
    // Set request ID in logger context
    logger.setRequestId(requestId);
    
    // Log security event for suspicious headers
    const suspiciousHeaders = checkSuspiciousHeaders(req.headers);
    if (suspiciousHeaders.length > 0) {
        logger.security('Suspicious headers detected', {
            headers: suspiciousHeaders,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent')
        });
    }
    
    next();
};

/**
 * Check for potentially suspicious headers
 */
function checkSuspiciousHeaders(headers) {
    const suspicious = [];
    
    // Check for SQL injection attempts in headers
    const sqlPatterns = [/union.*select/i, /drop.*table/i, /insert.*into/i, /delete.*from/i];
    
    // Check for XSS attempts
    const xssPatterns = [/<script/i, /javascript:/i, /onerror=/i, /onload=/i];
    
    // Check all headers
    Object.entries(headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
            // Check for SQL injection
            if (sqlPatterns.some(pattern => pattern.test(value))) {
                suspicious.push({ header: key, type: 'sql_injection', value: value.substring(0, 100) });
            }
            
            // Check for XSS
            if (xssPatterns.some(pattern => pattern.test(value))) {
                suspicious.push({ header: key, type: 'xss', value: value.substring(0, 100) });
            }
            
            // Check for unusually long headers
            if (value.length > 1000) {
                suspicious.push({ header: key, type: 'oversized', length: value.length });
            }
        }
    });
    
    return suspicious;
}

module.exports = requestIdMiddleware;