# Rate Limiting Documentation

## Overview
This application implements rate limiting to prevent API abuse and ensure fair usage across all endpoints.

## Configuration

### Global Rate Limiting
- **Limit**: 100 requests per 15 minutes per IP
- **Applies to**: All endpoints
- **Headers**: Standard RateLimit-* headers included

### Endpoint-Specific Limits

#### Authentication Endpoints (`/login`, `/register`)
- **Limit**: 5 attempts per 15 minutes per IP
- **Note**: Only failed attempts count against the limit
- **Purpose**: Prevent brute force attacks

#### API Endpoints (`/users`, etc.)
- **Limit**: 50 requests per 15 minutes per IP
- **Purpose**: Ensure fair API usage

#### Upload Endpoint (`/upload`)
- **Limit**: 10 uploads per hour per IP
- **Purpose**: Prevent storage abuse

## Rate Limit Headers

All responses include standard rate limit headers:
- `RateLimit-Limit`: The rate limit for the endpoint
- `RateLimit-Remaining`: Number of requests remaining
- `RateLimit-Reset`: Unix timestamp when the limit resets

## Error Responses

When rate limit is exceeded, the API returns:
```json
{
  "error": "Too many requests from this IP, please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": "15 minutes",
  "ip": "::1"
}
```

## Custom Rate Limiters

You can create custom rate limiters using the `createRateLimiter` function:

```javascript
const customLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 requests per hour
    message: 'Custom rate limit exceeded',
    code: 'CUSTOM_LIMIT_EXCEEDED'
});
```

## Testing

Use the provided test script to verify rate limiting:
```bash
node test-rate-limit.js
```

## Implementation Details

- Uses `express-rate-limit` package
- IP-based limiting using Express's trust proxy settings
- Configurable limits per endpoint type
- Memory store (suitable for single-instance applications)

For distributed applications, consider using Redis store for rate limit persistence across instances.