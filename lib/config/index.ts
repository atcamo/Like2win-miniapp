/**
 * Configuration Management Module
 * 
 * This module handles all application configuration including environment
 * variables, feature flags, and runtime configuration management.
 * 
 * @module Config
 * @version 1.0.0
 */

import { z } from 'zod';
import { EnvironmentSchema } from '@/lib/validation/schemas';

/**
 * Environment variable validation and parsing
 */
function validateEnvironment() {
  try {
    return EnvironmentSchema.parse(process.env);
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw new Error('Invalid environment configuration');
  }
}

/**
 * Validated environment variables
 */
const env = validateEnvironment();

/**
 * Database configuration
 */
export const databaseConfig = {
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  name: env.DATABASE_NAME,
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  url: env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production',
  poolConfig: {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
} as const;

/**
 * Application configuration
 */
export const appConfig = {
  name: env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
  url: env.NEXT_PUBLIC_VERCEL_URL,
  environment: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  debug: env.DEBUG,
  useMockData: env.USE_MOCK_DATA,
  
  // URLs and assets
  heroImage: env.NEXT_PUBLIC_APP_HERO_IMAGE,
  splashImage: env.NEXT_PUBLIC_SPLASH_IMAGE,
  splashBackgroundColor: env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR,
} as const;

/**
 * OnchainKit configuration
 */
export const onchainKitConfig = {
  apiKey: env.NEXT_PUBLIC_ONCHAINKIT_API_KEY,
  projectId: env.NEXT_PUBLIC_CDP_PROJECT_ID,
  projectName: env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
} as const;

/**
 * Web3 configuration
 */
export const web3Config = {
  baseRpcUrl: env.NEXT_PUBLIC_BASE_RPC_URL,
  baseChainId: env.NEXT_PUBLIC_BASE_CHAIN_ID,
  walletConnectProjectId: env.NEXT_PUBLIC_WC_PROJECT_ID,
  
  // Network configuration
  networks: {
    base: {
      id: env.NEXT_PUBLIC_BASE_CHAIN_ID,
      name: 'Base',
      rpcUrl: env.NEXT_PUBLIC_BASE_RPC_URL,
      blockExplorer: 'https://basescan.org',
    },
  },
} as const;

/**
 * Farcaster configuration
 */
export const farcasterConfig = {
  hubUrl: env.FARCASTER_HUB_URL,
  apiKey: env.FARCASTER_API_KEY,
  like2winFid: env.LIKE2WIN_FID,
  
  // Frame configuration
  frameSecret: env.FRAME_SECRET,
  frameBaseUrl: env.NEXT_PUBLIC_VERCEL_URL 
    ? `https://${env.NEXT_PUBLIC_VERCEL_URL}` 
    : 'http://localhost:3000',
} as const;

/**
 * Security configuration
 */
export const securityConfig = {
  frameSecret: env.FRAME_SECRET,
  nextAuthSecret: env.NEXTAUTH_SECRET,
  nextAuthUrl: env.NEXTAUTH_URL,
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  
  // CORS configuration
  cors: {
    origin: appConfig.isProduction 
      ? [`https://${env.NEXT_PUBLIC_VERCEL_URL}`]
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  },
} as const;

/**
 * Cache configuration
 */
export const cacheConfig = {
  redis: {
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
    enabled: !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
  },
  
  // TTL values in seconds
  ttl: {
    userStatus: 300, // 5 minutes
    raffleInfo: 60, // 1 minute
    leaderboard: 30, // 30 seconds
    stats: 180, // 3 minutes
  },
} as const;

/**
 * Feature flags configuration
 */
export const featureFlags = {
  enableFrames: true,
  enableWalletAuth: true,
  enableFarcasterAuth: true,
  enableCaching: cacheConfig.redis.enabled,
  enableAnalytics: !!process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID,
  enableErrorReporting: !!process.env.SENTRY_DSN,
  
  // Raffle features
  enableTipAllowanceLogic: true,
  enableMultipleWinners: false,
  enableDynamicPrizePool: false,
  
  // UI features
  enableDarkMode: false,
  enableNotifications: false,
  enableRealTimeUpdates: false,
} as const;

/**
 * Raffle configuration
 */
export const raffleConfig = {
  // Default raffle settings
  defaults: {
    ticketsPerParticipation: 1,
    maxTicketsPerUser: 1000,
    prizeCurrency: 'DEGEN',
    defaultPrizePool: 1000,
  },
  
  // Raffle schedule (bi-weekly: Wednesday and Sunday at 8PM UTC)
  schedule: {
    days: [0, 3], // Sunday = 0, Wednesday = 3
    hour: 20, // 8PM UTC
    minute: 0,
    duration: 72, // 72 hours (3 days)
  },
  
  // Engagement requirements
  engagement: {
    standardRequirements: ['like', 'comment', 'recast'],
    tipAllowanceRequirements: ['like'],
    minFollowersToParticipate: 0,
  },
  
  // Winner selection
  winnerSelection: {
    defaultNumberOfWinners: 1,
    maxNumberOfWinners: 5,
    selectionMethod: 'weighted_random', // 'weighted_random' | 'random' | 'top_tickets'
  },
} as const;

/**
 * API configuration
 */
export const apiConfig = {
  // Base URLs
  baseUrl: appConfig.url,
  internalApiUrl: '/api',
  
  // Timeouts
  timeouts: {
    database: 30000, // 30 seconds
    external: 10000, // 10 seconds
    frame: 5000, // 5 seconds
  },
  
  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  
  // External services
  external: {
    farcaster: {
      baseUrl: env.FARCASTER_HUB_URL,
      timeout: 5000,
    },
  },
} as const;

/**
 * Logging configuration
 */
export const loggingConfig = {
  level: appConfig.isDevelopment ? 'debug' : 'info',
  enableConsole: true,
  enableFile: appConfig.isProduction,
  
  // What to log
  logRequests: appConfig.isDevelopment,
  logResponses: appConfig.isDevelopment,
  logErrors: true,
  logSlowQueries: true,
  slowQueryThreshold: 1000, // 1 second
  
  // Sensitive data filtering
  sensitiveFields: [
    'password',
    'secret',
    'token',
    'apiKey',
    'privateKey',
    'authorization',
  ],
} as const;

/**
 * Analytics configuration
 */
export const analyticsConfig = {
  vercel: {
    enabled: !!process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID,
    id: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID,
  },
  
  googleAnalytics: {
    enabled: !!process.env.NEXT_PUBLIC_GA_TRACKING_ID,
    trackingId: process.env.NEXT_PUBLIC_GA_TRACKING_ID,
  },
  
  // Custom events to track
  events: {
    userRegistration: 'user_registration',
    raffleParticipation: 'raffle_participation',
    walletConnection: 'wallet_connection',
    frameInteraction: 'frame_interaction',
  },
} as const;

/**
 * Export all configuration as a single object
 */
export const config = {
  app: appConfig,
  database: databaseConfig,
  onchainKit: onchainKitConfig,
  web3: web3Config,
  farcaster: farcasterConfig,
  security: securityConfig,
  cache: cacheConfig,
  features: featureFlags,
  raffle: raffleConfig,
  api: apiConfig,
  logging: loggingConfig,
  analytics: analyticsConfig,
} as const;

/**
 * Configuration validation function
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required configurations
  if (!databaseConfig.host && !databaseConfig.url) {
    errors.push('Database configuration is incomplete');
  }

  if (!onchainKitConfig.apiKey) {
    errors.push('OnchainKit API key is required');
  }

  if (!farcasterConfig.apiKey) {
    errors.push('Farcaster API key is required');
  }

  if (!securityConfig.frameSecret || securityConfig.frameSecret.length < 32) {
    errors.push('Frame secret must be at least 32 characters');
  }

  // Check production-specific requirements
  if (appConfig.isProduction) {
    if (!securityConfig.nextAuthSecret) {
      errors.push('NextAuth secret is required in production');
    }

    if (appConfig.url.includes('localhost')) {
      errors.push('Production URL cannot be localhost');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Runtime configuration updates
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private runtimeConfig: Record<string, any> = {};

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Sets a runtime configuration value
   */
  set(key: string, value: any): void {
    this.runtimeConfig[key] = value;
  }

  /**
   * Gets a runtime configuration value
   */
  get(key: string, defaultValue?: any): any {
    return this.runtimeConfig[key] ?? defaultValue;
  }

  /**
   * Checks if a feature is enabled
   */
  isFeatureEnabled(feature: keyof typeof featureFlags): boolean {
    return this.get(`features.${feature}`, featureFlags[feature]);
  }

  /**
   * Updates feature flags at runtime
   */
  updateFeatureFlag(feature: keyof typeof featureFlags, enabled: boolean): void {
    this.set(`features.${feature}`, enabled);
  }

  /**
   * Gets all runtime configuration
   */
  getAll(): Record<string, any> {
    return { ...this.runtimeConfig };
  }

  /**
   * Resets runtime configuration
   */
  reset(): void {
    this.runtimeConfig = {};
  }
}

/**
 * Export singleton instance
 */
export const configManager = ConfigManager.getInstance();

/**
 * Utility function to get environment-specific config
 */
export function getEnvConfig<T>(
  development: T,
  production: T,
  fallback?: T
): T {
  if (appConfig.isDevelopment) return development;
  if (appConfig.isProduction) return production;
  return fallback || development;
}

/**
 * Initialize configuration on module load
 */
const configValidation = validateConfig();
if (!configValidation.valid) {
  console.error('Configuration validation failed:', configValidation.errors);
  if (appConfig.isProduction) {
    throw new Error('Invalid configuration detected in production');
  }
}