/**
 * Raffle Service
 * 
 * This service handles all raffle-related business logic including
 * raffle management, participation tracking, and winner selection.
 * 
 * @module Services/Raffle
 * @version 1.0.0
 */

import { query, withTransaction } from '@/lib/database/connection';
import { 
  Raffle, 
  RaffleEntry, 
  LeaderboardEntry,
  RaffleStats,
  ApiResponse, 
  PaginationParams, 
  RaffleFilters,
  RaffleStatus,
} from '@/lib/database/types';
import { RaffleSchemas, validateAndParse } from '@/lib/validation/schemas';

/**
 * Raffle service class containing all raffle-related business logic
 */
export class RaffleService {
  /**
   * Creates a new raffle
   * 
   * @param raffleData - Raffle data to create
   * @returns Promise resolving to created raffle
   */
  static async createRaffle(raffleData: any): Promise<ApiResponse<Raffle>> {
    try {
      // Validate input data
      const validatedData = validateAndParse(RaffleSchemas.create, raffleData);

      // Ensure no overlapping active raffles
      const overlappingRaffle = await query(
        `SELECT id FROM raffles 
         WHERE status IN ('active', 'upcoming') 
         AND (
           (start_date <= $1 AND end_date >= $1) OR
           (start_date <= $2 AND end_date >= $2) OR
           (start_date >= $1 AND end_date <= $2)
         )`,
        [validatedData.start_date, validatedData.end_date]
      );

      if (overlappingRaffle.rows.length > 0) {
        return {
          success: false,
          error: 'Overlapping raffle exists',
          message: 'Cannot create raffle with overlapping dates',
        };
      }

      // Create raffle
      const result = await query<Raffle>(
        `INSERT INTO raffles (
          name, description, start_date, end_date, 
          prize_pool, prize_currency
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          validatedData.name,
          validatedData.description,
          validatedData.start_date,
          validatedData.end_date,
          validatedData.prize_pool,
          validatedData.prize_currency,
        ]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Failed to create raffle',
          message: 'Raffle creation failed due to database error',
        };
      }

      return {
        success: true,
        data: result.rows[0],
      };

    } catch (error) {
      console.error('RaffleService.createRaffle error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Updates an existing raffle
   * 
   * @param raffleId - Raffle ID to update
   * @param updateData - Data to update
   * @returns Promise resolving to updated raffle
   */
  static async updateRaffle(raffleId: string, updateData: any): Promise<ApiResponse<Raffle>> {
    try {
      // Validate input data
      const validatedData = validateAndParse(RaffleSchemas.update, updateData);

      // Check if raffle exists
      const existingRaffle = await this.getRaffleById(raffleId);
      if (!existingRaffle.success || !existingRaffle.data) {
        return {
          success: false,
          error: 'Raffle not found',
          message: `Raffle with ID ${raffleId} not found`,
        };
      }

      // Build dynamic update query
      const updateFields = Object.keys(validatedData).filter(
        key => (validatedData as Record<string, any>)[key] !== undefined
      );

      if (updateFields.length === 0) {
        return {
          success: true,
          data: existingRaffle.data,
        };
      }

      const setClause = updateFields
        .map((field, index) => `${field} = $${index + 2}`)
        .join(', ');

      const values = [raffleId, ...updateFields.map(field => (validatedData as Record<string, any>)[field])];

      const result = await query<Raffle>(
        `UPDATE raffles 
         SET ${setClause}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Update failed',
          message: 'Raffle update failed due to database error',
        };
      }

      return {
        success: true,
        data: result.rows[0],
      };

    } catch (error) {
      console.error('RaffleService.updateRaffle error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Retrieves a raffle by ID
   * 
   * @param raffleId - Raffle ID
   * @returns Promise resolving to raffle data
   */
  static async getRaffleById(raffleId: string): Promise<ApiResponse<Raffle>> {
    try {
      const result = await query<Raffle>(
        'SELECT * FROM raffles WHERE id = $1',
        [raffleId]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Raffle not found',
          message: `Raffle with ID ${raffleId} not found`,
        };
      }

      return {
        success: true,
        data: result.rows[0],
      };

    } catch (error) {
      console.error('RaffleService.getRaffleById error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Gets the current active raffle
   * 
   * @returns Promise resolving to current raffle
   */
  static async getCurrentRaffle(): Promise<ApiResponse<Raffle>> {
    try {
      const result = await query<Raffle>(
        'SELECT * FROM current_raffle LIMIT 1'
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'No active raffle',
          message: 'No active raffle found',
        };
      }

      return {
        success: true,
        data: result.rows[0],
      };

    } catch (error) {
      console.error('RaffleService.getCurrentRaffle error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Lists raffles with filtering and pagination
   * 
   * @param filters - Filter criteria
   * @param pagination - Pagination parameters
   * @returns Promise resolving to paginated raffle list
   */
  static async listRaffles(
    filters: RaffleFilters = {},
    pagination: PaginationParams = {}
  ): Promise<ApiResponse<Raffle[]>> {
    try {
      const { page = 1, limit = 20, sortBy = 'start_date', sortOrder = 'desc' } = pagination;
      const offset = (page - 1) * limit;

      // Build WHERE clause
      const whereConditions: string[] = ['1=1'];
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (filters.status) {
        whereConditions.push(`status = $${paramIndex}`);
        queryParams.push(filters.status);
        paramIndex++;
      }

      if (filters.startDateAfter) {
        whereConditions.push(`start_date >= $${paramIndex}`);
        queryParams.push(filters.startDateAfter);
        paramIndex++;
      }

      if (filters.endDateBefore) {
        whereConditions.push(`end_date <= $${paramIndex}`);
        queryParams.push(filters.endDateBefore);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countResult = await query<{ count: number }>(
        `SELECT COUNT(*) as count FROM raffles WHERE ${whereClause}`,
        queryParams
      );

      const total = countResult.rows[0]?.count || 0;

      // Get paginated results
      const result = await query<Raffle>(
        `SELECT * FROM raffles 
         WHERE ${whereClause}
         ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...queryParams, limit, offset]
      );

      return {
        success: true,
        data: result.rows,
        metadata: {
          total,
          page,
          limit,
        },
      };

    } catch (error) {
      console.error('RaffleService.listRaffles error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Gets leaderboard for current raffle
   * 
   * @param limit - Number of entries to return
   * @returns Promise resolving to leaderboard
   */
  static async getLeaderboard(limit: number = 10): Promise<ApiResponse<LeaderboardEntry[]>> {
    try {
      const result = await query<LeaderboardEntry>(
        `SELECT 
          ROW_NUMBER() OVER (ORDER BY re.tickets DESC) as rank,
          u.fid,
          u.username,
          u.display_name,
          u.pfp_url,
          re.tickets,
          CASE 
            WHEN r.total_tickets > 0 
            THEN (re.tickets::float / r.total_tickets * 100)
            ELSE 0 
          END as win_probability
        FROM raffle_entries re
        JOIN users u ON re.user_id = u.id
        JOIN raffles r ON re.raffle_id = r.id
        WHERE r.status = 'active'
        ORDER BY re.tickets DESC
        LIMIT $1`,
        [limit]
      );

      return {
        success: true,
        data: result.rows,
      };

    } catch (error) {
      console.error('RaffleService.getLeaderboard error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Gets statistics for current raffle
   * 
   * @returns Promise resolving to raffle statistics
   */
  static async getCurrentRaffleStats(): Promise<ApiResponse<RaffleStats>> {
    try {
      const result = await query(
        `SELECT 
          COALESCE(r.total_participants, 0) as total_participants,
          COALESCE(r.total_tickets, 0) as total_tickets,
          COALESCE(r.prize_pool, 0) as prize_pool,
          COALESCE(r.prize_currency, 'DEGEN') as prize_currency,
          COALESCE(post_count.count, 0) as eligible_posts,
          CASE 
            WHEN r.total_participants > 0 
            THEN (r.total_tickets::float / r.total_participants)
            ELSE 0 
          END as avg_tickets_per_participant,
          CASE 
            WHEN r.end_date > CURRENT_TIMESTAMP 
            THEN EXTRACT(EPOCH FROM (r.end_date - CURRENT_TIMESTAMP))::int
            ELSE 0 
          END as seconds_until_end
        FROM current_raffle r
        LEFT JOIN (
          SELECT raffle_id, COUNT(*) as count 
          FROM posts 
          WHERE is_active = true 
          GROUP BY raffle_id
        ) post_count ON r.id = post_count.raffle_id`
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'No active raffle',
          message: 'No active raffle found for statistics',
        };
      }

      const stats = result.rows[0];
      
      // Calculate time until end
      let timeUntilEnd: string | undefined;
      if (stats.seconds_until_end > 0) {
        const days = Math.floor(stats.seconds_until_end / (24 * 60 * 60));
        const hours = Math.floor((stats.seconds_until_end % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((stats.seconds_until_end % (60 * 60)) / 60);
        
        if (days > 0) {
          timeUntilEnd = `${days}d ${hours}h`;
        } else if (hours > 0) {
          timeUntilEnd = `${hours}h ${minutes}m`;
        } else {
          timeUntilEnd = `${minutes}m`;
        }
      }

      return {
        success: true,
        data: {
          totalParticipants: parseInt(stats.total_participants) || 0,
          totalTickets: parseInt(stats.total_tickets) || 0,
          prizePool: parseFloat(stats.prize_pool) || 0,
          prizeCurrency: stats.prize_currency || 'DEGEN',
          eligiblePosts: parseInt(stats.eligible_posts) || 0,
          avgTicketsPerParticipant: parseFloat(stats.avg_tickets_per_participant) || 0,
          timeUntilEnd,
        },
      };

    } catch (error) {
      console.error('RaffleService.getCurrentRaffleStats error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Updates raffle status based on current time
   * 
   * @returns Promise resolving to number of updated raffles
   */
  static async updateRaffleStatuses(): Promise<ApiResponse<{ updated: number }>> {
    try {
      const result = await withTransaction(async (client) => {
        // Start upcoming raffles
        const startedResult = await client.query(
          `UPDATE raffles 
           SET status = 'active', updated_at = CURRENT_TIMESTAMP
           WHERE status = 'upcoming' AND start_date <= CURRENT_TIMESTAMP`
        );

        // End active raffles
        const endedResult = await client.query(
          `UPDATE raffles 
           SET status = 'ended', updated_at = CURRENT_TIMESTAMP
           WHERE status = 'active' AND end_date <= CURRENT_TIMESTAMP`
        );

        const totalUpdated = (startedResult.rowCount || 0) + (endedResult.rowCount || 0);

        return {
          success: true,
          data: { updated: totalUpdated },
        };
      });

      return result;

    } catch (error) {
      console.error('RaffleService.updateRaffleStatuses error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Gets user's position in current raffle
   * 
   * @param fid - User's Farcaster ID
   * @returns Promise resolving to user's rank
   */
  static async getUserRank(fid: number): Promise<ApiResponse<{ rank: number; totalParticipants: number }>> {
    try {
      const result = await query(
        `SELECT 
          RANK() OVER (ORDER BY re.tickets DESC) as rank,
          (SELECT COUNT(*) FROM raffle_entries re2 
           JOIN raffles r2 ON re2.raffle_id = r2.id 
           WHERE r2.status = 'active') as total_participants
        FROM raffle_entries re
        JOIN raffles r ON re.raffle_id = r.id
        JOIN users u ON re.user_id = u.id
        WHERE r.status = 'active' AND u.fid = $1`,
        [fid]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'User not found in current raffle',
          message: `User ${fid} has not participated in the current raffle`,
        };
      }

      const { rank, total_participants } = result.rows[0];

      return {
        success: true,
        data: {
          rank: parseInt(rank),
          totalParticipants: parseInt(total_participants),
        },
      };

    } catch (error) {
      console.error('RaffleService.getUserRank error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Selects winners for a completed raffle
   * 
   * @param raffleId - Raffle ID
   * @param numWinners - Number of winners to select
   * @returns Promise resolving to selected winners
   */
  static async selectWinners(
    raffleId: string, 
    numWinners: number = 1
  ): Promise<ApiResponse<{ winnerFids: number[]; totalPrize: number }>> {
    try {
      return await withTransaction(async (client) => {
        // Check if raffle exists and is ended
        const raffleResult = await client.query(
          'SELECT * FROM raffles WHERE id = $1 AND status = $2',
          [raffleId, 'ended']
        );

        if (raffleResult.rows.length === 0) {
          throw new Error('Raffle not found or not in ended status');
        }

        const raffle = raffleResult.rows[0];

        // Check if winners already selected
        if (raffle.winners_selected) {
          throw new Error('Winners already selected for this raffle');
        }

        // Get all participants with their ticket weights
        const participantsResult = await client.query(
          `SELECT re.user_id, u.fid, re.tickets
           FROM raffle_entries re
           JOIN users u ON re.user_id = u.id
           WHERE re.raffle_id = $1 AND re.tickets > 0
           ORDER BY RANDOM()`,
          [raffleId]
        );

        if (participantsResult.rows.length === 0) {
          throw new Error('No participants found for this raffle');
        }

        const participants = participantsResult.rows;
        const totalTickets = participants.reduce((sum, p) => sum + p.tickets, 0);
        const winners: number[] = [];

        // Simple weighted random selection
        for (let i = 0; i < Math.min(numWinners, participants.length); i++) {
          const randomWeight = Math.random() * totalTickets;
          let currentWeight = 0;
          
          for (const participant of participants) {
            currentWeight += participant.tickets;
            if (currentWeight >= randomWeight && !winners.includes(participant.fid)) {
              winners.push(participant.fid);
              break;
            }
          }
        }

        // Calculate prize distribution (winner takes all for now)
        const prizePerWinner = raffle.prize_pool / winners.length;

        // Insert winners
        for (let i = 0; i < winners.length; i++) {
          const participant = participants.find(p => p.fid === winners[i]);
          if (participant) {
            await client.query(
              `INSERT INTO winners (user_id, raffle_id, position, prize_amount, prize_currency)
               VALUES ($1, $2, $3, $4, $5)`,
              [participant.user_id, raffleId, i + 1, prizePerWinner, raffle.prize_currency]
            );
          }
        }

        // Mark raffle as completed with winners selected
        await client.query(
          `UPDATE raffles 
           SET status = 'completed', winners_selected = true, 
               winner_selection_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [raffleId]
        );

        return {
          success: true,
          data: {
            winnerFids: winners,
            totalPrize: raffle.prize_pool,
          },
        };
      });

    } catch (error) {
      console.error('RaffleService.selectWinners error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}