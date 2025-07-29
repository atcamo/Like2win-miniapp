/**
 * Playwright Configuration for E2E Testing
 * 
 * Configures Playwright for end-to-end testing of the raffle
 * participation flow and critical user journeys.
 */

import { defineConfig, devices } from '@playwright/test';

/**
 * Environment configuration
 */
const isCI = !!process.env.CI;
const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  // Test directory
  testDir: './e2e',
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: isCI,
  
  // Retry on CI only
  retries: isCI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: isCI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ...(isCI ? [['github']] : [['list']]),
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL for all tests
    baseURL,
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Navigation timeout
    navigationTimeout: 30000,
    
    // Action timeout
    actionTimeout: 10000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Global setup
  globalSetup: require.resolve('./e2e/global-setup'),
  globalTeardown: require.resolve('./e2e/global-teardown'),

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120000,
  },

  // Test timeout
  timeout: 60000,
  
  // Expect timeout for assertions
  expect: {
    timeout: 10000,
  },
  
  // Output directory for test artifacts
  outputDir: 'test-results/e2e-artifacts',
  
  // Test metadata
  metadata: {
    'Test Suite': 'Like2Win E2E Tests',
    'Environment': process.env.NODE_ENV || 'test',
    'Base URL': baseURL,
  },
});