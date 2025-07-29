const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Import authentication middleware and routes
const { authenticateToken, authorizeRole } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const { initializeDefaultUsers, getAllUsers, ROLES } = require('./models/user');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize default users
initializeDefaultUsers();

// Public routes
app.use('/api/auth', authRoutes);

// FIXME: Handle database connection errors
// TODO: Implement rate limiting
// TODO: Add logging system

// Public route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Welcome to the API',
        endpoints: {
            public: [
                'POST /api/auth/register',
                'POST /api/auth/login',
                'GET /'
            ],
            protected: [
                'GET /api/auth/me',
                'GET /api/users',
                'GET /api/admin/users'
            ]
        }
    });
});

// Protected route - requires authentication
app.get('/api/users', authenticateToken, (req, res) => {
    res.json({
        message: 'This is a protected route',
        user: req.user
    });
});

// Admin-only route - requires authentication and admin role
app.get('/api/admin/users', authenticateToken, authorizeRole(ROLES.ADMIN), (req, res) => {
    const users = getAllUsers();
    res.json({
        message: 'Admin access granted',
        users,
        totalUsers: users.length
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Authentication system is active');
    console.log('Default admin user: username=admin, password=admin123');
});