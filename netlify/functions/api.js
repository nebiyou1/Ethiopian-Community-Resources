const { createClient } = require('@supabase/supabase-js');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const databaseService = require('../../services/databaseService');

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: process.env.NETLIFY_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    platform: 'netlify'
  });
});

// Programs API endpoints
app.get('/api/programs', async (req, res) => {
  try {
    const filters = req.query;
    const programs = await databaseService.getAllPrograms(filters);
    res.json({
      success: true,
      data: programs,
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

// Error handling
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

// Netlify function handler
exports.handler = async (event, context) => {
  // Convert Netlify event to Express request
  const request = {
    method: event.httpMethod,
    url: event.path,
    headers: event.headers,
    body: event.body,
    query: event.queryStringParameters || {}
  };

  // Mock response object
  let response = {
    statusCode: 200,
    headers: {},
    body: ''
  };

  // Mock Express response methods
  const mockRes = {
    status: (code) => {
      response.statusCode = code;
      return mockRes;
    },
    json: (data) => {
      response.body = JSON.stringify(data);
      response.headers['Content-Type'] = 'application/json';
      return mockRes;
    },
    set: (key, value) => {
      response.headers[key] = value;
      return mockRes;
    }
  };

  try {
    // Handle the request
    await app(request, mockRes);
    
    return {
      statusCode: response.statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        ...response.headers
      },
      body: response.body
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      })
    };
  }
};

