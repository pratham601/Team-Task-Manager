const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Simple signup that always works
app.post('/api/auth/signup', (req, res) => {
    console.log('✅ SIGNUP HIT!');
    console.log('Body:', req.body);
    
    res.json({
        success: true,
        message: 'Signup successful',
        user: { id: 1, name: req.body.name, email: req.body.email, role: 'admin' },
        token: 'test-token-123'
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

app.listen(5000, () => {
    console.log('\n=========================================');
    console.log('✅ TEST SERVER RUNNING ON PORT 5000');
    console.log('=========================================\n');
});