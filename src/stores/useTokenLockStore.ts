'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TokenLock, VotingPowerBreakdown, MockTransaction } from '@/types';
import { ExtendedLockInfo } from '@/types/lock';
import { ExtendedVotingPowerBreakdown } from '@/types/lock';
import { realTokenService } from '@/services/realTokenService';
import { realEscrowService } from '@/services/realEscrowService';
import { mockGaugeVotingService } from '@/services/mockGaugeVotingService';
import { useWalletStore } from '@/stores/useWalletStore';
import { DEPLOYED_CONTRACTS } from '@/contracts/addresses';

interface TokenLockState {
  // Data
  userLocks: TokenLock[];
  votingPowerBreakdown: VotingPowerBreakdown | null;
  isLoading: boolean;
  error: string | null;

  // Token balance and allowance
  tokenBalance: bigint;
  escrowAllowance: bigint;

  // Actions
  fetchUserLocks: (address: string) => Promise<void>;
  fetchTokenBalance: (address: string) => Promise<void>;
  fetchEscrowAllowance: (address: string) => Promise<void>;

  // Voting power
  getAvailableVotingPower: (address: string) => Promise<bigint>;
  getTotalVotingPower: (address: string) => Promise<bigint>;
  hasVotingPower: (address: string) => Promise<boolean>;

  // Warmup period
  checkWarmupStatus: (tokenId: number) => Promise<boolean>;
  getWarmupTimeRemaining: (tokenId: number) => number;

  // Utilities
  clearError: () => void;
  refreshUserData: (address: string) => Promise<void>;

  // New methods
  extendLock: (tokenId: number, additionalDays: number) => Promise<void>;
  increaseLockAmount: (
    tokenId: number,
    additionalAmount: bigint
  ) => Promise<void>;
  mergeLocks: (fromTokenId: number, toTokenId: number) => Promise<void>;
  withdrawLock: (tokenId: number) => Promise<void>;
}

const ESCROW_ADDRESS = DEPLOYED_CONTRACTS.VOTING_ESCROW;

// Helper functions to handle BigInt serialization
const bigIntReplacer = (key: string, value: any) => {
  return typeof value === 'bigint' ? value.toString() + 'n' : value;
};

const bigIntReviver = (key: string, value: any) => {
  if (typeof value === 'string' && value.endsWith('n')) {
    try {
      return BigInt(value.slice(0, -1));
    } catch {
      return value;
    }
  }
  return value;
};

// Serialize state for persistence
const serializeState = (state: any) => {
  return JSON.stringify(state, bigIntReplacer);
};

// Deserialize state from persistence
const deserializeState = (str: string) => {
  try {
    return JSON.parse(str, bigIntReviver);
  } catch {
    return {};
  }
};

export const useTokenLockStore = create<TokenLockState>()(
  persist(
    (set, get) => ({
      // Initial state
      userLocks: [],
      votingPowerBreakdown: null,
      isLoading: false,
      error: null,
      tokenBalance: BigInt(0),
      escrowAllowance: BigInt(0),

      // Actions
      fetchUserLocks: async (address: string) => {
        set({ isLoading: true, error: null });
        try {
          // Use the realEscrowService method that returns the complete breakdown
          const breakdown = await realEscrowService.getUserVotingPowerBreakdown(
            address as `0x${string}`
          );

          // Calculate power used in voting (using mock service for now as gauge voting isn't implemented yet)
          let powerUsed = BigInt(0);
          try {
            for (const lock of breakdown.locks) {
              const used = await mockGaugeVotingService.getVotingPowerUsed(
                lock.tokenId
              );
              powerUsed += used;
            }
          } catch (error) {
            console.warn(
              'Gauge voting service not available, setting powerUsed to 0'
            );
            powerUsed = BigInt(0);
          }

          // Convert ExtendedLockInfo to TokenLock format
          const convertToTokenLock = (
            extendedLock: ExtendedLockInfo
          ): TokenLock => ({
            id: extendedLock.tokenId,
            owner: extendedLock.owner || address || '',
            amount: extendedLock.amount,
            lockDuration: 0, // Calculate if needed based on creation and end time
            createdAt: extendedLock.createdAt || new Date(),
            expiresAt: new Date(extendedLock.end * 1000),
            warmupEndsAt: extendedLock.warmupEndTime,
            votingPower: extendedLock.votingPower,
            isWarmupComplete: extendedLock.isWarmupComplete,
          });

          const convertedLocks = breakdown.locks.map(convertToTokenLock);

          const votingPowerBreakdown: VotingPowerBreakdown = {
            totalLocked: breakdown.totalLocked,
            totalVotingPower: breakdown.totalVotingPower,
            activeVotingPower: breakdown.activeVotingPower,
            warmingUpLocked: breakdown.warmingUpLocked,
            warmingUpCount: breakdown.warmingUpCount,
            activeLocked: breakdown.activeLocked,
            activeCount: breakdown.activeCount,
            locks: convertedLocks,
            powerUsed,
            powerAvailable: breakdown.totalVotingPower - powerUsed,
          };

          set({
            userLocks: convertedLocks,
            votingPowerBreakdown,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error fetching user locks:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch user locks',
            isLoading: false,
          });
        }
      },

      fetchTokenBalance: async (address: string) => {
        try {
          const balance = await realTokenService.getBalance(
            address as `0x${string}`
          );
          set({ tokenBalance: balance });
        } catch (error) {
          console.error('Error fetching token balance:', error);
        }
      },

      fetchEscrowAllowance: async (address: string) => {
        try {
          const allowance = await realTokenService.getAllowance(
            address as `0x${string}`,
            ESCROW_ADDRESS
          );
          set({ escrowAllowance: allowance });
        } catch (error) {
          console.error('Error fetching escrow allowance:', error);
        }
      },

      getAvailableVotingPower: async (address: string) => {
        const breakdown = get().votingPowerBreakdown;
        if (!breakdown) {
          await get().fetchUserLocks(address);
          return get().votingPowerBreakdown?.powerAvailable || BigInt(0);
        }
        return breakdown.powerAvailable;
      },

      getTotalVotingPower: async (address: string) => {
        const breakdown = get().votingPowerBreakdown;
        if (!breakdown) {
          await get().fetchUserLocks(address);
          return get().votingPowerBreakdown?.totalVotingPower || BigInt(0);
        }
        return breakdown.totalVotingPower;
      },

      hasVotingPower: async (address: string) => {
        const totalPower = await get().getTotalVotingPower(address);
        return totalPower > BigInt(0);
      },

      checkWarmupStatus: async (tokenId: number) => {
        try {
          // For real implementation, check if the lock has passed the warmup period
          const lock = get().userLocks.find(l => l.id === tokenId);
          if (!lock) return false;

          return lock.isWarmupComplete;
        } catch (error) {
          console.error('Error checking warmup status:', error);
          return false;
        }
      },

      getWarmupTimeRemaining: (tokenId: number) => {
        const lock = get().userLocks.find(l => l.id === tokenId);
        if (!lock || lock.isWarmupComplete) return 0;

        const now = new Date().getTime();
        const warmupEnd = lock.warmupEndsAt.getTime();
        return Math.max(0, warmupEnd - now);
      },

      clearError: () => set({ error: null }),

      refreshUserData: async (address: string) => {
        // Add delay to prevent rate limiting
        const delay = (ms: number) =>
          new Promise(resolve => setTimeout(resolve, ms));

        try {
          // Fetch data sequentially with delays to prevent rate limiting
          await get().fetchUserLocks(address);
          await delay(100);

          await get().fetchTokenBalance(address);
          await delay(100);

          await get().fetchEscrowAllowance(address);
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
      },

      // New methods - Updated to use real services
      extendLock: async (tokenId: number, additionalDays: number) => {
        const { address } = useWalletStore.getState();
        if (!address) throw new Error('Wallet not connected');

        try {
          set({ isLoading: true, error: null });

          // Note: This would need to be implemented in realEscrowService
          // For now, throw an error indicating it's not implemented
          throw new Error(
            'Lock extension not yet implemented for real contracts'
          );

          // Refresh user data
          // await get().fetchUserLocks(address);
        } catch (error) {
          console.error('Error extending lock:', error);
          set({
            error:
              error instanceof Error ? error.message : 'Failed to extend lock',
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      increaseLockAmount: async (tokenId: number, additionalAmount: bigint) => {
        const { address } = useWalletStore.getState();
        if (!address) throw new Error('Wallet not connected');

        try {
          set({ isLoading: true, error: null });

          // Note: This would need to be implemented in realEscrowService
          // For now, throw an error indicating it's not implemented
          throw new Error(
            'Lock amount increase not yet implemented for real contracts'
          );

          // Refresh user data
          // await get().fetchUserLocks(address);
        } catch (error) {
          console.error('Error increasing lock amount:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to increase lock amount',
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      mergeLocks: async (fromTokenId: number, toTokenId: number) => {
        const { address } = useWalletStore.getState();
        if (!address) throw new Error('Wallet not connected');

        try {
          set({ isLoading: true, error: null });

          // Note: This would need to be implemented in realEscrowService
          // For now, throw an error indicating it's not implemented
          throw new Error(
            'Lock merging not yet implemented for real contracts'
          );

          // Refresh user data
          // await get().fetchUserLocks(address);
        } catch (error) {
          console.error('Error merging locks:', error);
          set({
            error:
              error instanceof Error ? error.message : 'Failed to merge locks',
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      withdrawLock: async (tokenId: number) => {
        const { address } = useWalletStore.getState();
        if (!address) throw new Error('Wallet not connected');

        try {
          set({ isLoading: true, error: null });

          // Note: This would need to be implemented in realEscrowService
          // For now, throw an error indicating it's not implemented
          throw new Error(
            'Lock withdrawal not yet implemented for real contracts'
          );

          // Refresh user data
          // await get().fetchUserLocks(address);
        } catch (error) {
          console.error('Error withdrawing lock:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to withdraw lock',
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'vmf-token-lock-store',
      partialize: state => ({
        // Only persist non-BigInt data to avoid serialization issues
        // Don't persist locks as they contain BigInt values and should be fetched fresh
        isLoading: false,
        error: null,
      }),
    }
  )
);
