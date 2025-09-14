const express = require('express');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const databaseService = require('./services/databaseService-v2');
const { configureGoogleAuth, requireAuth, requireAdmin, getCurrentUser } = require('./services/authService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for Netlify compatibility
}));
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.NETLIFY_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Configure Google OAuth
configureGoogleAuth();

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/auth/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to dashboard
    res.redirect('/dashboard');
  }
);

app.get('/dashboard', (req, res) => {
  if (req.isAuthenticated()) {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
  } else {
    res.redirect('/login');
  }
});

app.get('/admin', (req, res) => {
  if (req.isAuthenticated()) {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
});

// API Routes
app.get('/api/user', getCurrentUser);

// Programs Data API Endpoints
app.get('/api/programs', async (req, res) => {
  try {
    const filters = req.query;
    const programs = await databaseService.getAllPrograms(filters);
    res.json({
      success: true,
      programs: programs,
      count: programs.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch programs',
      message: error.message
    });
  }
});

app.get('/api/programs/search', async (req, res) => {
  try {
    const filters = req.query;
    const results = await databaseService.searchPrograms(filters);
    res.json({
      success: true,
      data: results,
      count: results.length,
      filters: filters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search programs',
      message: error.message
    });
  }
});

app.get('/api/programs/filters', async (req, res) => {
  try {
    const filterOptions = await databaseService.getFilterOptions();
    res.json({
      success: true,
      data: filterOptions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch filter options',
      message: error.message
    });
  }
});

app.get('/api/programs/stats', async (req, res) => {
  try {
    const stats = await databaseService.getStatistics();
    res.json({
      success: true,
      data: {
        statistics: stats,
        metadata: {
          database_name: "ethiopia_community_resources",
          version: "1.0.0",
          last_updated: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

app.get('/api/programs/:id', async (req, res) => {
  try {
    const program = await databaseService.getProgramById(req.params.id);
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
    res.status(500).json({
      success: false,
      error: 'Failed to fetch program',
      message: error.message
    });
  }
});

app.post('/api/programs', async (req, res) => {
  try {
    const program = await databaseService.createProgram(req.body);
    res.status(201).json({
      success: true,
      data: program
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create program',
      message: error.message
    });
  }
});

app.put('/api/programs/:id', async (req, res) => {
  try {
    const program = await databaseService.updateProgram(req.params.id, req.body);
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
    res.status(500).json({
      success: false,
      error: 'Failed to update program',
      message: error.message
    });
  }
});

app.delete('/api/programs/:id', async (req, res) => {
  try {
    const result = await databaseService.deleteProgram(req.params.id);
    res.json({
      success: result.success,
      message: result.success ? 'Program deleted successfully' : 'Program not found'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete program',
      message: error.message
    });
  }
});

// Data migration endpoint
app.post('/api/migrate', async (req, res) => {
  try {
    const result = await databaseService.migrateJsonToSupabase();
    res.json({
      success: true,
      message: 'Migration completed successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Migration failed',
      message: error.message
    });
  }
});

// User favorites API
app.get('/api/user/favorites', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const favorites = await databaseService.getUserFavorites(req.user.id);
    res.json({
      success: true,
      data: favorites
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch favorites',
      message: error.message
    });
  }
});

app.post('/api/user/favorites/:programId', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const result = await databaseService.addUserFavorite(req.user.id, req.params.programId);
    res.json({
      success: true,
      message: 'Program added to favorites'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add favorite',
      message: error.message
    });
  }
});

app.delete('/api/user/favorites/:programId', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const result = await databaseService.removeUserFavorite(req.user.id, req.params.programId);
    res.json({
      success: true,
      message: 'Program removed from favorites'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to remove favorite',
      message: error.message
    });
  }
});

// Legacy data API (for backward compatibility)
app.get('/api/data', async (req, res) => {
  try {
    const stats = await databaseService.getStatistics();
    const programs = await databaseService.getAllPrograms({ limit: 10 });
    res.json({
      message: 'Ethiopia Community Resources Data API',
      timestamp: new Date().toISOString(),
      data: {
        programs: programs,
        stats: stats,
        metadata: {
          database_name: "ethiopia_community_resources",
          version: "1.0.0",
          last_updated: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch data',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Local URL: http://localhost:${PORT}`);
  if (process.env.NETLIFY_URL) {
    console.log(`🌐 Netlify URL: ${process.env.NETLIFY_URL}`);
  }
});

module.exports = app;
