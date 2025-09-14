const databaseService = require('../../services/databaseService-production');

// Simple Netlify function handler without Express wrapper
exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const path = event.path.replace('/.netlify/functions/api-simple', '');
    const method = event.httpMethod;
    const query = event.queryStringParameters || {};

    console.log(`🔍 Processing ${method} ${path}`);

    // Route handling
    if (path === '/api/health') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'OK',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'production',
          platform: 'netlify-simple'
        })
      };
    }

    if (path === '/api/programs') {
      const programs = await databaseService.getAllPrograms(query);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          programs: programs,
          count: programs.length
        })
      };
    }

    if (path === '/api/programs/stats') {
      const stats = await databaseService.getStatistics();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: stats
        })
      };
    }

    if (path === '/api/programs/filters') {
      const filterOptions = await databaseService.getFilterOptions();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: filterOptions
        })
      };
    }

    if (path.startsWith('/api/programs/search')) {
      const searchTerm = query.q || '';
      const results = await databaseService.searchPrograms(searchTerm, query);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          programs: results,
          count: results.length,
          query: query
        })
      };
    }

    if (path.match(/^\/api\/programs\/[^\/]+$/)) {
      const id = path.split('/').pop();
      const program = await databaseService.getProgramById(id);
      
      if (!program) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Program not found'
          })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: program
        })
      };
    }

    // 404 for unmatched routes
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        error: 'Not Found',
        message: 'The requested resource was not found',
        path: path
      })
    };

  } catch (error) {
    console.error('❌ Function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
