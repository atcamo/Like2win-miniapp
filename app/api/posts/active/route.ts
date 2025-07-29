/**
 * GET /api/posts/active - Get active posts that can generate tickets
 * POST /api/posts/active - Create a new active post
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/database';
import { ActivePost, CreatePostRequest } from '@/lib/database/models';
import { z } from 'zod';

// Validation schemas
const activePostsQuerySchema = z.object({
  limit: z.string().optional().default('10').transform(Number).pipe(z.number().min(1).max(50)),
  offset: z.string().optional().default('0').transform(Number).pipe(z.number().min(0)),
  fid: z.string().optional().transform((val) => val ? Number(val) : undefined).pipe(z.number().positive().optional()),
});

const createPostSchema = z.object({
  cast_hash: z.string().min(1),
  cast_url: z.string().url().optional(),
  text_content: z.string().optional(),
  author_fid: z.number().positive(),
  engagement_type: z.enum(['like', 'like_comment_recast']).optional().default('like'),
});

// GET /api/posts/active
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Validate query parameters
    const validation = activePostsQuerySchema.safeParse(queryParams);
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

    const { limit, offset, fid } = validation.data;

    // Get active posts
    const postsQuery = `
      SELECT 
        p.id,
        p.cast_hash,
        p.cast_url,
        p.text_content,
        p.author_fid,
        p.engagement_type,
        p.created_at,
        r.id as raffle_id,
        r.status as raffle_status,
        r.end_date as raffle_end_date,
        COUNT(pp.id) as total_participations
      FROM posts p
      JOIN raffles r ON p.raffle_id = r.id
      LEFT JOIN post_participations pp ON p.id = pp.post_id
      WHERE p.is_eligible = true 
        AND r.status = 'active'
      GROUP BY p.id, p.cast_hash, p.cast_url, p.text_content, p.author_fid, 
               p.engagement_type, p.created_at, r.id, r.status, r.end_date
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const queryParams_db = [limit, offset];

    const postsResult = await query<ActivePost>(postsQuery, queryParams_db);

    // If fid is provided, get user's participation status for each post
    const userParticipations: { [key: string]: any } = {};
    if (fid) {
      const participationsResult = await query(
        `SELECT pp.post_id, pp.has_liked, pp.has_commented, pp.has_recasted, 
                pp.tickets_earned, pp.engagement_completed_at
         FROM post_participations pp
         JOIN posts p ON pp.post_id = p.id
         JOIN users u ON pp.user_id = u.id
         WHERE u.fid = $1 AND p.id = ANY($2)`,
        [fid, postsResult.rows.map(p => p.id)]
      );

      participationsResult.rows.forEach(participation => {
        userParticipations[participation.post_id] = participation;
      });
    }

    // Get total count for pagination
    const countResult = await query(
      `SELECT COUNT(*) as total 
       FROM posts p
       JOIN raffles r ON p.raffle_id = r.id
       WHERE p.is_eligible = true AND r.status = 'active'`
    );

    const totalCount = parseInt(countResult.rows[0]?.total || '0');

    // Format response
    const formattedPosts = postsResult.rows.map(post => ({
      id: post.id,
      cast_hash: post.cast_hash,
      cast_url: post.cast_url,
      text_content: post.text_content,
      author_fid: post.author_fid,
      engagement_type: post.engagement_type,
      created_at: post.created_at,
      raffle_id: post.raffle_id,
      raffle_end_date: post.raffle_end_date,
      total_participations: post.total_participations,
      user_participation: userParticipations[post.id] || null,
      can_participate: fid ? !userParticipations[post.id] : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        posts: formattedPosts,
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
    console.error('Active posts API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch active posts'
    }, { status: 500 });
  }
}

// POST /api/posts/active
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = createPostSchema.safeParse(body);
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

    const postData = validation.data;

    const result = await transaction(async (client) => {
      // Get current active raffle
      const raffleResult = await client.query(
        'SELECT id FROM raffles WHERE status = $1 ORDER BY start_date DESC LIMIT 1',
        ['active']
      );

      if (raffleResult.rows.length === 0) {
        throw new Error('No active raffle found');
      }

      const activeRaffleId = raffleResult.rows[0].id;

      // Check if post already exists
      const existingPostResult = await client.query(
        'SELECT id FROM posts WHERE cast_hash = $1',
        [postData.cast_hash]
      );

      if (existingPostResult.rows.length > 0) {
        throw new Error('Post with this cast hash already exists');
      }

      // Insert new post
      const postResult = await client.query(
        `INSERT INTO posts (cast_hash, cast_url, text_content, author_fid, raffle_id, engagement_type)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          postData.cast_hash,
          postData.cast_url || null,
          postData.text_content || null,
          postData.author_fid,
          activeRaffleId,
          postData.engagement_type
        ]
      );

      const newPost = postResult.rows[0];

      // Log activity
      await client.query(
        `INSERT INTO activity_log (action, details, ip_address)
         VALUES ($1, $2, $3)`,
        [
          'create_post',
          JSON.stringify({
            post_id: newPost.id,
            cast_hash: postData.cast_hash,
            author_fid: postData.author_fid,
            raffle_id: activeRaffleId
          }),
          request.ip || null
        ]
      );

      return newPost;
    });

    return NextResponse.json({
      success: true,
      data: {
        post: result
      },
      message: 'Post created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create post API error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 409 });
      }
      
      if (error.message.includes('No active raffle')) {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 400 });
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create post'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}