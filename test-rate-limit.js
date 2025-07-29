const http = require('http');

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: JSON.parse(data)
                });
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// Test rate limiting
async function testRateLimiting() {
    console.log('Testing Rate Limiting...\n');

    // Test global rate limit
    console.log('1. Testing global rate limit (100 requests per 15 minutes):');
    for (let i = 1; i <= 5; i++) {
        try {
            const response = await makeRequest('/');
            console.log(`Request ${i}: Status ${response.statusCode}`);
            if (response.headers['ratelimit-remaining']) {
                console.log(`   Remaining: ${response.headers['ratelimit-remaining']}`);
            }
        } catch (error) {
            console.error(`Request ${i} failed:`, error.message);
        }
    }

    console.log('\n2. Testing auth endpoint rate limit (5 attempts per 15 minutes):');
    for (let i = 1; i <= 7; i++) {
        try {
            const response = await makeRequest('/login', 'POST');
            console.log(`Login attempt ${i}: Status ${response.statusCode}`);
            if (response.statusCode === 429) {
                console.log('   Rate limit exceeded:', response.body.error);
            }
        } catch (error) {
            console.error(`Login attempt ${i} failed:`, error.message);
        }
    }

    console.log('\n3. Testing API endpoint rate limit:');
    const response = await makeRequest('/users');
    console.log(`/users endpoint: Status ${response.statusCode}`);
    console.log(`Rate limit headers:`, {
        limit: response.headers['ratelimit-limit'],
        remaining: response.headers['ratelimit-remaining'],
        reset: new Date(parseInt(response.headers['ratelimit-reset']) * 1000).toLocaleTimeString()
    });

    console.log('\n4. Checking API status:');
    const statusResponse = await makeRequest('/api/status');
    console.log('API Status:', JSON.stringify(statusResponse.body, null, 2));
}

// Run the test
console.log('Make sure the server is running (npm start) before running this test.\n');
setTimeout(() => {
    testRateLimiting().catch(console.error);
}, 1000);