'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useWalletStore } from '@/stores/useWalletStore';

/**
 * Hook to synchronize wagmi wallet state with our custom wallet store
 */
export function useWalletSync() {
  const { address, isConnected } = useAccount();
  const { setWalletData, disconnect } = useWalletStore();

  useEffect(() => {
    if (isConnected && address) {
      // Sync connected state
      setWalletData({
        isConnected: true,
        address: address,
      });
    } else {
      // Sync disconnected state
      disconnect();
    }
  }, [isConnected, address, setWalletData, disconnect]);

  return { isConnected, address };
}
