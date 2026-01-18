// Test server with just loans route
const express = require('express');
const app = express();

app.use(express.json());

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// Load loan routes
try {
    const loanRoutes = require('./routes/loans');
    app.use('/api/loans', loanRoutes);
    console.log('Loan routes loaded successfully!');
} catch (error) {
    console.log('=== FULL ERROR ===');
    console.log('Message:', error.message);
    console.log('Error:', error);
    process.exit(1);
}

const PORT = 3009;
app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
});
