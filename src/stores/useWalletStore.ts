'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WalletState {
  // Connection state
  isConnected: boolean;
  address: string | null;
  ensName: string | null;

  // VMF Token data
  vmfBalance: number;
  votingPower: number;

  // User preferences
  preferredNetwork: string;

  // Actions
  setWalletData: (data: {
    isConnected: boolean;
    address: string | null;
    ensName?: string | null;
  }) => void;
  setVMFBalance: (balance: number) => void;
  calculateVotingPower: () => void;
  setPreferredNetwork: (network: string) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // Initial state
      isConnected: false,
      address: null,
      ensName: null,
      vmfBalance: 0,
      votingPower: 0,
      preferredNetwork: 'mainnet',

      // Actions
      setWalletData: data => {
        set({
          isConnected: data.isConnected,
          address: data.address,
          ensName: data.ensName || null,
        });

        // If connected, simulate VMF balance
        if (data.isConnected && data.address) {
          const mockBalance = Math.floor(Math.random() * 10000) + 1000; // 1000-11000 VMF
          get().setVMFBalance(mockBalance);
        }
      },

      setVMFBalance: balance => {
        set({ vmfBalance: balance });
        get().calculateVotingPower();
      },

      calculateVotingPower: () => {
        const { vmfBalance } = get();
        // Voting power calculation: 1 VMF = 1 vote, with diminishing returns for large holders
        const votingPower = Math.floor(
          vmfBalance <= 1000
            ? vmfBalance
            : 1000 + Math.sqrt(vmfBalance - 1000) * 10
        );
        set({ votingPower });
      },

      setPreferredNetwork: network => {
        set({ preferredNetwork: network });
      },

      disconnect: () => {
        set({
          isConnected: false,
          address: null,
          ensName: null,
          vmfBalance: 0,
          votingPower: 0,
        });
      },
    }),
    {
      name: 'vmf-wallet-storage',
      partialize: state => ({
        preferredNetwork: state.preferredNetwork,
        // Don't persist sensitive wallet data
      }),
    }
  )
);
