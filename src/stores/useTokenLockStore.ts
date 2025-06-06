'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TokenLock, VotingPowerBreakdown, MockTransaction } from '@/types';
import { mockTokenService } from '@/services/mockTokenService';
import { mockEscrowService } from '@/services/mockEscrowService';
import { mockGaugeVotingService } from '@/services/mockGaugeVotingService';

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
}

const ESCROW_ADDRESS = '0xESCROW_CONTRACT_ADDRESS';

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
          const tokenIds = await mockEscrowService.getUserTokens(address);
          const locks: TokenLock[] = [];

          for (const tokenId of tokenIds) {
            const lock = await mockEscrowService.getLock(tokenId);
            if (lock) {
              locks.push(lock);
            }
          }

          const breakdown =
            await mockEscrowService.getUserVotingPowerBreakdown(address);

          // Calculate power used in voting
          let powerUsed = BigInt(0);
          for (const lock of locks) {
            const used = await mockGaugeVotingService.getVotingPowerUsed(
              lock.id
            );
            powerUsed += used;
          }

          const votingPowerBreakdown: VotingPowerBreakdown = {
            ...breakdown,
            powerUsed,
            powerAvailable: breakdown.totalVotingPower - powerUsed,
          };

          set({
            userLocks: locks,
            votingPowerBreakdown,
            isLoading: false,
          });
        } catch (error) {
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
          const balance = await mockTokenService.getBalance(address);
          set({ tokenBalance: balance });
        } catch (error) {
          console.error('Error fetching token balance:', error);
        }
      },

      fetchEscrowAllowance: async (address: string) => {
        try {
          const allowance = await mockTokenService.getAllowance(
            address,
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
        return await mockEscrowService.checkWarmupPeriod(tokenId);
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
        await Promise.all([
          get().fetchUserLocks(address),
          get().fetchTokenBalance(address),
          get().fetchEscrowAllowance(address),
        ]);
      },
    }),
    {
      name: 'vmf-token-lock-store',
      partialize: state => ({
        userLocks: state.userLocks,
        votingPowerBreakdown: state.votingPowerBreakdown,
      }),
    }
  )
);
