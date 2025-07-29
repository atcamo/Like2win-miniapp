/**
 * Farcaster Frame for Post Participation
 * Allows users to participate in raffle posts directly from the frame
 */

import { NextRequest } from 'next/server';
import { query } from '@/lib/database';

// Frame metadata generation helper
function getFrameMetadata(config: {
  buttons: Array<{ label: string; action?: string; target?: string }>;
  image: { src: string; aspectRatio?: string } | string;
  postUrl?: string;
  input?: { text: string };
}) {
  const { buttons, image, postUrl, input } = config;
  const imageUrl = typeof image === 'string' ? image : image.src;
  const aspectRatio = typeof image === 'object' ? image.aspectRatio : '1.91:1';
  
  let meta = '';
  meta += `<meta name="fc:frame" content="vNext" />`;
  meta += `<meta name="fc:frame:image" content="${imageUrl}" />`;
  meta += `<meta name="fc:frame:image:aspect_ratio" content="${aspectRatio || '1.91:1'}" />`;
  
  if (postUrl) {
    meta += `<meta name="fc:frame:post_url" content="${postUrl}" />`;
  }
  
  if (input) {
    meta += `<meta name="fc:frame:input:text" content="${input.text}" />`;
  }
  
  buttons.forEach((button, index) => {
    const buttonIndex = index + 1;
    meta += `<meta name="fc:frame:button:${buttonIndex}" content="${button.label}" />`;
    if (button.action) {
      meta += `<meta name="fc:frame:button:${buttonIndex}:action" content="${button.action}" />`;
    }
    if (button.target) {
      meta += `<meta name="fc:frame:button:${buttonIndex}:target" content="${button.target}" />`;
    }
  });
  
  return meta;
}

const FRAME_BASE_URL = process.env.NEXT_PUBLIC_VERCEL_URL 
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` 
  : 'http://localhost:3000';

interface FrameRequest {
  untrustedData: {
    fid: number;
    url: string;
    messageHash: string;
    timestamp: number;
    network: number;
    buttonIndex?: number;
    inputText?: string;
    castId?: {
      fid: number;
      hash: string;
    };
  };
  trustedData: {
    messageBytes: string;
  };
}

// Generate participation frame image
async function generateParticipationImage(
  fid?: number, 
  postHash?: string, 
  participationResult?: any
) {
  let userStatus = null;
  let postInfo = null;
  let hasParticipated = false;

  if (fid) {
    // Get user status
    const statusResult = await query(
      'SELECT * FROM get_user_raffle_status($1)',
      [fid]
    );
    
    if (statusResult.rows.length > 0) {
      userStatus = statusResult.rows[0];
    }
  }

  if (postHash) {
    // Get post information
    const postResult = await query(
      'SELECT * FROM posts WHERE cast_hash = $1',
      [postHash]
    );
    
    if (postResult.rows.length > 0) {
      postInfo = postResult.rows[0];
    }

    // Check if user has participated
    if (fid && postInfo) {
      const participationCheck = await query(
        `SELECT pp.* FROM post_participations pp
         JOIN users u ON pp.user_id = u.id
         WHERE u.fid = $1 AND pp.post_id = $2`,
        [fid, postInfo.id]
      );
      
      hasParticipated = participationCheck.rows.length > 0;
    }
  }

  const width = 1200;
  const height = 630;
  
  let statusMessage = '';
  let statusColor = '#6B7280';
  let actionText = '';

  if (participationResult) {
    if (participationResult.success) {
      statusMessage = `🎉 Success! You earned ${participationResult.tickets_earned} ticket(s)!`;
      statusColor = '#10B981';
      actionText = 'Participation recorded successfully';
    } else {
      statusMessage = `❌ ${participationResult.error}`;
      statusColor = '#EF4444';
      actionText = 'Participation failed';
    }
  } else if (hasParticipated) {
    statusMessage = '✅ Already participated in this post';
    statusColor = '#10B981';
    actionText = 'You have already earned tickets from this post';
  } else if (!userStatus?.is_following) {
    statusMessage = '⚠️ Must follow @Like2Win to participate';
    statusColor = '#F59E0B';
    actionText = 'Follow @Like2Win first to be eligible';
  } else {
    statusMessage = userStatus.tip_allowance_enabled 
      ? '🎫 Like this post to earn 1 ticket!'
      : '🎫 Like + Comment + Recast to earn 1 ticket!';
    statusColor = '#3B82F6';
    actionText = 'Ready to participate';
  }

  const userTickets = userStatus?.current_tickets || 0;
  const canParticipate = userStatus?.is_following && !hasParticipated;

  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#EBF4FF;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#DBEAFE;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:0.95" />
          <stop offset="100%" style="stop-color:#F9FAFB;stop-opacity:0.95" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="url(#bg)"/>
      
      <!-- Main Card -->
      <rect x="60" y="60" width="1080" height="510" rx="24" fill="url(#cardBg)" stroke="#E5E7EB" stroke-width="2"/>
      
      <!-- Header -->
      <rect x="60" y="60" width="1080" height="100" rx="24" fill="#3B82F6" fill-opacity="0.1"/>
      <circle cx="130" cy="110" r="20" fill="#3B82F6"/>
      <text x="110" y="118" fill="white" font-size="20" font-weight="bold" text-anchor="middle">🎫</text>
      <text x="170" y="100" fill="#1E40AF" font-size="32" font-weight="bold" font-family="Inter, sans-serif">Participate in Raffle</text>
      <text x="170" y="130" fill="#2563EB" font-size="18" font-family="Inter, sans-serif">Like2Win Official Post</text>
      
      <!-- Current Status -->
      <rect x="100" y="200" width="480" height="100" rx="16" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1"/>
      <text x="340" y="235" fill="#92400E" font-size="36" font-weight="bold" text-anchor="middle" font-family="Inter, sans-serif">${userTickets}</text>
      <text x="340" y="260" fill="#A16207" font-size="16" text-anchor="middle" font-family="Inter, sans-serif">Your Current Tickets</text>
      <text x="340" y="280" fill="#D97706" font-size="14" text-anchor="middle" font-family="Inter, sans-serif">In this raffle period</text>
      
      <!-- Action Status -->
      <rect x="620" y="200" width="500" height="100" rx="16" fill="${statusColor === '#10B981' ? '#D1FAE5' : statusColor === '#EF4444' ? '#FEE2E2' : statusColor === '#F59E0B' ? '#FEF3C7' : '#DBEAFE'}" stroke="${statusColor}" stroke-width="1"/>
      <text x="870" y="235" fill="${statusColor}" font-size="20" font-weight="bold" text-anchor="middle" font-family="Inter, sans-serif">Participation Status</text>
      <text x="870" y="260" fill="${statusColor}" font-size="16" text-anchor="middle" font-family="Inter, sans-serif">${actionText}</text>
      
      <!-- Main Message -->
      <rect x="100" y="340" width="1020" height="80" rx="16" fill="white" stroke="${statusColor}" stroke-width="2"/>
      <text x="610" y="375" fill="${statusColor}" font-size="24" font-weight="bold" text-anchor="middle" font-family="Inter, sans-serif">${statusMessage}</text>
      
      <!-- Instructions -->
      <text x="610" y="410" fill="#6B7280" font-size="16" text-anchor="middle" font-family="Inter, sans-serif">
        ${canParticipate ? 'Click the participate button below to earn tickets!' : 'Follow the requirements above to participate'}
      </text>
      
      <!-- Requirements -->
      <text x="610" y="460" fill="#6B7280" font-size="14" text-anchor="middle" font-family="Inter, sans-serif">
        ${userStatus?.tip_allowance_enabled ? 
          'Requirements: Follow @Like2Win + Like this post' : 
          'Requirements: Follow @Like2Win + Like + Comment + Recast this post'
        }
      </text>
      
      <!-- Footer -->
      <text x="610" y="520" fill="#9CA3AF" font-size="12" text-anchor="middle" font-family="Inter, sans-serif">Like2Win • Bi-weekly raffles every Wednesday and Sunday at 8PM UTC</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postHash = searchParams.get('hash');
  
  const imageUrl = await generateParticipationImage(undefined, postHash || undefined);
  
  const frameMetadata = getFrameMetadata({
    buttons: [
      {
        label: '🎫 Participate',
        action: 'post',
      },
      {
        label: '📊 My Status',
        action: 'post',
      },
      {
        label: '🏆 Leaderboard',
        action: 'link',
        target: `${FRAME_BASE_URL}/raffle`,
      },
    ],
    image: {
      src: imageUrl,
      aspectRatio: '1.91:1',
    },
    input: {
      text: 'Enter your FID to participate',
    },
    postUrl: `${FRAME_BASE_URL}/api/frames/participate${postHash ? `?hash=${postHash}` : ''}`,
  });

  return new Response(
    `<!DOCTYPE html>
    <html>
      <head>
        <title>Like2Win - Participate in Raffle</title>
        <meta name="description" content="Participate in Like2Win raffle by liking this post" />
        ${frameMetadata}
      </head>
      <body>
        <h1>Like2Win Raffle Participation</h1>
        <p>Use this frame to participate in the raffle.</p>
      </body>
    </html>`,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const frameRequest: FrameRequest = await request.json();
    const { untrustedData } = frameRequest;
    const { fid, buttonIndex, inputText, castId } = untrustedData;
    
    const { searchParams } = new URL(request.url);
    const postHash = searchParams.get('hash');

    let nextImageUrl: string;
    let nextButtons: any[];
    let participationResult: any = null;

    if (buttonIndex === 1) {
      // Participate button clicked
      try {
        // Use the cast hash from the frame URL or the castId
        const targetPostHash = postHash || castId?.hash;
        
        if (!targetPostHash) {
          throw new Error('No post hash found');
        }

        if (!fid) {
          throw new Error('FID is required to participate');
        }

        // Get user info
        const userResult = await query(
          'SELECT tip_allowance_enabled FROM users WHERE fid = $1',
          [fid]
        );

        if (userResult.rows.length === 0) {
          throw new Error('User not found. Please connect first.');
        }

        const user = userResult.rows[0];

        // Simulate participation (in real implementation, this would call the participation API)
        const participationResponse = await fetch(`${FRAME_BASE_URL}/api/raffle/participate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_fid: fid,
            post_cast_hash: targetPostHash,
            engagement_type: user.tip_allowance_enabled ? 'like' : 'like_comment_recast',
            engagement_data: {
              has_liked: true,
              has_commented: !user.tip_allowance_enabled,
              has_recasted: !user.tip_allowance_enabled,
            },
          }),
        });

        const result = await participationResponse.json();
        participationResult = result;

        nextImageUrl = await generateParticipationImage(fid, targetPostHash, result);
        nextButtons = [
          {
            label: '🔄 Refresh Status',
            action: 'post',
          },
          {
            label: '📊 View Dashboard',
            action: 'link',
            target: `${FRAME_BASE_URL}/raffle`,
          },
        ];
      } catch (error) {
        participationResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Participation failed',
        };
        
        nextImageUrl = await generateParticipationImage(fid, postHash || undefined, participationResult);
        nextButtons = [
          {
            label: '🔄 Try Again',
            action: 'post',
          },
          {
            label: '📊 View Dashboard',
            action: 'link',
            target: `${FRAME_BASE_URL}/raffle`,
          },
        ];
      }
    } else if (buttonIndex === 2) {
      // My Status button clicked
      nextImageUrl = await generateParticipationImage(fid, postHash || undefined);
      nextButtons = [
        {
          label: '🎫 Participate',
          action: 'post',
        },
        {
          label: '🔄 Refresh',
          action: 'post',
        },
        {
          label: '📊 Dashboard',
          action: 'link',
          target: `${FRAME_BASE_URL}/raffle`,
        },
      ];
    } else {
      // Default refresh
      nextImageUrl = await generateParticipationImage(fid, postHash || undefined);
      nextButtons = [
        {
          label: '🎫 Participate',
          action: 'post',
        },
        {
          label: '📊 My Status',
          action: 'post',
        },
        {
          label: '🏆 Dashboard',
          action: 'link',
          target: `${FRAME_BASE_URL}/raffle`,
        },
      ];
    }

    const frameMetadata = getFrameMetadata({
      buttons: nextButtons,
      image: {
        src: nextImageUrl,
        aspectRatio: '1.91:1',
      },
      postUrl: `${FRAME_BASE_URL}/api/frames/participate${postHash ? `?hash=${postHash}` : ''}`,
    });

    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Like2Win - Participate in Raffle</title>
          ${frameMetadata}
        </head>
        <body>
          <h1>Like2Win Raffle Participation</h1>
        </body>
      </html>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  } catch (error) {
    console.error('Participation frame POST error:', error);
    
    return new Response('Error processing participation request', {
      status: 500,
    });
  }
}