const bcrypt = require('bcryptjs');

// In-memory user storage - In production, use a real database
const users = new Map();

// User roles
const ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

class User {
  constructor(username, password, role = ROLES.USER) {
    this.id = Date.now().toString();
    this.username = username;
    this.password = password; // This will be hashed
    this.role = role;
    this.createdAt = new Date();
  }

  // Convert to JSON-safe object (without password)
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      role: this.role,
      createdAt: this.createdAt
    };
  }
}

// Create a new user
const createUser = async (username, password, role = ROLES.USER) => {
  // Check if user already exists
  if (users.has(username)) {
    throw new Error('User already exists');
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const user = new User(username, hashedPassword, role);
  users.set(username, user);

  return user;
};

// Find user by username
const findUserByUsername = (username) => {
  return users.get(username);
};

// Find user by ID
const findUserById = (id) => {
  for (const user of users.values()) {
    if (user.id === id) {
      return user;
    }
  }
  return null;
};

// Verify user password
const verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Get all users (for admin purposes)
const getAllUsers = () => {
  return Array.from(users.values()).map(user => user.toJSON());
};

// Initialize with a default admin user (for testing)
const initializeDefaultUsers = async () => {
  try {
    await createUser('admin', 'admin123', ROLES.ADMIN);
    console.log('Default admin user created (username: admin, password: admin123)');
  } catch (error) {
    // User might already exist
  }
};

module.exports = {
  User,
  ROLES,
  createUser,
  findUserByUsername,
  findUserById,
  verifyPassword,
  getAllUsers,
  initializeDefaultUsers
};