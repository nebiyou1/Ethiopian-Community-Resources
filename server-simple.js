const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./services/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: 'development'
  });
});

// Programs Data API Endpoints
app.get('/api/programs', async (req, res) => {
  try {
    const filters = req.query;
    const programs = await db.searchPrograms('', filters);
    res.json({
      success: true,
      programs: programs,
      count: programs.length
    });
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch programs',
      message: error.message
    });
  }
});

app.get('/api/programs/search', async (req, res) => {
  try {
    const { search, ...filters } = req.query;
    const results = await db.searchPrograms(search, filters);
    res.json({
      success: true,
      programs: results,
      count: results.length,
      filters: filters
    });
  } catch (error) {
    console.error('Error searching programs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search programs',
      message: error.message
    });
  }
});

app.get('/api/programs/filters', async (req, res) => {
  try {
    const filterOptions = await db.getFilterOptions();
    res.json({
      success: true,
      data: filterOptions
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch filter options',
      message: error.message
    });
  }
});

app.get('/api/programs/stats', async (req, res) => {
  try {
    const stats = await db.getStatistics();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

app.get('/api/programs/:id', async (req, res) => {
  try {
    const program = await db.getProgramById(req.params.id);
    if (!program) {
      return res.status(404).json({
        success: false,
        error: 'Program not found'
      });
    }
    res.json({
      success: true,
      data: program
    });
  } catch (error) {
    console.error('Error fetching program:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch program',
      message: error.message
    });
  }
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Programs API: http://localhost:${PORT}/api/programs`);
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

