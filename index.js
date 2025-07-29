const express = require('express');
const { AppError, asyncHandler, errorHandler, notFound } = require('./middleware/errorHandler');
const database = require('./config/database');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use(logger.logRequest.bind(logger));

// Import routes
const exampleRoutes = require('./routes/example');

// Use example routes
app.use('/api', exampleRoutes);

// TODO: Add authentication middleware
// TODO: Implement rate limiting
// TODO: Add proper logging system (winston/morgan)

// Root route with async error handling
app.get('/', asyncHandler(async (req, res) => {
    // Hardcoded API key - security issue!
    const API_KEY = "sk-1234567890abcdef";
    
    res.status(200).json({
        success: true,
        message: 'Hello World!',
        version: '1.0.0'
    });
}));

// Users route with proper error handling
app.get('/users', asyncHandler(async (req, res) => {
    try {
        // TODO: Implement user fetching from database
        // Simulating potential database errors
        const users = [];
        
        // Example of how to throw custom errors
        // if (!users || users.length === 0) {
        //     throw new AppError('No users found', 404);
        // }
        
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        // This will be caught by asyncHandler and passed to error middleware
        throw error;
    }
}));

// Example route that demonstrates error handling
app.get('/error-test', asyncHandler(async (req, res) => {
    throw new AppError('This is a test error', 400);
}));

// Example route with async operation
app.get('/async-test', asyncHandler(async (req, res) => {
    // Simulating async operation that might fail
    await new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() > 0.5) {
                resolve();
            } else {
                reject(new AppError('Random async error occurred', 500));
            }
        }, 100);
    });
    
    res.status(200).json({
        success: true,
        message: 'Async operation completed successfully'
    });
}));

// 404 handler - must be after all routes
app.use(notFound);

// Global error handler - must be last middleware
app.use(errorHandler);

// Initialize server with database connection
let server;

const startServer = async () => {
    try {
        // Connect to database first
        await database.connect();
        
        // Start server only after successful database connection
        server = app.listen(PORT, () => {
            logger.info(`Server started successfully`, {
                port: PORT,
                environment: process.env.NODE_ENV || 'development',
                nodeVersion: process.version
            });
        });
    } catch (error) {
        logger.error('Failed to start server', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    logger.error('Unhandled Promise Rejection', err);
    // Close server & exit process
    if (server) {
        server.close(() => process.exit(1));
    } else {
        process.exit(1);
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', err);
    // Close server & exit process
    if (server) {
        server.close(() => process.exit(1));
    } else {
        process.exit(1);
    }
});

// Handle SIGTERM/SIGINT for graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
    logger.info('Received shutdown signal, starting graceful shutdown...');
    
    try {
        // Close server to stop accepting new connections
        if (server) {
            await new Promise((resolve) => {
                server.close(resolve);
            });
            logger.info('HTTP server closed');
        }
        
        // Close database connection
        await database.disconnect();
        logger.info('Database connection closed');
        
        // Exit process
        process.exit(0);
    } catch (error) {
        logger.error('Error during graceful shutdown', error);
        process.exit(1);
    }
}

// Start the server
startServer();