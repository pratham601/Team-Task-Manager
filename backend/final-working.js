const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Signup endpoint - no validation, just works
app.post('/api/auth/signup', (req, res) => {
    console.log('Signup called with:', req.body);
    
    // Always send success
    res.json({
        user: {
            id: 1,
            name: req.body.name || 'Test User',
            email: req.body.email || 'test@test.com',
            role: req.body.role || 'member'
        },
        token: 'simple_token_123'
    });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
    console.log('Login called with:', req.body);
    
    res.json({
        user: {
            id: 1,
            name: 'Test User',
            email: req.body.email,
            role: 'admin'
        },
        token: 'simple_token_123'
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

app.listen(5000, () => {
    console.log('\n========================================');
    console.log('✅ SIMPLE SERVER RUNNING');
    console.log('📍 http://localhost:5000');
    console.log('========================================\n');
});