const express = require('express');
const router = express.Router();
const { 
  createUser, 
  findUserByUsername, 
  verifyPassword, 
  ROLES 
} = require('../models/user');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Register new user - with rate limiting
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required' 
      });
    }

    if (username.length < 3) {
      return res.status(400).json({ 
        error: 'Username must be at least 3 characters long' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Validate role if provided
    const userRole = role && Object.values(ROLES).includes(role) ? role : ROLES.USER;

    // Create user
    const user = await createUser(username, password, userRole);

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    if (error.message === 'User already exists') {
      return res.status(409).json({ 
        error: 'Username already taken' 
      });
    }
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Failed to register user' 
    });
  }
});

// Login user - with rate limiting
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required' 
      });
    }

    // Find user
    const user = findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Failed to login' 
    });
  }
});

// Get current user info (protected route)
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: req.user
  });
});

module.exports = router;