/**
 * Test script for authentication system
 * Run with: node test-auth.js
 */

const BASE_URL = 'http://localhost:3000';

// Helper function to make HTTP requests
async function makeRequest(endpoint, method = 'GET', body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 'error', data: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing Authentication System\n');

  // Test 1: Register a new user
  console.log('1. Testing user registration...');
  const registerResult = await makeRequest('/api/auth/register', 'POST', {
    username: 'testuser',
    password: 'testpass123',
  });
  console.log(`   Status: ${registerResult.status}`);
  console.log(`   Response:`, registerResult.data);
  const userToken = registerResult.data.token;

  // Test 2: Login with the user
  console.log('\n2. Testing user login...');
  const loginResult = await makeRequest('/api/auth/login', 'POST', {
    username: 'testuser',
    password: 'testpass123',
  });
  console.log(`   Status: ${loginResult.status}`);
  console.log(`   Response:`, loginResult.data);

  // Test 3: Access protected route without token
  console.log('\n3. Testing protected route without token...');
  const noTokenResult = await makeRequest('/api/users');
  console.log(`   Status: ${noTokenResult.status}`);
  console.log(`   Response:`, noTokenResult.data);

  // Test 4: Access protected route with token
  console.log('\n4. Testing protected route with token...');
  const withTokenResult = await makeRequest('/api/users', 'GET', null, userToken);
  console.log(`   Status: ${withTokenResult.status}`);
  console.log(`   Response:`, withTokenResult.data);

  // Test 5: Get current user info
  console.log('\n5. Testing /api/auth/me endpoint...');
  const meResult = await makeRequest('/api/auth/me', 'GET', null, userToken);
  console.log(`   Status: ${meResult.status}`);
  console.log(`   Response:`, meResult.data);

  // Test 6: Admin login
  console.log('\n6. Testing admin login...');
  const adminLoginResult = await makeRequest('/api/auth/login', 'POST', {
    username: 'admin',
    password: 'admin123',
  });
  console.log(`   Status: ${adminLoginResult.status}`);
  console.log(`   Response:`, adminLoginResult.data);
  const adminToken = adminLoginResult.data.token;

  // Test 7: Access admin route with admin token
  console.log('\n7. Testing admin route with admin token...');
  const adminRouteResult = await makeRequest('/api/admin/users', 'GET', null, adminToken);
  console.log(`   Status: ${adminRouteResult.status}`);
  console.log(`   Response:`, adminRouteResult.data);

  // Test 8: Access admin route with regular user token
  console.log('\n8. Testing admin route with regular user token...');
  const unauthorizedResult = await makeRequest('/api/admin/users', 'GET', null, userToken);
  console.log(`   Status: ${unauthorizedResult.status}`);
  console.log(`   Response:`, unauthorizedResult.data);

  console.log('\n✅ Authentication tests completed!');
}

// Check if the server is running
console.log('⏳ Waiting for server to be ready...');
setTimeout(() => {
  runTests().catch(console.error);
}, 1000);