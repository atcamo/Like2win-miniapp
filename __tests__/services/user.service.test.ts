/**
 * Unit Tests for User Service
 * 
 * Tests all critical user service functionality including
 * user creation, updates, validation, and error handling.
 */

import { UserService } from '@/lib/services/user.service';
import { query } from '@/lib/database/connection';
import { User } from '@/lib/database/types';

// Mock the database connection
jest.mock('@/lib/database/connection');
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const validUserData = {
      fid: 12345,
      username: 'testuser',
      display_name: 'Test User',
      tip_allowance_enabled: false,
    };

    it('should create a new user successfully', async () => {
      const mockUser: User = {
        id: 'user-123',
        fid: 12345,
        username: 'testuser',
        display_name: 'Test User',
        tip_allowance_enabled: false,
        is_following_like2win: false,
        total_lifetime_tickets: 0,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock getUserByFid to return user not found
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT' })
        // Mock user creation
        .mockResolvedValueOnce({ rows: [mockUser], rowCount: 1, command: 'INSERT' });

      const result = await UserService.createUser(validUserData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should fail when user already exists', async () => {
      const existingUser: User = {
        id: 'user-123',
        fid: 12345,
        username: 'testuser',
        display_name: 'Test User',
        tip_allowance_enabled: false,
        is_following_like2win: false,
        total_lifetime_tickets: 0,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock getUserByFid to return existing user
      mockQuery.mockResolvedValueOnce({
        rows: [existingUser],
        rowCount: 1,
        command: 'SELECT',
      });

      const result = await UserService.createUser(validUserData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User already exists');
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should handle validation errors', async () => {
      const invalidUserData = {
        fid: -1, // Invalid FID
        username: 'test user with spaces', // Invalid username
      };

      const result = await UserService.createUser(invalidUserData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal server error');
    });

    it('should handle database errors', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT' })
        .mockRejectedValueOnce(new Error('Database connection failed'));

      const result = await UserService.createUser(validUserData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal server error');
    });
  });

  describe('getUserByFid', () => {
    it('should return user when found', async () => {
      const mockUser: User = {
        id: 'user-123',
        fid: 12345,
        username: 'testuser',
        display_name: 'Test User',
        tip_allowance_enabled: false,
        is_following_like2win: true,
        total_lifetime_tickets: 5,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1,
        command: 'SELECT',
      });

      const result = await UserService.getUserByFid(12345);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE fid = $1',
        [12345]
      );
    });

    it('should return error when user not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
      });

      const result = await UserService.getUserByFid(99999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('updateFollowingStatus', () => {
    it('should update following status successfully', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: 'UPDATE',
      });

      const result = await UserService.updateFollowingStatus(12345, true);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ fid: 12345, isFollowing: true });
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        [12345, true]
      );
    });

    it('should fail when user not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'UPDATE',
      });

      const result = await UserService.updateFollowingStatus(99999, true);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const mockStats = {
        total_tickets: '15',
        total_participations: '8',
        raffles_won: '2',
        current_rank: '5',
        win_rate: '25.0',
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockStats],
        rowCount: 1,
        command: 'SELECT',
      });

      const result = await UserService.getUserStats(12345);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        totalTickets: 15,
        totalParticipations: 8,
        rafflesWon: 2,
        currentRank: 5,
        winRate: 25.0,
      });
    });
  });
});