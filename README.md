# GitHub PM Demo

Demo project for GitHub project management with Claude Code.

## Database Setup

This project uses MongoDB for data persistence. Follow these steps to set up the database:

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your MongoDB connection string if needed. Default is:
   ```
   MONGODB_URI=mongodb://localhost:27017/github-pm-demo
   ```

### Running MongoDB

#### Option 1: Local MongoDB
```bash
# Start MongoDB service (macOS)
brew services start mongodb-community

# Start MongoDB service (Linux)
sudo systemctl start mongod

# Start MongoDB service (Windows)
net start MongoDB
```

#### Option 2: Docker
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### Option 3: MongoDB Atlas
Use a cloud MongoDB instance by updating the `MONGODB_URI` in your `.env` file.

### Starting the Application

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth - not yet implemented)

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (soft delete)

## Database Schema

### User Model
```javascript
{
  username: String (required, unique),
  email: String (required, unique),
  password: String (required, hashed),
  firstName: String,
  lastName: String,
  role: String (user/admin/moderator),
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Features Implemented

- ✅ MongoDB integration with Mongoose
- ✅ User model with validation
- ✅ CRUD operations for users
- ✅ Basic authentication endpoints
- ✅ Database connection retry logic
- ✅ Error handling for all routes
- ✅ Environment variable configuration

## TODO

- [ ] Implement JWT authentication
- [ ] Add authentication middleware
- [ ] Implement rate limiting
- [ ] Add comprehensive logging system
- [ ] Add password hashing with bcrypt
- [ ] Add input validation middleware
- [ ] Add API documentation (Swagger/OpenAPI)