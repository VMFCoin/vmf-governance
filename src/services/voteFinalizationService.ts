import { voteTrackingService } from './voteTrackingService';
import { deployedGaugeService } from './deployedGaugeService';
import { transactionManager } from './transactionManager';
import { Charity } from '@/types';

export interface VoteFinalizationResult {
  proposalId: string;
  holidayId: string;
  finalizedAt: Date;
  totalVotes: bigint;
  totalVoters: number;
  winner: {
    gaugeAddress: string;
    charity: Charity;
    totalVotes: bigint;
    percentage: number;
    rank: number;
  };
  results: Array<{
    gaugeAddress: string;
    charity: Charity;
    totalVotes: bigint;
    percentage: number;
    rank: number;
  }>;
  margin: number;
  isConclusive: boolean;
}

export interface FinalizationStatus {
  proposalId: string;
  status: 'pending' | 'processing' | 'finalized' | 'failed';
  progress: number;
  message: string;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface FinalizationTransaction {
  id: string;
  proposalId: string;
  type: 'finalization';
  status: 'pending' | 'confirmed' | 'failed';
  hash?: string;
  timestamp: Date;
  gasUsed?: bigint;
  error?: string;
}

export interface VotingStatistics {
  totalProposalsFinalized: number;
  totalVotesCast: bigint;
  totalVoters: number;
  averageParticipation: number;
  mostPopularCharity: {
    charity: Charity;
    wins: number;
    totalVotes: bigint;
  };
  closestRace: {
    proposalId: string;
    margin: number;
    winner: Charity;
    runnerUp: Charity;
  };
  participationTrend: Array<{
    proposalId: string;
    date: Date;
    totalVotes: bigint;
    uniqueVoters: number;
  }>;
}

class VoteFinalizationService {
  private finalizationStatus = new Map<string, FinalizationStatus>();
  private finalizedResults = new Map<string, VoteFinalizationResult>();
  private finalizationTransactions = new Map<string, FinalizationTransaction>();

  /**
   * Finalize voting for a proposal
   */
  async finalizeVoting(
    proposalId: string,
    gaugeAddresses: string[]
  ): Promise<string> {
    if (gaugeAddresses.length === 0) {
      throw new Error('No gauges provided for finalization');
    }

    if (this.finalizedResults.has(proposalId)) {
      throw new Error('Proposal has already been finalized');
    }

    const finalizationId = `finalization_${proposalId}_${Date.now()}`;

    // Initialize finalization status
    const status: FinalizationStatus = {
      proposalId,
      status: 'pending',
      progress: 0,
      message: 'Initializing vote finalization...',
      startedAt: new Date(),
    };

    this.finalizationStatus.set(proposalId, status);

    // Start async processing
    this.processFinalization(proposalId, gaugeAddresses, finalizationId);

    return finalizationId;
  }

  /**
   * Process the finalization asynchronously
   */
  private async processFinalization(
    proposalId: string,
    gaugeAddresses: string[],
    finalizationId: string
  ): Promise<void> {
    try {
      const status = this.finalizationStatus.get(proposalId)!;

      // Update status to processing
      status.status = 'processing';
      status.progress = 10;
      status.message = 'Collecting vote data...';

      // Collect all vote data
      const voteTallies = new Map<string, bigint>();
      const charityData = new Map<string, Charity>();

      for (const gaugeAddress of gaugeAddresses) {
        const tallies = await voteTrackingService.getCurrentVoteTallies([
          gaugeAddress as `0x${string}`,
        ]);
        if (tallies && tallies.length > 0) {
          const tally = tallies[0];
          voteTallies.set(gaugeAddress, tally.totalVotes);

          // Get charity data
          const gaugeInfo = await deployedGaugeService.getGaugeInfo(
            gaugeAddress as `0x${string}`
          );
          if (gaugeInfo?.metadataURI) {
            const metadata = deployedGaugeService.parseGaugeMetadata(
              gaugeInfo.metadataURI
            );
            if (metadata?.charityId) {
              // Create a mock charity object for now
              const mockCharity: Charity = {
                id: metadata.charityId,
                name: metadata.name || 'Unknown Charity',
                description: metadata.description || '',
                logo: '/placeholder.png',
                category: 'General' as any,
                website: '',
              } as any;
              charityData.set(gaugeAddress, mockCharity);
            }
          }
        }
      }

      status.progress = 40;
      status.message = 'Calculating final results...';

      // Calculate final results
      const finalResults = this.calculateFinalResults(voteTallies, charityData);

      status.progress = 70;
      status.message = 'Recording finalization on blockchain...';

      // Simulate blockchain transaction for finalization
      const transaction: FinalizationTransaction = {
        id: finalizationId,
        proposalId,
        type: 'finalization',
        status: 'pending',
        timestamp: new Date(),
      };

      this.finalizationTransactions.set(finalizationId, transaction);

      // Simulate transaction processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      transaction.status = 'confirmed';
      transaction.hash = `0x${Math.random().toString(16).substr(2, 64)}`;
      transaction.gasUsed = BigInt(Math.floor(Math.random() * 100000) + 50000);

      status.progress = 90;
      status.message = 'Finalizing results...';

      // Create finalization result
      const result: VoteFinalizationResult = {
        proposalId,
        holidayId: `holiday_${proposalId}`,
        finalizedAt: new Date(),
        totalVotes: finalResults.totalVotes,
        totalVoters: finalResults.totalVoters,
        winner: finalResults.winner,
        results: finalResults.results,
        margin: finalResults.margin,
        isConclusive: finalResults.margin > 5, // Consider >5% margin as conclusive
      };

      this.finalizedResults.set(proposalId, result);

      // Complete finalization
      status.status = 'finalized';
      status.progress = 100;
      status.message = 'Vote finalization completed successfully';
      status.completedAt = new Date();
    } catch (error) {
      const status = this.finalizationStatus.get(proposalId);
      if (status) {
        status.status = 'failed';
        status.error =
          error instanceof Error ? error.message : 'Unknown error occurred';
        status.message = 'Vote finalization failed';
        status.completedAt = new Date();
      }
      throw error;
    }
  }

  /**
   * Calculate final results from vote tallies
   */
  private calculateFinalResults(
    voteTallies: Map<string, bigint>,
    charityData: Map<string, Charity>
  ) {
    const results: Array<{
      gaugeAddress: string;
      charity: Charity;
      totalVotes: bigint;
      percentage: number;
      rank: number;
    }> = [];

    const totalVotes = Array.from(voteTallies.values()).reduce(
      (sum, votes) => sum + votes,
      BigInt(0)
    );
    const totalVotersEstimate = Math.floor(Number(totalVotes) / 1000); // Rough estimate

    // Sort by votes descending
    const sortedEntries = Array.from(voteTallies.entries()).sort((a, b) => {
      return Number(b[1] - a[1]);
    });

    sortedEntries.forEach(([gaugeAddress, votes], index) => {
      const charity = charityData.get(gaugeAddress);
      if (charity) {
        const percentage =
          totalVotes > 0 ? (Number(votes) * 100) / Number(totalVotes) : 0;

        results.push({
          gaugeAddress,
          charity,
          totalVotes: votes,
          percentage,
          rank: index + 1,
        });
      }
    });

    const winner = results[0];
    const runnerUp = results[1];
    const margin =
      winner && runnerUp ? winner.percentage - runnerUp.percentage : 100;

    return {
      totalVotes,
      totalVoters: totalVotersEstimate,
      winner,
      results,
      margin,
    };
  }

  /**
   * Get finalization status for a proposal
   */
  getFinalizationStatus(proposalId: string): FinalizationStatus | null {
    return this.finalizationStatus.get(proposalId) || null;
  }

  /**
   * Get finalization result for a proposal
   */
  getFinalizationResult(proposalId: string): VoteFinalizationResult | null {
    return this.finalizedResults.get(proposalId) || null;
  }

  /**
   * Get all finalized results
   */
  getAllFinalizedResults(): VoteFinalizationResult[] {
    return Array.from(this.finalizedResults.values()).sort(
      (a, b) => b.finalizedAt.getTime() - a.finalizedAt.getTime()
    );
  }

  /**
   * Get voting statistics
   */
  async getVotingStatistics(): Promise<VotingStatistics> {
    const allResults = this.getAllFinalizedResults();

    if (allResults.length === 0) {
      return {
        totalProposalsFinalized: 0,
        totalVotesCast: BigInt(0),
        totalVoters: 0,
        averageParticipation: 0,
        mostPopularCharity: {
          charity: {
            id: 'none',
            name: 'No Data',
            description: 'No finalized results yet',
            logo: '/placeholder.png',
            category: 'General' as any,
            website: '',
          } as any,
          wins: 0,
          totalVotes: BigInt(0),
        },
        closestRace: {
          proposalId: '',
          margin: 0,
          winner: {
            id: 'none',
            name: 'No Data',
            description: 'No finalized results yet',
            logo: '/placeholder.png',
            category: 'General' as any,
            website: '',
          } as any,
          runnerUp: {
            id: 'none',
            name: 'No Data',
            description: 'No finalized results yet',
            logo: '/placeholder.png',
            category: 'General' as any,
            website: '',
          } as any,
        },
        participationTrend: [],
      };
    }

    const totalVotesCast = allResults.reduce(
      (sum, result) => sum + result.totalVotes,
      BigInt(0)
    );
    const totalVoters = allResults.reduce(
      (sum, result) => sum + result.totalVoters,
      0
    );
    const averageParticipation = totalVoters / allResults.length;

    // Find most popular charity
    const charityWins = new Map<
      string,
      { charity: Charity; wins: number; totalVotes: bigint }
    >();

    allResults.forEach(result => {
      const charityId = result.winner.charity.id;
      const existing = charityWins.get(charityId);

      if (existing) {
        existing.wins++;
        existing.totalVotes += result.winner.totalVotes;
      } else {
        charityWins.set(charityId, {
          charity: result.winner.charity,
          wins: 1,
          totalVotes: result.winner.totalVotes,
        });
      }
    });

    const mostPopular = Array.from(charityWins.values()).sort(
      (a, b) => b.wins - a.wins
    )[0];

    // Find closest race
    const closestRace = allResults.reduce((closest, result) => {
      return result.margin < closest.margin ? result : closest;
    }, allResults[0]);

    const runnerUp = closestRace.results.find(r => r.rank === 2);

    return {
      totalProposalsFinalized: allResults.length,
      totalVotesCast,
      totalVoters,
      averageParticipation,
      mostPopularCharity: mostPopular || {
        charity: allResults[0].winner.charity,
        wins: 1,
        totalVotes: allResults[0].winner.totalVotes,
      },
      closestRace: {
        proposalId: closestRace.proposalId,
        margin: closestRace.margin,
        winner: closestRace.winner.charity,
        runnerUp: runnerUp?.charity || closestRace.winner.charity,
      },
      participationTrend: allResults.map(result => ({
        proposalId: result.proposalId,
        date: result.finalizedAt,
        totalVotes: result.totalVotes,
        uniqueVoters: result.totalVoters,
      })),
    };
  }

  /**
   * Get finalization transaction details
   */
  getFinalizationTransaction(
    transactionId: string
  ): FinalizationTransaction | null {
    return this.finalizationTransactions.get(transactionId) || null;
  }

  /**
   * Clean up old finalization records
   */
  cleanup(olderThanDays: number = 30): void {
    const cutoffTime = new Date(
      Date.now() - olderThanDays * 24 * 60 * 60 * 1000
    );

    Array.from(this.finalizationStatus.entries()).forEach(
      ([proposalId, status]) => {
        if (
          (status.status === 'finalized' || status.status === 'failed') &&
          status.completedAt &&
          status.completedAt < cutoffTime
        ) {
          this.finalizationStatus.delete(proposalId);
        }
      }
    );
  }
}

export const voteFinalizationService = new VoteFinalizationService();
