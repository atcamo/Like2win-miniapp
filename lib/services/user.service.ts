/**
 * User Service
 * 
 * This service handles all user-related business logic including
 * user creation, updates, authentication, and status management.
 * 
 * @module Services/User
 * @version 1.0.0
 */

import { query, withTransaction } from '@/lib/database/connection';
import { 
  User, 
  UserRaffleStatus, 
  ApiResponse, 
  PaginationParams, 
  UserFilters 
} from '@/lib/database/types';
import { UserSchemas, validateAndParse } from '@/lib/validation/schemas';

/**
 * User service class containing all user-related business logic
 */
export class UserService {
  /**
   * Creates a new user in the database
   * 
   * @param userData - User data to create
   * @returns Promise resolving to created user
   * 
   * @example
   * ```typescript
   * const user = await UserService.createUser({
   *   fid: 12345,
   *   username: 'johndoe',
   *   display_name: 'John Doe',
   *   tip_allowance_enabled: false
   * });
   * ```
   */
  static async createUser(userData: any): Promise<ApiResponse<User>> {
    try {
      // Validate input data
      const validatedData = validateAndParse(UserSchemas.create, userData);

      // Check if user already exists
      const existingUser = await this.getUserByFid(validatedData.fid);
      if (existingUser.success && existingUser.data) {
        return {
          success: false,
          error: 'User already exists',
          message: `User with FID ${validatedData.fid} already exists`,
        };
      }

      // Create user
      const result = await query<User>(
        `INSERT INTO users (
          fid, username, display_name, pfp_url, wallet_address,
          tip_allowance_enabled, custody_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          validatedData.fid,
          validatedData.username,
          validatedData.display_name,
          validatedData.pfp_url,
          validatedData.wallet_address,
          validatedData.tip_allowance_enabled,
          validatedData.custody_address,
        ]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Failed to create user',
          message: 'User creation failed due to database error',
        };
      }

      return {
        success: true,
        data: result.rows[0],
      };

    } catch (error) {
      console.error('UserService.createUser error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Updates an existing user
   * 
   * @param fid - User's Farcaster ID
   * @param updateData - Data to update
   * @returns Promise resolving to updated user
   */
  static async updateUser(fid: number, updateData: any): Promise<ApiResponse<User>> {
    try {
      // Validate input data
      const validatedData = validateAndParse(UserSchemas.update, updateData);

      // Check if user exists
      const existingUser = await this.getUserByFid(fid);
      if (!existingUser.success || !existingUser.data) {
        return {
          success: false,
          error: 'User not found',
          message: `User with FID ${fid} not found`,
        };
      }

      // Build dynamic update query
      const updateFields = Object.keys(validatedData).filter(
        key => validatedData[key] !== undefined
      );

      if (updateFields.length === 0) {
        return {
          success: true,
          data: existingUser.data,
        };
      }

      const setClause = updateFields
        .map((field, index) => `${field} = $${index + 2}`)
        .join(', ');

      const values = [fid, ...updateFields.map(field => validatedData[field])];

      const result = await query<User>(
        `UPDATE users 
         SET ${setClause}, updated_at = CURRENT_TIMESTAMP
         WHERE fid = $1
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Update failed',
          message: 'User update failed due to database error',
        };
      }

      return {
        success: true,
        data: result.rows[0],
      };

    } catch (error) {
      console.error('UserService.updateUser error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Retrieves a user by Farcaster ID
   * 
   * @param fid - User's Farcaster ID
   * @returns Promise resolving to user data
   */
  static async getUserByFid(fid: number): Promise<ApiResponse<User>> {
    try {
      const result = await query<User>(
        'SELECT * FROM users WHERE fid = $1',
        [fid]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'User not found',
          message: `User with FID ${fid} not found`,
        };
      }

      return {
        success: true,
        data: result.rows[0],
      };

    } catch (error) {
      console.error('UserService.getUserByFid error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Retrieves a user by wallet address
   * 
   * @param address - User's wallet address
   * @returns Promise resolving to user data
   */
  static async getUserByWalletAddress(address: string): Promise<ApiResponse<User>> {
    try {
      const result = await query<User>(
        'SELECT * FROM users WHERE wallet_address = $1',
        [address.toLowerCase()]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'User not found',
          message: `User with wallet address ${address} not found`,
        };
      }

      return {
        success: true,
        data: result.rows[0],
      };

    } catch (error) {
      console.error('UserService.getUserByWalletAddress error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Gets comprehensive raffle status for a user
   * 
   * @param fid - User's Farcaster ID
   * @returns Promise resolving to user raffle status
   */
  static async getUserRaffleStatus(fid: number): Promise<ApiResponse<UserRaffleStatus>> {
    try {
      const result = await query<UserRaffleStatus>(
        'SELECT * FROM get_user_raffle_status($1)',
        [fid]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'User status not found',
          message: `Raffle status for user ${fid} not found`,
        };
      }

      return {
        success: true,
        data: result.rows[0],
      };

    } catch (error) {
      console.error('UserService.getUserRaffleStatus error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Lists users with filtering and pagination
   * 
   * @param filters - Filter criteria
   * @param pagination - Pagination parameters
   * @returns Promise resolving to paginated user list
   */
  static async listUsers(
    filters: UserFilters = {},
    pagination: PaginationParams = {}
  ): Promise<ApiResponse<User[]>> {
    try {
      const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' } = pagination;
      const offset = (page - 1) * limit;

      // Build WHERE clause
      const whereConditions: string[] = ['1=1'];
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (filters.isFollowing !== undefined) {
        whereConditions.push(`is_following_like2win = $${paramIndex}`);
        queryParams.push(filters.isFollowing);
        paramIndex++;
      }

      if (filters.hasTipAllowance !== undefined) {
        whereConditions.push(`tip_allowance_enabled = $${paramIndex}`);
        queryParams.push(filters.hasTipAllowance);
        paramIndex++;
      }

      if (filters.isActive !== undefined) {
        whereConditions.push(`is_active = $${paramIndex}`);
        queryParams.push(filters.isActive);
        paramIndex++;
      }

      if (filters.minLifetimeTickets !== undefined) {
        whereConditions.push(`total_lifetime_tickets >= $${paramIndex}`);
        queryParams.push(filters.minLifetimeTickets);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countResult = await query<{ count: number }>(
        `SELECT COUNT(*) as count FROM users WHERE ${whereClause}`,
        queryParams
      );

      const total = countResult.rows[0]?.count || 0;

      // Get paginated results
      const result = await query<User>(
        `SELECT * FROM users 
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
      console.error('UserService.listUsers error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Updates user's following status
   * 
   * @param fid - User's Farcaster ID
   * @param isFollowing - Whether user is following
   * @returns Promise resolving to success status
   */
  static async updateFollowingStatus(
    fid: number,
    isFollowing: boolean
  ): Promise<ApiResponse<{ fid: number; isFollowing: boolean }>> {
    try {
      const result = await query(
        `UPDATE users 
         SET is_following_like2win = $2, updated_at = CURRENT_TIMESTAMP
         WHERE fid = $1`,
        [fid, isFollowing]
      );

      if (result.rowCount === 0) {
        return {
          success: false,
          error: 'User not found',
          message: `User with FID ${fid} not found`,
        };
      }

      return {
        success: true,
        data: { fid, isFollowing },
      };

    } catch (error) {
      console.error('UserService.updateFollowingStatus error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Links a wallet address to a user account
   * 
   * @param fid - User's Farcaster ID
   * @param walletAddress - Wallet address to link
   * @returns Promise resolving to updated user
   */
  static async linkWalletAddress(
    fid: number,
    walletAddress: string
  ): Promise<ApiResponse<User>> {
    try {
      return await withTransaction(async (client) => {
        // Check if wallet is already linked to another user
        const existingWalletResult = await client.query(
          'SELECT fid FROM users WHERE wallet_address = $1 AND fid != $2',
          [walletAddress.toLowerCase(), fid]
        );

        if (existingWalletResult.rows.length > 0) {
          throw new Error('Wallet address is already linked to another user');
        }

        // Update user with wallet address
        const result = await client.query(
          `UPDATE users 
           SET wallet_address = $2, updated_at = CURRENT_TIMESTAMP
           WHERE fid = $1
           RETURNING *`,
          [fid, walletAddress.toLowerCase()]
        );

        if (result.rows.length === 0) {
          throw new Error('User not found');
        }

        return {
          success: true,
          data: result.rows[0],
        };
      });

    } catch (error) {
      console.error('UserService.linkWalletAddress error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Deactivates a user account
   * 
   * @param fid - User's Farcaster ID
   * @returns Promise resolving to success status
   */
  static async deactivateUser(fid: number): Promise<ApiResponse<{ fid: number }>> {
    try {
      const result = await query(
        `UPDATE users 
         SET is_active = false, updated_at = CURRENT_TIMESTAMP
         WHERE fid = $1`,
        [fid]
      );

      if (result.rowCount === 0) {
        return {
          success: false,
          error: 'User not found',
          message: `User with FID ${fid} not found`,
        };
      }

      return {
        success: true,
        data: { fid },
      };

    } catch (error) {
      console.error('UserService.deactivateUser error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Gets user statistics
   * 
   * @param fid - User's Farcaster ID
   * @returns Promise resolving to user statistics
   */
  static async getUserStats(fid: number): Promise<ApiResponse<{
    totalTickets: number;
    totalParticipations: number;
    rafflesWon: number;
    currentRank?: number;
    winRate: number;
  }>> {
    try {
      const result = await query(
        `SELECT 
          u.total_lifetime_tickets as total_tickets,
          COUNT(DISTINCT pp.id) as total_participations,
          COUNT(DISTINCT w.id) as raffles_won,
          CASE 
            WHEN re.tickets > 0 THEN 
              (SELECT COUNT(*) FROM raffle_entries re2 
               JOIN raffles r2 ON re2.raffle_id = r2.id 
               WHERE r2.status = 'active' AND re2.tickets > re.tickets) + 1
            ELSE NULL
          END as current_rank,
          CASE 
            WHEN COUNT(DISTINCT re.raffle_id) > 0 
            THEN (COUNT(DISTINCT w.id)::float / COUNT(DISTINCT re.raffle_id) * 100)
            ELSE 0 
          END as win_rate
        FROM users u
        LEFT JOIN post_participations pp ON u.id = pp.user_id
        LEFT JOIN winners w ON u.id = w.user_id
        LEFT JOIN raffle_entries re ON u.id = re.user_id
        LEFT JOIN raffles r ON re.raffle_id = r.id AND r.status = 'active'
        WHERE u.fid = $1
        GROUP BY u.id, u.total_lifetime_tickets, re.tickets`,
        [fid]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'User not found',
          message: `User with FID ${fid} not found`,
        };
      }

      const stats = result.rows[0];

      return {
        success: true,
        data: {
          totalTickets: parseInt(stats.total_tickets) || 0,
          totalParticipations: parseInt(stats.total_participations) || 0,
          rafflesWon: parseInt(stats.raffles_won) || 0,
          currentRank: stats.current_rank ? parseInt(stats.current_rank) : undefined,
          winRate: parseFloat(stats.win_rate) || 0,
        },
      };

    } catch (error) {
      console.error('UserService.getUserStats error:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}