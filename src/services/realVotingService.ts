import { Address } from 'viem';
import {
  readContract,
  writeContract,
  simulateContract,
  watchContractEvent,
  getAccount,
} from '@wagmi/core';
import { config } from '@/lib/wagmi';
import { gaugeVoterABI } from '@/contracts/abis/GaugeVoter';
import { getContractAddressFromEnv } from '@/contracts/addresses';

export interface VotedEvent {
  voter: Address;
  tokenId: bigint;
  weight: bigint;
}

export interface AbstainedEvent {
  voter: Address;
  tokenId: bigint;
}

export interface GaugeVote {
  gauge: Address;
  weight: bigint;
}

export interface Vote {
  id: string;
  tokenId: number;
  voter: Address;
  allocations: { gaugeAddress: Address; percentage: number }[];
  timestamp: Date;
  totalWeight: bigint;
}

export interface VoteAllocation {
  gaugeAddress: Address;
  percentage: number;
}

export interface GaugeInfo {
  address: Address;
  name: string;
  totalVotes: bigint;
  isActive: boolean;
}

export interface VotingService {
  vote(gaugeAddress: Address, weight: number): Promise<string>;
  reset(): Promise<string>;
  getVotes(gaugeAddress: Address): Promise<bigint>;
  getUsedWeight(userAddress: Address): Promise<bigint>;
  getLastVoted(userAddress: Address): Promise<bigint>;
  getPoolVote(
    userAddress: Address,
    index: number
  ): Promise<{
    pool: Address;
    weight: bigint;
  }>;
  getPoolVoteLength(userAddress: Address): Promise<bigint>;
  isValidGauge(gaugeAddress: Address): Promise<boolean>;
  getAllGauges(): Promise<Address[]>;
}

export class RealVotingService implements VotingService {
  private gaugeVoterAddress: Address;

  constructor() {
    this.gaugeVoterAddress = getContractAddressFromEnv(
      'GAUGE_VOTER_PLUGIN'
    ) as Address;
  }

  async vote(gaugeAddress: Address, weight: number): Promise<string> {
    try {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      // Simulate the transaction first
      const { request } = await simulateContract(config, {
        address: this.gaugeVoterAddress,
        abi: gaugeVoterABI,
        functionName: 'vote',
        args: [gaugeAddress, BigInt(weight)],
        account: account.address,
      });

      // Execute the transaction
      const hash = await writeContract(config, request);
      return hash;
    } catch (error) {
      console.error('Error voting:', error);
      throw error;
    }
  }

  async reset(): Promise<string> {
    try {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      // Simulate the transaction first
      const { request } = await simulateContract(config, {
        address: this.gaugeVoterAddress,
        abi: gaugeVoterABI,
        functionName: 'reset',
        account: account.address,
      });

      // Execute the transaction
      const hash = await writeContract(config, request);
      return hash;
    } catch (error) {
      console.error('Error resetting votes:', error);
      throw error;
    }
  }

  async getVotes(gaugeAddress: Address): Promise<bigint> {
    try {
      const votes = await readContract(config, {
        address: this.gaugeVoterAddress,
        abi: gaugeVoterABI,
        functionName: 'votes',
        args: [gaugeAddress],
      });
      return votes as bigint;
    } catch (error) {
      console.error('Error getting votes:', error);
      throw error;
    }
  }

  async getUsedWeight(userAddress: Address): Promise<bigint> {
    try {
      const usedWeight = await readContract(config, {
        address: this.gaugeVoterAddress,
        abi: gaugeVoterABI,
        functionName: 'usedWeights',
        args: [userAddress],
      });
      return usedWeight as bigint;
    } catch (error) {
      console.error('Error getting used weight:', error);
      throw error;
    }
  }

  async getLastVoted(userAddress: Address): Promise<bigint> {
    try {
      const lastVoted = await readContract(config, {
        address: this.gaugeVoterAddress,
        abi: gaugeVoterABI,
        functionName: 'lastVoted',
        args: [userAddress],
      });
      return lastVoted as bigint;
    } catch (error) {
      console.error('Error getting last voted:', error);
      throw error;
    }
  }

  async getPoolVote(
    userAddress: Address,
    index: number
  ): Promise<{
    pool: Address;
    weight: bigint;
  }> {
    try {
      const vote = await readContract(config, {
        address: this.gaugeVoterAddress,
        abi: gaugeVoterABI,
        functionName: 'poolVote',
        args: [userAddress, BigInt(index)],
      });
      const [pool, weight] = vote as [Address, bigint];
      return { pool, weight };
    } catch (error) {
      console.error('Error getting pool vote:', error);
      throw error;
    }
  }

  async getPoolVoteLength(userAddress: Address): Promise<bigint> {
    try {
      const count = await readContract(config, {
        address: this.gaugeVoterAddress,
        abi: gaugeVoterABI,
        functionName: 'poolVoteLength',
        args: [userAddress],
      });
      return count as bigint;
    } catch (error) {
      console.error('Error getting pool vote length:', error);
      throw error;
    }
  }

  async isValidGauge(gaugeAddress: Address): Promise<boolean> {
    try {
      const isValidGauge = await readContract(config, {
        address: this.gaugeVoterAddress,
        abi: gaugeVoterABI,
        functionName: 'isGauge',
        args: [gaugeAddress],
      });
      return isValidGauge as boolean;
    } catch (error) {
      console.error('Error checking if gauge is valid:', error);
      throw error;
    }
  }

  async getAllGauges(): Promise<Address[]> {
    try {
      const length = await readContract(config, {
        address: this.gaugeVoterAddress,
        abi: gaugeVoterABI,
        functionName: 'length',
      });

      const gauges: Address[] = [];
      for (let i = 0; i < Number(length); i++) {
        const gauge = await readContract(config, {
          address: this.gaugeVoterAddress,
          abi: gaugeVoterABI,
          functionName: 'gauges',
          args: [BigInt(i)],
        });
        gauges.push(gauge as Address);
      }

      return gauges;
    } catch (error) {
      console.error('Error getting all gauges:', error);
      throw error;
    }
  }

  /**
   * Get detailed vote information for a token
   */
  async getTokenVoteDetails(tokenId: number): Promise<{
    usedWeight: bigint;
    lastVoted: number;
    voteCount: number;
    votes: { gauge: Address; weight: bigint }[];
  }> {
    try {
      // Note: These methods expect Address, not tokenId
      // This is a simplified implementation - in reality you'd need different contract calls
      const votes: { gauge: Address; weight: bigint }[] = [];
      const allGauges = await this.getAllGauges();

      for (const gauge of allGauges) {
        const weight = await this.getVotes(gauge);
        if (weight > BigInt(0)) {
          votes.push({ gauge, weight });
        }
      }

      return {
        usedWeight: BigInt(0), // Simplified - would need proper contract call
        lastVoted: 0, // Simplified - would need proper contract call
        voteCount: votes.length,
        votes,
      };
    } catch (error) {
      console.error('Error getting token vote details:', error);
      throw new Error('Failed to get token vote details');
    }
  }

  /**
   * Get gauge information including total votes
   */
  async getGaugeInfo(gaugeAddress: Address): Promise<GaugeInfo> {
    try {
      const [totalVotes, isValidGauge] = await Promise.all([
        this.getVotes(gaugeAddress),
        this.isValidGauge(gaugeAddress),
      ]);

      // In a real implementation, you might fetch additional gauge metadata
      // from other contracts or off-chain sources
      return {
        address: gaugeAddress,
        name: `Gauge ${gaugeAddress.slice(0, 8)}...`, // Simplified name
        totalVotes,
        isActive: isValidGauge,
      };
    } catch (error) {
      console.error('Error getting gauge info:', error);
      throw new Error('Failed to get gauge info');
    }
  }

  /**
   * Get all gauge information
   */
  async getAllGaugeInfo(): Promise<GaugeInfo[]> {
    try {
      const gaugeAddresses = await this.getAllGauges();
      const gaugeInfoPromises = gaugeAddresses.map(address =>
        this.getGaugeInfo(address)
      );

      return await Promise.all(gaugeInfoPromises);
    } catch (error) {
      console.error('Error getting all gauge info:', error);
      throw new Error('Failed to get all gauge info');
    }
  }

  /**
   * Get vote history for a token (simplified version)
   * In a full implementation, this would query historical events
   */
  async getVoteHistory(tokenId: number): Promise<Vote[]> {
    try {
      const voteDetails = await this.getTokenVoteDetails(tokenId);

      // Create a simplified vote record based on current state
      // In reality, you'd query historical Voted events
      const vote: Vote = {
        id: `${tokenId}-${voteDetails.lastVoted}`,
        tokenId,
        voter: '0x0000000000000000000000000000000000000000', // Would be fetched from events
        allocations: voteDetails.votes.map(v => ({
          gaugeAddress: v.gauge,
          percentage: Number(v.weight) / 10000, // Assuming weight is in basis points
        })),
        timestamp: new Date(voteDetails.lastVoted * 1000),
        totalWeight: voteDetails.usedWeight,
      };

      return voteDetails.lastVoted > 0 ? [vote] : [];
    } catch (error) {
      console.error('Error getting vote history:', error);
      throw new Error('Failed to get vote history');
    }
  }

  /**
   * Check if a token can vote (not in cooldown period)
   */
  async canVote(tokenId: number): Promise<{
    canVote: boolean;
    nextVoteTime?: number;
    reason?: string;
  }> {
    try {
      // Simplified implementation - would need proper contract integration
      const now = Math.floor(Date.now() / 1000);
      const VOTE_COOLDOWN = 7 * 24 * 60 * 60; // 1 week in seconds

      // For now, assume tokens can vote (would need proper lastVoted lookup)
      return { canVote: true };
    } catch (error) {
      console.error('Error checking if token can vote:', error);
      throw new Error('Failed to check if token can vote');
    }
  }

  /**
   * Subscribe to Voted events
   */
  subscribeToVoteEvents(
    callback: (event: { user: Address; gauge: Address; weight: bigint }) => void
  ): () => void {
    const unwatch = watchContractEvent(config, {
      address: this.gaugeVoterAddress,
      abi: gaugeVoterABI,
      eventName: 'Voted',
      onLogs: logs => {
        logs.forEach((log: any) => {
          const { args } = log;
          if (args && 'user' in args && 'gauge' in args && 'weight' in args) {
            callback({
              user: args.user as Address,
              gauge: args.gauge as Address,
              weight: args.weight as bigint,
            });
          }
        });
      },
    });

    return unwatch;
  }

  /**
   * Subscribe to Abstained events
   */
  subscribeToResetEvents(
    callback: (event: { user: Address }) => void
  ): () => void {
    const unwatch = watchContractEvent(config, {
      address: this.gaugeVoterAddress,
      abi: gaugeVoterABI,
      eventName: 'Reset',
      onLogs: logs => {
        logs.forEach((log: any) => {
          const { args } = log;
          if (args && 'user' in args) {
            callback({
              user: args.user as Address,
            });
          }
        });
      },
    });

    return unwatch;
  }

  /**
   * Validate vote allocations before submitting
   */
  validateVoteAllocations(allocations: VoteAllocation[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check if allocations sum to 100%
    const totalPercentage = allocations.reduce(
      (sum, allocation) => sum + allocation.percentage,
      0
    );

    if (Math.abs(totalPercentage - 100) > 0.01) {
      errors.push('Vote allocations must sum to 100%');
    }

    // Check for negative percentages
    const hasNegative = allocations.some(
      allocation => allocation.percentage < 0
    );
    if (hasNegative) {
      errors.push('Vote allocations cannot be negative');
    }

    // Check for duplicate gauges
    const gaugeAddresses = allocations.map(a => a.gaugeAddress.toLowerCase());
    const uniqueGauges = new Set(gaugeAddresses);
    if (gaugeAddresses.length !== uniqueGauges.size) {
      errors.push('Cannot vote for the same gauge multiple times');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const realVotingService = new RealVotingService();
