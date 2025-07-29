const express = require('express');
const router = express.Router();
const User = require('../models/User');
const crypto = require('crypto');

// Simple password hashing (in production, use bcrypt)
const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;
        
        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username, email, and password are required'
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User already exists',
                field: existingUser.email === email ? 'email' : 'username'
            });
        }
        
        // Hash password
        const hashedPassword = hashPassword(password);
        
        // Create new user
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            firstName,
            lastName
        });
        
        // Remove password from response
        const userResponse = user.toJSON();
        
        res.status(201).json({
            success: true,
            data: userResponse,
            message: 'User registered successfully'
        });
    } catch (error) {
        console.error('Registration error:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message
            }));
            
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                errors
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Registration failed',
            message: error.message
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { credential, password } = req.body;
        
        // Validate required fields
        if (!credential || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email/username and password are required'
            });
        }
        
        // Find user by email or username
        const user = await User.findByCredential(credential);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
        
        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Account is deactivated'
            });
        }
        
        // Verify password
        const hashedPassword = hashPassword(password);
        if (user.password !== hashedPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
        
        // Update last login
        await user.updateLastLogin();
        
        // Remove password from response
        const userResponse = user.toJSON();
        
        // In a real app, you would generate and return a JWT token here
        res.json({
            success: true,
            data: {
                user: userResponse,
                // token: generateJWT(user._id) // TODO: Implement JWT generation
            },
            message: 'Login successful'
        });
    } catch (error) {
        console.error('Login error:', error);
        
        res.status(500).json({
            success: false,
            error: 'Login failed',
            message: error.message
        });
    }
});

// Get current user (placeholder for when auth middleware is implemented)
router.get('/me', async (req, res) => {
    // TODO: Implement auth middleware to get current user
    res.status(501).json({
        success: false,
        error: 'Authentication middleware not yet implemented'
    });
});

module.exports = router;