/**
 * POST /api/raffle/participate - Record user participation in a post
 * Handles both like-only and like+comment+recast participation
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/database';
import { ParticipateRequest, ParticipationCheck } from '@/lib/database/models';
import { z } from 'zod';

// Validation schema
const participateSchema = z.object({
  user_fid: z.number().positive(),
  post_cast_hash: z.string().min(1),
  engagement_type: z.enum(['like', 'comment', 'recast', 'like_comment_recast']),
  engagement_data: z.object({
    has_liked: z.boolean().optional().default(false),
    has_commented: z.boolean().optional().default(false),
    has_recasted: z.boolean().optional().default(false),
  }).optional().default({}),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = participateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: validation.error.format() 
        },
        { status: 400 }
      );
    }

    const { user_fid, post_cast_hash, engagement_type, engagement_data } = validation.data;

    // Check if user can participate using database function
    const canParticipateResult = await query<ParticipationCheck>(
      'SELECT * FROM can_user_participate_in_post($1, $2)',
      [user_fid, post_cast_hash]
    );

    if (canParticipateResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Unable to check participation eligibility'
      }, { status: 500 });
    }

    const participationCheck = canParticipateResult.rows[0];

    if (!participationCheck.can_participate) {
      return NextResponse.json({
        success: false,
        error: participationCheck.reason,
        required_actions: participationCheck.required_actions
      }, { status: 400 });
    }

    // Process participation in a transaction
    const result = await transaction(async (client) => {
      // Get user and post information
      const userResult = await client.query(
        'SELECT id, tip_allowance_enabled FROM users WHERE fid = $1',
        [user_fid]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];

      const postResult = await client.query(
        'SELECT id, raffle_id FROM posts WHERE cast_hash = $1',
        [post_cast_hash]
      );

      if (postResult.rows.length === 0) {
        throw new Error('Post not found');
      }

      const post = postResult.rows[0];

      // Determine if engagement is complete based on user type
      let engagementComplete = false;
      let ticketsEarned = 0;
      let finalEngagementType = engagement_type;

      if (user.tip_allowance_enabled) {
        // For users with tip allowance, only like is required
        if (engagement_type === 'like' || engagement_data.has_liked) {
          engagementComplete = true;
          ticketsEarned = 1;
          finalEngagementType = 'like';
        }
      } else {
        // For users without tip allowance, all three actions are required
        if (engagement_data.has_liked && engagement_data.has_commented && engagement_data.has_recasted) {
          engagementComplete = true;
          ticketsEarned = 1;
          finalEngagementType = 'like_comment_recast';
        }
      }

      // Insert or update post participation
      const participationResult = await client.query(
        `INSERT INTO post_participations 
         (user_id, post_id, engagement_type, has_liked, has_commented, has_recasted, 
          tickets_earned, engagement_completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id, post_id) 
         DO UPDATE SET
           has_liked = EXCLUDED.has_liked OR post_participations.has_liked,
           has_commented = EXCLUDED.has_commented OR post_participations.has_commented,
           has_recasted = EXCLUDED.has_recasted OR post_participations.has_recasted,
           tickets_earned = EXCLUDED.tickets_earned,
           engagement_completed_at = EXCLUDED.engagement_completed_at,
           updated_at = NOW()
         RETURNING *`,
        [
          user.id,
          post.id,
          finalEngagementType,
          engagement_data.has_liked || false,
          engagement_data.has_commented || false,
          engagement_data.has_recasted || false,
          ticketsEarned,
          engagementComplete ? new Date() : null
        ]
      );

      const participation = participationResult.rows[0];

      // If tickets were earned, update raffle entry
      if (ticketsEarned > 0) {
        await client.query(
          `INSERT INTO raffle_entries (user_id, raffle_id, tickets, last_participation_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (user_id, raffle_id)
           DO UPDATE SET
             tickets = raffle_entries.tickets + EXCLUDED.tickets,
             last_participation_at = NOW(),
             updated_at = NOW()`,
          [user.id, post.raffle_id, ticketsEarned]
        );

        // Update user total lifetime tickets
        await client.query(
          'UPDATE users SET total_lifetime_tickets = total_lifetime_tickets + $1 WHERE id = $2',
          [ticketsEarned, user.id]
        );

        // Update raffle totals
        await client.query(
          `UPDATE raffles SET 
             total_tickets = (
               SELECT COALESCE(SUM(tickets), 0) 
               FROM raffle_entries 
               WHERE raffle_id = $1
             ),
             total_participants = (
               SELECT COUNT(DISTINCT user_id) 
               FROM raffle_entries 
               WHERE raffle_id = $1
             )
           WHERE id = $1`,
          [post.raffle_id]
        );

        // Log activity
        await client.query(
          `INSERT INTO activity_log (user_id, action, details, ip_address)
           VALUES ($1, $2, $3, $4)`,
          [
            user.id,
            'earn_ticket',
            JSON.stringify({
              post_cast_hash,
              engagement_type: finalEngagementType,
              tickets_earned: ticketsEarned,
              raffle_id: post.raffle_id
            }),
            request.ip || null
          ]
        );
      }

      return {
        participation,
        tickets_earned: ticketsEarned,
        engagement_complete: engagementComplete,
        required_for_completion: user.tip_allowance_enabled 
          ? ['like'] 
          : ['like', 'comment', 'recast']
      };
    });

    // Get updated user status
    const updatedStatusResult = await query(
      'SELECT * FROM get_user_raffle_status($1)',
      [user_fid]
    );

    const updatedStatus = updatedStatusResult.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        tickets_earned: result.tickets_earned,
        engagement_complete: result.engagement_complete,
        required_for_completion: result.required_for_completion,
        user_status: {
          current_tickets: updatedStatus?.current_tickets || 0,
          total_lifetime_tickets: updatedStatus?.total_lifetime_tickets || 0,
        },
        participation_id: result.participation.id
      },
      message: result.engagement_complete 
        ? `Congratulations! You earned ${result.tickets_earned} ticket(s)!`
        : 'Engagement recorded. Complete all required actions to earn tickets.'
    });

  } catch (error) {
    console.error('Participation API error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to record participation'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}