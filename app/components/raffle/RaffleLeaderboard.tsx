/**
 * RaffleLeaderboard Component - Shows current raffle leaderboard
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { 
  TrophyIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  UsersIcon,
  TicketIcon
} from '@heroicons/react/24/outline';

interface LeaderboardEntry {
  rank: number;
  fid: number;
  username?: string;
  display_name?: string;
  pfp_url?: string;
  tickets: number;
  total_lifetime_tickets: number;
  last_participation_at: string;
  probability_percent: string;
}

interface RaffleInfo {
  id: string;
  status: string;
  end_date: string;
  prize_pool: string;
  total_tickets: number;
  total_participants: number;
}

interface PrizeDistribution {
  first_place: string;
  second_place: string;
  third_place: string;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  raffle_info: RaffleInfo | null;
  prize_distribution: PrizeDistribution | null;
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
    limit: number;
    offset: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

interface RaffleLeaderboardProps {
  raffleId?: string;
  limit?: number;
  userFid?: number;
  className?: string;
}

export function RaffleLeaderboard({ 
  raffleId,
  limit = 20,
  userFid,
  className = '' 
}: RaffleLeaderboardProps) {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchLeaderboard = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
        ...(raffleId && { raffle_id: raffleId })
      });

      const response = await fetch(`/api/raffle/leaderboard?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch leaderboard');
      }

      if (result.success) {
        setData(result.data);
        setCurrentPage(page);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(1);
  }, [raffleId, limit]);

  const handleRefresh = () => {
    fetchLeaderboard(currentPage);
  };

  const handlePageChange = (page: number) => {
    fetchLeaderboard(page);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return <Badge variant="warning" className="bg-yellow-100 text-yellow-800">🥇 1st</Badge>;
    } else if (rank === 2) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800">🥈 2nd</Badge>;
    } else if (rank === 3) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">🥉 3rd</Badge>;
    }
    return <span className="text-sm font-medium text-gray-600">#{rank}</span>;
  };

  const formatDisplayName = (entry: LeaderboardEntry) => {
    return entry.display_name || entry.username || `User ${entry.fid}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  if (isLoading && !data) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={`p-6 border-red-200 ${className}`}>
        <div className="text-center">
          <TrophyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Leaderboard</h3>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <Button onClick={handleRefresh} disabled={isLoading}>
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  const { leaderboard, raffle_info, prize_distribution, pagination } = data;

  return (
    <Card className={`overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <TrophyIcon className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Leaderboard</h3>
              <p className="text-sm text-gray-600">
                {raffle_info ? `${raffle_info.total_participants} participants` : 'Current standings'}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Prize Distribution */}
      {prize_distribution && raffle_info && (
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Prize Distribution</h4>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <div className="text-lg font-bold text-yellow-800">{prize_distribution.first_place}</div>
              <div className="text-xs text-yellow-600">🥇 1st Place (60%)</div>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <div className="text-lg font-bold text-gray-800">{prize_distribution.second_place}</div>
              <div className="text-xs text-gray-600">🥈 2nd Place (30%)</div>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <div className="text-lg font-bold text-orange-800">{prize_distribution.third_place}</div>
              <div className="text-xs text-orange-600">🥉 3rd Place (10%)</div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Entries */}
      <div className="divide-y divide-gray-100">
        {leaderboard.length === 0 ? (
          <div className="p-8 text-center">
            <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Participants Yet</h3>
            <p className="text-sm text-gray-600">Be the first to participate in this raffle!</p>
          </div>
        ) : (
          leaderboard.map((entry) => (
            <div 
              key={entry.fid} 
              className={`p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors ${
                entry.fid === userFid ? 'bg-blue-50 border-l-4 border-blue-400' : ''
              }`}
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-12">
                {getRankBadge(entry.rank)}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {entry.pfp_url && (
                    <img 
                      src={entry.pfp_url} 
                      alt="Profile" 
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  )}
                  <span className="font-medium text-gray-900 truncate">
                    {formatDisplayName(entry)}
                  </span>
                  {entry.fid === userFid && (
                    <Badge variant="info" className="text-xs">You</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Last active {formatTimeAgo(entry.last_participation_at)}</span>
                  <span>{entry.total_lifetime_tickets} lifetime tickets</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-right">
                <div>
                  <div className="flex items-center gap-1 text-amber-600">
                    <TicketIcon className="w-4 h-4" />
                    <span className="font-bold">{entry.tickets}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {entry.probability_percent}% chance
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total_count)} of {pagination.total_count}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={!pagination.has_previous || isLoading}
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600">
                Page {pagination.current_page} of {pagination.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={!pagination.has_next || isLoading}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}