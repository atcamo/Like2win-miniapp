/**
 * E2E Authentication Helpers
 * 
 * Provides utilities for mocking authentication flows
 * and setting up test users in E2E tests.
 */

import { Page } from '@playwright/test';

/**
 * User data interface for testing
 */
export interface TestUser {
  fid?: number;
  username?: string;
  displayName?: string;
  walletAddress?: string;
  isFollowing?: boolean;
  tipAllowanceEnabled?: boolean;
  totalLifetimeTickets?: number;
}

/**
 * Mock wallet authentication flow
 */
export async function mockWalletAuth(page: Page, walletAddress?: string): Promise<void> {
  const defaultAddress = walletAddress || '0x1234567890abcdef1234567890abcdef12345678';
  
  // Mock wallet provider
  await page.addInitScript(() => {
    // Mock window.ethereum
    (window as any).ethereum = {
      request: async ({ method }: { method: string }) => {
        switch (method) {
          case 'eth_requestAccounts':
            return ['0x1234567890abcdef1234567890abcdef12345678'];
          case 'eth_accounts':
            return ['0x1234567890abcdef1234567890abcdef12345678'];
          case 'eth_chainId':
            return '0x2105'; // Base chain ID
          default:
            throw new Error(`Unsupported method: ${method}`);
        }
      },
      on: () => {},
      removeListener: () => {},
    };
  });

  // Mock authentication API calls
  await page.route('**/api/auth/wallet', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          user: {
            walletAddress: defaultAddress,
            isAuthenticated: true,
          },
        },
      }),
    });
  });

  // Mock user data API
  await page.route(`**/api/users/wallet/${defaultAddress}`, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 'user-123',
          walletAddress: defaultAddress,
          fid: 12345,
          username: 'testuser',
          displayName: 'Test User',
          isFollowing: true,
          tipAllowanceEnabled: false,
          totalLifetimeTickets: 10,
        },
      }),
    });
  });
}

/**
 * Mock Farcaster authentication flow
 */
export async function mockFarcasterAuth(page: Page, userData?: TestUser): Promise<void> {
  const defaultUser = {
    fid: 12345,
    username: 'testuser',
    displayName: 'Test User',
    isFollowing: true,
    tipAllowanceEnabled: false,
    totalLifetimeTickets: 10,
    ...userData,
  };

  // Mock Farcaster SDK
  await page.addInitScript(() => {
    (window as any).farcaster = {
      requestAccounts: async () => ({
        accounts: [{
          fid: 12345,
          username: 'testuser',
          displayName: 'Test User',
        }],
      }),
      signMessage: async () => ({
        signature: 'mock-signature',
        message: 'mock-message',
      }),
    };
  });

  // Mock Farcaster authentication API
  await page.route('**/api/auth/farcaster', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          user: defaultUser,
        },
      }),
    });
  });

  // Mock user data API
  await page.route(`**/api/users/fid/${defaultUser.fid}`, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: defaultUser,
      }),
    });
  });
}

/**
 * Set up test user with specific properties
 */
export async function setupTestUser(page: Page, userData?: TestUser): Promise<void> {
  const defaultUser = {
    fid: 12345,
    username: 'testuser',
    displayName: 'Test User',
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    isFollowing: true,
    tipAllowanceEnabled: false,
    totalLifetimeTickets: 10,
    ...userData,
  };

  // Mock authentication state
  await page.addInitScript((user) => {
    localStorage.setItem('like2win-auth', JSON.stringify({
      isAuthenticated: true,
      user: user,
      authMethod: 'farcaster',
    }));
  }, defaultUser);

  // Mock user data API endpoints
  await page.route(`**/api/users/fid/${defaultUser.fid}`, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: defaultUser,
      }),
    });
  });

  if (defaultUser.walletAddress) {
    await page.route(`**/api/users/wallet/${defaultUser.walletAddress}`, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: defaultUser,
        }),
      });
    });
  }

  // Mock raffle status API
  await page.route('**/api/raffle/status**', route => {
    const url = new URL(route.request().url());
    const fid = url.searchParams.get('fid');
    
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          fid: parseInt(fid || defaultUser.fid.toString()),
          username: defaultUser.username,
          display_name: defaultUser.displayName,
          tip_allowance_enabled: defaultUser.tipAllowanceEnabled,
          is_following: defaultUser.isFollowing,
          current_tickets: 5,
          total_lifetime_tickets: defaultUser.totalLifetimeTickets,
          current_raffle_name: 'Test Raffle',
          current_raffle_status: 'active',
          current_raffle_end_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
          current_raffle_prize_pool: 1000,
          current_raffle_participants: 25,
          current_raffle_total_tickets: 150,
          win_probability: 3.33,
          current_rank: 8,
        },
      }),
    });
  });

  // Mock leaderboard API
  await page.route('**/api/raffle/leaderboard**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            rank: 1,
            fid: 11111,
            username: 'leader1',
            display_name: 'Top Player',
            tickets: 15,
            win_probability: 10.0,
          },
          {
            rank: 2,
            fid: 22222,
            username: 'leader2',
            display_name: 'Second Place',
            tickets: 12,
            win_probability: 8.0,
          },
          {
            rank: 8,
            fid: defaultUser.fid,
            username: defaultUser.username,
            display_name: defaultUser.displayName,
            tickets: 5,
            win_probability: 3.33,
          },
        ],
      }),
    });
  });
}

/**
 * Mock failed authentication
 */
export async function mockAuthFailure(page: Page, errorMessage?: string): Promise<void> {
  const error = errorMessage || 'Authentication failed';
  
  await page.route('**/api/auth/**', route => {
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        error: error,
      }),
    });
  });
}

/**
 * Clear authentication state
 */
export async function clearAuthState(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.removeItem('like2win-auth');
    sessionStorage.clear();
  });
}

/**
 * Wait for authentication to complete
 */
export async function waitForAuth(page: Page, timeout?: number): Promise<void> {
  await page.waitForFunction(
    () => {
      const auth = localStorage.getItem('like2win-auth');
      return auth && JSON.parse(auth).isAuthenticated;
    },
    { timeout: timeout || 10000 }
  );
}

/**
 * Mock network conditions
 */
export async function mockNetworkConditions(
  page: Page, 
  condition: 'offline' | 'slow' | 'normal'
): Promise<void> {
  switch (condition) {
    case 'offline':
      await page.route('**/api/**', route => route.abort('failed'));
      break;
    
    case 'slow':
      await page.route('**/api/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 3000));
        route.continue();
      });
      break;
    
    case 'normal':
    default:
      await page.unroute('**/api/**');
      break;
  }
}

/**
 * Mock specific API responses
 */
export async function mockApiResponse(
  page: Page,
  endpoint: string,
  response: any,
  status: number = 200
): Promise<void> {
  await page.route(`**${endpoint}`, route => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Simulate user interactions for authentication
 */
export async function simulateWalletConnection(page: Page): Promise<void> {
  await mockWalletAuth(page);
  await page.click('[data-testid="connect-wallet-button"]');
  await page.waitForSelector('[data-testid="wallet-modal"]');
  await page.click('[data-testid="metamask-option"]');
  await page.waitForSelector('[data-testid="user-profile"]');
}

/**
 * Simulate Farcaster authentication flow
 */
export async function simulateFarcasterConnection(page: Page, userData?: TestUser): Promise<void> {
  await mockFarcasterAuth(page, userData);
  await page.click('[data-testid="connect-farcaster-button"]');
  await page.waitForSelector('[data-testid="farcaster-modal"]');
  await page.click('[data-testid="farcaster-login-button"]');
  await page.waitForSelector('[data-testid="user-profile"]');
}

/**
 * Verify authentication state in UI
 */
export async function verifyAuthenticationState(
  page: Page, 
  expectedState: 'authenticated' | 'unauthenticated'
): Promise<void> {
  if (expectedState === 'authenticated') {
    await page.waitForSelector('[data-testid="user-profile"]');
  } else {
    await page.waitForSelector('[data-testid="connect-buttons"]');
  }
}