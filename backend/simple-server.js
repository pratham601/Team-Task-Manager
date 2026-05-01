const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Simple storage
const users = [];

// SIGNUP - No validation, just works
app.post('/api/auth/signup', (req, res) => {
    console.log('Signup request:', req.body);
    
    const { name, email, password, role } = req.body;
    
    // Create user
    const user = {
        id: users.length + 1,
        name: name,
        email: email,
        role: role || 'member'
    };
    
    users.push({ ...user, password });
    
    // Send success
    res.json({
        user: user,
        token: 'test-token-123'
    });
});

// LOGIN
app.post('/api/auth/login', (req, res) => {
    console.log('Login request:', req.body);
    
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token: 'test-token-123'
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

app.listen(5000, () => {
    console.log('\n=========================================');
    console.log('✅ SIMPLE SERVER RUNNING on port 5000');
    console.log('=========================================\n');
});