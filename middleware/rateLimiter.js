const rateLimit = require('express-rate-limit');
const config = require('../config/rateLimitConfig');

// Create rate limiter configurations

// Global rate limiter
const globalLimiter = rateLimit({
    windowMs: config.global.windowMs,
    max: config.global.max,
    message: {
        error: config.global.message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: `${config.global.windowMs / 60000} minutes`
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many requests from this IP, please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: '15 minutes',
            ip: req.ip
        });
    }
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
    windowMs: config.auth.windowMs,
    max: config.auth.max,
    message: {
        error: config.auth.message,
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        retryAfter: `${config.auth.windowMs / 60000} minutes`
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: config.auth.skipSuccessfulRequests,
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many authentication attempts, please try again later.',
            code: 'AUTH_RATE_LIMIT_EXCEEDED',
            retryAfter: '15 minutes',
            ip: req.ip,
            hint: 'This limit applies to failed authentication attempts only.'
        });
    }
});

// API endpoints rate limiter
const apiLimiter = rateLimit({
    windowMs: config.api.windowMs,
    max: config.api.max,
    message: {
        error: config.api.message,
        code: 'API_RATE_LIMIT_EXCEEDED',
        retryAfter: `${config.api.windowMs / 60000} minutes`
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: 'API rate limit exceeded, please try again later.',
            code: 'API_RATE_LIMIT_EXCEEDED',
            retryAfter: '15 minutes',
            ip: req.ip
        });
    }
});

// Create custom rate limiter with configurable options
const createRateLimiter = (options = {}) => {
    const defaults = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                error: options.message || 'Rate limit exceeded, please try again later.',
                code: options.code || 'RATE_LIMIT_EXCEEDED',
                retryAfter: `${options.windowMs / 60000} minutes`,
                ip: req.ip
            });
        }
    };

    return rateLimit({ ...defaults, ...options });
};

module.exports = {
    globalLimiter,
    authLimiter,
    apiLimiter,
    createRateLimiter
};