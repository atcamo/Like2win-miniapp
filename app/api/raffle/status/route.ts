/**
 * GET /api/raffle/status - Get current raffle status and user participation
 * Query params: fid (required), detailed (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { UserRaffleStatus, RaffleStats } from '@/lib/database/models';
import { z } from 'zod';

// Validation schema
const statusQuerySchema = z.object({
  fid: z.string().transform(Number).pipe(z.number().positive()),
  detailed: z.string().optional().transform(val => val === 'true'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Validate query parameters
    const validation = statusQuerySchema.safeParse(queryParams);
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

    const { fid, detailed } = validation.data;

    // Get user raffle status using database function
    const statusResult = await query<UserRaffleStatus>(
      'SELECT * FROM get_user_raffle_status($1)',
      [fid]
    );

    if (statusResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        message: 'User with this FID does not exist'
      }, { status: 404 });
    }

    const userStatus = statusResult.rows[0];

    // Basic response
    const response: any = {
      success: true,
      data: {
        user: {
          fid: userStatus.fid,
          username: userStatus.username,
          is_following: userStatus.is_following,
          tip_allowance_enabled: userStatus.tip_allowance_enabled,
          current_tickets: userStatus.current_tickets,
        },
        raffle: userStatus.raffle_id ? {
          id: userStatus.raffle_id,
          status: userStatus.raffle_status,
          end_date: userStatus.raffle_end_date,
          total_participants: userStatus.total_participants,
          total_pool: userStatus.total_pool,
        } : null,
        can_participate: userStatus.is_following,
        required_actions: !userStatus.is_following ? ['Follow @Like2Win'] : [],
      }
    };

    // Add detailed information if requested
    if (detailed && userStatus.raffle_id) {
      // Get detailed raffle stats
      const statsResult = await query<RaffleStats>(
        'SELECT * FROM get_raffle_stats($1)',
        [userStatus.raffle_id]
      );

      if (statsResult.rows.length > 0) {
        const stats = statsResult.rows[0];
        response.data.raffle_stats = {
          avg_tickets_per_user: stats.avg_tickets_per_user,
          top_participant_tickets: stats.top_participant_tickets,
          eligible_posts_count: stats.eligible_posts_count,
        };
      }

      // Get user's probability
      if (userStatus.current_tickets > 0) {
        const probabilityResult = await query(
          `SELECT probability_percent 
           FROM calculate_raffle_probabilities($1) 
           WHERE fid = $2`,
          [userStatus.raffle_id, fid]
        );

        if (probabilityResult.rows.length > 0) {
          response.data.user.probability_percent = probabilityResult.rows[0].probability_percent;
        }
      }

      // Get recent activity
      const activityResult = await query(
        `SELECT pp.*, p.cast_hash, p.created_at as post_created_at
         FROM post_participations pp
         JOIN posts p ON pp.post_id = p.id
         JOIN users u ON pp.user_id = u.id
         WHERE u.fid = $1 AND p.raffle_id = $2
         ORDER BY pp.created_at DESC
         LIMIT 5`,
        [fid, userStatus.raffle_id]
      );

      response.data.recent_activity = activityResult.rows;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Raffle status API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch raffle status'
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