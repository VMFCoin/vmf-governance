import { Address, Hash } from 'viem';
import { writeContract, simulateContract, readContract } from '@wagmi/core';
import { config } from '@/lib/wagmi';
import { gaugeVoterABI } from '@/contracts/abis/GaugeVoter';
import { getContractAddressFromEnv } from '@/contracts/addresses';
import {
  TransactionManager,
  TransactionType,
  TransactionStatus,
} from './transactionManager';
import {
  VoteTrackingService,
  VoteTally,
  FinalResults,
} from './voteTrackingService';
import {
  deployedGaugeService,
  DeployedGaugeInfo,
} from './deployedGaugeService';
import { charities } from '@/data/charities';
import { Charity } from '@/types';

export interface DistributionTransaction {
  id: string;
  proposalId: string;
  holidayId: string;
  winnerGauge: Address;
  winnerCharity: Charity;
  fundAmount: number;
  transactionHash?: Hash;
  status: 'pending' | 'processing' | 'confirmed' | 'failed';
  createdAt: Date;
  confirmedAt?: Date;
  error?: string;
  blockNumber?: number;
  gasUsed?: bigint;
}

export interface DistributionStatus {
  distributionId: string;
  status: 'pending' | 'processing' | 'confirmed' | 'failed';
  progress: number; // 0-100
  message: string;
  estimatedCompletion?: Date;
  transactionHash?: Hash;
  error?: string;
}

export interface DistributionHistory {
  totalDistributed: number;
  totalDistributions: number;
  distributions: DistributionTransaction[];
  charityStats: {
    [charityId: string]: {
      totalReceived: number;
      distributionCount: number;
      lastDistribution: Date;
    };
  };
}

export interface WinnerDetermination {
  proposalId: string;
  holidayId: string;
  winner: {
    gaugeAddress: Address;
    charity: Charity;
    totalVotes: bigint;
    percentage: number;
  };
  runnerUp?: {
    gaugeAddress: Address;
    charity: Charity;
    totalVotes: bigint;
    percentage: number;
  };
  totalVotes: bigint;
  margin: number;
  finalizedAt: Date;
}

export class FundDistributionService {
  private static instance: FundDistributionService;
  private transactionManager: TransactionManager;
  private voteTrackingService: VoteTrackingService;
  private distributionHistory: Map<string, DistributionTransaction> = new Map();
  private activeDistributions: Map<string, DistributionStatus> = new Map();

  private constructor() {
    this.transactionManager = TransactionManager.getInstance();
    this.voteTrackingService = new VoteTrackingService();
  }

  static getInstance(): FundDistributionService {
    if (!FundDistributionService.instance) {
      FundDistributionService.instance = new FundDistributionService();
    }
    return FundDistributionService.instance;
  }

  /**
   * Automatically determine winner from deployed gauge votes
   */
  async determineWinner(
    proposalId: string,
    holidayId: string,
    gauges: Address[]
  ): Promise<WinnerDetermination> {
    try {
      // Get final vote tallies from deployed contracts
      const tallies =
        await this.voteTrackingService.getCurrentVoteTallies(gauges);

      if (tallies.length === 0) {
        throw new Error('No gauges found for winner determination');
      }

      // Sort by total votes to find winner and runner-up
      const sortedTallies = tallies.sort(
        (a, b) => Number(b.totalVotes) - Number(a.totalVotes)
      );
      const winnerTally = sortedTallies[0];
      const runnerUpTally =
        sortedTallies.length > 1 ? sortedTallies[1] : undefined;

      if (winnerTally.totalVotes === BigInt(0)) {
        throw new Error('No votes cast for any gauge');
      }

      // Get charity information from gauge metadata
      const winnerGaugeInfo = await deployedGaugeService.getGaugeInfo(
        winnerTally.gaugeAddress
      );
      const winnerMetadata = deployedGaugeService.parseGaugeMetadata(
        winnerGaugeInfo.metadataURI
      );

      if (!winnerMetadata?.charityId) {
        throw new Error('Winner gauge has no associated charity');
      }

      const winnerCharity = charities.find(
        c => c.id === winnerMetadata.charityId
      );
      if (!winnerCharity) {
        throw new Error(
          `Charity not found for ID: ${winnerMetadata.charityId}`
        );
      }

      // Calculate total votes and margin
      const totalVotes = tallies.reduce(
        (sum, tally) => sum + tally.totalVotes,
        BigInt(0)
      );
      const margin = runnerUpTally
        ? (Number(winnerTally.totalVotes - runnerUpTally.totalVotes) /
            Number(totalVotes)) *
          100
        : 100;

      const winnerDetermination: WinnerDetermination = {
        proposalId,
        holidayId,
        winner: {
          gaugeAddress: winnerTally.gaugeAddress,
          charity: winnerCharity,
          totalVotes: winnerTally.totalVotes,
          percentage: winnerTally.percentage,
        },
        totalVotes,
        margin,
        finalizedAt: new Date(),
      };

      // Add runner-up if exists
      if (runnerUpTally) {
        const runnerUpGaugeInfo = await deployedGaugeService.getGaugeInfo(
          runnerUpTally.gaugeAddress
        );
        const runnerUpMetadata = deployedGaugeService.parseGaugeMetadata(
          runnerUpGaugeInfo.metadataURI
        );

        if (runnerUpMetadata?.charityId) {
          const runnerUpCharity = charities.find(
            c => c.id === runnerUpMetadata.charityId
          );
          if (runnerUpCharity) {
            winnerDetermination.runnerUp = {
              gaugeAddress: runnerUpTally.gaugeAddress,
              charity: runnerUpCharity,
              totalVotes: runnerUpTally.totalVotes,
              percentage: runnerUpTally.percentage,
            };
          }
        }
      }

      return winnerDetermination;
    } catch (error) {
      console.error('Error determining winner:', error);
      throw new Error(
        `Failed to determine winner: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create fund distribution transaction
   */
  async createDistributionTransaction(
    proposalId: string,
    holidayId: string,
    fundAmount: number,
    gauges: Address[]
  ): Promise<string> {
    try {
      // Determine winner first
      const winnerDetermination = await this.determineWinner(
        proposalId,
        holidayId,
        gauges
      );

      // Create distribution transaction record
      const distributionId = `dist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const distributionTransaction: DistributionTransaction = {
        id: distributionId,
        proposalId,
        holidayId,
        winnerGauge: winnerDetermination.winner.gaugeAddress,
        winnerCharity: winnerDetermination.winner.charity,
        fundAmount,
        status: 'pending',
        createdAt: new Date(),
      };

      // Store in history
      this.distributionHistory.set(distributionId, distributionTransaction);

      // Create status tracking
      const distributionStatus: DistributionStatus = {
        distributionId,
        status: 'pending',
        progress: 0,
        message: 'Preparing fund distribution transaction...',
      };

      this.activeDistributions.set(distributionId, distributionStatus);

      // Note: In a real implementation, this would interact with a treasury contract
      // or payment system to actually distribute funds. For now, we simulate the process.

      // Simulate transaction processing
      setTimeout(() => {
        this.processDistribution(distributionId);
      }, 2000);

      return distributionId;
    } catch (error) {
      console.error('Error creating distribution transaction:', error);
      throw new Error(
        `Failed to create distribution transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Process the distribution (simulated)
   */
  private async processDistribution(distributionId: string): Promise<void> {
    try {
      const distribution = this.distributionHistory.get(distributionId);
      const status = this.activeDistributions.get(distributionId);

      if (!distribution || !status) {
        throw new Error('Distribution not found');
      }

      // Update status to processing
      status.status = 'processing';
      status.progress = 25;
      status.message = 'Processing fund distribution...';
      this.activeDistributions.set(distributionId, status);

      // Simulate transaction creation and submission
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Simulate transaction hash (in real implementation, this would be from actual transaction)
      const mockTransactionHash =
        `0x${Math.random().toString(16).substr(2, 64)}` as Hash;

      // Update distribution record
      distribution.transactionHash = mockTransactionHash;
      distribution.status = 'processing';
      this.distributionHistory.set(distributionId, distribution);

      // Update status
      status.progress = 50;
      status.message = 'Transaction submitted, waiting for confirmation...';
      status.transactionHash = mockTransactionHash;
      this.activeDistributions.set(distributionId, status);

      // Simulate confirmation delay
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Simulate successful confirmation
      distribution.status = 'confirmed';
      distribution.confirmedAt = new Date();
      distribution.blockNumber = Math.floor(Math.random() * 1000000) + 18000000;
      distribution.gasUsed = BigInt(Math.floor(Math.random() * 50000) + 21000);
      this.distributionHistory.set(distributionId, distribution);

      // Update final status
      status.status = 'confirmed';
      status.progress = 100;
      status.message = `Successfully distributed $${distribution.fundAmount.toLocaleString()} to ${distribution.winnerCharity.name}`;
      this.activeDistributions.set(distributionId, status);

      console.log(`✅ Distribution ${distributionId} completed successfully`);
    } catch (error) {
      console.error('Error processing distribution:', error);

      // Update status to failed
      const status = this.activeDistributions.get(distributionId);
      if (status) {
        status.status = 'failed';
        status.error = error instanceof Error ? error.message : 'Unknown error';
        status.message = 'Distribution failed';
        this.activeDistributions.set(distributionId, status);
      }

      // Update distribution record
      const distribution = this.distributionHistory.get(distributionId);
      if (distribution) {
        distribution.status = 'failed';
        distribution.error =
          error instanceof Error ? error.message : 'Unknown error';
        this.distributionHistory.set(distributionId, distribution);
      }
    }
  }

  /**
   * Get distribution status
   */
  async getDistributionStatus(
    distributionId: string
  ): Promise<DistributionStatus | null> {
    return this.activeDistributions.get(distributionId) || null;
  }

  /**
   * Monitor distribution status
   */
  async monitorDistribution(
    distributionId: string,
    callback: (status: DistributionStatus) => void
  ): Promise<() => void> {
    const checkStatus = () => {
      const status = this.activeDistributions.get(distributionId);
      if (status) {
        callback(status);

        // Continue monitoring if not complete
        if (status.status === 'pending' || status.status === 'processing') {
          setTimeout(checkStatus, 1000);
        }
      }
    };

    // Start monitoring
    checkStatus();

    // Return cleanup function
    return () => {
      // Cleanup would stop monitoring in a real implementation
    };
  }

  /**
   * Get distribution confirmation
   */
  async getDistributionConfirmation(
    distributionId: string
  ): Promise<DistributionTransaction | null> {
    const distribution = this.distributionHistory.get(distributionId);
    return distribution || null;
  }

  /**
   * Get historical distribution data
   */
  async getDistributionHistory(): Promise<DistributionHistory> {
    const distributions = Array.from(this.distributionHistory.values());

    const totalDistributed = distributions
      .filter(d => d.status === 'confirmed')
      .reduce((sum, d) => sum + d.fundAmount, 0);

    const totalDistributions = distributions.filter(
      d => d.status === 'confirmed'
    ).length;

    // Calculate charity stats
    const charityStats: DistributionHistory['charityStats'] = {};

    distributions
      .filter(d => d.status === 'confirmed')
      .forEach(distribution => {
        const charityId = distribution.winnerCharity.id;
        if (!charityStats[charityId]) {
          charityStats[charityId] = {
            totalReceived: 0,
            distributionCount: 0,
            lastDistribution: distribution.confirmedAt!,
          };
        }

        charityStats[charityId].totalReceived += distribution.fundAmount;
        charityStats[charityId].distributionCount += 1;

        if (
          distribution.confirmedAt! > charityStats[charityId].lastDistribution
        ) {
          charityStats[charityId].lastDistribution = distribution.confirmedAt!;
        }
      });

    return {
      totalDistributed,
      totalDistributions,
      distributions: distributions.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      ),
      charityStats,
    };
  }

  /**
   * Get distributions for a specific holiday
   */
  async getHolidayDistributions(
    holidayId: string
  ): Promise<DistributionTransaction[]> {
    const distributions = Array.from(this.distributionHistory.values());
    return distributions.filter(d => d.holidayId === holidayId);
  }

  /**
   * Get distributions for a specific charity
   */
  async getCharityDistributions(
    charityId: string
  ): Promise<DistributionTransaction[]> {
    const distributions = Array.from(this.distributionHistory.values());
    return distributions.filter(d => d.winnerCharity.id === charityId);
  }

  /**
   * Check if distribution is ready for a proposal
   */
  async isDistributionReady(proposalId: string): Promise<boolean> {
    try {
      // Check if voting period has ended
      const votingActive = await deployedGaugeService.isVotingActive();
      if (votingActive) {
        return false;
      }

      // Check if there are any existing distributions for this proposal
      const existingDistribution = Array.from(
        this.distributionHistory.values()
      ).find(d => d.proposalId === proposalId);

      if (existingDistribution) {
        return false; // Already distributed
      }

      return true;
    } catch (error) {
      console.error('Error checking distribution readiness:', error);
      return false;
    }
  }

  /**
   * Cleanup old distribution records
   */
  cleanup(olderThanDays = 30): void {
    const cutoffTime = new Date(
      Date.now() - olderThanDays * 24 * 60 * 60 * 1000
    );

    // Remove old active distributions that are complete
    Array.from(this.activeDistributions.entries()).forEach(([id, status]) => {
      if (status.status === 'confirmed' || status.status === 'failed') {
        const distribution = this.distributionHistory.get(id);
        if (distribution && distribution.createdAt < cutoffTime) {
          this.activeDistributions.delete(id);
        }
      }
    });
  }
}

// Export singleton instance
export const fundDistributionService = FundDistributionService.getInstance();
