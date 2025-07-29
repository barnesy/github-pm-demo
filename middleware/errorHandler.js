// Global error handling middleware
const logger = require('../utils/logger');

// Custom error class for operational errors
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Async handler wrapper to catch errors in async route handlers
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error using logger utility
    logger.error('Request Error', {
        message: err.message,
        stack: err.stack,
        statusCode: err.statusCode || 500,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params,
        isOperational: err.isOperational
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = new AppError(message, 404);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = new AppError(message, 400);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = new AppError(message, 400);
    }

    // Default to 500 server error
    const statusCode = error.statusCode || err.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        error: {
            message,
            // Only send stack trace in development
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
};

// 404 handler for undefined routes
const notFound = (req, res, next) => {
    const error = new AppError(`Route ${req.originalUrl} not found`, 404);
    next(error);
};

// Database connection error handler
const handleDatabaseError = (error) => {
    logger.error('Database Connection Failed', {
        message: error.message,
        code: error.code,
        stack: error.stack
    });
    
    // In a real app, you might want to:
    // - Attempt reconnection
    // - Send alerts to monitoring service
    // - Gracefully shut down if critical
    
    // Give time for logs to be written
    setTimeout(() => {
        process.exit(1);
    }, 1000);
};

module.exports = {
    AppError,
    asyncHandler,
    errorHandler,
    notFound,
    handleDatabaseError
};