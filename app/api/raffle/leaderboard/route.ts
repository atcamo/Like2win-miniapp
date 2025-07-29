/**
 * GET /api/raffle/leaderboard - Get current raffle leaderboard
 * Query params: limit (optional), offset (optional), raffle_id (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { RaffleLeaderboard } from '@/lib/database/models';
import { z } from 'zod';

// Validation schema
const leaderboardQuerySchema = z.object({
  limit: z.string().optional().transform(Number).pipe(z.number().min(1).max(100)).default(20),
  offset: z.string().optional().transform(Number).pipe(z.number().min(0)).default(0),
  raffle_id: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestParams = Object.fromEntries(searchParams.entries());
    
    // Validate query parameters
    const validation = leaderboardQuerySchema.safeParse(requestParams);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid parameters',
          details: validation.error.format() 
        },
        { status: 400 }
      );
    }

    const { limit, offset, raffle_id } = validation.data;

    let leaderboardQuery: string;
    let queryParams: any[];

    if (raffle_id) {
      // Get leaderboard for specific raffle
      leaderboardQuery = `
        SELECT 
          u.fid,
          u.username,
          u.display_name,
          u.pfp_url,
          re.tickets,
          re.raffle_id,
          u.total_lifetime_tickets,
          re.last_participation_at,
          ROW_NUMBER() OVER (ORDER BY re.tickets DESC, re.last_participation_at ASC) as rank
        FROM raffle_entries re
        JOIN users u ON re.user_id = u.id
        WHERE re.raffle_id = $1
        ORDER BY re.tickets DESC, re.last_participation_at ASC
        LIMIT $2 OFFSET $3
      `;
      queryParams = [raffle_id, limit, offset];
    } else {
      // Get leaderboard for current active raffle
      leaderboardQuery = `
        SELECT 
          u.fid,
          u.username,
          u.display_name,
          u.pfp_url,
          re.tickets,
          re.raffle_id,
          u.total_lifetime_tickets,
          re.last_participation_at,
          ROW_NUMBER() OVER (ORDER BY re.tickets DESC, re.last_participation_at ASC) as rank
        FROM raffle_entries re
        JOIN users u ON re.user_id = u.id
        JOIN raffles r ON re.raffle_id = r.id
        WHERE r.status = 'active'
        ORDER BY re.tickets DESC, re.last_participation_at ASC
        LIMIT $1 OFFSET $2
      `;
      queryParams = [limit, offset];
    }

    const leaderboardResult = await query<RaffleLeaderboard & { rank: number }>(
      leaderboardQuery,
      queryParams
    );

    // Get raffle information
    let raffleInfo = null;
    if (raffle_id) {
      const raffleResult = await query(
        'SELECT id, status, end_date, prize_pool, total_tickets, total_participants FROM raffles WHERE id = $1',
        [raffle_id]
      );
      raffleInfo = raffleResult.rows[0] || null;
    } else {
      const raffleResult = await query(
        'SELECT id, status, end_date, prize_pool, total_tickets, total_participants FROM current_raffle'
      );
      raffleInfo = raffleResult.rows[0] || null;
    }

    // Get total count for pagination
    let totalCountQuery: string;
    let countParams: any[];

    if (raffle_id) {
      totalCountQuery = 'SELECT COUNT(*) as total FROM raffle_entries WHERE raffle_id = $1';
      countParams = [raffle_id];
    } else {
      totalCountQuery = `
        SELECT COUNT(*) as total 
        FROM raffle_entries re
        JOIN raffles r ON re.raffle_id = r.id
        WHERE r.status = 'active'
      `;
      countParams = [];
    }

    const countResult = await query(totalCountQuery, countParams);
    const totalCount = parseInt(countResult.rows[0]?.total || '0');

    // Calculate prize distribution if we have raffle info
    let prizeDistribution = null;
    if (raffleInfo && parseFloat(raffleInfo.prize_pool) > 0) {
      const prizePool = parseFloat(raffleInfo.prize_pool);
      prizeDistribution = {
        first_place: (prizePool * 0.6).toFixed(2),
        second_place: (prizePool * 0.3).toFixed(2),
        third_place: (prizePool * 0.1).toFixed(2),
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: leaderboardResult.rows.map((entry, index) => ({
          rank: offset + index + 1,
          fid: entry.fid,
          username: entry.username,
          display_name: entry.display_name,
          pfp_url: entry.pfp_url,
          tickets: entry.tickets,
          total_lifetime_tickets: entry.total_lifetime_tickets,
          last_participation_at: entry.last_participation_at,
          probability_percent: raffleInfo?.total_tickets > 0 
            ? ((entry.tickets / raffleInfo.total_tickets) * 100).toFixed(2)
            : '0.00'
        })),
        raffle_info: raffleInfo,
        prize_distribution: prizeDistribution,
        pagination: {
          current_page: Math.floor(offset / limit) + 1,
          total_pages: Math.ceil(totalCount / limit),
          total_count: totalCount,
          limit,
          offset,
          has_next: offset + limit < totalCount,
          has_previous: offset > 0,
        }
      }
    });

  } catch (error) {
    console.error('Leaderboard API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch leaderboard'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}