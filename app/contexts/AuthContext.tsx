/**
 * Authentication Context - Manages user authentication state
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

interface User {
  fid?: number;
  username?: string;
  display_name?: string;
  pfp_url?: string;
  wallet_address?: string;
  tip_allowance_enabled: boolean;
  is_following_like2win: boolean;
  total_lifetime_tickets: number;
}

interface AuthContextType {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Authentication methods
  loginWithWallet: () => Promise<void>;
  loginWithFarcaster: (fid: number, userData?: Partial<User>) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  
  // Wallet state
  isWalletConnected: boolean;
  walletAddress?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Wagmi hooks for wallet connection
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const isAuthenticated = !!user;
  const isWalletConnected = isConnected && !!address;

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Handle wallet connection changes
  useEffect(() => {
    if (isWalletConnected && user && address && address !== user.wallet_address) {
      // Update user's wallet address if it changed
      updateUser({ wallet_address: address });
    }
  }, [isWalletConnected, address, user]);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Check for stored authentication
      const storedUser = localStorage.getItem('like2win_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Optionally refresh user data from server
        if (userData.fid) {
          await refreshUserData(userData.fid);
        }
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      setError('Failed to initialize authentication');
      localStorage.removeItem('like2win_user');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserData = async (fid: number) => {
    try {
      const response = await fetch(`/api/users/${fid}?include_stats=true`);
      const result = await response.json();
      
      if (result.success && result.data.user) {
        const updatedUser = result.data.user;
        setUser(updatedUser);
        localStorage.setItem('like2win_user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error('Failed to refresh user data:', err);
    }
  };

  const loginWithWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isWalletConnected) {
        // Connect wallet first
        const connector = connectors[0]; // Use first available connector
        if (connector) {
          connect({ connector });
        } else {
          throw new Error('No wallet connector available');
        }
        return;
      }

      // Check if user exists with this wallet address
      const response = await fetch(`/api/users/wallet/${address}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.user) {
          setUser(result.data.user);
          localStorage.setItem('like2win_user', JSON.stringify(result.data.user));
          return;
        }
      }

      // If no user found, create minimal user with wallet
      const newUser: User = {
        wallet_address: address,
        tip_allowance_enabled: false,
        is_following_like2win: false,
        total_lifetime_tickets: 0,
      };

      setUser(newUser);
      localStorage.setItem('like2win_user', JSON.stringify(newUser));

    } catch (err) {
      console.error('Wallet login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to login with wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithFarcaster = async (fid: number, userData: Partial<User> = {}) => {
    try {
      setIsLoading(true);
      setError(null);

      // Create or update user with Farcaster data
      const userPayload = {
        fid,
        username: userData.username,
        display_name: userData.display_name,
        pfp_url: userData.pfp_url,
        tip_allowance_enabled: userData.tip_allowance_enabled || false,
        ...(isWalletConnected && { wallet_address: address }),
      };

      const response = await fetch(`/api/users/${fid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to authenticate with Farcaster');
      }

      if (result.success && result.data.user) {
        const authenticatedUser = result.data.user;
        setUser(authenticatedUser);
        localStorage.setItem('like2win_user', JSON.stringify(authenticatedUser));
      } else {
        throw new Error('Invalid response from server');
      }

    } catch (err) {
      console.error('Farcaster login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to login with Farcaster');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user?.fid) {
      throw new Error('No authenticated user to update');
    }

    try {
      setError(null);

      const response = await fetch(`/api/users/${user.fid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user');
      }

      if (result.success && result.data.user) {
        const updatedUser = result.data.user;
        setUser(updatedUser);
        localStorage.setItem('like2win_user', JSON.stringify(updatedUser));
      }

    } catch (err) {
      console.error('Update user error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user');
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('like2win_user');
    
    // Disconnect wallet if connected
    if (isWalletConnected) {
      disconnect();
    }
  };

  const contextValue: AuthContextType = {
    // User state
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Authentication methods
    loginWithWallet,
    loginWithFarcaster,
    logout,
    updateUser,
    
    // Wallet state
    isWalletConnected,
    walletAddress: address,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}