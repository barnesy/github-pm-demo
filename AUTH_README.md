# JWT Authentication System

This project now includes a JWT-based authentication system with role-based access control (RBAC).

## Features

- JWT token generation and verification
- User registration and login
- Password hashing with bcrypt
- Role-based access control (admin/user roles)
- Protected routes requiring authentication
- In-memory user storage (for demo purposes)

## Default Admin User

- Username: `admin`
- Password: `admin123`

## API Endpoints

### Public Endpoints

- `GET /` - API information
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Protected Endpoints (Require Authentication)

- `GET /api/auth/me` - Get current user info
- `GET /api/users` - Protected user route

### Admin-Only Endpoints

- `GET /api/admin/users` - Get all users (admin only)

## Usage

### Register a New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "password123"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "password123"
  }'
```

### Access Protected Route

```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Authentication

Run the included test script:

```bash
node test-auth.js
```

## Security Notes

- JWT secret should be stored in environment variables in production
- Use HTTPS in production
- Consider implementing refresh tokens
- Add password complexity requirements
- Implement account lockout after failed attempts
- Use a real database instead of in-memory storage