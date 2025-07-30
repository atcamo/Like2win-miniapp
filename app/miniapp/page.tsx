"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sdk } from "@farcaster/miniapp-sdk";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Logo } from "../components/ui/Logo";
import { HeartIcon, TrophyIcon, MoneyIcon, ShieldIcon } from "../components/icons";

export default function MiniApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isFarcasterContext, setIsFarcasterContext] = useState(false);
  const [raffleStats, setRaffleStats] = useState({
    currentPrize: "15,000",
    participantsCount: "2,400+",
    yourTickets: 0,
    nextDraw: "Wednesday 8PM UTC"
  });
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const initializeMiniApp = async () => {
      try {
        console.log('🚀 Initializing MiniApp...');
        console.log('🔍 Current URL:', window.location.href);
        console.log('🔍 User Agent:', navigator.userAgent);
        
        // Check if we're in Farcaster context
        const isInFarcaster = window.location.href.includes('farcaster.xyz') || 
                             window.location.href.includes('warpcast.com') ||
                             navigator.userAgent.includes('Farcaster') ||
                             window.parent !== window; // Check if in iframe
        
        console.log('🔍 Is in Farcaster context:', isInFarcaster);
        setIsFarcasterContext(isInFarcaster);
        
        // Load interface first
        setIsLoading(false);
        
        if (isInFarcaster) {
          // Small delay to ensure DOM is fully rendered
          await new Promise(resolve => setTimeout(resolve, 50));
          
          if (!isMounted) return;
          
          // Now call ready() after interface is loaded
          console.log('📞 Calling SDK ready()...');
          await sdk.actions.ready();
          console.log('✅ SDK ready() called successfully - splash screen should be hidden');
          
          // Get user context after ready() call
          try {
            const context = await sdk.context;
            console.log('👤 SDK context:', context);
            if (context?.user && isMounted) {
              setUser(context.user);
            }
          } catch (contextError) {
            console.error('❌ Failed to get SDK context:', contextError);
          }
        } else {
          console.log('ℹ️ Running outside Farcaster - SDK calls skipped');
        }
        
        if (isMounted) {
          setTimeout(() => {
            if (isMounted) setIsVisible(true);
          }, 100);
        }
      } catch (error) {
        console.error("❌ Failed to initialize mini app:", error);
        
        // Only try to call ready() if we're in Farcaster context
        if (isFarcasterContext) {
          try {
            console.log('🔄 Retrying SDK ready() after error...');
            await sdk.actions.ready();
            console.log('✅ SDK ready() retry successful');
          } catch (readyError) {
            console.error('❌ Failed to call ready() on retry:', readyError);
          }
        }
        
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeMiniApp();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStartParticipating = () => {
    router.push('/raffle');
  };

  const handleViewLeaderboard = () => {
    router.push('/raffle?tab=leaderboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-amber-900/20">
        <div className="text-center">
          {/* Logo with loading animation */}
          <div className="relative mb-8">
            <Logo size="xl" variant="loading" className="mx-auto" />
          </div>
          
          {/* Loading text with pulse animation */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 bg-clip-text text-transparent">
              Like2Win
            </h2>
            <p className="text-amber-700/80 dark:text-amber-300/80 font-medium animate-pulse">
              Loading your mini app...
            </p>
          </div>
          
          {/* Loading dots */}
          <div className="flex justify-center space-x-1 mt-6">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-amber-900/20">
      {/* Header with Logo */}
      <div className="relative px-4 pt-8 pb-6">
        <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Logo with Brand */}
          <div className="flex justify-center mb-6">
            <Logo size="lg" showBrand />
          </div>
          
          {/* Tagline */}
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
            Turn Your Farcaster Likes Into
          </p>
          <p className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
            Real $DEGEN Rewards
          </p>
          
          {/* Context Warning */}
          {!isFarcasterContext && (
            <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700/30 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ℹ️ This is a preview. Open in Farcaster for full functionality.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Current Raffle Status */}
      <div className={`px-4 mb-6 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <Card className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 backdrop-blur-lg border border-amber-200/30 dark:border-amber-700/30">
          <div className="text-center p-6">
            <div className="flex items-center justify-center mb-4">
              <TrophyIcon size="lg" className="text-amber-600 mr-2" />
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Current Raffle
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-2xl font-bold text-amber-600">
                  {raffleStats.currentPrize}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  $DEGEN Prize Pool
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">
                  {raffleStats.participantsCount}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Active Participants
                </div>
              </div>
            </div>
            
            <div className="bg-white/60 dark:bg-gray-900/60 rounded-xl p-3 backdrop-blur-sm">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Next Draw
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {raffleStats.nextDraw}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Your Status */}
      {user && (
        <div className={`px-4 mb-6 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">
                    {user.displayName?.[0] || user.username?.[0] || '?'}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {user.displayName || user.username || 'Anonymous'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Your Status
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <div className="text-xl font-bold text-amber-600">
                    {raffleStats.yourTickets}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Your Tickets
                  </div>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-xl font-bold text-green-600">
                    {raffleStats.yourTickets > 0 ? ((raffleStats.yourTickets / 1000) * 100).toFixed(1) : '0.0'}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Win Chance
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className={`px-4 mb-6 transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="grid grid-cols-1 gap-4">
          <Button
            variant="gradient"
            size="lg"
            onClick={handleStartParticipating}
            className="w-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            <HeartIcon size="md" className="mr-2" />
            Start Participating
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={handleViewLeaderboard}
            className="w-full border-2 border-amber-300 hover:bg-amber-600 hover:text-white transition-all duration-300"
          >
            <TrophyIcon size="md" className="mr-2" />
            View Leaderboard
          </Button>
        </div>
      </div>

      {/* How It Works */}
      <div className={`px-4 mb-8 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">
              How It Works
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-sm font-bold text-amber-600">1</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Follow @Like2Win
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Must be following to participate
                  </div>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-sm font-bold text-amber-600">2</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Engage with Posts
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Like, comment, or recast to earn tickets
                  </div>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-sm font-bold text-amber-600">3</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Win Prizes
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Bi-weekly draws every Wed & Sun at 8PM UTC
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Features */}
      <div className={`px-4 mb-8 transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center">
            <MoneyIcon size="md" className="mx-auto text-amber-600 mb-2" />
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Fair Economics
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              90% to winners
            </div>
          </Card>
          
          <Card className="p-4 text-center">
            <ShieldIcon size="md" className="mx-auto text-amber-600 mb-2" />
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Provably Fair
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Chainlink VRF
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-8 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Like2Win - Fair raffles for the Farcaster community
        </p>
      </div>
    </div>
  );
}