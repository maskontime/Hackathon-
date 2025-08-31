const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static('.'));

// Serve the test page at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Maskon Health Server Running',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🌿 Maskon Health Server running on http://localhost:${PORT}`);
    console.log(`📱 Test page: http://localhost:${PORT}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
