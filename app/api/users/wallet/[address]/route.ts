/**
 * GET /api/users/wallet/[address] - Get user by wallet address
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { User } from '@/lib/database/models';
import { z } from 'zod';

// Validation schema
const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    // Validate address parameter
    const validation = addressSchema.safeParse(params.address);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid wallet address format' 
        },
        { status: 400 }
      );
    }

    const address = validation.data;

    // Get user by wallet address
    const userResult = await query<User>(
      'SELECT * FROM users WHERE wallet_address = $1',
      [address]
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

  } catch (error) {
    console.error('Get user by wallet API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch user by wallet address'
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