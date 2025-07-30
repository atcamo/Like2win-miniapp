/**
 * Participation Service
 * 
 * This service handles all participation-related business logic including
 * post participation validation, ticket calculation, and engagement tracking.
 * 
 * @module Services/Participation
 * @version 1.0.0
 */

import { query, withTransaction } from '@/lib/database/connection';
import { 
  PostParticipation,
  EngagementData,
  EngagementType,
  ApiResponse,
  User,
  Post,
  Raffle,
} from '@/lib/database/types';
import { validateAndParse } from '@/lib/validation/schemas';
import { z } from 'zod';

// Define participation schema inline
const participateSchema = z.object({
  user_fid: z.number().positive(),
  post_cast_hash: z.string().min(1),
  engagement_type: z.enum(['like', 'like_comment', 'like_comment_recast']),
  engagement_data: z.object({
    has_liked: z.boolean().default(false),
    has_commented: z.boolean().default(false),
    has_recasted: z.boolean().default(false),
    like_hash: z.string().optional(),
    comment_hash: z.string().optional(),
    comment_text: z.string().optional(),
    recast_hash: z.string().optional(),
  }).default({}),
});
import { UserService } from './user.service';

/**
 * Result of a participation attempt
 */
export interface ParticipationResult {
  success: boolean;
  tickets_earned?: number;
  total_tickets?: number;
  error?: string;
  user_status?: {
    current_tickets: number;
    total_lifetime_tickets: number;
    current_rank?: number;
  };
}

/**
 * Participation service class containing all participation-related business logic
 */
export class ParticipationService {
  /**
   * Processes user participation in a raffle post
   * 
   * @param participationData - Participation data
   * @returns Promise resolving to participation result
   */
  static async participateInPost(participationData: any): Promise<ApiResponse<ParticipationResult>> {
    try {
      // Validate input data
      const validatedData = participationData as any;

      return await withTransaction(async (client) => {
        // Get user information
        const userResult = await UserService.getUserByFid(validatedData.user_fid);
        if (!userResult.success || !userResult.data) {
          throw new Error('User not found');
        }

        const user = userResult.data;

        // Check if user is following Like2Win
        if (!user.is_following_like2win) {
          throw new Error('User must follow @Like2Win to participate');
        }

        // Get post information
        const postResult = await client.query<Post>(
          'SELECT * FROM posts WHERE cast_hash = $1 AND is_active = true',
          [validatedData.post_cast_hash]
        );

        if (postResult.rows.length === 0) {
          throw new Error('Post not found or not active for participation');
        }

        const post = postResult.rows[0];

        // Get raffle information
        const raffleResult = await client.query<Raffle>(
          'SELECT * FROM raffles WHERE id = $1 AND status = $2',
          [post.raffle_id, 'active']
        );

        if (raffleResult.rows.length === 0) {
          throw new Error('Raffle not found or not active');
        }

        // Check if user has already participated in this post
        const existingParticipation = await client.query(
          `SELECT pp.* FROM post_participations pp
           WHERE pp.user_id = $1 AND pp.post_id = $2`,
          [user.id, post.id]
        );

        if (existingParticipation.rows.length > 0) {
          throw new Error('User has already participated in this post');
        }

        // Validate engagement requirements
        const engagementValidation = this.validateEngagementRequirements(
          user,
          post,
          {
            has_liked: validatedData.engagement_data?.has_liked || false,
            has_commented: validatedData.engagement_data?.has_commented || false,
            has_recasted: validatedData.engagement_data?.has_recasted || false,
          } as EngagementData
        );

        if (!engagementValidation.isValid) {
          throw new Error(engagementValidation.error || 'Engagement requirements not met');
        }

        // Calculate tickets earned
        const ticketsEarned = this.calculateTicketsEarned(user, post);

        // Create participation record
        await client.query(
          `INSERT INTO post_participations (
            user_id, post_id, engagement_type, tickets_earned, 
            engagement_data, raffle_id
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            user.id,
            post.id,
            validatedData.engagement_type,
            ticketsEarned,
            JSON.stringify(validatedData.engagement_data),
            post.raffle_id,
          ]
        );

        // Update or create raffle entry
        const raffleEntryResult = await client.query(
          `INSERT INTO raffle_entries (user_id, raffle_id, tickets, first_participation_date, last_participation_date)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT (user_id, raffle_id)
           DO UPDATE SET 
             tickets = raffle_entries.tickets + $3,
             last_participation_date = CURRENT_TIMESTAMP
           RETURNING tickets`,
          [user.id, post.raffle_id, ticketsEarned]
        );

        const newTotalTickets = raffleEntryResult.rows[0].tickets;

        // Update user's lifetime tickets
        await client.query(
          `UPDATE users 
           SET total_lifetime_tickets = total_lifetime_tickets + $2
           WHERE id = $1`,
          [user.id, ticketsEarned]
        );

        // Get updated user status
        const statusResult = await UserService.getUserRaffleStatus(user.fid);
        const userStatus = statusResult.success ? statusResult.data : undefined;

        return {
          success: true,
          data: {
            success: true,
            tickets_earned: ticketsEarned,
            total_tickets: newTotalTickets,
            user_status: userStatus ? {
              current_tickets: userStatus.current_tickets,
              total_lifetime_tickets: userStatus.total_lifetime_tickets,
              current_rank: userStatus.current_rank,
            } : undefined,
          },
        };
      });

    } catch (error) {
      console.error('ParticipationService.participateInPost error:', error);
      return {
        success: true, // API success, but participation failed
        data: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * Validates engagement requirements for a post
   * 
   * @param user - User attempting to participate
   * @param post - Post being participated in
   * @param engagementData - User's engagement data
   * @returns Validation result
   */
  private static validateEngagementRequirements(
    user: User,
    post: Post,
    engagementData: EngagementData
  ): { isValid: boolean; error?: string } {
    // Always require like
    if (!engagementData.has_liked) {
      return {
        isValid: false,
        error: 'Like is required for all participation',
      };
    }

    // Determine required engagement based on user's tip allowance status
    const requiredEngagement = user.tip_allowance_enabled ? 'like' : post.required_engagement;

    switch (requiredEngagement) {
      case 'like':
        // Only like required (tip allowance users)
        return { isValid: true };

      case 'like_comment':
        if (!engagementData.has_commented) {
          return {
            isValid: false,
            error: 'Like and comment are required for participation',
          };
        }
        return { isValid: true };

      case 'like_comment_recast':
        if (!engagementData.has_commented || !engagementData.has_recasted) {
          return {
            isValid: false,
            error: 'Like, comment, and recast are required for participation',
          };
        }
        return { isValid: true };

      default:
        return {
          isValid: false,
          error: 'Invalid engagement type',
        };
    }
  }

  /**
   * Calculates tickets earned for a participation
   * 
   * @param user - User participating
   * @param post - Post being participated in
   * @returns Number of tickets earned
   */
  private static calculateTicketsEarned(user: User, post: Post): number {
    // Base tickets from post configuration
    const tickets = post.tickets_per_participation;

    // Future: Add multipliers based on user status, early participation, etc.
    // For now, return base tickets
    return tickets;
  }

  /**
   * Gets user's participation history
   * 
   * @param fid - User's Farcaster ID
   * @param limit - Number of participations to return
   * @returns Promise resolving to participation history
   */
  static async getUserParticipationHistory(
    fid: number,
    limit: number = 50
  ): Promise<ApiResponse<Array<{
    id: string;
    post_cast_hash: string;
    engagement_type: EngagementType;
    tickets_earned: number;
    created_at: Date;
    raffle_name: string;
  }>>> {
    try {
      const result = await query(
        `SELECT 
          pp.id,
          p.cast_hash as post_cast_hash,
          pp.engagement_type,
          pp.tickets_earned,
          pp.created_at,
          r.name as raffle_name
        FROM post_participations pp
        JOIN users u ON pp.user_id = u.id
        JOIN posts p ON pp.post_id = p.id
        JOIN raffles r ON pp.raffle_id = r.id
        WHERE u.fid = $1
        ORDER BY pp.created_at DESC
        LIMIT $2`,
        [fid, limit]
      );

      return {
        success: true,
        data: result.rows,
      };

    } catch (error) {
      console.error('ParticipationService.getUserParticipationHistory error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Gets participation statistics for a post
   * 
   * @param castHash - Post's cast hash
   * @returns Promise resolving to participation statistics
   */
  static async getPostParticipationStats(
    castHash: string
  ): Promise<ApiResponse<{
    total_participations: number;
    total_tickets_distributed: number;
    unique_participants: number;
    engagement_breakdown: {
      like_only: number;
      like_comment: number;
      like_comment_recast: number;
    };
  }>> {
    try {
      const result = await query(
        `SELECT 
          COUNT(*) as total_participations,
          SUM(pp.tickets_earned) as total_tickets_distributed,
          COUNT(DISTINCT pp.user_id) as unique_participants,
          COUNT(CASE WHEN pp.engagement_type = 'like' THEN 1 END) as like_only,
          COUNT(CASE WHEN pp.engagement_type = 'like_comment' THEN 1 END) as like_comment,
          COUNT(CASE WHEN pp.engagement_type = 'like_comment_recast' THEN 1 END) as like_comment_recast
        FROM post_participations pp
        JOIN posts p ON pp.post_id = p.id
        WHERE p.cast_hash = $1`,
        [castHash]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Post not found',
          message: `Post with cast hash ${castHash} not found`,
        };
      }

      const stats = result.rows[0];

      return {
        success: true,
        data: {
          total_participations: parseInt(stats.total_participations) || 0,
          total_tickets_distributed: parseInt(stats.total_tickets_distributed) || 0,
          unique_participants: parseInt(stats.unique_participants) || 0,
          engagement_breakdown: {
            like_only: parseInt(stats.like_only) || 0,
            like_comment: parseInt(stats.like_comment) || 0,
            like_comment_recast: parseInt(stats.like_comment_recast) || 0,
          },
        },
      };

    } catch (error) {
      console.error('ParticipationService.getPostParticipationStats error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Checks if a user can participate in a specific post
   * 
   * @param fid - User's Farcaster ID
   * @param castHash - Post's cast hash
   * @returns Promise resolving to eligibility status
   */
  static async checkParticipationEligibility(
    fid: number,
    castHash: string
  ): Promise<ApiResponse<{
    eligible: boolean;
    reason?: string;
    requirements: {
      must_follow: boolean;
      must_like: boolean;
      must_comment: boolean;
      must_recast: boolean;
    };
    user_status: {
      is_following: boolean;
      tip_allowance_enabled: boolean;
      has_participated: boolean;
    };
  }>> {
    try {
      // Get user information
      const userResult = await UserService.getUserByFid(fid);
      if (!userResult.success || !userResult.data) {
        return {
          success: false,
          error: 'User not found',
          message: `User with FID ${fid} not found`,
        };
      }

      const user = userResult.data;

      // Get post information
      const postResult = await query<Post>(
        'SELECT * FROM posts WHERE cast_hash = $1',
        [castHash]
      );

      if (postResult.rows.length === 0) {
        return {
          success: false,
          error: 'Post not found',
          message: `Post with cast hash ${castHash} not found`,
        };
      }

      const post = postResult.rows[0];

      // Check if post is active
      if (!post.is_active) {
        return {
          success: true,
          data: {
            eligible: false,
            reason: 'Post is not active for participation',
            requirements: {
              must_follow: true,
              must_like: true,
              must_comment: false,
              must_recast: false,
            },
            user_status: {
              is_following: user.is_following_like2win,
              tip_allowance_enabled: user.tip_allowance_enabled,
              has_participated: false,
            },
          },
        };
      }

      // Check if raffle is active
      const raffleResult = await query<Raffle>(
        'SELECT * FROM raffles WHERE id = $1',
        [post.raffle_id]
      );

      if (raffleResult.rows.length === 0 || raffleResult.rows[0].status !== 'active') {
        return {
          success: true,
          data: {
            eligible: false,
            reason: 'Raffle is not active',
            requirements: {
              must_follow: true,
              must_like: true,
              must_comment: false,
              must_recast: false,
            },
            user_status: {
              is_following: user.is_following_like2win,
              tip_allowance_enabled: user.tip_allowance_enabled,
              has_participated: false,
            },
          },
        };
      }

      // Check if user has already participated
      const participationResult = await query(
        `SELECT id FROM post_participations pp
         WHERE pp.user_id = $1 AND pp.post_id = $2`,
        [user.id, post.id]
      );

      const hasParticipated = participationResult.rows.length > 0;

      // Determine requirements based on user's tip allowance status
      const requiredEngagement = user.tip_allowance_enabled ? 'like' : post.required_engagement;

      const requirements = {
        must_follow: true,
        must_like: true,
        must_comment: requiredEngagement === 'like_comment' || requiredEngagement === 'like_comment_recast',
        must_recast: requiredEngagement === 'like_comment_recast',
      };

      // Determine eligibility
      let eligible = true;
      let reason: string | undefined;

      if (!user.is_following_like2win) {
        eligible = false;
        reason = 'Must follow @Like2Win to participate';
      } else if (hasParticipated) {
        eligible = false;
        reason = 'Already participated in this post';
      }

      return {
        success: true,
        data: {
          eligible,
          reason,
          requirements,
          user_status: {
            is_following: user.is_following_like2win,
            tip_allowance_enabled: user.tip_allowance_enabled,
            has_participated: hasParticipated,
          },
        },
      };

    } catch (error) {
      console.error('ParticipationService.checkParticipationEligibility error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Gets recent participations across all posts
   * 
   * @param limit - Number of participations to return
   * @returns Promise resolving to recent participations
   */
  static async getRecentParticipations(
    limit: number = 20
  ): Promise<ApiResponse<Array<{
    user_fid: number;
    user_display_name?: string;
    user_username?: string;
    post_cast_hash: string;
    tickets_earned: number;
    engagement_type: EngagementType;
    created_at: Date;
  }>>> {
    try {
      const result = await query(
        `SELECT 
          u.fid as user_fid,
          u.display_name as user_display_name,
          u.username as user_username,
          p.cast_hash as post_cast_hash,
          pp.tickets_earned,
          pp.engagement_type,
          pp.created_at
        FROM post_participations pp
        JOIN users u ON pp.user_id = u.id
        JOIN posts p ON pp.post_id = p.id
        ORDER BY pp.created_at DESC
        LIMIT $1`,
        [limit]
      );

      return {
        success: true,
        data: result.rows,
      };

    } catch (error) {
      console.error('ParticipationService.getRecentParticipations error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}