/**
 * Database models and types for Like2Win
 * TypeScript interfaces matching the PostgreSQL schema
 */

// Core database models
export interface User {
  id: string;
  fid: number;
  username?: string;
  display_name?: string;
  pfp_url?: string;
  wallet_address?: string;
  tip_allowance_enabled: boolean;
  is_following_like2win: boolean;
  total_lifetime_tickets: number;
  total_winnings: string; // DECIMAL as string
  created_at: Date;
  updated_at: Date;
}

export interface Raffle {
  id: string;
  start_date: Date;
  end_date: Date;
  status: 'upcoming' | 'active' | 'drawing' | 'completed' | 'cancelled';
  prize_pool: string; // DECIMAL as string
  total_tickets: number;
  total_participants: number;
  chainlink_vrf_request_id?: string;
  random_words?: string;
  created_at: Date;
  updated_at: Date;
}

export interface RaffleEntry {
  id: string;
  user_id: string;
  raffle_id: string;
  tickets: number;
  last_participation_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Post {
  id: string;
  cast_hash: string;
  cast_url?: string;
  text_content?: string;
  author_fid: number;
  raffle_id?: string;
  is_eligible: boolean;
  engagement_type: 'like' | 'like_comment_recast';
  created_at: Date;
  updated_at: Date;
}

export interface PostParticipation {
  id: string;
  user_id: string;
  post_id: string;
  engagement_type: 'like' | 'comment' | 'recast' | 'like_comment_recast';
  has_liked: boolean;
  has_commented: boolean;
  has_recasted: boolean;
  tickets_earned: number;
  engagement_completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface RaffleWinner {
  id: string;
  raffle_id: string;
  user_id: string;
  position: 1 | 2 | 3;
  prize_amount: string; // DECIMAL as string
  transaction_hash?: string;
  claimed_at?: Date;
  created_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'raffle_reminder' | 'winner_announcement' | 'prize_claim' | 'system_update';
  title: string;
  message: string;
  is_read: boolean;
  sent_at?: Date;
  created_at: Date;
}

export interface UserSettings {
  id: string;
  user_id: string;
  raffle_reminders: boolean;
  result_announcements: boolean;
  winner_notifications: boolean;
  system_updates: boolean;
  notification_details?: any; // JSONB
  created_at: Date;
  updated_at: Date;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  action: string;
  details?: any; // JSONB
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

// View models (from database views)
export interface UserStats {
  id: string;
  fid: number;
  username?: string;
  display_name?: string;
  pfp_url?: string;
  wallet_address?: string;
  tip_allowance_enabled: boolean;
  is_following_like2win: boolean;
  total_lifetime_tickets: number;
  total_winnings: string;
  raffles_participated: number;
  raffles_won: number;
  current_raffle_tickets: number;
  last_activity: Date;
  created_at: Date;
  updated_at: Date;
}

export interface RaffleLeaderboard {
  fid: number;
  username?: string;
  display_name?: string;
  pfp_url?: string;
  tickets: number;
  raffle_id: string;
  total_lifetime_tickets: number;
  last_participation_at: Date;
}

export interface RecentWinner {
  id: string;
  position: 1 | 2 | 3;
  prize_amount: string;
  transaction_hash?: string;
  claimed_at?: Date;
  created_at: Date;
  fid: number;
  username?: string;
  display_name?: string;
  pfp_url?: string;
  raffle_id: string;
  raffle_end_date: Date;
  raffle_total_pool: string;
}

export interface ActivePost {
  id: string;
  cast_hash: string;
  cast_url?: string;
  text_content?: string;
  author_fid: number;
  engagement_type: 'like' | 'like_comment_recast';
  created_at: Date;
  raffle_id: string;
  raffle_status: string;
  raffle_end_date: Date;
  total_participations: number;
}

// Function result types
export interface UserRaffleStatus {
  user_id: string;
  fid: number;
  username?: string;
  is_following: boolean;
  tip_allowance_enabled: boolean;
  current_tickets: number;
  raffle_id?: string;
  raffle_status?: string;
  raffle_end_date?: Date;
  total_participants?: number;
  total_pool?: string;
}

export interface ParticipationCheck {
  can_participate: boolean;
  reason: string;
  required_actions: string[];
}

export interface RaffleProbability {
  user_id: string;
  fid: number;
  username?: string;
  tickets: number;
  probability_percent: string;
}

export interface RaffleStats {
  raffle_id: string;
  status: string;
  start_date: Date;
  end_date: Date;
  prize_pool: string;
  total_tickets: number;
  total_participants: number;
  avg_tickets_per_user: string;
  top_participant_tickets: number;
  eligible_posts_count: number;
}

// API request/response types
export interface CreateUserRequest {
  fid: number;
  username?: string;
  display_name?: string;
  pfp_url?: string;
  wallet_address?: string;
  tip_allowance_enabled?: boolean;
}

export interface UpdateUserRequest {
  username?: string;
  display_name?: string;
  pfp_url?: string;
  wallet_address?: string;
  tip_allowance_enabled?: boolean;
  is_following_like2win?: boolean;
}

export interface CreatePostRequest {
  cast_hash: string;
  cast_url?: string;
  text_content?: string;
  author_fid: number;
  raffle_id?: string;
  engagement_type?: 'like' | 'like_comment_recast';
}

export interface ParticipateRequest {
  user_fid: number;
  post_cast_hash: string;
  engagement_type: 'like' | 'comment' | 'recast' | 'like_comment_recast';
  engagement_data?: {
    has_liked?: boolean;
    has_commented?: boolean;
    has_recasted?: boolean;
  };
}

export interface CreateRaffleRequest {
  start_date: Date;
  end_date: Date;
  status?: 'upcoming' | 'active';
}

// Utility types
export type DatabaseResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginationParams = {
  page?: number;
  limit?: number;
  offset?: number;
};

export type FilterParams = {
  status?: string;
  fid?: number;
  raffle_id?: string;
  start_date?: Date;
  end_date?: Date;
};

// Constants
export const RAFFLE_STATUS = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  DRAWING: 'drawing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const ENGAGEMENT_TYPE = {
  LIKE: 'like',
  COMMENT: 'comment',
  RECAST: 'recast',
  LIKE_COMMENT_RECAST: 'like_comment_recast',
} as const;

export const NOTIFICATION_TYPE = {
  RAFFLE_REMINDER: 'raffle_reminder',
  WINNER_ANNOUNCEMENT: 'winner_announcement',
  PRIZE_CLAIM: 'prize_claim',
  SYSTEM_UPDATE: 'system_update',
} as const;

export const WINNER_POSITION = {
  FIRST: 1,
  SECOND: 2,
  THIRD: 3,
} as const;

// Default values
export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  offset: 0,
} as const;

export const DEFAULT_USER_SETTINGS = {
  raffle_reminders: true,
  result_announcements: true,
  winner_notifications: true,
  system_updates: true,
} as const;