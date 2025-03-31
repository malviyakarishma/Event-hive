const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Test server running successfully!',
    env: process.env.NODE_ENV,
    time: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
});