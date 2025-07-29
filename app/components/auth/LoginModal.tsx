/**
 * Login Modal Component - Handles user authentication
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useMiniKitSetup } from '@/app/hooks/useMiniKitSetup';
import { Button } from '@/app/components/ui/Button';
import { Modal } from '@/app/components/ui/Modal';
import { 
  WalletIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const { loginWithWallet, loginWithFarcaster, isLoading, error } = useAuth();
  const { isReady: isMiniKitReady, user: miniKitUser } = useMiniKitSetup();
  
  const [selectedMethod, setSelectedMethod] = useState<'wallet' | 'farcaster' | null>(null);
  const [fidInput, setFidInput] = useState('');

  const handleWalletLogin = async () => {
    try {
      setSelectedMethod('wallet');
      await loginWithWallet();
      onSuccess?.();
      onClose();
    } catch (err) {
      // Error is handled by AuthContext
      setSelectedMethod(null);
    }
  };

  const handleFarcasterLogin = async () => {
    try {
      setSelectedMethod('farcaster');
      
      if (isMiniKitReady && miniKitUser?.fid) {
        // Use MiniKit user data
        await loginWithFarcaster(miniKitUser.fid, {
          username: miniKitUser.username,
          display_name: miniKitUser.displayName,
          pfp_url: miniKitUser.pfpUrl,
        });
      } else if (fidInput) {
        // Use manual FID input
        const fid = parseInt(fidInput);
        if (isNaN(fid) || fid <= 0) {
          throw new Error('Please enter a valid FID');
        }
        await loginWithFarcaster(fid);
      } else {
        throw new Error('Please enter your Farcaster FID or use MiniKit');
      }
      
      onSuccess?.();
      onClose();
    } catch (err) {
      // Error is handled by AuthContext
      setSelectedMethod(null);
    }
  };

  const handleClose = () => {
    setSelectedMethod(null);
    setFidInput('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Connect to Like2Win">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
            <WalletIcon className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Connect Your Account
          </h3>
          <p className="text-sm text-gray-600">
            Choose how you'd like to connect to participate in Like2Win raffles
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* MiniKit Option (if available) */}
        {isMiniKitReady && miniKitUser && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircleIcon className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-blue-900">MiniKit Detected</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              {miniKitUser.pfpUrl && (
                <img 
                  src={miniKitUser.pfpUrl} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div>
                <div className="font-medium text-blue-900">
                  {miniKitUser.displayName || miniKitUser.username}
                </div>
                <div className="text-sm text-blue-600">FID: {miniKitUser.fid}</div>
              </div>
            </div>
            <Button
              onClick={handleFarcasterLogin}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading && selectedMethod === 'farcaster' ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect with MiniKit'
              )}
            </Button>
          </div>
        )}

        {/* Manual Farcaster Login */}
        <div className="space-y-4">
          <div>
            <label htmlFor="fid" className="block text-sm font-medium text-gray-700 mb-2">
              Farcaster FID
            </label>
            <input
              type="number"
              id="fid"
              value={fidInput}
              onChange={(e) => setFidInput(e.target.value)}
              placeholder="Enter your Farcaster FID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Your FID can be found in your Farcaster profile settings
            </p>
          </div>
          
          <Button
            onClick={handleFarcasterLogin}
            disabled={isLoading || !fidInput}
            variant="primary"
            className="w-full"
          >
            {isLoading && selectedMethod === 'farcaster' ? (
              <>
                <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect with Farcaster'
            )}
          </Button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="space-y-4">
          <Button
            onClick={handleWalletLogin}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading && selectedMethod === 'wallet' ? (
              <>
                <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <WalletIcon className="w-4 h-4 mr-2" />
                Connect Wallet Only
              </>
            )}
          </Button>
          
          <p className="text-xs text-gray-500 text-center">
            Wallet connection is optional but enables automatic tip allowance detection
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Why connect?</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-green-500" />
              Track your raffle tickets and participation
            </li>
            <li className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-green-500" />
              Automatic tip allowance detection
            </li>
            <li className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-green-500" />
              Personalized raffle experience
            </li>
            <li className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-green-500" />
              Prize claim notifications
            </li>
          </ul>
        </div>

        {/* Privacy Note */}
        <div className="text-xs text-gray-500 text-center">
          We only store public Farcaster data and wallet addresses. 
          No private keys or sensitive information is stored.
        </div>
      </div>
    </Modal>
  );
}