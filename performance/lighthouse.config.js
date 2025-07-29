/**
 * Lighthouse Performance Testing Configuration
 * 
 * Configures Lighthouse for automated performance testing
 * of critical user flows and pages.
 */

module.exports = {
  // CI configuration
  ci: {
    collect: {
      // URLs to test
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/raffle',
        'http://localhost:3000/raffle?fid=12345',
      ],
      
      // Collection settings
      numberOfRuns: 3,
      settings: {
        // Lighthouse settings
        preset: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices'],
        
        // Network simulation
        throttlingMethod: 'simulate',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
        
        // Device emulation
        emulatedFormFactor: 'desktop',
        
        // Skip certain audits for CI
        skipAudits: [
          'uses-http2',
          'canonical',
          'robots-txt',
        ],
      },
    },
    
    // Upload configuration (optional)
    upload: {
      target: 'temporary-public-storage',
    },
    
    // Assertion configuration
    assert: {
      // Performance thresholds
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        
        // Other important metrics
        'interactive': ['error', { maxNumericValue: 3500 }],
        'speed-index': ['error', { maxNumericValue: 2000 }],
      },
    },
  },
  
  // Server configuration for CI
  server: {
    command: 'npm run build && npm run start',
    port: 3000,
    wait: 10000,
  },
};