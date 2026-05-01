const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Simple test storage
const users = [];

// SIGNUP - Test endpoint
app.post('/api/auth/signup', (req, res) => {
    console.log('SIGNUP called with:', req.body);
    
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    
    const user = { id: users.length + 1, name, email, role: role || 'member' };
    users.push({ ...user, password });
    
    res.json({ 
        success: true,
        user: user,
        token: 'fake-token-123'
    });
});

// LOGIN - Test endpoint
app.post('/api/auth/login', (req, res) => {
    console.log('LOGIN called with:', req.body);
    
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.json({ 
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token: 'fake-token-123'
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Test server is running' });
});

app.listen(5000, () => {
    console.log('\n=================================');
    console.log('✅ TEST SERVER RUNNING');
    console.log('📍 http://localhost:5000');
    console.log('=================================\n');
});