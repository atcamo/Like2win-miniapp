/**
 * GET /api/users/[fid] - Get user information and stats
 * PUT /api/users/[fid] - Update user information
 * POST /api/users/[fid] - Create or update user (upsert)
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/database';
import { User, UserStats, CreateUserRequest, UpdateUserRequest } from '@/lib/database/models';
import { z } from 'zod';

// Helper function to get client IP from NextRequest
function getClientIP(request: NextRequest): string | null {
  // Check various headers for the real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return null;
}

// Validation schemas
const fidSchema = z.string().transform(Number).pipe(z.number().positive());

const createUserSchema = z.object({
  fid: z.number().positive(),
  username: z.string().optional(),
  display_name: z.string().optional(),
  pfp_url: z.string().url().optional(),
  wallet_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  tip_allowance_enabled: z.boolean().optional().default(false),
});

const updateUserSchema = z.object({
  username: z.string().optional(),
  display_name: z.string().optional(),
  pfp_url: z.string().url().optional(),
  wallet_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  tip_allowance_enabled: z.boolean().optional(),
  is_following_like2win: z.boolean().optional(),
});

// GET /api/users/[fid]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fid: string }> }
) {
  try {
    // Await params and validate FID parameter
    const resolvedParams = await params;
    const validation = fidSchema.safeParse(resolvedParams.fid);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid FID parameter' 
        },
        { status: 400 }
      );
    }

    const fid = validation.data;
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('include_stats') === 'true';

    if (includeStats) {
      // Get comprehensive user stats
      const userStatsResult = await query<UserStats>(
        'SELECT * FROM user_stats WHERE fid = $1',
        [fid]
      );

      if (userStatsResult.rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'User not found'
        }, { status: 404 });
      }

      const userStats = userStatsResult.rows[0];

      // Get recent activity
      const activityResult = await query(
        `SELECT al.action, al.details, al.created_at
         FROM activity_log al
         WHERE al.user_id = $1
         ORDER BY al.created_at DESC
         LIMIT 10`,
        [userStats.id]
      );

      // Get recent participations
      const participationsResult = await query(
        `SELECT pp.*, p.cast_hash, p.text_content, p.created_at as post_created_at
         FROM post_participations pp
         JOIN posts p ON pp.post_id = p.id
         WHERE pp.user_id = $1
         ORDER BY pp.created_at DESC
         LIMIT 5`,
        [userStats.id]
      );

      return NextResponse.json({
        success: true,
        data: {
          user: userStats,
          recent_activity: activityResult.rows,
          recent_participations: participationsResult.rows,
        }
      });
    } else {
      // Get basic user information
      const userResult = await query<User>(
        'SELECT * FROM users WHERE fid = $1',
        [fid]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'User not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          user: userResult.rows[0]
        }
      });
    }

  } catch (error) {
    console.error('Get user API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch user information'
    }, { status: 500 });
  }
}

// PUT /api/users/[fid] - Update existing user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ fid: string }> }
) {
  try {
    // Await params and validate FID parameter
    const resolvedParams = await params;
    const fidValidation = fidSchema.safeParse(resolvedParams.fid);
    if (!fidValidation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid FID parameter' 
        },
        { status: 400 }
      );
    }

    const fid = fidValidation.data;
    const body = await request.json();

    // Validate request body
    const validation = updateUserSchema.safeParse(body);
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

    const updateData = validation.data;

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No fields to update'
      }, { status: 400 });
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(fid);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE fid = $${paramIndex}
      RETURNING *
    `;

    const result = await query<User>(updateQuery, updateValues);

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        user: result.rows[0]
      },
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Update user API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update user'
    }, { status: 500 });
  }
}

// POST /api/users/[fid] - Create or update user (upsert)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fid: string }> }
) {
  try {
    // Await params and validate FID parameter
    const resolvedParams = await params;
    const fidValidation = fidSchema.safeParse(resolvedParams.fid);
    if (!fidValidation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid FID parameter' 
        },
        { status: 400 }
      );
    }

    const fid = fidValidation.data;
    const body = await request.json();

    // Validate request body
    const validation = createUserSchema.safeParse({ ...body, fid });
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

    const userData = validation.data;

    const result = await transaction(async (client) => {
      // Upsert user
      const userResult = await client.query<User>(
        `INSERT INTO users (fid, username, display_name, pfp_url, wallet_address, tip_allowance_enabled)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (fid) 
         DO UPDATE SET
           username = COALESCE(EXCLUDED.username, users.username),
           display_name = COALESCE(EXCLUDED.display_name, users.display_name),
           pfp_url = COALESCE(EXCLUDED.pfp_url, users.pfp_url),
           wallet_address = COALESCE(EXCLUDED.wallet_address, users.wallet_address),
           tip_allowance_enabled = EXCLUDED.tip_allowance_enabled,
           updated_at = NOW()
         RETURNING *, (xmax = 0) AS was_inserted`,
        [
          userData.fid,
          userData.username || null,
          userData.display_name || null,
          userData.pfp_url || null,
          userData.wallet_address || null,
          userData.tip_allowance_enabled
        ]
      );

      const user = userResult.rows[0];

      // Create default user settings if new user
      if ((user as any).was_inserted) {
        await client.query(
          `INSERT INTO user_settings (user_id)
           VALUES ($1)
           ON CONFLICT (user_id) DO NOTHING`,
          [user.id]
        );

        // Log registration activity
        await client.query(
          `INSERT INTO activity_log (user_id, action, details, ip_address)
           VALUES ($1, $2, $3, $4)`,
          [
            user.id,
            'user_registration',
            JSON.stringify({
              fid: userData.fid,
              tip_allowance_enabled: userData.tip_allowance_enabled
            }),
            getClientIP(request)
          ]
        );
      }

      return { user, was_inserted: (user as any).was_inserted };
    });

    return NextResponse.json({
      success: true,
      data: {
        user: result.user
      },
      message: result.was_inserted ? 'User created successfully' : 'User updated successfully'
    }, { status: result.was_inserted ? 201 : 200 });

  } catch (error) {
    console.error('Create/update user API error:', error);
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json({
        success: false,
        error: 'User already exists'
      }, { status: 409 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create/update user'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}