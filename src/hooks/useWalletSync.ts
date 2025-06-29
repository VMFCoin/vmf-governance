'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useWalletStore } from '@/stores/useWalletStore';
import { useUserProfileStore } from '@/stores/useUserProfileStore';
import { useUserStore } from '@/stores/useUserStore';
import { useTokenLockStore } from '@/stores/useTokenLockStore';
import { useCommunityStore } from '@/stores/useCommunityStore';
import { useCharityStore } from '@/stores/useCharityStore';
import { apiCache } from '@/lib/api';
import { votingPowerCalculator } from '@/lib/votingPowerCalculations';

/**
 * Hook to synchronize wagmi wallet state with our custom wallet store
 * Also handles comprehensive cache clearing on disconnect
 */
export function useWalletSync() {
  const { address, isConnected } = useAccount();
  const { setWalletData, disconnect } = useWalletStore();
  const { clearProfile } = useUserProfileStore();
  const { clearAllNotifications } = useUserStore();

  // Comprehensive cache clearing function
  const clearAllCaches = () => {
    console.log('🧹 Clearing all caches and user data...');

    // Clear profile data
    clearProfile();

    // Clear user notifications (keep preferences as they're user settings)
    clearAllNotifications();

    // Clear API cache
    apiCache.clear();

    // Clear voting power calculator cache
    votingPowerCalculator.clearCache();

    // Clear token lock store data (reset to initial state)
    useTokenLockStore.getState().clear();

    // Clear specific localStorage keys for user-specific data
    if (typeof window !== 'undefined') {
      try {
        // Clear profile data from localStorage
        localStorage.removeItem('vmf-user-profile-store');

        // Clear notifications and voting history (keep user preferences)
        const userStore = localStorage.getItem('vmf-user-storage');
        if (userStore) {
          const parsed = JSON.parse(userStore);
          // Keep preferences but clear user-specific data
          const clearedStore = {
            ...parsed,
            state: {
              ...parsed.state,
              userId: null,
              notifications: [],
              votingHistory: [],
              communityActivity: [],
              // Keep preferences, hasSeenWelcome, lastActiveTab
            },
          };
          localStorage.setItem(
            'vmf-user-storage',
            JSON.stringify(clearedStore)
          );
        }

        // Clear any cached notification data
        localStorage.removeItem('vmf_notifications');

        console.log('🗑️  Cleared localStorage user data');
      } catch (error) {
        console.warn('Failed to clear some localStorage data:', error);
      }
    }

    // Note: We don't clear user preferences, community posts, or charity data
    // as these might be considered "global" data not tied to wallet connection

    console.log('✅ Cache clearing completed');
  };

  useEffect(() => {
    if (isConnected && address) {
      // Sync connected state
      setWalletData({
        isConnected: true,
        address: address,
      });
    } else {
      // Sync disconnected state and clear all caches
      disconnect();
      clearAllCaches();
    }
  }, [
    isConnected,
    address,
    setWalletData,
    disconnect,
    clearProfile,
    clearAllNotifications,
  ]);

  return { isConnected, address };
}
