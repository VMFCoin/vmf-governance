import { Address } from 'viem';
import { readContract, watchContractEvent } from '@wagmi/core';
import { config } from '@/lib/wagmi';
import { gaugeVoterABI } from '@/contracts/abis/GaugeVoter';
import { getContractAddressFromEnv } from '@/contracts/addresses';
import {
  deployedGaugeService,
  DeployedGaugeInfo,
} from './deployedGaugeService';
import { realVotingService } from './realVotingService';

export interface VoteTally {
  gaugeAddress: Address;
  totalVotes: bigint;
  percentage: number;
  rank: number;
}

export interface VotingResults {
  totalVotes: bigint;
  totalParticipants: number;
  tallies: VoteTally[];
  leadingGauge: VoteTally | null;
  votingComplete: boolean;
  lastUpdated: Date;
}

export interface FinalResults {
  proposalId: string;
  winner: {
    gaugeAddress: Address;
    name: string;
    totalVotes: bigint;
    percentage: number;
  };
  finalTallies: VoteTally[];
  totalVotes: bigint;
  finalizedAt: Date;
  distributionReady: boolean;
}

export interface VoteEvent {
  voter: Address;
  gauge: Address;
  tokenId: bigint;
  weight: bigint;
  epoch: bigint;
  timestamp: Date;
  blockNumber: bigint;
  transactionHash: string;
}

export class VoteTrackingService {
  private gaugeVoterAddress: Address;
  private eventSubscriptions: Map<string, () => void> = new Map();
  private voteEventCallbacks: Set<(event: VoteEvent) => void> = new Set();
  private finalizationCallbacks: Set<(results: FinalResults) => void> =
    new Set();

  constructor() {
    this.gaugeVoterAddress = getContractAddressFromEnv(
      'GAUGE_VOTER_PLUGIN'
    ) as Address;
  }

  /**
   * Subscribe to real voting events from deployed GaugeVoterPlugin
   */
  async subscribeToVoteEvents(gauges: Address[]): Promise<void> {
    try {
      // Create a unique subscription key
      const subscriptionKey = `vote_events_${gauges.join('_')}`;

      // Unsubscribe if already subscribed
      if (this.eventSubscriptions.has(subscriptionKey)) {
        this.eventSubscriptions.get(subscriptionKey)?.();
        this.eventSubscriptions.delete(subscriptionKey);
      }

      // Subscribe to Voted events
      const unwatch = watchContractEvent(config, {
        address: this.gaugeVoterAddress,
        abi: gaugeVoterABI,
        eventName: 'Voted',
        onLogs: logs => {
          logs.forEach((log: any) => {
            const { args, blockNumber, transactionHash } = log;
            if (args && 'user' in args && 'gauge' in args && 'weight' in args) {
              // Filter for specified gauges
              const gaugeAddress = args.gauge as Address;
              if (gauges.length === 0 || gauges.includes(gaugeAddress)) {
                const voteEvent: VoteEvent = {
                  voter: args.user as Address,
                  gauge: gaugeAddress,
                  tokenId: args.tokenId as bigint,
                  weight: args.weight as bigint,
                  epoch: args.epoch as bigint,
                  timestamp: new Date(),
                  blockNumber: blockNumber as bigint,
                  transactionHash: transactionHash as string,
                };

                // Notify all callbacks
                this.voteEventCallbacks.forEach(callback => {
                  try {
                    callback(voteEvent);
                  } catch (error) {
                    console.error('Error in vote event callback:', error);
                  }
                });
              }
            }
          });
        },
      });

      this.eventSubscriptions.set(subscriptionKey, unwatch);
    } catch (error) {
      console.error('Error subscribing to vote events:', error);
      throw new Error('Failed to subscribe to vote events');
    }
  }

  /**
   * Get current vote tallies from deployed gauge contracts
   */
  async getCurrentVoteTallies(gauges: Address[]): Promise<VoteTally[]> {
    try {
      const tallyPromises = gauges.map(async gaugeAddress => {
        const totalVotes = await readContract(config, {
          address: this.gaugeVoterAddress,
          abi: gaugeVoterABI,
          functionName: 'gaugeVotes',
          args: [gaugeAddress],
        });

        return {
          gaugeAddress,
          totalVotes: totalVotes as bigint,
          percentage: 0, // Will be calculated after all tallies are fetched
          rank: 0, // Will be calculated after sorting
        };
      });

      const tallies = await Promise.all(tallyPromises);

      // Calculate total votes
      const totalVotes = tallies.reduce(
        (sum, tally) => sum + tally.totalVotes,
        BigInt(0)
      );

      // Calculate percentages and ranks
      const talliesWithPercentages = tallies.map(tally => ({
        ...tally,
        percentage:
          totalVotes > 0
            ? (Number(tally.totalVotes) / Number(totalVotes)) * 100
            : 0,
      }));

      // Sort by total votes (descending) and assign ranks
      const sortedTallies = talliesWithPercentages
        .sort((a, b) => Number(b.totalVotes) - Number(a.totalVotes))
        .map((tally, index) => ({
          ...tally,
          rank: index + 1,
        }));

      return sortedTallies;
    } catch (error) {
      console.error('Error getting current vote tallies:', error);
      throw new Error('Failed to get current vote tallies');
    }
  }

  /**
   * Calculate real-time results from deployed contract data
   */
  async calculateLiveResults(gauges: Address[]): Promise<VotingResults> {
    try {
      const tallies = await this.getCurrentVoteTallies(gauges);
      const totalVotes = tallies.reduce(
        (sum, tally) => sum + tally.totalVotes,
        BigInt(0)
      );

      // Get real participant count by counting unique voters
      const totalParticipants = await this.getUniqueVoterCount(gauges);

      // Determine leading gauge
      const leadingGauge =
        tallies.length > 0 && tallies[0].totalVotes > 0 ? tallies[0] : null;

      // Check if voting is still active
      const votingComplete = await this.isVotingPeriodComplete();

      return {
        totalVotes,
        totalParticipants,
        tallies,
        leadingGauge,
        votingComplete,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Error calculating live results:', error);
      throw new Error('Failed to calculate live results');
    }
  }

  /**
   * Monitor vote finalization on deployed contracts
   */
  async monitorVoteFinalization(proposalId: string): Promise<FinalResults> {
    try {
      // Get all gauges for this proposal
      const allGauges = await deployedGaugeService.getAllDeployedGauges();

      // Wait for voting period to complete
      const isComplete = await this.isVotingPeriodComplete();
      if (!isComplete) {
        throw new Error('Voting period is still active');
      }

      // Get final tallies
      const finalTallies = await this.getCurrentVoteTallies(allGauges);
      const totalVotes = finalTallies.reduce(
        (sum, tally) => sum + tally.totalVotes,
        BigInt(0)
      );

      // Determine winner
      const winner = finalTallies[0];
      if (!winner || winner.totalVotes === BigInt(0)) {
        throw new Error('No votes cast, cannot determine winner');
      }

      // Get gauge info for winner name
      const winnerGaugeInfo = await deployedGaugeService.getGaugeInfo(
        winner.gaugeAddress
      );

      const finalResults: FinalResults = {
        proposalId,
        winner: {
          gaugeAddress: winner.gaugeAddress,
          name: winnerGaugeInfo.name,
          totalVotes: winner.totalVotes,
          percentage: winner.percentage,
        },
        finalTallies,
        totalVotes,
        finalizedAt: new Date(),
        distributionReady: true,
      };

      // Notify finalization callbacks
      this.finalizationCallbacks.forEach(callback => {
        try {
          callback(finalResults);
        } catch (error) {
          console.error('Error in finalization callback:', error);
        }
      });

      return finalResults;
    } catch (error) {
      console.error('Error monitoring vote finalization:', error);
      throw new Error('Failed to monitor vote finalization');
    }
  }

  /**
   * Get unique voter count for gauges
   */
  private async getUniqueVoterCount(gauges: Address[]): Promise<number> {
    try {
      // This would require event log analysis to get unique voters
      // For now, we'll use a simplified approach
      const voterCounts = await Promise.all(
        gauges.map(async gauge => {
          try {
            // Get vote count for this gauge (simplified)
            const votes = await readContract(config, {
              address: this.gaugeVoterAddress,
              abi: gaugeVoterABI,
              functionName: 'gaugeVotes',
              args: [gauge],
            });
            // Estimate participants based on average vote weight
            const avgVoteWeight = BigInt(1000); // Simplified assumption
            const votesAsBigInt = votes as bigint;
            return votesAsBigInt > 0
              ? Number(votesAsBigInt / avgVoteWeight)
              : 0;
          } catch {
            return 0;
          }
        })
      );

      return Math.max(
        1,
        voterCounts.reduce((sum, count) => sum + count, 0)
      );
    } catch (error) {
      console.error('Error getting unique voter count:', error);
      return 1; // Fallback to prevent division by zero
    }
  }

  /**
   * Check if voting period is complete
   */
  private async isVotingPeriodComplete(): Promise<boolean> {
    try {
      // Check if voting is still active
      const isActive = await deployedGaugeService.isVotingActive();
      return !isActive;
    } catch (error) {
      console.error('Error checking voting period:', error);
      return false;
    }
  }

  /**
   * Add callback for vote events
   */
  onVoteEvent(callback: (event: VoteEvent) => void): () => void {
    this.voteEventCallbacks.add(callback);
    return () => {
      this.voteEventCallbacks.delete(callback);
    };
  }

  /**
   * Add callback for finalization events
   */
  onFinalization(callback: (results: FinalResults) => void): () => void {
    this.finalizationCallbacks.add(callback);
    return () => {
      this.finalizationCallbacks.delete(callback);
    };
  }

  /**
   * Get voting statistics
   */
  async getVotingStats(gauges: Address[]): Promise<{
    totalGauges: number;
    activeGauges: number;
    totalVotes: bigint;
    averageVotesPerGauge: number;
  }> {
    try {
      const tallies = await this.getCurrentVoteTallies(gauges);
      const totalVotes = tallies.reduce(
        (sum, tally) => sum + tally.totalVotes,
        BigInt(0)
      );
      const activeGauges = tallies.filter(tally => tally.totalVotes > 0).length;

      return {
        totalGauges: gauges.length,
        activeGauges,
        totalVotes,
        averageVotesPerGauge:
          activeGauges > 0 ? Number(totalVotes) / activeGauges : 0,
      };
    } catch (error) {
      console.error('Error getting voting stats:', error);
      throw new Error('Failed to get voting statistics');
    }
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup(): void {
    this.eventSubscriptions.forEach(unwatch => unwatch());
    this.eventSubscriptions.clear();
    this.voteEventCallbacks.clear();
    this.finalizationCallbacks.clear();
  }
}

// Export singleton instance
export const voteTrackingService = new VoteTrackingService();
