/**
 * User Profile Component - Shows authenticated user info and controls
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { Card } from '@/app/components/ui/Card';
import { 
  UserIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  WalletIcon,
  TicketIcon
} from '@heroicons/react/24/outline';

interface UserProfileProps {
  className?: string;
  showFullProfile?: boolean;
}

export function UserProfile({ className = '', showFullProfile = false }: UserProfileProps) {
  const { user, logout, updateUser, isWalletConnected, walletAddress } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!user) return null;

  const handleToggleFollowing = async () => {
    try {
      setIsUpdating(true);
      await updateUser({ is_following_like2win: !user.is_following_like2win });
    } catch (err) {
      console.error('Failed to update following status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleTipAllowance = async () => {
    try {
      setIsUpdating(true);
      await updateUser({ tip_allowance_enabled: !user.tip_allowance_enabled });
    } catch (err) {
      console.error('Failed to update tip allowance:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDisplayName = () => {
    if (user.display_name) return user.display_name;
    if (user.username) return user.username;
    if (user.fid) return `User ${user.fid}`;
    return 'Anonymous User';
  };

  if (!showFullProfile) {
    // Compact profile for header/navbar
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {user.pfp_url && (
          <img 
            src={user.pfp_url} 
            alt="Profile" 
            className="w-8 h-8 rounded-full object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">
            {formatDisplayName()}
          </div>
          {user.fid && (
            <div className="text-sm text-gray-500">FID: {user.fid}</div>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={logout}>
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // Full profile view
  return (
    <Card className={className}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-4">
          <div className="relative">
            {user.pfp_url ? (
              <img 
                src={user.pfp_url} 
                alt="Profile" 
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
            {user.is_following_like2win && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {formatDisplayName()}
            </h3>
            {user.fid && (
              <p className="text-sm text-gray-500">Farcaster FID: {user.fid}</p>
            )}
            {user.username && user.display_name && (
              <p className="text-sm text-gray-500">@{user.username}</p>
            )}
          </div>

          <Button variant="ghost" size="sm" onClick={logout}>
            <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-6 border-b">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <div className="text-2xl font-bold text-amber-600">
              {user.total_lifetime_tickets || 0}
            </div>
            <div className="text-sm text-gray-600">Lifetime Tickets</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {user.total_winnings ? parseFloat(user.total_winnings).toFixed(2) : '0.00'}
            </div>
            <div className="text-sm text-gray-600">$DEGEN Won</div>
          </div>
        </div>
      </div>

      {/* Status & Settings */}
      <div className="p-6 space-y-4">
        <h4 className="font-medium text-gray-900">Account Status</h4>
        
        {/* Following Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircleIcon className={`w-5 h-5 ${user.is_following_like2win ? 'text-green-500' : 'text-gray-400'}`} />
            <div>
              <div className="font-medium text-gray-900">Following @Like2Win</div>
              <div className="text-sm text-gray-600">Required to participate in raffles</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={user.is_following_like2win ? 'success' : 'warning'}>
              {user.is_following_like2win ? 'Following' : 'Not Following'}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleToggleFollowing}
              disabled={isUpdating}
            >
              {user.is_following_like2win ? 'Unfollow' : 'Follow'}
            </Button>
          </div>
        </div>

        {/* Tip Allowance */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <TicketIcon className={`w-5 h-5 ${user.tip_allowance_enabled ? 'text-blue-500' : 'text-gray-400'}`} />
            <div>
              <div className="font-medium text-gray-900">Tip Allowance</div>
              <div className="text-sm text-gray-600">
                {user.tip_allowance_enabled ? 'Like only for tickets' : 'Like + Comment + Recast required'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={user.tip_allowance_enabled ? 'success' : 'secondary'}>
              {user.tip_allowance_enabled ? 'Enabled' : 'Disabled'}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleToggleTipAllowance}
              disabled={isUpdating}
            >
              {user.tip_allowance_enabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <WalletIcon className={`w-5 h-5 ${isWalletConnected ? 'text-purple-500' : 'text-gray-400'}`} />
            <div>
              <div className="font-medium text-gray-900">Wallet Connection</div>
              <div className="text-sm text-gray-600">
                {isWalletConnected && walletAddress ? (
                  `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                ) : (
                  'No wallet connected'
                )}
              </div>
            </div>
          </div>
          <Badge variant={isWalletConnected ? 'success' : 'secondary'}>
            {isWalletConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
      </div>

      {/* Help Text */}
      <div className="p-6 bg-blue-50 border-t">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
            <span className="text-xs font-bold text-white">i</span>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How to maximize your chances:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Follow @Like2Win to be eligible for all raffles</li>
              <li>• Enable tip allowance for easier participation (like-only)</li>
              <li>• Participate consistently in official posts</li>
              <li>• Connect your wallet for automatic tip detection</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}