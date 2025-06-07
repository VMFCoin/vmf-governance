'use client';

import { useState, useEffect } from 'react';
import { useWalletSync } from './useWalletSync';
import { useProfile } from './useProfile';
import { useTokenLockStore } from '@/stores/useTokenLockStore';

export interface PrerequisiteStatus {
  wallet: 'connected' | 'disconnected';
  profile: 'exists' | 'missing' | 'loading';
  tokenLock: 'sufficient' | 'insufficient' | 'none' | 'loading';
  warmup: 'complete' | 'pending' | 'not_applicable' | 'loading';
  votingPower: 'available' | 'insufficient' | 'used' | 'loading';
}

export interface VotingPrerequisitesData {
  status: PrerequisiteStatus;
  isAllRequirementsMet: boolean;
  totalVotingPower: bigint;
  availableVotingPower: bigint;
  warmupTimeRemaining: number;
  activeLocksCount: number;
  pendingLocksCount: number;
  isLoading: boolean;
  error: string | null;
}

export interface UseVotingPrerequisitesOptions {
  minimumPower?: bigint;
  requireWarmupComplete?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useVotingPrerequisites = (
  options: UseVotingPrerequisitesOptions = {}
): VotingPrerequisitesData => {
  const {
    minimumPower = BigInt(0),
    requireWarmupComplete = true,
    autoRefresh = true,
    refreshInterval = 5000, // 5 seconds
  } = options;

  const { isConnected, address } = useWalletSync();
  const { hasProfile, isLoading: profileLoading } = useProfile();
  const {
    userLocks,
    votingPowerBreakdown,
    isLoading: lockLoading,
    error: lockError,
    fetchUserLocks,
    getTotalVotingPower,
    getAvailableVotingPower,
    checkWarmupStatus,
    getWarmupTimeRemaining,
  } = useTokenLockStore();

  const [status, setStatus] = useState<PrerequisiteStatus>({
    wallet: 'disconnected',
    profile: 'loading',
    tokenLock: 'loading',
    warmup: 'loading',
    votingPower: 'loading',
  });

  const [totalVotingPower, setTotalVotingPower] = useState<bigint>(BigInt(0));
  const [availableVotingPower, setAvailableVotingPower] = useState<bigint>(
    BigInt(0)
  );
  const [warmupTimeRemaining, setWarmupTimeRemaining] = useState<number>(0);

  // Auto-refresh data
  useEffect(() => {
    if (!autoRefresh || !isConnected || !address) return;

    const interval = setInterval(() => {
      fetchUserLocks(address);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, isConnected, address, refreshInterval, fetchUserLocks]);

  // Update status when dependencies change
  useEffect(() => {
    const updateStatus = async () => {
      if (!address) {
        setStatus({
          wallet: 'disconnected',
          profile: 'loading',
          tokenLock: 'loading',
          warmup: 'not_applicable',
          votingPower: 'loading',
        });
        return;
      }

      // Wallet status
      const walletStatus: PrerequisiteStatus['wallet'] = isConnected
        ? 'connected'
        : 'disconnected';

      // Profile status
      const profileStatus: PrerequisiteStatus['profile'] = profileLoading
        ? 'loading'
        : hasProfile
          ? 'exists'
          : 'missing';

      // Token lock status
      let tokenLockStatus: PrerequisiteStatus['tokenLock'] = 'loading';
      let warmupStatus: PrerequisiteStatus['warmup'] = 'loading';
      let votingPowerStatus: PrerequisiteStatus['votingPower'] = 'loading';

      if (!lockLoading && isConnected) {
        // Get voting power data
        const totalPower = await getTotalVotingPower(address);
        const availablePower = await getAvailableVotingPower(address);

        setTotalVotingPower(totalPower);
        setAvailableVotingPower(availablePower);

        // Token lock status
        if (userLocks.length === 0) {
          tokenLockStatus = 'none';
        } else if (totalPower >= minimumPower) {
          tokenLockStatus = 'sufficient';
        } else {
          tokenLockStatus = 'insufficient';
        }

        // Warmup status
        if (userLocks.length === 0) {
          warmupStatus = 'not_applicable';
        } else {
          const activeLocksWithWarmup = userLocks.filter(
            lock => !lock.isWarmupComplete
          );
          const activeLocksComplete = userLocks.filter(
            lock => lock.isWarmupComplete
          );

          if (
            activeLocksWithWarmup.length === 0 &&
            activeLocksComplete.length > 0
          ) {
            warmupStatus = 'complete';
          } else if (activeLocksWithWarmup.length > 0) {
            warmupStatus = 'pending';
            // Calculate remaining warmup time for the earliest completing lock
            const earliestWarmup = Math.min(
              ...activeLocksWithWarmup.map(lock =>
                getWarmupTimeRemaining(lock.id)
              )
            );
            setWarmupTimeRemaining(earliestWarmup);
          } else {
            warmupStatus = 'not_applicable';
          }
        }

        // Voting power status
        if (availablePower === BigInt(0)) {
          votingPowerStatus = totalPower > BigInt(0) ? 'used' : 'insufficient';
        } else if (availablePower >= minimumPower) {
          votingPowerStatus = 'available';
        } else {
          votingPowerStatus = 'insufficient';
        }
      }

      setStatus({
        wallet: walletStatus,
        profile: profileStatus,
        tokenLock: tokenLockStatus,
        warmup: warmupStatus,
        votingPower: votingPowerStatus,
      });
    };

    updateStatus();
  }, [
    address,
    isConnected,
    hasProfile,
    profileLoading,
    userLocks,
    votingPowerBreakdown,
    lockLoading,
    minimumPower,
    requireWarmupComplete,
    getTotalVotingPower,
    getAvailableVotingPower,
    getWarmupTimeRemaining,
  ]);

  // Calculate derived data
  const activeLocksCount = userLocks.filter(
    lock => lock.isWarmupComplete
  ).length;
  const pendingLocksCount = userLocks.filter(
    lock => !lock.isWarmupComplete
  ).length;

  // Determine if all requirements are met
  const isAllRequirementsMet =
    status.wallet === 'connected' &&
    status.profile === 'exists' &&
    (status.tokenLock === 'sufficient' ||
      status.tokenLock === 'insufficient') &&
    (!requireWarmupComplete ||
      status.warmup === 'complete' ||
      status.warmup === 'not_applicable') &&
    status.votingPower === 'available';

  const isLoading =
    status.profile === 'loading' ||
    status.tokenLock === 'loading' ||
    status.warmup === 'loading' ||
    status.votingPower === 'loading';

  return {
    status,
    isAllRequirementsMet,
    totalVotingPower,
    availableVotingPower,
    warmupTimeRemaining,
    activeLocksCount,
    pendingLocksCount,
    isLoading,
    error: lockError,
  };
};
