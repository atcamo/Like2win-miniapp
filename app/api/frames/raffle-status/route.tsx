/**
 * Farcaster Frame for Raffle Status Display
 * Shows user's current raffle participation and allows quick actions
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
    castId?: {
      fid: number;
      hash: string;
    };
  };
  trustedData: {
    messageBytes: string;
  };
}

// Generate raffle status image
async function generateRaffleStatusImage(fid?: number) {
  let userStatus = null;
  let raffleInfo = null;

  if (fid) {
    // Get user raffle status
    const statusResult = await query(
      'SELECT * FROM get_user_raffle_status($1)',
      [fid]
    );
    
    if (statusResult.rows.length > 0) {
      userStatus = statusResult.rows[0];
    }
  }

  // Get current raffle info
  const raffleResult = await query(
    'SELECT * FROM current_raffle'
  );
  
  if (raffleResult.rows.length > 0) {
    raffleInfo = raffleResult.rows[0];
  }

  // Create SVG image
  const width = 1200;
  const height = 630;
  
  const timeUntilEnd = raffleInfo ? getTimeUntilEnd(raffleInfo.end_date) : 'No active raffle';
  const prizePool = raffleInfo ? `${raffleInfo.prize_pool} $DEGEN` : '0 $DEGEN';
  const userTickets = userStatus?.current_tickets || 0;
  const totalParticipants = raffleInfo?.total_participants || 0;
  const userProbability = raffleInfo && userTickets > 0 
    ? ((userTickets / raffleInfo.total_tickets) * 100).toFixed(1)
    : '0.0';

  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FEF3C7;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#FDE68A;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:#F9FAFB;stop-opacity:0.9" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="url(#bg)"/>
      
      <!-- Main Card -->
      <rect x="60" y="60" width="1080" height="510" rx="24" fill="url(#cardBg)" stroke="#E5E7EB" stroke-width="2"/>
      
      <!-- Header -->
      <rect x="60" y="60" width="1080" height="100" rx="24" fill="#F59E0B" fill-opacity="0.1"/>
      <circle cx="130" cy="110" r="20" fill="#F59E0B"/>
      <text x="110" y="118" fill="white" font-size="20" font-weight="bold" text-anchor="middle">🎫</text>
      <text x="170" y="100" fill="#92400E" font-size="32" font-weight="bold" font-family="Inter, sans-serif">Like2Win Raffle</text>
      <text x="170" y="130" fill="#D97706" font-size="18" font-family="Inter, sans-serif">${raffleInfo?.status === 'active' ? 'Active Raffle' : 'No Active Raffle'}</text>
      
      <!-- Stats Grid -->
      <!-- User Tickets -->
      <rect x="100" y="200" width="240" height="120" rx="16" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1"/>
      <text x="220" y="235" fill="#92400E" font-size="36" font-weight="bold" text-anchor="middle" font-family="Inter, sans-serif">${userTickets}</text>
      <text x="220" y="260" fill="#A16207" font-size="16" text-anchor="middle" font-family="Inter, sans-serif">Your Tickets</text>
      <text x="220" y="285" fill="#D97706" font-size="14" text-anchor="middle" font-family="Inter, sans-serif">${userProbability}% chance</text>
      
      <!-- Prize Pool -->
      <rect x="360" y="200" width="240" height="120" rx="16" fill="#DBEAFE" stroke="#3B82F6" stroke-width="1"/>
      <text x="480" y="235" fill="#1E40AF" font-size="28" font-weight="bold" text-anchor="middle" font-family="Inter, sans-serif">${prizePool.split(' ')[0]}</text>
      <text x="480" y="255" fill="#2563EB" font-size="18" text-anchor="middle" font-family="Inter, sans-serif">${prizePool.split(' ')[1] || ''}</text>
      <text x="480" y="280" fill="#3B82F6" font-size="16" text-anchor="middle" font-family="Inter, sans-serif">Prize Pool</text>
      
      <!-- Participants -->
      <rect x="620" y="200" width="240" height="120" rx="16" fill="#D1FAE5" stroke="#10B981" stroke-width="1"/>
      <text x="740" y="235" fill="#047857" font-size="36" font-weight="bold" text-anchor="middle" font-family="Inter, sans-serif">${totalParticipants}</text>
      <text x="740" y="260" fill="#059669" font-size="16" text-anchor="middle" font-family="Inter, sans-serif">Participants</text>
      
      <!-- Time Left -->
      <rect x="880" y="200" width="240" height="120" rx="16" fill="#FEE2E2" stroke="#EF4444" stroke-width="1"/>
      <text x="1000" y="235" fill="#DC2626" font-size="24" font-weight="bold" text-anchor="middle" font-family="Inter, sans-serif">${timeUntilEnd}</text>
      <text x="1000" y="260" fill="#EF4444" font-size="16" text-anchor="middle" font-family="Inter, sans-serif">Time Left</text>
      
      <!-- Instructions -->
      <text x="600" y="380" fill="#374151" font-size="20" font-weight="bold" text-anchor="middle" font-family="Inter, sans-serif">
        ${userStatus?.is_following ? 
          (userStatus.tip_allowance_enabled ? 'Like official posts to earn tickets!' : 'Like + Comment + Recast to earn tickets!') :
          'Follow @Like2Win to participate!'
        }
      </text>
      
      <!-- Status Indicator -->
      ${userStatus?.is_following ? 
        '<circle cx="580" cy="415" r="8" fill="#10B981"/><text x="600" y="420" fill="#059669" font-size="16" font-family="Inter, sans-serif">✓ Following @Like2Win</text>' :
        '<circle cx="580" cy="415" r="8" fill="#EF4444"/><text x="600" y="420" fill="#DC2626" font-size="16" font-family="Inter, sans-serif">⚠ Not following @Like2Win</text>'
      }
      
      <!-- Footer -->
      <text x="600" y="520" fill="#6B7280" font-size="14" text-anchor="middle" font-family="Inter, sans-serif">Like2Win • Bi-weekly raffles every Wednesday and Sunday at 8PM UTC</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function getTimeUntilEnd(endDate: Date | string): string {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  
  if (diff <= 0) return 'Ended';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  return '<1h';
}

export async function GET(request: NextRequest) {
  const imageUrl = await generateRaffleStatusImage();
  
  const frameMetadata = getFrameMetadata({
    buttons: [
      {
        label: 'View My Status',
        action: 'post',
      },
      {
        label: 'Leaderboard',
        action: 'post',
      },
      {
        label: 'Open App',
        action: 'link',
        target: `${FRAME_BASE_URL}/raffle`,
      },
    ],
    image: {
      src: imageUrl,
      aspectRatio: '1.91:1',
    },
    input: {
      text: 'Enter your FID (optional)',
    },
    postUrl: `${FRAME_BASE_URL}/api/frames/raffle-status`,
  });

  return new Response(
    `<!DOCTYPE html>
    <html>
      <head>
        <title>Like2Win Raffle Status</title>
        <meta name="description" content="Check your Like2Win raffle participation status" />
        ${frameMetadata}
      </head>
      <body>
        <h1>Like2Win Raffle Status</h1>
        <p>Use this frame to check your raffle participation status.</p>
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
    const { fid, buttonIndex, url } = untrustedData;

    let nextImageUrl: string;
    let nextButtons: any[];
    let nextPostUrl: string;

    if (buttonIndex === 1) {
      // View My Status
      nextImageUrl = await generateRaffleStatusImage(fid);
      nextButtons = [
        {
          label: 'Refresh',
          action: 'post',
        },
        {
          label: 'Leaderboard',
          action: 'post',
        },
        {
          label: 'Open App',
          action: 'link',
          target: `${FRAME_BASE_URL}/raffle`,
        },
      ];
      nextPostUrl = `${FRAME_BASE_URL}/api/frames/raffle-status`;
    } else if (buttonIndex === 2) {
      // Show Leaderboard
      nextImageUrl = await generateLeaderboardImage();
      nextButtons = [
        {
          label: 'My Status',
          action: 'post',
        },
        {
          label: 'Refresh',
          action: 'post',
        },
        {
          label: 'Open App',
          action: 'link',
          target: `${FRAME_BASE_URL}/raffle`,
        },
      ];
      nextPostUrl = `${FRAME_BASE_URL}/api/frames/raffle-status`;
    } else {
      // Default or refresh
      nextImageUrl = await generateRaffleStatusImage(fid);
      nextButtons = [
        {
          label: 'View My Status',
          action: 'post',
        },
        {
          label: 'Leaderboard',
          action: 'post',
        },
        {
          label: 'Open App',
          action: 'link',
          target: `${FRAME_BASE_URL}/raffle`,
        },
      ];
      nextPostUrl = `${FRAME_BASE_URL}/api/frames/raffle-status`;
    }

    const frameMetadata = getFrameMetadata({
      buttons: nextButtons,
      image: {
        src: nextImageUrl,
        aspectRatio: '1.91:1',
      },
      postUrl: nextPostUrl,
    });

    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Like2Win Raffle Status</title>
          ${frameMetadata}
        </head>
        <body>
          <h1>Like2Win Raffle Status</h1>
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
    console.error('Frame POST error:', error);
    
    return new Response('Error processing frame request', {
      status: 500,
    });
  }
}

async function generateLeaderboardImage() {
  // Get current leaderboard
  const leaderboardResult = await query(
    `SELECT u.fid, u.username, u.display_name, re.tickets,
            ROW_NUMBER() OVER (ORDER BY re.tickets DESC) as rank
     FROM raffle_entries re
     JOIN users u ON re.user_id = u.id
     JOIN raffles r ON re.raffle_id = r.id
     WHERE r.status = 'active'
     ORDER BY re.tickets DESC
     LIMIT 10`
  );

  const leaderboard = leaderboardResult.rows;
  
  const width = 1200;
  const height = 630;
  
  let leaderboardRows = '';
  leaderboard.forEach((entry, index) => {
    const y = 180 + (index * 40);
    const displayName = entry.display_name || entry.username || `User ${entry.fid}`;
    const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
    
    leaderboardRows += `
      <text x="120" y="${y}" fill="#374151" font-size="18" font-weight="bold" font-family="Inter, sans-serif">${rankEmoji}</text>
      <text x="180" y="${y}" fill="#374151" font-size="18" font-family="Inter, sans-serif">${displayName}</text>
      <text x="1050" y="${y}" fill="#F59E0B" font-size="18" font-weight="bold" text-anchor="end" font-family="Inter, sans-serif">${entry.tickets} tickets</text>
    `;
  });

  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FEF3C7;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#FDE68A;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <rect width="100%" height="100%" fill="url(#bg)"/>
      
      <!-- Header -->
      <rect x="60" y="40" width="1080" height="80" rx="16" fill="white" fill-opacity="0.9"/>
      <text x="600" y="70" fill="#92400E" font-size="28" font-weight="bold" text-anchor="middle" font-family="Inter, sans-serif">🏆 Current Leaderboard</text>
      <text x="600" y="100" fill="#D97706" font-size="16" text-anchor="middle" font-family="Inter, sans-serif">Top participants in the current raffle</text>
      
      <!-- Leaderboard Container -->
      <rect x="80" y="140" width="1040" height="420" rx="16" fill="white" fill-opacity="0.95" stroke="#E5E7EB" stroke-width="1"/>
      
      <!-- Header Row -->
      <rect x="80" y="140" width="1040" height="40" rx="16" fill="#F3F4F6"/>
      <text x="120" y="165" fill="#6B7280" font-size="16" font-weight="bold" font-family="Inter, sans-serif">Rank</text>
      <text x="180" y="165" fill="#6B7280" font-size="16" font-weight="bold" font-family="Inter, sans-serif">User</text>
      <text x="1050" y="165" fill="#6B7280" font-size="16" font-weight="bold" text-anchor="end" font-family="Inter, sans-serif">Tickets</text>
      
      <!-- Leaderboard Rows -->
      ${leaderboardRows}
      
      <!-- Footer -->
      <text x="600" y="590" fill="#6B7280" font-size="14" text-anchor="middle" font-family="Inter, sans-serif">Like2Win • Real-time leaderboard updates</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}