# Logging System Documentation

## Overview

This application uses Winston for comprehensive logging with the following features:
- Multiple log levels (error, warn, info, http, debug)
- Daily log rotation
- Structured JSON logging
- Request ID tracking
- Performance monitoring
- Security event logging

## Configuration

### Environment Variables

- `NODE_ENV` - Set to 'production' for JSON formatted console output
- `LOG_LEVEL` - Set the minimum log level (default: 'info' in production, 'debug' in development)
- `LOG_DIR` - Directory for log files (default: './logs')

### Log Files

The system creates the following log files in the `logs` directory:

- `combined-YYYY-MM-DD.log` - All logs
- `error-YYYY-MM-DD.log` - Only error logs
- `performance-YYYY-MM-DD.log` - Performance metrics
- `security-YYYY-MM-DD.log` - Security events

Files are rotated daily and kept for:
- Error logs: 14 days
- Combined logs: 14 days
- Performance logs: 7 days
- Security logs: 30 days

## Usage

### Basic Logging

```javascript
const logger = require('./utils/logger');

// Log levels
logger.error('Error message', { additionalData: 'value' });
logger.warn('Warning message');
logger.info('Info message');
logger.http('HTTP message');
logger.debug('Debug message');
```

### Request Logging Middleware

The logger includes built-in request logging middleware:

```javascript
app.use(logger.logRequest.bind(logger));
```

This automatically logs:
- Incoming requests with method, URL, IP, and user agent
- Response status codes and duration
- Request IDs for tracking
- Slow requests (>1000ms)
- HTTP errors (4xx, 5xx)

### Security Logging

Log security-related events:

```javascript
logger.security('Suspicious activity detected', {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    event: 'multiple_failed_logins'
});
```

### Performance Logging

Log performance metrics:

```javascript
const start = Date.now();
// ... operation ...
const duration = Date.now() - start;

logger.performance('Database query', duration, {
    query: 'SELECT * FROM users',
    rowCount: 100
});
```

### Structured Logging

Use the StructuredLogger utility for consistent log formats:

```javascript
const StructuredLogger = require('./utils/structuredLogger');

// Database operations
StructuredLogger.logDatabaseOperation('find', 'users', { id: '123' }, result, error);

// API calls
StructuredLogger.logApiCall('PaymentAPI', '/charge', 'POST', requestData, response, error);

// Authentication events
StructuredLogger.logAuthEvent('login_success', userId, { ip: req.ip });

// Business events
StructuredLogger.logBusinessEvent('order_placed', 'order', 'create', { orderId, amount });

// Validation errors
StructuredLogger.logValidationError('user', validationErrors, requestData);

// Cache operations
StructuredLogger.logCacheOperation('get', 'user:123', true);

// Job execution
StructuredLogger.logJobExecution('daily_cleanup', 'completed', { recordsProcessed: 1000 });
```

## Request ID Tracking

Every request is assigned a unique ID that appears in all related logs:

1. The system checks for existing IDs in headers (`X-Request-ID` or `X-Correlation-ID`)
2. If none exists, a new UUID is generated
3. The ID is added to the response header as `X-Request-ID`
4. All logs during that request include the `requestId` field

## Performance Monitoring

The system includes performance monitoring middleware:

```javascript
const { performanceMonitor, routePerformanceLogger, PerformanceTimer } = require('./middleware/performanceMonitor');

// Global performance monitoring
app.use(performanceMonitor);

// Route-specific monitoring
router.get('/api/users', routePerformanceLogger('GetUsers'), (req, res) => {
    // ... route handler
});

// Custom operation timing
const timer = new PerformanceTimer('Complex calculation');
// ... perform operation ...
const duration = timer.end({ resultSize: 1000 });
```

## Security Features

The request ID middleware includes security checks for:
- SQL injection attempts in headers
- XSS attempts in headers
- Oversized headers (>1000 characters)

Suspicious headers are automatically logged to the security log.

## Best Practices

1. **Use appropriate log levels:**
   - `error` - Application errors that need immediate attention
   - `warn` - Warning conditions that might lead to errors
   - `info` - General informational messages
   - `debug` - Detailed debug information (not logged in production)

2. **Include context in logs:**
   ```javascript
   logger.error('Database connection failed', {
       host: dbConfig.host,
       port: dbConfig.port,
       error: error.message
   });
   ```

3. **Sanitize sensitive data:**
   - The StructuredLogger automatically redacts sensitive fields
   - Fields like 'password', 'token', 'apiKey', etc. are replaced with '[REDACTED]'

4. **Use structured logging for consistency:**
   - Prefer StructuredLogger methods for common operations
   - This ensures consistent log formats for easier parsing

5. **Monitor performance:**
   - Set up alerts for slow requests
   - Review performance logs regularly
   - Use the PerformanceTimer for critical operations

## Log Analysis

The JSON format makes logs easy to parse and analyze:

```bash
# Find all errors
jq 'select(.level == "error")' logs/combined-2025-07-29.log

# Find slow requests
jq 'select(.durationMs > 1000)' logs/combined-2025-07-29.log

# Group errors by message
jq -s 'group_by(.message) | map({message: .[0].message, count: length})' logs/error-2025-07-29.log
```

## Integration with Monitoring Services

The structured JSON format is compatible with popular log aggregation services:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Splunk
- Datadog
- New Relic
- AWS CloudWatch

Simply configure your log shipper to read from the log files or capture stdout in production.