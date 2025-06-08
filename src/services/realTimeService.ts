'use client';

import { Proposal, HolidayCharityProposal } from '@/types';

export interface RealTimeVoteUpdate {
  proposalId: string;
  timestamp: Date;
  totalVotes: number;
  yesPercentage: number;
  noPercentage: number;
  abstainPercentage: number;
  // For holiday charity proposals
  charityVotes?: {
    [charityId: string]: {
      votes: number;
      percentage: number;
    };
  };
  leadingCharity?: string;
}

export interface RealTimeSubscription {
  proposalId: string;
  callback: (update: RealTimeVoteUpdate) => void;
  interval: NodeJS.Timeout;
}

export class RealTimeService {
  private static instance: RealTimeService;
  private subscriptions: Map<string, RealTimeSubscription> = new Map();
  private defaultPollInterval = 5000; // 5 seconds

  private constructor() {}

  public static getInstance(): RealTimeService {
    if (!RealTimeService.instance) {
      RealTimeService.instance = new RealTimeService();
    }
    return RealTimeService.instance;
  }

  /**
   * Subscribe to real-time updates for a proposal
   */
  public subscribe(
    proposalId: string,
    callback: (update: RealTimeVoteUpdate) => void,
    pollInterval: number = this.defaultPollInterval
  ): void {
    // Clear existing subscription if any
    this.unsubscribe(proposalId);

    // Create new subscription with polling
    const interval = setInterval(() => {
      this.fetchLatestVoteData(proposalId).then(update => {
        if (update) {
          callback(update);
        }
      });
    }, pollInterval);

    this.subscriptions.set(proposalId, {
      proposalId,
      callback,
      interval,
    });

    // Fetch initial data immediately
    this.fetchLatestVoteData(proposalId).then(update => {
      if (update) {
        callback(update);
      }
    });
  }

  /**
   * Unsubscribe from real-time updates
   */
  public unsubscribe(proposalId: string): void {
    const subscription = this.subscriptions.get(proposalId);
    if (subscription) {
      clearInterval(subscription.interval);
      this.subscriptions.delete(proposalId);
    }
  }

  /**
   * Unsubscribe from all real-time updates
   */
  public unsubscribeAll(): void {
    this.subscriptions.forEach(subscription => {
      clearInterval(subscription.interval);
    });
    this.subscriptions.clear();
  }

  /**
   * Fetch latest vote data for a proposal (simulated with mock data variations)
   */
  private async fetchLatestVoteData(
    proposalId: string
  ): Promise<RealTimeVoteUpdate | null> {
    try {
      // In a real app, this would be an API call
      // For now, we'll simulate real-time changes with small random variations

      // Get current proposal data from the store
      const { useProposalStore } = await import('@/stores/useProposalStore');
      const proposal = useProposalStore.getState().getProposalById(proposalId);

      if (!proposal) {
        return null;
      }

      // Simulate small random changes to create "live" feeling
      const variation = () => Math.random() * 2 - 1; // -1 to 1
      const currentTotal =
        proposal.yesPercentage +
        proposal.noPercentage +
        proposal.abstainPercentage;

      // Add small variations but keep within realistic bounds
      let yesPercentage = Math.max(
        0,
        Math.min(100, proposal.yesPercentage + variation())
      );
      let noPercentage = Math.max(
        0,
        Math.min(100, proposal.noPercentage + variation())
      );
      let abstainPercentage = Math.max(
        0,
        Math.min(100, proposal.abstainPercentage + variation())
      );

      // Normalize to maintain total
      const total = yesPercentage + noPercentage + abstainPercentage;
      if (total > 0) {
        yesPercentage = (yesPercentage / total) * currentTotal;
        noPercentage = (noPercentage / total) * currentTotal;
        abstainPercentage = (abstainPercentage / total) * currentTotal;
      }

      const update: RealTimeVoteUpdate = {
        proposalId,
        timestamp: new Date(),
        totalVotes: Math.floor(currentTotal * 10), // Simulate vote count
        yesPercentage: Math.round(yesPercentage * 100) / 100,
        noPercentage: Math.round(noPercentage * 100) / 100,
        abstainPercentage: Math.round(abstainPercentage * 100) / 100,
      };

      // Handle holiday charity proposals with charity-specific voting
      if (proposal.type === 'holiday_charity') {
        const holidayProposal = proposal as HolidayCharityProposal;
        const charityVotes: {
          [charityId: string]: { votes: number; percentage: number };
        } = {};

        let totalCharityVotes = 0;
        holidayProposal.availableCharities.forEach(charityId => {
          const baseVotes = holidayProposal.charityVotes[charityId]?.votes || 0;
          const votes = Math.max(0, baseVotes + Math.floor(Math.random() * 3)); // Small random increase
          charityVotes[charityId] = {
            votes,
            percentage: 0, // Will be calculated below
          };
          totalCharityVotes += votes;
        });

        // Calculate percentages
        Object.keys(charityVotes).forEach(charityId => {
          charityVotes[charityId].percentage =
            totalCharityVotes > 0
              ? Math.round(
                  (charityVotes[charityId].votes / totalCharityVotes) *
                    100 *
                    100
                ) / 100
              : 0;
        });

        // Find leading charity
        const leadingCharity = Object.entries(charityVotes).sort(
          ([, a], [, b]) => b.votes - a.votes
        )[0]?.[0];

        update.charityVotes = charityVotes;
        update.leadingCharity = leadingCharity;
      }

      return update;
    } catch (error) {
      console.error('Error fetching real-time vote data:', error);
      return null;
    }
  }

  /**
   * Get active subscriptions count
   */
  public getActiveSubscriptionsCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Check if proposal is subscribed
   */
  public isSubscribed(proposalId: string): boolean {
    return this.subscriptions.has(proposalId);
  }
}

export const realTimeService = RealTimeService.getInstance();
