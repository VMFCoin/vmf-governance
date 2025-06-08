'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  realTimeService,
  RealTimeVoteUpdate,
} from '@/services/realTimeService';
import { useProposalStore } from '@/stores/useProposalStore';

export interface UseRealTimeVotingOptions {
  enabled?: boolean;
  pollInterval?: number;
  autoUpdate?: boolean; // Whether to automatically update the proposal store
}

export interface UseRealTimeVotingReturn {
  liveVoteData: RealTimeVoteUpdate | null;
  isLiveUpdating: boolean;
  lastUpdateTime: Date | null;
  enableLiveUpdates: () => void;
  disableLiveUpdates: () => void;
  forceUpdate: () => void;
  error: string | null;
}

export const useRealTimeVoting = (
  proposalId: string,
  options: UseRealTimeVotingOptions = {}
): UseRealTimeVotingReturn => {
  const { enabled = true, pollInterval = 5000, autoUpdate = false } = options;

  const [liveVoteData, setLiveVoteData] = useState<RealTimeVoteUpdate | null>(
    null
  );
  const [isLiveUpdating, setIsLiveUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { updateProposal } = useProposalStore();

  // Handle real-time vote updates
  const handleVoteUpdate = useCallback(
    (update: RealTimeVoteUpdate) => {
      try {
        setLiveVoteData(update);
        setLastUpdateTime(update.timestamp);
        setError(null);

        // Optionally update the proposal store with live data
        if (autoUpdate) {
          const proposalUpdates: any = {
            yesPercentage: update.yesPercentage,
            noPercentage: update.noPercentage,
            abstainPercentage: update.abstainPercentage,
          };

          // Handle holiday charity proposal updates
          if (update.charityVotes) {
            proposalUpdates.charityVotes = update.charityVotes;
            proposalUpdates.totalVotes = update.totalVotes;
            proposalUpdates.leadingCharity = update.leadingCharity;
          }

          updateProposal(proposalId, proposalUpdates);
        }
      } catch (err) {
        console.error('Error handling vote update:', err);
        setError('Failed to process vote update');
      }
    },
    [proposalId, autoUpdate, updateProposal]
  );

  // Enable live updates
  const enableLiveUpdates = useCallback(() => {
    if (!proposalId) return;

    setIsLiveUpdating(true);
    setError(null);

    try {
      realTimeService.subscribe(proposalId, handleVoteUpdate, pollInterval);
    } catch (err) {
      console.error('Error enabling live updates:', err);
      setError('Failed to enable live updates');
      setIsLiveUpdating(false);
    }
  }, [proposalId, handleVoteUpdate, pollInterval]);

  // Disable live updates
  const disableLiveUpdates = useCallback(() => {
    setIsLiveUpdating(false);
    realTimeService.unsubscribe(proposalId);
  }, [proposalId]);

  // Force an immediate update
  const forceUpdate = useCallback(() => {
    if (!isLiveUpdating) return;

    // Temporarily disable and re-enable to trigger immediate fetch
    realTimeService.unsubscribe(proposalId);
    setTimeout(() => {
      realTimeService.subscribe(proposalId, handleVoteUpdate, pollInterval);
    }, 100);
  }, [proposalId, handleVoteUpdate, pollInterval, isLiveUpdating]);

  // Initialize real-time updates when enabled
  useEffect(() => {
    if (enabled && proposalId) {
      enableLiveUpdates();
    }

    return () => {
      if (proposalId) {
        disableLiveUpdates();
      }
    };
  }, [enabled, proposalId, enableLiveUpdates, disableLiveUpdates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (proposalId) {
        realTimeService.unsubscribe(proposalId);
      }
    };
  }, [proposalId]);

  return {
    liveVoteData,
    isLiveUpdating,
    lastUpdateTime,
    enableLiveUpdates,
    disableLiveUpdates,
    forceUpdate,
    error,
  };
};
