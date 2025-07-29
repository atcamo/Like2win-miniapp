/**
 * Database Types and Interfaces
 * 
 * This module contains all TypeScript types and interfaces for database entities.
 * These types ensure type safety across the application and serve as documentation
 * for the database schema.
 * 
 * @module Database/Types
 * @version 1.0.0
 */

/**
 * Base interface for all database entities
 * Contains common fields that exist on all tables
 */
export interface BaseEntity {
  /** Unique identifier for the entity */
  id: string;
  /** Timestamp when the entity was created */
  created_at: Date;
  /** Timestamp when the entity was last updated */
  updated_at: Date;
}

/**
 * User entity representing application users
 * Users can authenticate via wallet or Farcaster and participate in raffles
 */
export interface User extends BaseEntity {
  /** Farcaster ID - unique identifier from Farcaster protocol */
  fid: number;
  /** Username from Farcaster profile */
  username?: string;
  /** Display name from Farcaster profile */
  display_name?: string;
  /** User's profile image URL from Farcaster */
  pfp_url?: string;
  /** User's Ethereum wallet address */
  wallet_address?: string;
  /** Whether user has tip allowance enabled (affects participation requirements) */
  tip_allowance_enabled: boolean;
  /** Whether user is following the Like2Win account */
  is_following_like2win: boolean;
  /** Total number of tickets earned across all raffles */
  total_lifetime_tickets: number;
  /** User's custody address for receiving prizes */
  custody_address?: string;
  /** Whether the user account is active */
  is_active: boolean;
}

/**
 * Raffle entity representing individual raffle periods
 * Raffles run on a bi-weekly schedule with specific start and end times
 */
export interface Raffle extends BaseEntity {
  /** Human-readable name for the raffle period */
  name: string;
  /** Detailed description of the raffle */
  description?: string;
  /** When the raffle period starts */
  start_date: Date;
  /** When the raffle period ends */
  end_date: Date;
  /** Current status of the raffle */
  status: RaffleStatus;
  /** Total prize pool amount in DEGEN tokens */
  prize_pool: number;
  /** Currency of the prize pool (e.g., 'DEGEN') */
  prize_currency: string;
  /** Total number of tickets distributed in this raffle */
  total_tickets: number;
  /** Total number of unique participants */
  total_participants: number;
  /** Whether winners have been selected */
  winners_selected: boolean;
  /** Timestamp when winners were selected */
  winner_selection_date?: Date;
}

/**
 * Possible states of a raffle
 */
export type RaffleStatus = 'upcoming' | 'active' | 'ended' | 'completed';

/**
 * Post entity representing Farcaster posts eligible for raffle participation
 * Only official Like2Win posts are eligible for earning raffle tickets
 */
export interface Post extends BaseEntity {
  /** Farcaster cast hash - unique identifier for the post */
  cast_hash: string;
  /** Farcaster ID of the post author */
  author_fid: number;
  /** Text content of the post */
  content: string;
  /** URL of the post on Farcaster */
  post_url?: string;
  /** Type of engagement required for this post */
  required_engagement: EngagementType;
  /** Number of tickets awarded for participating in this post */
  tickets_per_participation: number;
  /** Whether this post is currently active for participation */
  is_active: boolean;
  /** Associated raffle ID */
  raffle_id: string;
}

/**
 * Types of engagement required for raffle participation
 */
export type EngagementType = 'like' | 'like_comment' | 'like_comment_recast';

/**
 * RaffleEntry entity tracking user participation in specific raffles
 * One entry per user per raffle, aggregating all their tickets
 */
export interface RaffleEntry extends BaseEntity {
  /** Reference to the user */
  user_id: string;
  /** Reference to the raffle */
  raffle_id: string;
  /** Total tickets earned by this user in this raffle */
  tickets: number;
  /** Timestamp of first participation in this raffle */
  first_participation_date: Date;
  /** Timestamp of last participation in this raffle */
  last_participation_date: Date;
  /** Whether this user won this raffle */
  is_winner: boolean;
  /** Amount won if this user is a winner */
  prize_amount?: number;
}

/**
 * PostParticipation entity tracking individual post engagements
 * Records each time a user participates in a specific post
 */
export interface PostParticipation extends BaseEntity {
  /** Reference to the user who participated */
  user_id: string;
  /** Reference to the post that was engaged with */
  post_id: string;
  /** Type of engagement performed */
  engagement_type: EngagementType;
  /** Number of tickets earned from this participation */
  tickets_earned: number;
  /** Detailed engagement data */
  engagement_data: EngagementData;
  /** Reference to the associated raffle */
  raffle_id: string;
}

/**
 * Detailed data about user engagement with a post
 */
export interface EngagementData {
  /** Whether the user liked the post */
  has_liked: boolean;
  /** Whether the user commented on the post */
  has_commented: boolean;
  /** Whether the user recasted the post */
  has_recasted: boolean;
  /** Timestamp when the like was performed */
  like_timestamp?: Date;
  /** Timestamp when the comment was made */
  comment_timestamp?: Date;
  /** Timestamp when the recast was performed */
  recast_timestamp?: Date;
  /** Hash of the user's comment (if applicable) */
  comment_hash?: string;
  /** Hash of the user's recast (if applicable) */
  recast_hash?: string;
}

/**
 * Winner entity representing raffle winners
 * Stores the final results of each raffle period
 */
export interface Winner extends BaseEntity {
  /** Reference to the winning user */
  user_id: string;
  /** Reference to the raffle they won */
  raffle_id: string;
  /** Position/rank of the winner (1st, 2nd, etc.) */
  position: number;
  /** Amount won by this winner */
  prize_amount: number;
  /** Currency of the prize */
  prize_currency: string;
  /** Whether the prize has been distributed */
  is_distributed: boolean;
  /** Timestamp when the prize was distributed */
  distribution_date?: Date;
  /** Transaction hash of the prize distribution */
  distribution_tx_hash?: string;
}

/**
 * Database query result wrapper
 * Provides type safety for database query responses
 */
export interface QueryResult<T = any> {
  /** Array of rows returned by the query */
  rows: T[];
  /** Number of rows affected by the query */
  rowCount: number;
  /** Command executed (SELECT, INSERT, UPDATE, DELETE) */
  command: string;
}

/**
 * Database connection configuration
 */
export interface DatabaseConfig {
  /** Database host */
  host: string;
  /** Database port */
  port: number;
  /** Database name */
  database: string;
  /** Database user */
  user: string;
  /** Database password */
  password: string;
  /** SSL configuration */
  ssl?: boolean | object;
  /** Connection timeout in milliseconds */
  connectionTimeoutMillis?: number;
  /** Maximum number of connections in pool */
  max?: number;
}

/**
 * User raffle status - comprehensive view of user's current raffle participation
 * Returned by the get_user_raffle_status database function
 */
export interface UserRaffleStatus {
  /** User's Farcaster ID */
  fid: number;
  /** User's display name */
  display_name?: string;
  /** User's username */
  username?: string;
  /** User's profile picture URL */
  pfp_url?: string;
  /** Whether user has tip allowance enabled */
  tip_allowance_enabled: boolean;
  /** Whether user is following Like2Win */
  is_following: boolean;
  /** Current tickets in active raffle */
  current_tickets: number;
  /** Total lifetime tickets across all raffles */
  total_lifetime_tickets: number;
  /** Current raffle ID */
  current_raffle_id?: string;
  /** Current raffle name */
  current_raffle_name?: string;
  /** Current raffle status */
  current_raffle_status?: RaffleStatus;
  /** Current raffle end date */
  current_raffle_end_date?: Date;
  /** Current raffle prize pool */
  current_raffle_prize_pool?: number;
  /** Total participants in current raffle */
  current_raffle_participants?: number;
  /** Total tickets in current raffle */
  current_raffle_total_tickets?: number;
  /** User's win probability as percentage */
  win_probability?: number;
  /** User's rank in current raffle */
  current_rank?: number;
}

/**
 * Leaderboard entry for displaying top participants
 */
export interface LeaderboardEntry {
  /** User's rank in the leaderboard */
  rank: number;
  /** User's Farcaster ID */
  fid: number;
  /** User's display name */
  display_name?: string;
  /** User's username */
  username?: string;
  /** User's profile picture URL */
  pfp_url?: string;
  /** Number of tickets earned */
  tickets: number;
  /** Win probability as percentage */
  win_probability: number;
}

/**
 * API response wrapper for consistent response format
 */
export interface ApiResponse<T = any> {
  /** Whether the operation was successful */
  success: boolean;
  /** Response data (present on success) */
  data?: T;
  /** Error message (present on failure) */
  error?: string;
  /** Additional error details */
  message?: string;
  /** Metadata about the response */
  metadata?: {
    /** Total count for paginated responses */
    total?: number;
    /** Current page for paginated responses */
    page?: number;
    /** Items per page for paginated responses */
    limit?: number;
  };
}

/**
 * Pagination parameters for list queries
 */
export interface PaginationParams {
  /** Page number (1-based) */
  page?: number;
  /** Number of items per page */
  limit?: number;
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filter parameters for user queries
 */
export interface UserFilters {
  /** Filter by following status */
  isFollowing?: boolean;
  /** Filter by tip allowance status */
  hasTipAllowance?: boolean;
  /** Filter by active status */
  isActive?: boolean;
  /** Filter by minimum lifetime tickets */
  minLifetimeTickets?: number;
}

/**
 * Filter parameters for raffle queries
 */
export interface RaffleFilters {
  /** Filter by raffle status */
  status?: RaffleStatus;
  /** Filter by start date (after) */
  startDateAfter?: Date;
  /** Filter by end date (before) */
  endDateBefore?: Date;
}

/**
 * Statistics for the current raffle period
 */
export interface RaffleStats {
  /** Total number of active participants */
  totalParticipants: number;
  /** Total tickets distributed */
  totalTickets: number;
  /** Total prize pool */
  prizePool: number;
  /** Prize currency */
  prizeCurrency: string;
  /** Number of eligible posts */
  eligiblePosts: number;
  /** Average tickets per participant */
  avgTicketsPerParticipant: number;
  /** Time until raffle ends */
  timeUntilEnd?: string;
}

/**
 * Application-wide statistics
 */
export interface AppStats {
  /** Total number of registered users */
  totalUsers: number;
  /** Total raffles completed */
  totalRaffles: number;
  /** Total tickets distributed all-time */
  totalTicketsDistributed: number;
  /** Total prize pool distributed */
  totalPrizesDistributed: number;
  /** Number of active participants this period */
  activeParticipants: number;
}