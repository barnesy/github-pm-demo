const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find({ isActive: true })
            .select('-password')
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users',
            message: error.message
        });
    }
});

// Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid user ID format'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user',
            message: error.message
        });
    }
});

// Create new user
router.post('/', async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, role } = req.body;
        
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
        
        // Create new user
        const user = await User.create({
            username,
            email,
            password,
            firstName,
            lastName,
            role: role || 'user'
        });
        
        // Remove password from response
        const userResponse = user.toJSON();
        
        res.status(201).json({
            success: true,
            data: userResponse,
            message: 'User created successfully'
        });
    } catch (error) {
        console.error('Error creating user:', error);
        
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
            error: 'Failed to create user',
            message: error.message
        });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    try {
        const updates = {};
        const allowedUpdates = ['firstName', 'lastName', 'email', 'username', 'role', 'isActive'];
        
        // Only include allowed fields in updates
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });
        
        // Check for duplicate email/username if they're being updated
        if (updates.email || updates.username) {
            const query = { _id: { $ne: req.params.id } };
            if (updates.email) query.email = updates.email;
            if (updates.username) query.username = updates.username;
            
            const existingUser = await User.findOne({
                $and: [
                    { _id: { $ne: req.params.id } },
                    {
                        $or: [
                            updates.email ? { email: updates.email } : {},
                            updates.username ? { username: updates.username } : {}
                        ]
                    }
                ]
            });
            
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    error: 'Email or username already in use'
                });
            }
        }
        
        const user = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: user,
            message: 'User updated successfully'
        });
    } catch (error) {
        console.error('Error updating user:', error);
        
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
            error: 'Failed to update user',
            message: error.message
        });
    }
});

// Delete user (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'User deleted successfully',
            data: user
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        
        res.status(500).json({
            success: false,
            error: 'Failed to delete user',
            message: error.message
        });
    }
});

module.exports = router;