/**
 * PostParticipation Component - Handle user participation in posts
 */

'use client';

import React, { useState } from 'react';
import { useParticipation } from '@/app/hooks/useParticipation';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { 
  HeartIcon,
  ChatBubbleLeftIcon,
  ArrowPathRoundedSquareIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartIconSolid,
} from '@heroicons/react/24/solid';

interface PostParticipationProps {
  post: {
    id: string;
    cast_hash: string;
    cast_url?: string;
    text_content?: string;
    author_fid: number;
    engagement_type: 'like' | 'like_comment_recast';
    created_at: string;
    total_participations: number;
    user_participation?: {
      has_liked: boolean;
      has_commented: boolean;
      has_recasted: boolean;
      tickets_earned: number;
      engagement_completed_at?: string;
    } | null;
    can_participate: boolean | null;
  };
  user: {
    fid: number;
    tip_allowance_enabled: boolean;
    is_following: boolean;
  };
  onParticipationComplete?: (result: any) => void;
  className?: string;
}

export function PostParticipation({ 
  post, 
  user, 
  onParticipationComplete,
  className = '' 
}: PostParticipationProps) {
  const { participate, isParticipating, participationError } = useParticipation();
  const [localEngagement, setLocalEngagement] = useState({
    has_liked: Boolean(post.user_participation?.has_liked),
    has_commented: Boolean(post.user_participation?.has_commented),
    has_recasted: Boolean(post.user_participation?.has_recasted),
  });

  const isCompleted = post.user_participation?.engagement_completed_at;
  const ticketsEarned = post.user_participation?.tickets_earned || 0;

  // Determine what actions are required
  const requiredActions = user.tip_allowance_enabled ? ['like'] : ['like', 'comment', 'recast'];
  const completedActions = [
    localEngagement.has_liked && 'like',
    localEngagement.has_commented && 'comment',
    localEngagement.has_recasted && 'recast',
  ].filter(Boolean) as string[];

  const isEngagementComplete = user.tip_allowance_enabled 
    ? localEngagement.has_liked
    : localEngagement.has_liked && localEngagement.has_commented && localEngagement.has_recasted;

  const handleEngagement = async (type: 'like' | 'comment' | 'recast') => {
    if (!user.is_following) {
      alert('You must follow @Like2Win to participate!');
      return;
    }

    if (isCompleted) {
      return; // Already completed
    }

    const newEngagement = {
      ...localEngagement,
      [`has_${type}`]: true,
    };

    setLocalEngagement(newEngagement);

    try {
      const result = await participate({
        user_fid: user.fid,
        post_cast_hash: post.cast_hash,
        engagement_type: user.tip_allowance_enabled ? 'like' : 'like_comment_recast',
        engagement_data: newEngagement,
      });

      onParticipationComplete?.(result);
    } catch (error) {
      // Revert local state on error
      setLocalEngagement(localEngagement);
      console.error('Participation failed:', error);
    }
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

  return (
    <Card className={`overflow-hidden ${className}`}>
      {/* Post Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              @Like2Win Official
            </Badge>
            <span className="text-sm text-gray-500">
              {formatTimeAgo(post.created_at)}
            </span>
          </div>
          {isCompleted && (
            <Badge variant="success" className="text-xs">
              <CheckCircleIcon className="w-3 h-3 mr-1" />
              +{ticketsEarned} Ticket{ticketsEarned !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        
        {post.text_content && (
          <p className="text-gray-900 mb-3 leading-relaxed">
            {post.text_content}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{post.total_participations} participations</span>
          {post.cast_url && (
            <a 
              href={post.cast_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600"
            >
              View on Warpcast
            </a>
          )}
        </div>
      </div>

      {/* Engagement Actions */}
      <div className="p-4">
        {!user.is_following ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
            <ExclamationTriangleIcon className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-amber-800 font-medium mb-1">Follow Required</p>
            <p className="text-sm text-amber-600">
              You must follow @Like2Win to participate in raffles
            </p>
          </div>
        ) : post.can_participate === false ? (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
            <CheckCircleIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 font-medium">Already Participated</p>
            <p className="text-sm text-gray-500">
              You've already earned tickets from this post
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">
                {user.tip_allowance_enabled ? 'Like to Earn Ticket' : 'Complete All Actions'}
              </h4>
              {isEngagementComplete && !isCompleted && (
                <Badge variant="success" className="text-xs animate-pulse">
                  <SparklesIcon className="w-3 h-3 mr-1" />
                  Ready to Submit!
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Like Button */}
              <Button
                variant={localEngagement.has_liked ? "primary" : "outline"}
                size="sm"
                onClick={() => handleEngagement('like')}
                disabled={isParticipating || isCompleted || localEngagement.has_liked}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                {localEngagement.has_liked ? (
                  <HeartIconSolid className="w-5 h-5 text-red-500" />
                ) : (
                  <HeartIcon className="w-5 h-5" />
                )}
                <span className="text-xs">
                  {localEngagement.has_liked ? 'Liked' : 'Like'}
                </span>
              </Button>

              {/* Comment Button */}
              <Button
                variant={localEngagement.has_commented ? "primary" : "outline"}
                size="sm"
                onClick={() => handleEngagement('comment')}
                disabled={
                  isParticipating || 
                  isCompleted || 
                  localEngagement.has_commented ||
                  user.tip_allowance_enabled
                }
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <ChatBubbleLeftIcon className="w-5 h-5" />
                <span className="text-xs">
                  {localEngagement.has_commented ? 'Commented' : 'Comment'}
                </span>
                {user.tip_allowance_enabled && (
                  <span className="text-xs text-gray-400">Optional</span>
                )}
              </Button>

              {/* Recast Button */}
              <Button
                variant={localEngagement.has_recasted ? "primary" : "outline"}
                size="sm"
                onClick={() => handleEngagement('recast')}
                disabled={
                  isParticipating || 
                  isCompleted || 
                  localEngagement.has_recasted ||
                  user.tip_allowance_enabled
                }
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <ArrowPathRoundedSquareIcon className="w-5 h-5" />
                <span className="text-xs">
                  {localEngagement.has_recasted ? 'Recasted' : 'Recast'}
                </span>
                {user.tip_allowance_enabled && (
                  <span className="text-xs text-gray-400">Optional</span>
                )}
              </Button>
            </div>

            {/* Progress Indicator */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Progress</span>
                <span className="text-gray-900">
                  {completedActions.length}/{requiredActions.length} actions
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(completedActions.length / requiredActions.length) * 100}%` 
                  }}
                />
              </div>
              {!isEngagementComplete && (
                <p className="text-xs text-gray-500 mt-2">
                  {user.tip_allowance_enabled 
                    ? "Like this post to earn 1 ticket!"
                    : "Complete all three actions to earn 1 ticket!"
                  }
                </p>
              )}
            </div>

            {/* Error Display */}
            {participationError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700">{participationError}</span>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isParticipating && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-blue-700">Processing your participation...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}