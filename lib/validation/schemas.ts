/**
 * API Validation Schemas
 * 
 * This module contains Zod schemas for validating API requests and responses.
 * All schemas include comprehensive validation rules and error messages.
 * 
 * @module Validation/Schemas
 * @version 1.0.0
 */

import { z } from 'zod';

/**
 * Common validation patterns and utilities
 */
export const ValidationPatterns = {
  /** Ethereum address pattern */
  ETHEREUM_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  /** Farcaster cast hash pattern */
  CAST_HASH: /^0x[a-fA-F0-9]{40}$/,
  /** Username pattern (alphanumeric, underscore, hyphen) */
  USERNAME: /^[a-zA-Z0-9_-]{1,20}$/,
  /** URL pattern */
  URL: /^https?:\/\/.+/,
} as const;

/**
 * Base pagination schema for list endpoints
 */
export const PaginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(val => val ? parseInt(val) : 1)
    .refine(val => val > 0, { message: 'Page must be greater than 0' }),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform(val => val ? parseInt(val) : 20)
    .refine(val => val > 0 && val <= 100, { 
      message: 'Limit must be between 1 and 100' 
    }),
  sortBy: z
    .string()
    .optional()
    .default('created_at'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc'),
});

/**
 * User-related validation schemas
 */
export const UserSchemas = {
  /**
   * Schema for creating a new user
   */
  create: z.object({
    fid: z
      .number()
      .int()
      .positive({ message: 'FID must be a positive integer' }),
    username: z
      .string()
      .regex(ValidationPatterns.USERNAME, { 
        message: 'Username must be alphanumeric with underscores/hyphens, max 20 characters' 
      })
      .optional(),
    display_name: z
      .string()
      .min(1, { message: 'Display name cannot be empty' })
      .max(50, { message: 'Display name cannot exceed 50 characters' })
      .optional(),
    pfp_url: z
      .string()
      .url({ message: 'Profile picture must be a valid URL' })
      .optional(),
    wallet_address: z
      .string()
      .regex(ValidationPatterns.ETHEREUM_ADDRESS, { 
        message: 'Invalid Ethereum address format' 
      })
      .optional(),
    tip_allowance_enabled: z
      .boolean()
      .default(false),
    custody_address: z
      .string()
      .regex(ValidationPatterns.ETHEREUM_ADDRESS, { 
        message: 'Invalid custody address format' 
      })
      .optional(),
  }),

  /**
   * Schema for updating user information
   */
  update: z.object({
    username: z
      .string()
      .regex(ValidationPatterns.USERNAME)
      .optional(),
    display_name: z
      .string()
      .min(1)
      .max(50)
      .optional(),
    pfp_url: z
      .string()
      .url()
      .optional(),
    wallet_address: z
      .string()
      .regex(ValidationPatterns.ETHEREUM_ADDRESS)
      .optional(),
    tip_allowance_enabled: z
      .boolean()
      .optional(),
    is_following_like2win: z
      .boolean()
      .optional(),
    custody_address: z
      .string()
      .regex(ValidationPatterns.ETHEREUM_ADDRESS)
      .optional(),
  }),

  /**
   * Schema for user lookup by FID
   */
  getByFid: z.object({
    fid: z
      .string()
      .transform(val => parseInt(val))
      .refine(val => !isNaN(val) && val > 0, { 
        message: 'FID must be a positive integer' 
      }),
  }),

  /**
   * Schema for user lookup by wallet address
   */
  getByAddress: z.object({
    address: z
      .string()
      .regex(ValidationPatterns.ETHEREUM_ADDRESS, { 
        message: 'Invalid Ethereum address format' 
      }),
  }),

  /**
   * Schema for user filters
   */
  filters: z.object({
    isFollowing: z
      .string()
      .optional()
      .transform(val => val === 'true'),
    hasTipAllowance: z
      .string()
      .optional()
      .transform(val => val === 'true'),
    isActive: z
      .string()
      .optional()
      .transform(val => val === 'true'),
    minLifetimeTickets: z
      .string()
      .optional()
      .transform(val => val ? parseInt(val) : undefined)
      .refine(val => val === undefined || val >= 0, { 
        message: 'Minimum lifetime tickets must be non-negative' 
      }),
  }),
};

/**
 * Raffle-related validation schemas
 */
export const RaffleSchemas = {
  /**
   * Schema for creating a new raffle
   */
  create: z.object({
    name: z
      .string()
      .min(1, { message: 'Raffle name is required' })
      .max(100, { message: 'Raffle name cannot exceed 100 characters' }),
    description: z
      .string()
      .max(500, { message: 'Description cannot exceed 500 characters' })
      .optional(),
    start_date: z
      .string()
      .datetime({ message: 'Start date must be a valid ISO datetime' })
      .transform(val => new Date(val)),
    end_date: z
      .string()
      .datetime({ message: 'End date must be a valid ISO datetime' })
      .transform(val => new Date(val)),
    prize_pool: z
      .number()
      .positive({ message: 'Prize pool must be positive' }),
    prize_currency: z
      .string()
      .min(1, { message: 'Prize currency is required' })
      .max(10, { message: 'Prize currency cannot exceed 10 characters' })
      .default('DEGEN'),
  }).refine(data => data.end_date > data.start_date, {
    message: 'End date must be after start date',
    path: ['end_date'],
  }),

  /**
   * Schema for updating raffle information
   */
  update: z.object({
    name: z
      .string()
      .min(1)
      .max(100)
      .optional(),
    description: z
      .string()
      .max(500)
      .optional(),
    status: z
      .enum(['upcoming', 'active', 'ended', 'completed'])
      .optional(),
    prize_pool: z
      .number()
      .positive()
      .optional(),
    winners_selected: z
      .boolean()
      .optional(),
  }),

  /**
   * Schema for raffle filters
   */
  filters: z.object({
    status: z
      .enum(['upcoming', 'active', 'ended', 'completed'])
      .optional(),
    startDateAfter: z
      .string()
      .datetime()
      .transform(val => new Date(val))
      .optional(),
    endDateBefore: z
      .string()
      .datetime()
      .transform(val => new Date(val))
      .optional(),
  }),
};

/**
 * Post-related validation schemas
 */
export const PostSchemas = {
  /**
   * Schema for creating a new post
   */
  create: z.object({
    cast_hash: z
      .string()
      .regex(ValidationPatterns.CAST_HASH, { 
        message: 'Invalid cast hash format' 
      }),
    author_fid: z
      .number()
      .int()
      .positive({ message: 'Author FID must be a positive integer' }),
    content: z
      .string()
      .min(1, { message: 'Post content is required' })
      .max(1000, { message: 'Post content cannot exceed 1000 characters' }),
    post_url: z
      .string()
      .url({ message: 'Post URL must be valid' })
      .optional(),
    required_engagement: z
      .enum(['like', 'like_comment', 'like_comment_recast'])
      .default('like_comment_recast'),
    tickets_per_participation: z
      .number()
      .int()
      .positive({ message: 'Tickets per participation must be positive' })
      .default(1),
    raffle_id: z
      .string()
      .uuid({ message: 'Raffle ID must be a valid UUID' }),
  }),

  /**
   * Schema for updating post information
   */
  update: z.object({
    content: z
      .string()
      .min(1)
      .max(1000)
      .optional(),
    required_engagement: z
      .enum(['like', 'like_comment', 'like_comment_recast'])
      .optional(),
    tickets_per_participation: z
      .number()
      .int()
      .positive()
      .optional(),
    is_active: z
      .boolean()
      .optional(),
  }),

  /**
   * Schema for post lookup by cast hash
   */
  getByCastHash: z.object({
    castHash: z
      .string()
      .regex(ValidationPatterns.CAST_HASH, { 
        message: 'Invalid cast hash format' 
      }),
  }),
};

/**
 * Participation-related validation schemas
 */
export const ParticipationSchemas = {
  /**
   * Schema for raffle participation request
   */
  participate: z.object({
    user_fid: z
      .number()
      .int()
      .positive({ message: 'User FID must be a positive integer' }),
    post_cast_hash: z
      .string()
      .regex(ValidationPatterns.CAST_HASH, { 
        message: 'Invalid post cast hash format' 
      }),
    engagement_type: z
      .enum(['like', 'like_comment', 'like_comment_recast'])
      .default('like_comment_recast'),
    engagement_data: z.object({
      has_liked: z
        .boolean()
        .default(false),
      has_commented: z
        .boolean()
        .default(false),
      has_recasted: z
        .boolean()
        .default(false),
      like_timestamp: z
        .string()
        .datetime()
        .transform(val => new Date(val))
        .optional(),
      comment_timestamp: z
        .string()
        .datetime()
        .transform(val => new Date(val))
        .optional(),
      recast_timestamp: z
        .string()
        .datetime()
        .transform(val => new Date(val))
        .optional(),
      comment_hash: z
        .string()
        .regex(ValidationPatterns.CAST_HASH)
        .optional(),
      recast_hash: z
        .string()
        .regex(ValidationPatterns.CAST_HASH)
        .optional(),
    }),
  }),

  /**
   * Schema for validating engagement requirements
   */
  validateEngagement: z.object({
    engagement_type: z
      .enum(['like', 'like_comment', 'like_comment_recast']),
    engagement_data: z.object({
      has_liked: z.boolean(),
      has_commented: z.boolean(),
      has_recasted: z.boolean(),
    }),
  }).refine(data => {
    const { engagement_type, engagement_data } = data;
    
    // Always require like
    if (!engagement_data.has_liked) return false;
    
    // Check specific requirements
    if (engagement_type === 'like_comment' && !engagement_data.has_commented) {
      return false;
    }
    
    if (engagement_type === 'like_comment_recast' && 
        (!engagement_data.has_commented || !engagement_data.has_recasted)) {
      return false;
    }
    
    return true;
  }, {
    message: 'Engagement data does not meet the required engagement type',
    path: ['engagement_data'],
  }),
};

/**
 * Frame-related validation schemas
 */
export const FrameSchemas = {
  /**
   * Schema for Farcaster frame request
   */
  frameRequest: z.object({
    untrustedData: z.object({
      fid: z
        .number()
        .int()
        .positive(),
      url: z
        .string()
        .url(),
      messageHash: z
        .string(),
      timestamp: z
        .number(),
      network: z
        .number(),
      buttonIndex: z
        .number()
        .int()
        .min(1)
        .max(4)
        .optional(),
      inputText: z
        .string()
        .optional(),
      castId: z.object({
        fid: z.number().int().positive(),
        hash: z.string(),
      }).optional(),
    }),
    trustedData: z.object({
      messageBytes: z.string(),
    }),
  }),

  /**
   * Schema for frame URL parameters
   */
  frameParams: z.object({
    hash: z
      .string()
      .regex(ValidationPatterns.CAST_HASH)
      .optional(),
    fid: z
      .string()
      .transform(val => parseInt(val))
      .refine(val => !isNaN(val) && val > 0)
      .optional(),
  }),
};

/**
 * API response validation schemas
 */
export const ResponseSchemas = {
  /**
   * Standard API response wrapper
   */
  apiResponse: <T extends z.ZodType>(dataSchema: T) => z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
    metadata: z.object({
      total: z.number().optional(),
      page: z.number().optional(),
      limit: z.number().optional(),
    }).optional(),
  }),

  /**
   * User raffle status response
   */
  userRaffleStatus: z.object({
    fid: z.number(),
    display_name: z.string().optional(),
    username: z.string().optional(),
    pfp_url: z.string().url().optional(),
    tip_allowance_enabled: z.boolean(),
    is_following: z.boolean(),
    current_tickets: z.number(),
    total_lifetime_tickets: z.number(),
    current_raffle_id: z.string().uuid().optional(),
    current_raffle_name: z.string().optional(),
    current_raffle_status: z.enum(['upcoming', 'active', 'ended', 'completed']).optional(),
    current_raffle_end_date: z.date().optional(),
    current_raffle_prize_pool: z.number().optional(),
    current_raffle_participants: z.number().optional(),
    current_raffle_total_tickets: z.number().optional(),
    win_probability: z.number().optional(),
    current_rank: z.number().optional(),
  }),

  /**
   * Leaderboard entry response
   */
  leaderboardEntry: z.object({
    rank: z.number(),
    fid: z.number(),
    display_name: z.string().optional(),
    username: z.string().optional(),
    pfp_url: z.string().url().optional(),
    tickets: z.number(),
    win_probability: z.number(),
  }),

  /**
   * Participation result response
   */
  participationResult: z.object({
    success: z.boolean(),
    tickets_earned: z.number().optional(),
    total_tickets: z.number().optional(),
    error: z.string().optional(),
    user_status: z.object({
      current_tickets: z.number(),
      total_lifetime_tickets: z.number(),
      current_rank: z.number().optional(),
    }).optional(),
  }),
};

/**
 * Utility function to validate and parse request data
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Parsed and validated data
 * @throws ValidationError if validation fails
 */
export function validateAndParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      
      throw new ValidationError('Validation failed', formattedErrors);
    }
    throw error;
  }
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Array<{
      path: string;
      message: string;
      code: string;
    }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Environment variable validation schema
 */
export const EnvironmentSchema = z.object({
  // Database
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.string().default('5432').transform(val => parseInt(val)),
  DATABASE_NAME: z.string().default('like2win'),
  DATABASE_USER: z.string().default('postgres'),
  DATABASE_PASSWORD: z.string(),
  DATABASE_URL: z.string().url().optional(),
  
  // App
  NEXT_PUBLIC_VERCEL_URL: z.string(),
  NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME: z.string().default('Like2Win'),
  NEXT_PUBLIC_ONCHAINKIT_API_KEY: z.string(),
  NEXT_PUBLIC_CDP_PROJECT_ID: z.string(),
  
  // Web3
  NEXT_PUBLIC_BASE_RPC_URL: z.string().url().default('https://mainnet.base.org'),
  NEXT_PUBLIC_BASE_CHAIN_ID: z.string().default('8453').transform(val => parseInt(val)),
  NEXT_PUBLIC_WC_PROJECT_ID: z.string(),
  
  // Farcaster
  FARCASTER_HUB_URL: z.string().url().default('https://hub-api.neynar.com'),
  FARCASTER_API_KEY: z.string(),
  LIKE2WIN_FID: z.string().transform(val => parseInt(val)),
  
  // Security
  FRAME_SECRET: z.string().min(32, 'Frame secret must be at least 32 characters'),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  
  // Optional
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  DEBUG: z.string().default('false').transform(val => val === 'true'),
  USE_MOCK_DATA: z.string().default('false').transform(val => val === 'true'),
});