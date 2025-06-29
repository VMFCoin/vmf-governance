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
  votingPowerBreakdown: ExtendedVotingPowerBreakdown | null;
  isLoading: boolean;
  error: string | null;
  lastFetchTime: number;

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
  clear: () => void;
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
      lastFetchTime: 0,

      // Actions
      fetchUserLocks: async (address: string) => {
        console.log(
          'TokenLockStore: fetchUserLocks called for address:',
          address
        );

        // Validate address format
        if (
          !address ||
          address === '0x0' ||
          address.length !== 42 ||
          !address.startsWith('0x')
        ) {
          console.log(
            'TokenLockStore: Invalid address provided, skipping fetch'
          );
          set({
            userLocks: [],
            votingPowerBreakdown: null,
            isLoading: false,
            error: null,
          });
          return;
        }

        const currentTime = Date.now();
        const { lastFetchTime } = get();

        // Prevent rapid consecutive calls (debounce for 1 second)
        if (currentTime - lastFetchTime < 1000) {
          console.log('TokenLockStore: Skipping fetch due to debounce');
          return;
        }

        set({ isLoading: true, error: null, lastFetchTime: currentTime });

        try {
          console.log(
            'TokenLockStore: Calling realEscrowService.getUserVotingPowerBreakdown...'
          );
          // Use the realEscrowService method that returns the complete breakdown
          const breakdown = await realEscrowService.getUserVotingPowerBreakdown(
            address as `0x${string}`
          );

          console.log('TokenLockStore: Raw breakdown received:', breakdown);
          console.log(
            'TokenLockStore: Breakdown locks count:',
            breakdown.locks?.length || 0
          );
          console.log('TokenLockStore: Active count:', breakdown.activeCount);
          console.log(
            'TokenLockStore: Warming up count:',
            breakdown.warmingUpCount
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
          console.log('TokenLockStore: Converted locks:', convertedLocks);

          // Store the ExtendedVotingPowerBreakdown directly (not the legacy VotingPowerBreakdown)
          console.log('TokenLockStore: Setting breakdown in state:', breakdown);

          set({
            userLocks: convertedLocks,
            votingPowerBreakdown: breakdown, // Store the ExtendedVotingPowerBreakdown directly
            isLoading: false,
          });

          console.log('TokenLockStore: State updated successfully');
          console.log('TokenLockStore: Final state check:', {
            userLocksCount: convertedLocks.length,
            votingPowerBreakdown: breakdown,
            hasActiveLocks: breakdown.activeCount > 0,
            hasWarmingUpLocks: breakdown.warmingUpCount > 0,
          });
        } catch (error) {
          console.error('TokenLockStore: Error fetching user locks:', error);
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
        console.log(
          'TokenLockStore: fetchTokenBalance called for address:',
          address
        );

        // Validate address format
        if (
          !address ||
          address === '0x0' ||
          address.length !== 42 ||
          !address.startsWith('0x')
        ) {
          console.log(
            'TokenLockStore: Invalid address provided, skipping token balance fetch'
          );
          set({ tokenBalance: BigInt(0) });
          return;
        }

        try {
          const balance = await realTokenService.getBalance(
            address as `0x${string}`
          );
          console.log('TokenLockStore: Token balance fetched:', balance);
          set({ tokenBalance: balance });
        } catch (error) {
          console.error('TokenLockStore: Error fetching token balance:', error);
        }
      },

      fetchEscrowAllowance: async (address: string) => {
        console.log(
          'TokenLockStore: fetchEscrowAllowance called for address:',
          address
        );

        // Validate address format
        if (
          !address ||
          address === '0x0' ||
          address.length !== 42 ||
          !address.startsWith('0x')
        ) {
          console.log(
            'TokenLockStore: Invalid address provided, skipping escrow allowance fetch'
          );
          set({ escrowAllowance: BigInt(0) });
          return;
        }

        try {
          const allowance = await realTokenService.getAllowance(
            address as `0x${string}`,
            ESCROW_ADDRESS
          );
          console.log('TokenLockStore: Escrow allowance fetched:', allowance);
          set({ escrowAllowance: allowance });
        } catch (error) {
          console.error(
            'TokenLockStore: Error fetching escrow allowance:',
            error
          );
        }
      },

      getAvailableVotingPower: async (address: string) => {
        console.log(
          'TokenLockStore: getAvailableVotingPower called for address:',
          address
        );
        const breakdown = get().votingPowerBreakdown;
        if (!breakdown) {
          console.log(
            'TokenLockStore: No breakdown available, fetching user locks...'
          );
          await get().fetchUserLocks(address);
          const newBreakdown = get().votingPowerBreakdown;
          console.log(
            'TokenLockStore: Available voting power:',
            newBreakdown?.totalVotingPower || BigInt(0)
          );
          return newBreakdown?.totalVotingPower || BigInt(0);
        }
        console.log(
          'TokenLockStore: Available voting power from cache:',
          breakdown.totalVotingPower
        );
        return breakdown.totalVotingPower;
      },

      getTotalVotingPower: async (address: string) => {
        console.log(
          'TokenLockStore: getTotalVotingPower called for address:',
          address
        );
        const breakdown = get().votingPowerBreakdown;
        if (!breakdown) {
          console.log(
            'TokenLockStore: No breakdown available, fetching user locks...'
          );
          await get().fetchUserLocks(address);
          const newBreakdown = get().votingPowerBreakdown;
          console.log(
            'TokenLockStore: Total voting power after fetch:',
            newBreakdown?.totalVotingPower || BigInt(0)
          );
          return newBreakdown?.totalVotingPower || BigInt(0);
        }
        console.log(
          'TokenLockStore: Total voting power from cache:',
          breakdown.totalVotingPower
        );
        return breakdown.totalVotingPower;
      },

      hasVotingPower: async (address: string) => {
        const totalPower = await get().getTotalVotingPower(address);
        const hasVP = totalPower > BigInt(0);
        console.log(
          'TokenLockStore: hasVotingPower result:',
          hasVP,
          'for power:',
          totalPower
        );
        return hasVP;
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

      clear: () =>
        set({
          userLocks: [],
          votingPowerBreakdown: null,
          isLoading: false,
          error: null,
          tokenBalance: BigInt(0),
          escrowAllowance: BigInt(0),
          lastFetchTime: 0,
        }),

      refreshUserData: async (address: string) => {
        console.log(
          'TokenLockStore: refreshUserData called for address:',
          address
        );
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
          console.log('TokenLockStore: refreshUserData completed successfully');
        } catch (error) {
          console.error('TokenLockStore: Error refreshing user data:', error);
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
