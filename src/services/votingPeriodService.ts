import { Address } from 'viem';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { realVotingService } from './realVotingService';
import { voteTrackingService } from './voteTrackingService';
import { EventType, useEventStore } from './eventMonitor';

export interface VotingPeriod {
  id: string;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  isFinalized: boolean;
  totalParticipants: number;
  totalVotes: bigint;
  winnerGaugeAddress?: Address;
  winnerCharityId?: string;
  finalResults?: VotingResult[];
}

export interface VotingResult {
  gaugeAddress: Address;
  charityId: string;
  totalVotes: bigint;
  percentage: number;
  rank: number;
  isWinner: boolean;
}

export interface VotingPeriodState {
  currentPeriod: VotingPeriod | null;
  previousPeriods: VotingPeriod[];
  isLoading: boolean;
  error: string | null;
  timeRemaining: number; // in seconds
  finalizationInProgress: boolean;
}

export interface VotingPeriodActions {
  loadCurrentPeriod: () => Promise<void>;
  loadPreviousPeriods: (limit?: number) => Promise<void>;
  finalizeCurrentPeriod: () => Promise<void>;
  announceWinner: (gaugeAddress: Address, charityId: string) => Promise<void>;
  updateTimeRemaining: () => void;
  subscribeToTimeUpdates: () => () => void;
  reset: () => void;
}

export type VotingPeriodStore = VotingPeriodState & VotingPeriodActions;

// Create the voting period store
export const useVotingPeriodStore = create<VotingPeriodStore>()(
  subscribeWithSelector((set, get) => ({
    currentPeriod: null,
    previousPeriods: [],
    isLoading: false,
    error: null,
    timeRemaining: 0,
    finalizationInProgress: false,

    loadCurrentPeriod: async () => {
      set({ isLoading: true, error: null });

      try {
        // For now, create a mock current period since the contract doesn't have getCurrentVotingPeriod
        // This would be replaced with actual contract calls when available
        const now = Date.now();
        const period: VotingPeriod = {
          id: `period_${now}`,
          startTime: new Date(now - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          endTime: new Date(now + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          isActive: true,
          isFinalized: false,
          totalParticipants: 0,
          totalVotes: BigInt(0),
        };

        set({ currentPeriod: period, isLoading: false });

        // Update time remaining
        get().updateTimeRemaining();
      } catch (error) {
        console.error('Error loading current voting period:', error);
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to load voting period',
          isLoading: false,
        });
      }
    },

    loadPreviousPeriods: async (limit = 10) => {
      try {
        // Mock previous periods for now
        const periods: VotingPeriod[] = [];

        for (let i = 1; i <= Math.min(limit, 3); i++) {
          const endTime = Date.now() - i * 14 * 24 * 60 * 60 * 1000;
          periods.push({
            id: `period_${endTime}`,
            startTime: new Date(endTime - 7 * 24 * 60 * 60 * 1000),
            endTime: new Date(endTime),
            isActive: false,
            isFinalized: true,
            totalParticipants: Math.floor(Math.random() * 100) + 50,
            totalVotes: BigInt(Math.floor(Math.random() * 10000) + 1000),
            winnerGaugeAddress: ('0x' +
              Math.random().toString(16).slice(2, 42)) as Address,
            winnerCharityId: `charity_${i}`,
          });
        }

        set({ previousPeriods: periods });
      } catch (error) {
        console.error('Error loading previous voting periods:', error);
      }
    },

    finalizeCurrentPeriod: async () => {
      const { currentPeriod } = get();
      if (!currentPeriod || currentPeriod.isFinalized) {
        throw new Error('No active period to finalize');
      }

      set({ finalizationInProgress: true, error: null });

      try {
        // Get final results from tracking service
        const gaugeAddresses = await realVotingService.getAllGauges();
        const finalResults =
          await voteTrackingService.calculateLiveResults(gaugeAddresses);

        // Determine winner (highest vote count)
        const winner = finalResults.tallies.find(t => t.rank === 1);

        if (winner) {
          // Update local state
          const updatedPeriod: VotingPeriod = {
            ...currentPeriod,
            isFinalized: true,
            isActive: false,
            winnerGaugeAddress: winner.gaugeAddress,
            totalVotes: finalResults.totalVotes,
            totalParticipants: finalResults.totalParticipants,
            finalResults: finalResults.tallies.map(t => ({
              gaugeAddress: t.gaugeAddress,
              charityId: '', // Will be resolved from mapping
              totalVotes: t.totalVotes,
              percentage: t.percentage,
              rank: t.rank,
              isWinner: t.rank === 1,
            })),
          };

          set({
            currentPeriod: updatedPeriod,
            finalizationInProgress: false,
          });

          // Emit finalization event
          useEventStore.getState().addEvent({
            type: EventType.VOTE_FINALIZED,
            data: {
              periodId: currentPeriod.id,
              winner: winner.gaugeAddress,
              totalVotes: finalResults.totalVotes.toString(),
              totalParticipants: finalResults.totalParticipants,
            },
          });
        } else {
          throw new Error('No winner found in results');
        }
      } catch (error) {
        console.error('Error finalizing voting period:', error);
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to finalize period',
          finalizationInProgress: false,
        });
        throw error;
      }
    },

    announceWinner: async (gaugeAddress: Address, charityId: string) => {
      const { currentPeriod } = get();
      if (!currentPeriod || !currentPeriod.isFinalized) {
        throw new Error('Period must be finalized before announcing winner');
      }

      try {
        // Update period with winner info
        const updatedPeriod: VotingPeriod = {
          ...currentPeriod,
          winnerCharityId: charityId,
        };

        set({ currentPeriod: updatedPeriod });

        // Emit winner announcement event
        useEventStore.getState().addEvent({
          type: EventType.WINNER_ANNOUNCED,
          data: {
            periodId: currentPeriod.id,
            winnerGauge: gaugeAddress,
            winnerCharity: charityId,
            totalVotes: currentPeriod.totalVotes.toString(),
          },
        });
      } catch (error) {
        console.error('Error announcing winner:', error);
        throw error;
      }
    },

    updateTimeRemaining: () => {
      const { currentPeriod } = get();
      if (!currentPeriod || !currentPeriod.isActive) {
        set({ timeRemaining: 0 });
        return;
      }

      const now = Date.now();
      const endTime = currentPeriod.endTime.getTime();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

      set({ timeRemaining: remaining });

      // Auto-finalize if time has expired
      if (remaining === 0 && !currentPeriod.isFinalized) {
        setTimeout(() => {
          get().finalizeCurrentPeriod().catch(console.error);
        }, 1000);
      }
    },

    subscribeToTimeUpdates: () => {
      const interval = setInterval(() => {
        get().updateTimeRemaining();
      }, 1000);

      return () => clearInterval(interval);
    },

    reset: () => {
      set({
        currentPeriod: null,
        previousPeriods: [],
        isLoading: false,
        error: null,
        timeRemaining: 0,
        finalizationInProgress: false,
      });
    },
  }))
);

// Voting Period Service Class
export class VotingPeriodService {
  private static instance: VotingPeriodService;
  private timeUpdateUnsubscribe: (() => void) | null = null;

  private constructor() {}

  static getInstance(): VotingPeriodService {
    if (!VotingPeriodService.instance) {
      VotingPeriodService.instance = new VotingPeriodService();
    }
    return VotingPeriodService.instance;
  }

  /**
   * Initialize the service and start monitoring
   */
  async initialize(): Promise<void> {
    const store = useVotingPeriodStore.getState();

    // Load current period
    await store.loadCurrentPeriod();

    // Start time updates
    this.startTimeUpdates();

    // Load recent periods
    await store.loadPreviousPeriods(5);
  }

  /**
   * Start automatic time updates
   */
  startTimeUpdates(): void {
    if (this.timeUpdateUnsubscribe) {
      this.timeUpdateUnsubscribe();
    }

    this.timeUpdateUnsubscribe = useVotingPeriodStore
      .getState()
      .subscribeToTimeUpdates();
  }

  /**
   * Stop automatic time updates
   */
  stopTimeUpdates(): void {
    if (this.timeUpdateUnsubscribe) {
      this.timeUpdateUnsubscribe();
      this.timeUpdateUnsubscribe = null;
    }
  }

  /**
   * Check if voting period has ended and auto-finalize
   */
  async checkAndFinalizePeriod(): Promise<void> {
    const { currentPeriod, finalizeCurrentPeriod } =
      useVotingPeriodStore.getState();

    if (
      currentPeriod &&
      currentPeriod.isActive &&
      !currentPeriod.isFinalized &&
      Date.now() >= currentPeriod.endTime.getTime()
    ) {
      console.log('Voting period has ended, auto-finalizing...');
      await finalizeCurrentPeriod();
    }
  }

  /**
   * Get formatted time remaining
   */
  getFormattedTimeRemaining(): string {
    const { timeRemaining } = useVotingPeriodStore.getState();

    if (timeRemaining <= 0) return 'Voting ended';

    const days = Math.floor(timeRemaining / (24 * 60 * 60));
    const hours = Math.floor((timeRemaining % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((timeRemaining % (60 * 60)) / 60);
    const seconds = timeRemaining % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get voting period progress (0-100)
   */
  getVotingProgress(): number {
    const { currentPeriod } = useVotingPeriodStore.getState();

    if (!currentPeriod) return 0;

    const now = Date.now();
    const start = currentPeriod.startTime.getTime();
    const end = currentPeriod.endTime.getTime();
    const duration = end - start;
    const elapsed = now - start;

    return Math.min(100, Math.max(0, (elapsed / duration) * 100));
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopTimeUpdates();
    useVotingPeriodStore.getState().reset();
  }
}

// Export singleton instance
export const votingPeriodService = VotingPeriodService.getInstance();

// Helper function to format voting period duration
export const formatVotingPeriodDuration = (
  startTime: Date,
  endTime: Date
): string => {
  const duration = endTime.getTime() - startTime.getTime();
  const days = Math.floor(duration / (24 * 60 * 60 * 1000));
  const hours = Math.floor(
    (duration % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
  );

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ${hours > 0 ? `${hours}h` : ''}`;
  } else {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
};

// Helper function to get voting period status
export const getVotingPeriodStatus = (
  period: VotingPeriod
): 'upcoming' | 'active' | 'ended' | 'finalized' => {
  const now = Date.now();

  if (period.isFinalized) return 'finalized';
  if (now >= period.endTime.getTime()) return 'ended';
  if (now >= period.startTime.getTime()) return 'active';
  return 'upcoming';
};
