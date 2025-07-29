/**
 * Raffle Dashboard Page - Main interface for raffle participation tracking
 */

'use client';

import React, { useState, useEffect } from 'react';
import { RaffleStatus } from '@/app/components/raffle/RaffleStatus';
import { RaffleLeaderboard } from '@/app/components/raffle/RaffleLeaderboard';
import { PostParticipation } from '@/app/components/raffle/PostParticipation';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';
import { Logo } from '@/app/components/ui/Logo';
import { 
  TrophyIcon,
  TicketIcon,
  UsersIcon,
  SparklesIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// Mock data for demonstration - in real app this would come from APIs
const mockUser = {
  fid: 12345,
  username: 'alice.eth',
  tip_allowance_enabled: true,
  is_following: true,
};

const mockPosts = [
  {
    id: '1',
    cast_hash: '0xabcdef123456',
    cast_url: 'https://warpcast.com/like2win/0xabcdef123456',
    text_content: '🎲 New raffle is LIVE! Like this post to get your first ticket! 🎫',
    author_fid: 99999,
    engagement_type: 'like' as const,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    total_participations: 45,
    user_participation: null,
    can_participate: true,
  },
  {
    id: '2',
    cast_hash: '0x789abc456def',
    cast_url: 'https://warpcast.com/like2win/0x789abc456def',
    text_content: '💰 Current prize pool: 1,850 $DEGEN! Who will win this Wednesday? 🏆',
    author_fid: 99999,
    engagement_type: 'like' as const,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    total_participations: 32,
    user_participation: {
      has_liked: true,
      has_commented: false,
      has_recasted: false,
      tickets_earned: 1,
      engagement_completed_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    can_participate: false,
  },
  {
    id: '3',
    cast_hash: '0x456def789abc',
    cast_url: 'https://warpcast.com/like2win/0x456def789abc',
    text_content: '🚀 The more you engage, the more chances you have! Follow + Like = Win! ✨',
    author_fid: 99999,
    engagement_type: 'like_comment_recast' as const,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    total_participations: 28,
    user_participation: null,
    can_participate: true,
  },
];

export default function RafflePage() {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'leaderboard' | 'posts'>('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleParticipationComplete = (result: any) => {
    console.log('Participation completed:', result);
    // Trigger refresh of components
    setRefreshKey(prev => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-amber-900/20">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-sm"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="text-center">
              {/* Logo with Trophy badge */}
              <div className="flex justify-center mb-6">
                <Logo 
                  size="lg" 
                  badge={<TrophyIcon className="w-4 h-4 text-white" />}
                />
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  Raffle Dashboard
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Track your participation and compete for $DEGEN rewards in our transparent, fair raffles
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Card className="p-6 text-center group hover:shadow-2xl transition-all duration-300 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border border-amber-200/30">
            <div className="mx-auto w-14 h-14 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <TicketIcon className="w-7 h-7 text-white" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent mb-1">47</div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Your Tickets</div>
          </Card>
          
          <Card className="p-6 text-center group hover:shadow-2xl transition-all duration-300 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border border-blue-200/30">
            <div className="mx-auto w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <UsersIcon className="w-7 h-7 text-white" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-1">2,347</div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Participants</div>
          </Card>
          
          <Card className="p-6 text-center group hover:shadow-2xl transition-all duration-300 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border border-green-200/30">
            <div className="mx-auto w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <SparklesIcon className="w-7 h-7 text-white" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">15,000</div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">$DEGEN Pool</div>
          </Card>
          
          <Card className="p-6 text-center group hover:shadow-2xl transition-all duration-300 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border border-purple-200/30">
            <div className="mx-auto w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <TrophyIcon className="w-7 h-7 text-white" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">2.0%</div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Win Chance</div>
          </Card>
        </div>

        {/* Enhanced Navigation Tabs */}
        <div className={`flex space-x-2 mb-8 p-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl border border-amber-200/30 shadow-lg transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Button
            variant={selectedTab === 'overview' ? 'gradient' : 'ghost'}
            onClick={() => setSelectedTab('overview')}
            className={`flex-1 rounded-xl font-medium transition-all duration-300 ${
              selectedTab === 'overview' 
                ? 'shadow-lg transform scale-105' 
                : 'hover:bg-amber-50 dark:hover:bg-gray-700'
            }`}
          >
            <InformationCircleIcon className="w-4 h-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={selectedTab === 'leaderboard' ? 'gradient' : 'ghost'}
            onClick={() => setSelectedTab('leaderboard')}
            className={`flex-1 rounded-xl font-medium transition-all duration-300 ${
              selectedTab === 'leaderboard' 
                ? 'shadow-lg transform scale-105' 
                : 'hover:bg-amber-50 dark:hover:bg-gray-700'
            }`}
          >
            <TrophyIcon className="w-4 h-4 mr-2" />
            Leaderboard
          </Button>
          <Button
            variant={selectedTab === 'posts' ? 'gradient' : 'ghost'}
            onClick={() => setSelectedTab('posts')}
            className={`flex-1 rounded-xl font-medium transition-all duration-300 ${
              selectedTab === 'posts' 
                ? 'shadow-lg transform scale-105' 
                : 'hover:bg-amber-50 dark:hover:bg-gray-700'
            }`}
          >
            <TicketIcon className="w-4 h-4 mr-2" />
            Posts
          </Button>
        </div>

        {/* Tab Content */}
        {selectedTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Status */}
            <div className="lg:col-span-2">
              <RaffleStatus 
                key={refreshKey}
                fid={mockUser.fid}
                detailed={true}
                onRefresh={handleRefresh}
                className="mb-6"
              />
              
              {/* How It Works */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <InformationCircleIcon className="w-6 h-6 text-blue-500" />
                  <h3 className="text-lg font-semibold text-gray-900">How to Participate</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Follow @Like2Win</div>
                      <div className="text-sm text-gray-600">Must be following to participate in raffles</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-amber-600">2</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {mockUser.tip_allowance_enabled ? 'Like Official Posts' : 'Like + Comment + Recast'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {mockUser.tip_allowance_enabled 
                          ? 'Each like on official posts earns 1 ticket'
                          : 'Complete all three actions to earn 1 ticket per post'
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-purple-600">3</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Win Prizes</div>
                      <div className="text-sm text-gray-600">Raffles draw every Wednesday and Sunday at 8PM UTC</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <RaffleLeaderboard 
                key={refreshKey}
                userFid={mockUser.fid}
                limit={10}
              />
            </div>
          </div>
        )}

        {selectedTab === 'leaderboard' && (
          <div className="max-w-4xl">
            <RaffleLeaderboard 
              key={refreshKey}
              userFid={mockUser.fid}
              limit={50}
            />
          </div>
        )}

        {selectedTab === 'posts' && (
          <div className="max-w-4xl">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Eligible Posts</h2>
              <p className="text-gray-600">
                Like these official @Like2Win posts to earn raffle tickets. 
                {mockUser.tip_allowance_enabled 
                  ? ' You only need to like each post!'
                  : ' You need to like, comment, and recast each post to earn tickets.'
                }
              </p>
            </div>
            
            <div className="space-y-6">
              {mockPosts.map((post) => (
                <PostParticipation
                  key={post.id}
                  post={post}
                  user={mockUser}
                  onParticipationComplete={handleParticipationComplete}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}