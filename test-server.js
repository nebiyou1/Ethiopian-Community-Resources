const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test programs endpoint
app.get('/api/programs', (req, res) => {
  res.json({
    success: true,
    programs: [
      { id: 1, name: 'Test Program 1' },
      { id: 2, name: 'Test Program 2' }
    ],
    count: 2
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Programs: http://localhost:${PORT}/api/programs`);
});

// Handle errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

