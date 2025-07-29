// Example routes demonstrating comprehensive error handling
const express = require('express');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const database = require('../config/database');

const router = express.Router();

// Example: Get user by ID with validation and error handling
router.get('/users/:id', asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    
    // Validate ID format
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new AppError('Invalid user ID format', 400);
    }
    
    // Check database connection
    database.checkConnection();
    
    // Simulate database query
    const user = await simulateDatabaseQuery('users', id);
    
    if (!user) {
        throw new AppError('User not found', 404);
    }
    
    res.status(200).json({
        success: true,
        data: user
    });
}));

// Example: Create user with validation
router.post('/users', asyncHandler(async (req, res, next) => {
    const { name, email } = req.body;
    
    // Validation
    if (!name || !email) {
        throw new AppError('Name and email are required', 400);
    }
    
    if (!isValidEmail(email)) {
        throw new AppError('Invalid email format', 400);
    }
    
    // Check database connection
    database.checkConnection();
    
    // Simulate checking for duplicate
    const existingUser = await simulateDatabaseQuery('users', { email });
    if (existingUser) {
        throw new AppError('User with this email already exists', 409);
    }
    
    // Simulate creating user
    const newUser = await simulateDatabaseInsert('users', { name, email });
    
    res.status(201).json({
        success: true,
        data: newUser
    });
}));

// Example: Bulk operation with transaction-like error handling
router.post('/users/bulk', asyncHandler(async (req, res, next) => {
    const { users } = req.body;
    
    if (!Array.isArray(users) || users.length === 0) {
        throw new AppError('Users array is required', 400);
    }
    
    if (users.length > 100) {
        throw new AppError('Cannot process more than 100 users at once', 400);
    }
    
    const results = [];
    const errors = [];
    
    // Process each user with individual error handling
    for (const [index, user] of users.entries()) {
        try {
            // Validate individual user
            if (!user.name || !user.email) {
                throw new Error('Name and email are required');
            }
            
            if (!isValidEmail(user.email)) {
                throw new Error('Invalid email format');
            }
            
            // Simulate insert
            const newUser = await simulateDatabaseInsert('users', user);
            results.push({ index, success: true, data: newUser });
            
        } catch (error) {
            errors.push({
                index,
                success: false,
                error: error.message
            });
        }
    }
    
    // If all operations failed, throw error
    if (errors.length === users.length) {
        throw new AppError('All bulk operations failed', 400);
    }
    
    res.status(errors.length > 0 ? 207 : 201).json({
        success: errors.length === 0,
        processed: users.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors
    });
}));

// Utility functions
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function simulateDatabaseQuery(collection, query) {
    // Simulate async database operation
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Simulate potential database errors
    if (Math.random() < 0.1) {
        const error = new Error('Database query failed');
        error.code = 'DB_ERROR';
        throw error;
    }
    
    // Return mock data or null
    if (typeof query === 'string') {
        return { id: query, name: 'John Doe', email: 'john@example.com' };
    }
    return null;
}

async function simulateDatabaseInsert(collection, data) {
    // Simulate async database operation
    await new Promise(resolve => setTimeout(resolve, 20));
    
    // Simulate potential database errors
    if (Math.random() < 0.05) {
        const error = new Error('Database insert failed');
        error.code = 'DB_ERROR';
        throw error;
    }
    
    return {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        createdAt: new Date()
    };
}

module.exports = router;