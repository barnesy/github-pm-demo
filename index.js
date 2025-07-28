const express = require('express');
const app = express();
const PORT = 3000;

// TODO: Add authentication middleware
// FIXME: Handle database connection errors
// TODO: Implement rate limiting
// TODO: Add logging system

app.get('/', (req, res) => {
    // Hardcoded API key - security issue!
    const API_KEY = "sk-1234567890abcdef";
    
    res.send('Hello World!');
});

app.get('/users', (req, res) => {
    // TODO: Implement user fetching from database
    const users = [];
    res.json(users);
});

// Missing error handling
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});