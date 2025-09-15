// Simple API function for Netlify that doesn't depend on complex database services
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

    // Health check endpoint
    if (path === '/api/health') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'OK',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'production',
          platform: 'netlify-simple',
          version: '1.0.0'
        })
      };
    }

    // Programs endpoint - return mock data for now
    if (path === '/api/programs') {
      const mockPrograms = [
        {
          id: 1,
          program_name: "Ethiopian Community Resources",
          organization: "Community Organization",
          description: "A comprehensive resource platform for the Ethiopian community",
          grade_level: 12,
          cost_category: "FREE",
          program_type: "Resource Platform",
          subject_area: "Community",
          location_state: "Various",
          location_city: "Multiple Cities",
          website: "https://ethiopian-community-resources.netlify.app",
          contact_email: "info@ethiopian-community.org"
        }
      ];

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          programs: mockPrograms,
          count: mockPrograms.length,
          message: "Using mock data - database connection pending"
        })
      };
    }

    // Stats endpoint
    if (path === '/api/programs/stats') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            total_programs: 1,
            total_organizations: 1,
            programs_by_type: {
              "Resource Platform": 1
            },
            programs_by_cost: {
              "FREE": 1
            }
          }
        })
      };
    }

    // Filters endpoint
    if (path === '/api/programs/filters') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            program_types: ["Resource Platform"],
            cost_categories: ["FREE"],
            locations: ["Multiple Cities"],
            grade_levels: [12]
          }
        })
      };
    }

    // Search endpoint
    if (path.startsWith('/api/programs/search')) {
      const searchTerm = query.q || '';
      console.log(`🔍 Search request: term="${searchTerm}"`);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          programs: [],
          count: 0,
          query: query,
          message: "Search functionality pending database connection"
        })
      };
    }

    // Individual program endpoint
    if (path.match(/^\/api\/programs\/[^\/]+$/)) {
      const id = path.split('/').pop();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            id: id,
            program_name: "Ethiopian Community Resources",
            organization: "Community Organization",
            description: "A comprehensive resource platform for the Ethiopian community",
            message: "Individual program details pending database connection"
          }
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
        path: path,
        available_endpoints: [
          '/api/health',
          '/api/programs',
          '/api/programs/stats',
          '/api/programs/filters',
          '/api/programs/search',
          '/api/programs/{id}'
        ]
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