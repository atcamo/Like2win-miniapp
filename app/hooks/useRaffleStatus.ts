/**
 * Custom hook for managing raffle status and user participation
 */

import { useState, useEffect, useCallback } from 'react';
import { UserRaffleStatus, RaffleStats } from '@/lib/database/models';

interface UseRaffleStatusProps {
  fid?: number;
  detailed?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface RaffleStatusData {
  user: {
    fid: number;
    username?: string;
    is_following: boolean;
    tip_allowance_enabled: boolean;
    current_tickets: number;
    probability_percent?: string;
  };
  raffle: {
    id: string;
    status: string;
    end_date: Date;
    total_participants: number;
    total_pool: string;
  } | null;
  raffle_stats?: {
    avg_tickets_per_user: string;
    top_participant_tickets: number;
    eligible_posts_count: number;
  };
  recent_activity?: any[];
  can_participate: boolean;
  required_actions: string[];
}

interface UseRaffleStatusResult {
  data: RaffleStatusData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  timeUntilEnd: string | null;
}

export function useRaffleStatus({
  fid,
  detailed = false,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: UseRaffleStatusProps): UseRaffleStatusResult {
  const [data, setData] = useState<RaffleStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeUntilEnd, setTimeUntilEnd] = useState<string | null>(null);

  const fetchRaffleStatus = useCallback(async () => {
    if (!fid) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        fid: fid.toString(),
        ...(detailed && { detailed: 'true' })
      });

      const response = await fetch(`/api/raffle/status?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch raffle status');
      }

      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Failed to fetch raffle status:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fid, detailed]);

  // Calculate time until raffle end
  const updateTimeUntilEnd = useCallback(() => {
    if (!data?.raffle?.end_date) {
      setTimeUntilEnd(null);
      return;
    }

    const now = new Date();
    const endDate = new Date(data.raffle.end_date);
    const diff = endDate.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeUntilEnd('Ended');
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      setTimeUntilEnd(`${days}d ${hours}h ${minutes}m`);
    } else if (hours > 0) {
      setTimeUntilEnd(`${hours}h ${minutes}m`);
    } else {
      setTimeUntilEnd(`${minutes}m`);
    }
  }, [data]);

  // Initial fetch
  useEffect(() => {
    fetchRaffleStatus();
  }, [fetchRaffleStatus]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !fid) return;

    const interval = setInterval(fetchRaffleStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, fid, refreshInterval, fetchRaffleStatus]);

  // Update countdown timer
  useEffect(() => {
    updateTimeUntilEnd();
    const interval = setInterval(updateTimeUntilEnd, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [updateTimeUntilEnd]);

  const refresh = useCallback(async () => {
    await fetchRaffleStatus();
  }, [fetchRaffleStatus]);

  return {
    data,
    isLoading,
    error,
    refresh,
    timeUntilEnd,
  };
}