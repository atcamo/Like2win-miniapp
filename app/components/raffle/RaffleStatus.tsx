/**
 * RaffleStatus Component - Shows current raffle status and user participation
 */

'use client';

import React from 'react';
import { useRaffleStatus } from '@/app/hooks/useRaffleStatus';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { 
  TrophyIcon, 
  TicketIcon, 
  ClockIcon, 
  UsersIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface RaffleStatusProps {
  fid?: number;
  detailed?: boolean;
  className?: string;
  onRefresh?: () => void;
}

export function RaffleStatus({ 
  fid, 
  detailed = false, 
  className = '',
  onRefresh 
}: RaffleStatusProps) {
  const { data, isLoading, error, refresh, timeUntilEnd } = useRaffleStatus({
    fid,
    detailed,
    autoRefresh: true,
  });

  const handleRefresh = async () => {
    await refresh();
    onRefresh?.();
  };

  if (isLoading && !data) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={`p-6 border-red-200 ${className}`}>
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <ExclamationTriangleIcon className="w-5 h-5" />
          <span className="font-medium">Unable to load raffle status</span>
        </div>
        {error && (
          <p className="text-sm text-red-500 mb-4">{error}</p>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <ArrowPathIcon className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Try Again
        </Button>
      </Card>
    );
  }

  const { user, raffle, raffle_stats, can_participate, required_actions } = data;

  return (
    <Card className={`overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <TicketIcon className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Like2Win Raffle
              </h3>
              <p className="text-sm text-gray-600">
                {raffle ? `${raffle.status.charAt(0).toUpperCase() + raffle.status.slice(1)} Raffle` : 'No Active Raffle'}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="p-6">
        {/* User Status */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Your Status</h4>
            <div className="flex items-center gap-2">
              {user.is_following ? (
                <Badge variant="success" className="text-xs">
                  <CheckCircleIcon className="w-3 h-3 mr-1" />
                  Following
                </Badge>
              ) : (
                <Badge variant="warning" className="text-xs">
                  <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                  Not Following
                </Badge>
              )}
              {user.tip_allowance_enabled && (
                <Badge variant="info" className="text-xs">
                  Tips Enabled
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">
                {user.current_tickets}
              </div>
              <div className="text-sm text-gray-600">Current Tickets</div>
              {user.probability_percent && (
                <div className="text-xs text-amber-500 mt-1">
                  {user.probability_percent}% chance
                </div>
              )}
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {user.current_tickets} {/* This would be total lifetime in real implementation */}
              </div>
              <div className="text-sm text-gray-600">Lifetime Tickets</div>
            </div>
          </div>
        </div>

        {/* Raffle Information */}
        {raffle ? (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Current Raffle</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <TrophyIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">{raffle.total_pool} $DEGEN</div>
                  <div className="text-sm text-gray-600">Prize Pool</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <UsersIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">{raffle.total_participants}</div>
                  <div className="text-sm text-gray-600">Participants</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <ClockIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">{timeUntilEnd || 'Calculating...'}</div>
                  <div className="text-sm text-gray-600">Time Left</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
            <ClockIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No active raffle at the moment</p>
            <p className="text-sm text-gray-500">Check back soon for the next raffle!</p>
          </div>
        )}

        {/* Detailed Stats */}
        {detailed && raffle_stats && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Raffle Statistics</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">{raffle_stats.avg_tickets_per_user}</div>
                <div className="text-gray-600">Avg Tickets/User</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">{raffle_stats.top_participant_tickets}</div>
                <div className="text-gray-600">Top Participant</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">{raffle_stats.eligible_posts_count}</div>
                <div className="text-gray-600">Eligible Posts</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Required */}
        {!can_participate && required_actions.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
              <span className="font-medium text-amber-800">Action Required</span>
            </div>
            <ul className="text-sm text-amber-700 space-y-1">
              {required_actions.map((action, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* How to Participate */}
        {can_participate && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Ready to Participate!</span>
            </div>
            <p className="text-sm text-green-700">
              {user.tip_allowance_enabled 
                ? "Like any official @Like2Win post to earn tickets! 🎫"
                : "Like + Comment + Recast official @Like2Win posts to earn tickets! 🎫"
              }
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}