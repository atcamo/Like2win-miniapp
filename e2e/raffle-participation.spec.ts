/**
 * E2E Tests for Raffle Participation Flow
 * 
 * Tests the complete user journey from authentication to
 * raffle participation and status tracking.
 */

import { test, expect, Page } from '@playwright/test';
import { mockFarcasterAuth, mockWalletAuth, setupTestUser } from './helpers/auth-helpers';
import { seedE2ETestData, cleanupE2ETestData } from './helpers/test-data';

test.describe('Raffle Participation Flow', () => {
  let page: Page;

  test.beforeAll(async () => {
    await seedE2ETestData();
  });

  test.afterAll(async () => {
    await cleanupE2ETestData();
  });

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/');
  });

  test.describe('Authentication Flow', () => {
    test('should allow wallet authentication', async () => {
      // Mock wallet connection
      await mockWalletAuth(page);

      // Click connect wallet button
      await page.click('[data-testid="connect-wallet-button"]');

      // Wait for wallet modal
      await expect(page.locator('[data-testid="wallet-modal"]')).toBeVisible();

      // Select MetaMask (mocked)
      await page.click('[data-testid="metamask-option"]');

      // Wait for authentication to complete
      await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();

      // Verify user is authenticated
      const userAddress = await page.textContent('[data-testid="user-address"]');
      expect(userAddress).toContain('0x');
    });

    test('should allow Farcaster authentication', async () => {
      // Mock Farcaster authentication
      await mockFarcasterAuth(page, {
        fid: 12345,
        username: 'testuser',
        displayName: 'Test User',
      });

      // Click connect Farcaster button
      await page.click('[data-testid="connect-farcaster-button"]');

      // Wait for Farcaster modal
      await expect(page.locator('[data-testid="farcaster-modal"]')).toBeVisible();

      // Complete authentication
      await page.click('[data-testid="farcaster-login-button"]');

      // Wait for authentication to complete
      await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();

      // Verify user is authenticated
      const username = await page.textContent('[data-testid="user-username"]');
      expect(username).toBe('@testuser');
    });

    test('should handle authentication errors gracefully', async () => {
      // Mock authentication failure
      await page.route('**/api/auth/**', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Authentication failed',
          }),
        });
      });

      await page.click('[data-testid="connect-wallet-button"]');

      // Wait for error message
      await expect(page.locator('[data-testid="auth-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="auth-error"]')).toContainText('Authentication failed');
    });
  });

  test.describe('Raffle Status Display', () => {
    test.beforeEach(async () => {
      await setupTestUser(page, { fid: 12345, isFollowing: true });
    });

    test('should display current raffle status', async () => {
      await page.goto('/raffle');

      // Wait for raffle status to load
      await expect(page.locator('[data-testid="raffle-status-card"]')).toBeVisible();

      // Check raffle information
      await expect(page.locator('[data-testid="raffle-name"]')).toContainText('Test Raffle');
      await expect(page.locator('[data-testid="prize-pool"]')).toContainText('1000 DEGEN');
      await expect(page.locator('[data-testid="time-remaining"]')).toBeVisible();

      // Check user status
      await expect(page.locator('[data-testid="user-tickets"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-rank"]')).toBeVisible();
    });

    test('should show following status correctly', async () => {
      await page.goto('/raffle');

      // Following badge should be visible for authenticated following user
      await expect(page.locator('[data-testid="following-badge"]')).toBeVisible();
      await expect(page.locator('[data-testid="following-badge"]')).toContainText('Following');
    });

    test('should show non-following status and requirements', async () => {
      await setupTestUser(page, { fid: 54321, isFollowing: false });
      await page.goto('/raffle');

      // Non-following warning should be visible
      await expect(page.locator('[data-testid="not-following-warning"]')).toBeVisible();
      await expect(page.locator('[data-testid="follow-button"]')).toBeVisible();
    });

    test('should update status in real-time', async () => {
      await page.goto('/raffle');

      // Initial tickets count
      const initialTickets = await page.textContent('[data-testid="user-tickets"]');

      // Mock participation API call
      await page.route('**/api/raffle/participate', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              success: true,
              tickets_earned: 1,
              total_tickets: parseInt(initialTickets || '0') + 1,
            },
          }),
        });
      });

      // Simulate participation (would normally come from external engagement)
      await page.click('[data-testid="refresh-status-button"]');

      // Wait for status update
      await page.waitForTimeout(1000);

      // Verify ticket count increased
      const updatedTickets = await page.textContent('[data-testid="user-tickets"]');
      expect(parseInt(updatedTickets || '0')).toBeGreaterThan(parseInt(initialTickets || '0'));
    });
  });

  test.describe('Leaderboard Display', () => {
    test('should display leaderboard correctly', async () => {
      await setupTestUser(page);
      await page.goto('/raffle');

      // Navigate to leaderboard
      await page.click('[data-testid="leaderboard-tab"]');

      // Wait for leaderboard to load
      await expect(page.locator('[data-testid="leaderboard-container"]')).toBeVisible();

      // Check leaderboard entries
      const leaderboardEntries = page.locator('[data-testid="leaderboard-entry"]');
      await expect(leaderboardEntries).toHaveCountGreaterThan(0);

      // Check first entry has required fields
      const firstEntry = leaderboardEntries.first();
      await expect(firstEntry.locator('[data-testid="rank"]')).toBeVisible();
      await expect(firstEntry.locator('[data-testid="username"]')).toBeVisible();
      await expect(firstEntry.locator('[data-testid="tickets"]')).toBeVisible();
      await expect(firstEntry.locator('[data-testid="win-probability"]')).toBeVisible();
    });

    test('should highlight current user in leaderboard', async () => {
      await setupTestUser(page, { fid: 12345 });
      await page.goto('/raffle');

      await page.click('[data-testid="leaderboard-tab"]');

      // User's entry should be highlighted
      const userEntry = page.locator('[data-testid="leaderboard-entry"][data-user="current"]');
      await expect(userEntry).toBeVisible();
      await expect(userEntry).toHaveClass(/highlighted/);
    });

    test('should handle empty leaderboard', async () => {
      // Mock empty leaderboard response
      await page.route('**/api/raffle/leaderboard', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
          }),
        });
      });

      await setupTestUser(page);
      await page.goto('/raffle');
      await page.click('[data-testid="leaderboard-tab"]');

      // Empty state should be visible
      await expect(page.locator('[data-testid="empty-leaderboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="empty-leaderboard"]')).toContainText('No participants yet');
    });
  });

  test.describe('Participation Requirements', () => {
    test('should show correct requirements for standard users', async () => {
      await setupTestUser(page, { 
        fid: 12345, 
        isFollowing: true,
        tipAllowanceEnabled: false,
      });
      await page.goto('/raffle');

      // Requirements should show like + comment + recast
      await expect(page.locator('[data-testid="requirements-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="requirement-like"]')).toBeVisible();
      await expect(page.locator('[data-testid="requirement-comment"]')).toBeVisible();
      await expect(page.locator('[data-testid="requirement-recast"]')).toBeVisible();
    });

    test('should show simplified requirements for tip allowance users', async () => {
      await setupTestUser(page, { 
        fid: 12345, 
        isFollowing: true,
        tipAllowanceEnabled: true,
      });
      await page.goto('/raffle');

      // Requirements should show only like
      await expect(page.locator('[data-testid="requirements-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="requirement-like"]')).toBeVisible();
      await expect(page.locator('[data-testid="requirement-comment"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="requirement-recast"]')).not.toBeVisible();

      // Tip allowance badge should be visible
      await expect(page.locator('[data-testid="tip-allowance-badge"]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      await setupTestUser(page);

      // Mock API error
      await page.route('**/api/raffle/status', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Internal server error',
          }),
        });
      });

      await page.goto('/raffle');

      // Error state should be visible
      await expect(page.locator('[data-testid="error-state"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to load raffle status');

      // Retry button should be available
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    test('should handle network errors', async () => {
      await setupTestUser(page);

      // Mock network failure
      await page.route('**/api/**', route => route.abort('failed'));

      await page.goto('/raffle');

      // Network error state should be visible
      await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    });

    test('should retry failed requests', async () => {
      await setupTestUser(page);

      let requestCount = 0;
      await page.route('**/api/raffle/status', route => {
        requestCount++;
        if (requestCount < 2) {
          route.fulfill({ status: 500 });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { /* valid raffle status */ },
            }),
          });
        }
      });

      await page.goto('/raffle');

      // Error should appear first
      await expect(page.locator('[data-testid="error-state"]')).toBeVisible();

      // Click retry
      await page.click('[data-testid="retry-button"]');

      // Success state should appear after retry
      await expect(page.locator('[data-testid="raffle-status-card"]')).toBeVisible();
      expect(requestCount).toBe(2);
    });
  });

  test.describe('Loading States', () => {
    test('should show loading states during data fetching', async () => {
      await setupTestUser(page);

      // Mock slow API response
      await page.route('**/api/raffle/status', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { /* valid raffle status */ },
          }),
        });
      });

      await page.goto('/raffle');

      // Loading state should be visible
      await expect(page.locator('[data-testid="raffle-loading"]')).toBeVisible();
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();

      // Loading state should disappear when data loads
      await expect(page.locator('[data-testid="raffle-loading"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="raffle-status-card"]')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work correctly on mobile devices', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await setupTestUser(page);
      await page.goto('/raffle');

      // Mobile layout should be active
      await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible();

      // Navigation should be mobile-friendly
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();

      // Cards should stack vertically
      const cards = page.locator('[data-testid="status-card"]');
      const firstCardBox = await cards.first().boundingBox();
      const secondCardBox = await cards.nth(1).boundingBox();
      
      if (firstCardBox && secondCardBox) {
        expect(secondCardBox.y).toBeGreaterThan(firstCardBox.y + firstCardBox.height);
      }
    });

    test('should work correctly on tablet devices', async () => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await setupTestUser(page);
      await page.goto('/raffle');

      // Tablet layout should be active
      await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();

      // Content should be properly sized
      const mainContent = page.locator('[data-testid="main-content"]');
      const contentBox = await mainContent.boundingBox();
      
      if (contentBox) {
        expect(contentBox.width).toBeLessThanOrEqual(768);
        expect(contentBox.width).toBeGreaterThan(600);
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should be accessible to screen readers', async () => {
      await setupTestUser(page);
      await page.goto('/raffle');

      // Check for proper heading structure
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('h2')).toBeVisible();

      // Check for proper labels
      const buttons = page.locator('button');
      for (let i = 0; i < await buttons.count(); i++) {
        const button = buttons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        const textContent = await button.textContent();
        expect(ariaLabel || textContent).toBeTruthy();
      }

      // Check for proper focus management
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should support keyboard navigation', async () => {
      await setupTestUser(page);
      await page.goto('/raffle');

      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Enter should activate buttons
      const focusedButton = page.locator(':focus');
      if (await focusedButton.count() > 0) {
        await page.keyboard.press('Enter');
        // Should trigger button action (verified by lack of errors)
      }
    });
  });
});