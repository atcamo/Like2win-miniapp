/**
 * Load Testing Script using Artillery
 * 
 * Tests API endpoints under load to identify performance
 * bottlenecks and ensure system stability.
 */

const { check } = require('artillery');

/**
 * Artillery configuration for load testing
 */
module.exports = {
  config: {
    // Test target
    target: process.env.TEST_TARGET || 'http://localhost:3000',
    
    // Load phases
    phases: [
      // Warm up
      {
        duration: 30,
        arrivalRate: 1,
        name: 'Warm up',
      },
      
      // Ramp up
      {
        duration: 60,
        arrivalRate: 1,
        rampTo: 10,
        name: 'Ramp up load',
      },
      
      // Sustained load
      {
        duration: 120,
        arrivalRate: 10,
        name: 'Sustained load',
      },
      
      // Peak load
      {
        duration: 60,
        arrivalRate: 10,
        rampTo: 25,
        name: 'Peak load',
      },
      
      // Cool down
      {
        duration: 30,
        arrivalRate: 25,
        rampTo: 1,
        name: 'Cool down',
      },
    ],
    
    // Default headers
    defaults: {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Like2Win-LoadTest/1.0',
      },
    },
    
    // Variables
    variables: {
      testFid: 12345,
      testCastHash: '0x1234567890abcdef1234567890abcdef12345678',
    },
    
    // Plugins
    plugins: {
      metrics: {
        statsd: false,
      },
    },
  },
  
  scenarios: [
    {
      name: 'User Status Flow',
      weight: 40,
      flow: [
        // Get user by FID
        {
          get: {
            url: '/api/users/fid/{{ testFid }}',
            capture: {
              json: '$.data.id',
              as: 'userId',
            },
            expect: [
              { statusCode: 200 },
              { hasProperty: 'data.fid' },
            ],
          },
        },
        
        // Get raffle status
        {
          get: {
            url: '/api/raffle/status?fid={{ testFid }}',
            expect: [
              { statusCode: 200 },
              { hasProperty: 'data.current_tickets' },
            ],
          },
        },
        
        // Get leaderboard
        {
          get: {
            url: '/api/raffle/leaderboard?limit=10',
            expect: [
              { statusCode: 200 },
              { hasProperty: 'data' },
            ],
          },
        },
      ],
    },
    
    {
      name: 'Participation Flow',
      weight: 30,
      flow: [
        // Check participation eligibility
        {
          get: {
            url: '/api/raffle/eligibility?fid={{ testFid }}&hash={{ testCastHash }}',
            expect: [
              { statusCode: 200 },
              { hasProperty: 'data.eligible' },
            ],
          },
        },
        
        // Attempt participation (will fail due to test data, but tests the endpoint)
        {
          post: {
            url: '/api/raffle/participate',
            json: {
              user_fid: '{{ testFid }}',
              post_cast_hash: '{{ testCastHash }}',
              engagement_type: 'like_comment_recast',
              engagement_data: {
                has_liked: true,
                has_commented: true,
                has_recasted: true,
              },
            },
            expect: [
              { statusCode: [200, 400, 422] }, // Expected to fail in test environment
            ],
          },
        },
      ],
    },
    
    {
      name: 'Public Data Access',
      weight: 20,
      flow: [
        // Home page
        {
          get: {
            url: '/',
            expect: [
              { statusCode: 200 },
            ],
          },
        },
        
        // Raffle page
        {
          get: {
            url: '/raffle',
            expect: [
              { statusCode: 200 },
            ],
          },
        },
        
        // Frame endpoints
        {
          get: {
            url: '/api/frames/raffle-status',
            expect: [
              { statusCode: 200 },
            ],
          },
        },
      ],
    },
    
    {
      name: 'Database Intensive Operations',
      weight: 10,
      flow: [
        // Get full leaderboard
        {
          get: {
            url: '/api/raffle/leaderboard?limit=100',
            expect: [
              { statusCode: 200 },
            ],
          },
        },
        
        // Get user statistics
        {
          get: {
            url: '/api/users/fid/{{ testFid }}/stats',
            expect: [
              { statusCode: [200, 404] },
            ],
          },
        },
        
        // Get raffle history
        {
          get: {
            url: '/api/raffles?status=completed&limit=50',
            expect: [
              { statusCode: 200 },
            ],
          },
        },
      ],
    },
  ],
};

/**
 * Custom functions for load testing
 */

/**
 * Log response times that exceed threshold
 */
function logSlowResponses(requestParams, response, context, ee, next) {
  const responseTime = response.timings.response;
  const threshold = 1000; // 1 second
  
  if (responseTime > threshold) {
    console.log(`Slow response: ${requestParams.url} took ${responseTime}ms`);
  }
  
  return next();
}

/**
 * Check database connection health
 */
function checkDatabaseHealth(requestParams, response, context, ee, next) {
  if (response.statusCode === 500) {
    const body = response.body;
    if (body && body.includes('database')) {
      console.error('Database connection issue detected');
    }
  }
  
  return next();
}

/**
 * Validate API response structure
 */
function validateApiResponse(requestParams, response, context, ee, next) {
  try {
    const data = JSON.parse(response.body);
    
    // Check for required fields
    if (!data.hasOwnProperty('success')) {
      console.error(`Invalid API response structure: ${requestParams.url}`);
    }
    
    // Check for error responses
    if (!data.success && data.error) {
      console.log(`API error: ${data.error} at ${requestParams.url}`);
    }
  } catch (error) {
    console.error(`Failed to parse JSON response from ${requestParams.url}`);
  }
  
  return next();
}

// Export custom functions
module.exports.logSlowResponses = logSlowResponses;
module.exports.checkDatabaseHealth = checkDatabaseHealth;
module.exports.validateApiResponse = validateApiResponse;