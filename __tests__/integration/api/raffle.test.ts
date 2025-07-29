/**
 * Integration Tests for Raffle API Endpoints
 * 
 * Tests the complete API flow including database interactions,
 * validation, error handling, and response formatting.
 */

import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import { testDb, seedTestData, cleanupTestData } from '../helpers/test-db';

// Import API handlers
import { GET as getUserByFid } from '@/app/api/users/fid/[fid]/route';
import { GET as getRaffleStatus, POST as participateInRaffle } from '@/app/api/raffle/participate/route';
import { GET as getLeaderboard } from '@/app/api/raffle/leaderboard/route';

describe('Raffle API Integration Tests', () => {
  beforeAll(async () => {
    await testDb.connect();
  });

  beforeEach(async () => {
    await cleanupTestData();
    await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await testDb.disconnect();
  });

  describe('GET /api/users/fid/[fid]', () => {
    it('should return user data for existing user', async () => {
      const { req } = createMocks<NextRequest>({
        method: 'GET',
        url: '/api/users/fid/12345',
      });

      // Add the fid parameter that would be provided by Next.js routing
      const params = { fid: '12345' };
      
      const response = await getUserByFid(req, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.fid).toBe(12345);
      expect(data.data.username).toBeDefined();
    });

    it('should return 404 for non-existent user', async () => {
      const { req } = createMocks<NextRequest>({
        method: 'GET',
        url: '/api/users/fid/99999',
      });

      const params = { fid: '99999' };
      
      const response = await getUserByFid(req, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User not found');
    });

    it('should return 400 for invalid FID', async () => {
      const { req } = createMocks<NextRequest>({
        method: 'GET',
        url: '/api/users/fid/invalid',
      });

      const params = { fid: 'invalid' };
      
      const response = await getUserByFid(req, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('validation');
    });
  });

  describe('GET /api/raffle/status', () => {
    it('should return raffle status for valid user', async () => {
      const { req } = createMocks<NextRequest>({
        method: 'GET',
        url: '/api/raffle/status?fid=12345',
      });

      const response = await getRaffleStatus(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('fid');
      expect(data.data).toHaveProperty('current_tickets');
      expect(data.data).toHaveProperty('is_following');
      expect(data.data).toHaveProperty('current_raffle_status');
    });

    it('should return general raffle info when no FID provided', async () => {
      const { req } = createMocks<NextRequest>({
        method: 'GET',
        url: '/api/raffle/status',
      });

      const response = await getRaffleStatus(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('current_raffle_status');
      expect(data.data).toHaveProperty('current_raffle_prize_pool');
    });
  });

  describe('POST /api/raffle/participate', () => {
    const validParticipationData = {
      user_fid: 12345,
      post_cast_hash: '0x1234567890abcdef1234567890abcdef12345678',
      engagement_type: 'like_comment_recast',
      engagement_data: {
        has_liked: true,
        has_commented: true,
        has_recasted: true,
        like_timestamp: new Date().toISOString(),
        comment_timestamp: new Date().toISOString(),
        recast_timestamp: new Date().toISOString(),
      },
    };

    it('should allow valid participation', async () => {
      const { req } = createMocks<NextRequest>({
        method: 'POST',
        url: '/api/raffle/participate',
        headers: {
          'content-type': 'application/json',
        },
        body: validParticipationData,
      });

      // Mock request.json() to return our data
      (req as any).json = jest.fn().mockResolvedValue(validParticipationData);

      const response = await participateInRaffle(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.success).toBe(true);
      expect(data.data.tickets_earned).toBeGreaterThan(0);
    });

    it('should reject participation without following', async () => {
      const invalidData = {
        ...validParticipationData,
        user_fid: 54321, // User who is not following
      };

      const { req } = createMocks<NextRequest>({
        method: 'POST',
        url: '/api/raffle/participate',
        headers: {
          'content-type': 'application/json',
        },
        body: invalidData,
      });

      (req as any).json = jest.fn().mockResolvedValue(invalidData);

      const response = await participateInRaffle(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.success).toBe(false);
      expect(data.data.error).toContain('follow');
    });

    it('should reject duplicate participation', async () => {
      // First participation
      const { req: req1 } = createMocks<NextRequest>({
        method: 'POST',
        url: '/api/raffle/participate',
        headers: {
          'content-type': 'application/json',
        },
        body: validParticipationData,
      });

      (req1 as any).json = jest.fn().mockResolvedValue(validParticipationData);
      await participateInRaffle(req1);

      // Second participation (should fail)
      const { req: req2 } = createMocks<NextRequest>({
        method: 'POST',
        url: '/api/raffle/participate',
        headers: {
          'content-type': 'application/json',
        },
        body: validParticipationData,
      });

      (req2 as any).json = jest.fn().mockResolvedValue(validParticipationData);

      const response = await participateInRaffle(req2);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.success).toBe(false);
      expect(data.data.error).toContain('already participated');
    });

    it('should reject insufficient engagement', async () => {
      const insufficientData = {
        ...validParticipationData,
        engagement_data: {
          has_liked: true,
          has_commented: false, // Missing required engagement
          has_recasted: false,
        },
      };

      const { req } = createMocks<NextRequest>({
        method: 'POST',
        url: '/api/raffle/participate',
        headers: {
          'content-type': 'application/json',
        },
        body: insufficientData,
      });

      (req as any).json = jest.fn().mockResolvedValue(insufficientData);

      const response = await participateInRaffle(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.success).toBe(false);
      expect(data.data.error).toContain('engagement');
    });

    it('should validate request body schema', async () => {
      const invalidData = {
        user_fid: 'invalid', // Should be number
        post_cast_hash: 'invalid', // Invalid format
      };

      const { req } = createMocks<NextRequest>({
        method: 'POST',
        url: '/api/raffle/participate',
        headers: {
          'content-type': 'application/json',
        },
        body: invalidData,
      });

      (req as any).json = jest.fn().mockResolvedValue(invalidData);

      const response = await participateInRaffle(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('validation');
    });
  });

  describe('GET /api/raffle/leaderboard', () => {
    it('should return leaderboard data', async () => {
      const { req } = createMocks<NextRequest>({
        method: 'GET',
        url: '/api/raffle/leaderboard',
      });

      const response = await getLeaderboard(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      if (data.data.length > 0) {
        expect(data.data[0]).toHaveProperty('rank');
        expect(data.data[0]).toHaveProperty('fid');
        expect(data.data[0]).toHaveProperty('tickets');
        expect(data.data[0]).toHaveProperty('win_probability');
      }
    });

    it('should respect limit parameter', async () => {
      const { req } = createMocks<NextRequest>({
        method: 'GET',
        url: '/api/raffle/leaderboard?limit=5',
      });

      const response = await getLeaderboard(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.length).toBeLessThanOrEqual(5);
    });

    it('should handle invalid limit parameter', async () => {
      const { req } = createMocks<NextRequest>({
        method: 'GET',
        url: '/api/raffle/leaderboard?limit=invalid',
      });

      const response = await getLeaderboard(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Temporarily break database connection
      await testDb.disconnect();

      const { req } = createMocks<NextRequest>({
        method: 'GET',
        url: '/api/raffle/status?fid=12345',
      });

      const response = await getRaffleStatus(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');

      // Reconnect for cleanup
      await testDb.connect();
    });

    it('should handle malformed JSON in POST requests', async () => {
      const { req } = createMocks<NextRequest>({
        method: 'POST',
        url: '/api/raffle/participate',
        headers: {
          'content-type': 'application/json',
        },
      });

      // Mock malformed JSON
      (req as any).json = jest.fn().mockRejectedValue(new Error('Invalid JSON'));

      const response = await participateInRaffle(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should implement rate limiting for participation endpoint', async () => {
      const participationData = {
        ...validParticipationData,
        post_cast_hash: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', // Different post
      };

      // Make multiple rapid requests
      const requests = Array.from({ length: 10 }, () => {
        const { req } = createMocks<NextRequest>({
          method: 'POST',
          url: '/api/raffle/participate',
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': '192.168.1.1', // Same IP
          },
          body: participationData,
        });

        (req as any).json = jest.fn().mockResolvedValue(participationData);
        return participateInRaffle(req);
      });

      const responses = await Promise.all(requests);
      
      // At least some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});