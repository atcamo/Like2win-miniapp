/**
 * Custom hook for managing user participation in posts
 */

import { useState, useCallback } from 'react';

interface ParticipationData {
  has_liked?: boolean;
  has_commented?: boolean;
  has_recasted?: boolean;
}

interface ParticipateRequest {
  user_fid: number;
  post_cast_hash: string;
  engagement_type: 'like' | 'comment' | 'recast' | 'like_comment_recast';
  engagement_data?: ParticipationData;
}

interface ParticipationResult {
  tickets_earned: number;
  engagement_complete: boolean;
  required_for_completion: string[];
  user_status: {
    current_tickets: number;
    total_lifetime_tickets: number;
  };
  participation_id: string;
}

interface UseParticipationResult {
  participate: (request: ParticipateRequest) => Promise<ParticipationResult>;
  isParticipating: boolean;
  participationError: string | null;
  lastResult: ParticipationResult | null;
}

export function useParticipation(): UseParticipationResult {
  const [isParticipating, setIsParticipating] = useState(false);
  const [participationError, setParticipationError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ParticipationResult | null>(null);

  const participate = useCallback(async (request: ParticipateRequest): Promise<ParticipationResult> => {
    setIsParticipating(true);
    setParticipationError(null);

    try {
      const response = await fetch('/api/raffle/participate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to participate');
      }

      if (result.success) {
        setLastResult(result.data);
        return result.data;
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setParticipationError(errorMessage);
      console.error('Participation failed:', err);
      throw err;
    } finally {
      setIsParticipating(false);
    }
  }, []);

  return {
    participate,
    isParticipating,
    participationError,
    lastResult,
  };
}