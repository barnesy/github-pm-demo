const express = require('express');
const app = express();
const PORT = 3000;

// Import rate limiting middleware
const { globalLimiter, authLimiter, apiLimiter, createRateLimiter } = require('./middleware/rateLimiter');

// Import authentication middleware and routes
const { authenticateToken, authorizeRole } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const { initializeDefaultUsers, getAllUsers, ROLES } = require('./models/user');

// Apply global rate limiting to all routes
app.use(globalLimiter);

// Middleware for parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize default users
initializeDefaultUsers();

// FIXME: Handle database connection errors
// TODO: Add logging system

// Public route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Welcome to the API',
        endpoints: {
            public: [
                'GET /',
                'POST /api/auth/register',
                'POST /api/auth/login',
                'GET /api/status'
            ],
            protected: [
                'GET /api/auth/me',
                'GET /users',
                'GET /api/admin/users',
                'POST /upload'
            ]
        }
    });
});

// Mount authentication routes
app.use('/api/auth', authRoutes);

// Protected route - requires authentication
app.get('/users', apiLimiter, authenticateToken, (req, res) => {
    res.json({
        message: 'This is a protected route',
        user: req.user
    });
});

// Admin-only route - requires authentication and admin role
app.get('/api/admin/users', apiLimiter, authenticateToken, authorizeRole(ROLES.ADMIN), (req, res) => {
    const users = getAllUsers();
    res.json({
        message: 'Admin access granted',
        users,
        totalUsers: users.length
    });
});

// Legacy authentication endpoints - redirect to new API
app.post('/login', authLimiter, (req, res) => {
    res.status(301).json({ 
        message: 'Please use /api/auth/login instead',
        newEndpoint: '/api/auth/login'
    });
});

app.post('/register', authLimiter, (req, res) => {
    res.status(301).json({ 
        message: 'Please use /api/auth/register instead',
        newEndpoint: '/api/auth/register'
    });
});

// Example of custom rate limiting for a specific endpoint
const uploadLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 uploads per hour
    message: 'Upload limit exceeded. Maximum 10 uploads per hour.',
    code: 'UPLOAD_LIMIT_EXCEEDED'
});

// Protected upload endpoint
app.post('/upload', uploadLimiter, authenticateToken, (req, res) => {
    res.json({ 
        message: 'Upload endpoint - requires authentication',
        user: req.user.username,
        limit: '10 uploads per hour'
    });
});

// API status endpoint with rate limit info
app.get('/api/status', (req, res) => {
    res.json({
        status: 'operational',
        rateLimits: {
            global: '100 requests per 15 minutes',
            api: '50 requests per 15 minutes for API endpoints',
            auth: '5 attempts per 15 minutes for authentication',
            upload: '10 uploads per hour'
        },
        headers: {
            'RateLimit-Limit': 'Shows the rate limit for the endpoint',
            'RateLimit-Remaining': 'Shows remaining requests',
            'RateLimit-Reset': 'Shows when the rate limit resets'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: err.message 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.url}`
    });
});

// Start server with error handling
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('\nAuthentication system is active:');
    console.log('- JWT-based authentication enabled');
    console.log('- Default admin user: username=admin, password=admin123');
    console.log('\nRate limiting is active:');
    console.log('- Global: 100 requests per 15 minutes');
    console.log('- API endpoints: 50 requests per 15 minutes');
    console.log('- Auth endpoints: 5 attempts per 15 minutes');
    console.log('\nProtected endpoints require Bearer token in Authorization header');
}).on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});