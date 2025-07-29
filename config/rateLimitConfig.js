// Rate limiting configuration
module.exports = {
    // Global rate limit applied to all routes
    global: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // requests per windowMs
        message: 'Too many requests from this IP, please try again later.'
    },
    
    // Authentication endpoints (login, register, password reset)
    auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // attempts per windowMs
        skipSuccessfulRequests: true, // Don't count successful auth
        message: 'Too many authentication attempts, please try again later.'
    },
    
    // General API endpoints
    api: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 50, // requests per windowMs
        message: 'API rate limit exceeded, please try again later.'
    },
    
    // File upload endpoints
    upload: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10, // uploads per windowMs
        message: 'Upload limit exceeded. Maximum 10 uploads per hour.'
    },
    
    // Password reset endpoint
    passwordReset: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 3, // reset attempts per windowMs
        message: 'Too many password reset attempts. Please try again later.'
    },
    
    // Email verification endpoint
    emailVerification: {
        windowMs: 30 * 60 * 1000, // 30 minutes
        max: 5, // verification attempts per windowMs
        message: 'Too many email verification attempts. Please try again later.'
    }
};