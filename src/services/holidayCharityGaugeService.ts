import { Address } from 'viem';
import {
  writeContract,
  simulateContract,
  getAccount,
  readContract,
  watchContractEvent,
} from '@wagmi/core';
import { config } from '@/lib/wagmi';
import { gaugeVoterABI } from '@/contracts/abis/GaugeVoter';
import { getContractAddressFromEnv } from '@/contracts/addresses';
import {
  deployedGaugeService,
  CharityGaugeMapping,
  HolidayVotingResults,
} from './deployedGaugeService';
import { Charity, HolidayCharityProposal } from '@/types';

export interface HolidayCharityVote {
  tokenId: number;
  charityId: string;
  gaugeAddress: Address;
  weight: bigint;
  timestamp: Date;
}

export interface CharityVoteAllocation {
  charityId: string;
  charityName: string;
  gaugeAddress: Address;
  weight: number; // 0-10000 (basis points)
}

export interface HolidayGaugeVoteParams {
  tokenId: number;
  allocations: CharityVoteAllocation[];
}

export interface VoteResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export class HolidayCharityGaugeService {
  private gaugeVoterAddress: Address;

  constructor() {
    this.gaugeVoterAddress = getContractAddressFromEnv(
      'GAUGE_VOTER_PLUGIN'
    ) as Address;
  }

  /**
   * Submit a vote for holiday charity selection using gauge voting
   */
  async submitHolidayCharityVote(
    params: HolidayGaugeVoteParams
  ): Promise<VoteResult> {
    try {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      // Validate total weight doesn't exceed 10000 (100%)
      const totalWeight = params.allocations.reduce(
        (sum, alloc) => sum + alloc.weight,
        0
      );
      if (totalWeight > 10000) {
        throw new Error('Total vote weight cannot exceed 100%');
      }

      // Convert allocations to the format expected by the contract
      const gaugeVotes = params.allocations.map(allocation => ({
        weight: BigInt(allocation.weight),
        gauge: allocation.gaugeAddress,
      }));

      // Simulate the transaction first
      const { request } = await simulateContract(config, {
        address: this.gaugeVoterAddress,
        abi: gaugeVoterABI,
        functionName: 'vote',
        args: [BigInt(params.tokenId), gaugeVotes],
        account: account.address,
      });

      // Execute the transaction
      const hash = await writeContract(config, request);

      return {
        success: true,
        transactionHash: hash,
      };
    } catch (error) {
      console.error('Error submitting holiday charity vote:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Submit a simple charity vote (100% to one charity)
   */
  async submitSingleCharityVote(
    tokenId: number,
    charityId: string,
    gaugeAddress: Address
  ): Promise<VoteResult> {
    const allocation: CharityVoteAllocation = {
      charityId,
      charityName: '', // Will be filled by calling component
      gaugeAddress,
      weight: 10000, // 100% weight
    };

    return this.submitHolidayCharityVote({
      tokenId,
      allocations: [allocation],
    });
  }

  /**
   * Reset votes for a token
   */
  async resetVotes(tokenId: number): Promise<VoteResult> {
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
        args: [BigInt(tokenId)],
        account: account.address,
      });

      // Execute the transaction
      const hash = await writeContract(config, request);

      return {
        success: true,
        transactionHash: hash,
      };
    } catch (error) {
      console.error('Error resetting votes:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Check if a token is currently voting
   */
  async isTokenVoting(tokenId: number): Promise<boolean> {
    try {
      const isVoting = await readContract(config, {
        address: this.gaugeVoterAddress,
        abi: gaugeVoterABI,
        functionName: 'isVoting',
        args: [BigInt(tokenId)],
      });
      return isVoting as boolean;
    } catch (error) {
      console.error('Error checking if token is voting:', error);
      return false;
    }
  }

  /**
   * Get the voting power used by a token
   */
  async getUsedVotingPower(tokenId: number): Promise<bigint> {
    try {
      const usedPower = await readContract(config, {
        address: this.gaugeVoterAddress,
        abi: gaugeVoterABI,
        functionName: 'usedVotingPower',
        args: [BigInt(tokenId)],
      });
      return usedPower as bigint;
    } catch (error) {
      console.error('Error getting used voting power:', error);
      return BigInt(0);
    }
  }

  /**
   * Get gauges that a token has voted for
   */
  async getTokenVotedGauges(tokenId: number): Promise<Address[]> {
    try {
      const gauges = await readContract(config, {
        address: this.gaugeVoterAddress,
        abi: gaugeVoterABI,
        functionName: 'gaugesVotedFor',
        args: [BigInt(tokenId)],
      });
      return gauges as Address[];
    } catch (error) {
      console.error('Error getting voted gauges:', error);
      return [];
    }
  }

  /**
   * Get vote weight for a specific token and gauge
   */
  async getTokenGaugeVote(
    tokenId: number,
    gaugeAddress: Address
  ): Promise<bigint> {
    try {
      const voteWeight = await readContract(config, {
        address: this.gaugeVoterAddress,
        abi: gaugeVoterABI,
        functionName: 'votes',
        args: [BigInt(tokenId), gaugeAddress],
      });
      return voteWeight as bigint;
    } catch (error) {
      console.error('Error getting token gauge vote:', error);
      return BigInt(0);
    }
  }

  /**
   * Get comprehensive voting results for a holiday
   */
  async getHolidayVotingResults(
    holidayId: string,
    charities: Charity[]
  ): Promise<HolidayVotingResults> {
    try {
      const charityIds = charities.map(c => c.id);
      return await deployedGaugeService.getHolidayVotingResults(
        holidayId,
        charityIds
      );
    } catch (error) {
      console.error('Error getting holiday voting results:', error);
      throw new Error(`Failed to get voting results for holiday ${holidayId}`);
    }
  }

  /**
   * Create charity gauge mappings for holiday voting
   */
  async createCharityGaugeMappings(
    holidayId: string,
    charities: Charity[]
  ): Promise<CharityGaugeMapping[]> {
    try {
      const charityIds = charities.map(c => c.id);
      const mappings = await deployedGaugeService.mapCharitiesToGauges(
        holidayId,
        charityIds
      );

      // Enhance mappings with charity data
      return mappings.map(mapping => {
        const charity = charities.find(c => c.id === mapping.charityId);
        return {
          ...mapping,
          charityName: charity?.name || mapping.charityName,
        };
      });
    } catch (error) {
      console.error('Error creating charity gauge mappings:', error);
      throw new Error('Failed to create charity gauge mappings');
    }
  }

  /**
   * Subscribe to voting events for real-time updates
   */
  subscribeToVotingEvents(
    callback: (event: {
      voter: Address;
      gauge: Address;
      tokenId: bigint;
      weight: bigint;
      epoch: bigint;
    }) => void
  ): () => void {
    const unwatch = watchContractEvent(config, {
      address: this.gaugeVoterAddress,
      abi: gaugeVoterABI,
      eventName: 'Voted',
      onLogs: logs => {
        logs.forEach((log: any) => {
          const { args } = log;
          if (args && 'voter' in args && 'gauge' in args && 'tokenId' in args) {
            callback({
              voter: args.voter as Address,
              gauge: args.gauge as Address,
              tokenId: args.tokenId as bigint,
              weight: args.weight as bigint,
              epoch: args.epoch as bigint,
            });
          }
        });
      },
    });

    return unwatch;
  }

  /**
   * Validate vote allocations before submission
   */
  validateVoteAllocations(allocations: CharityVoteAllocation[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check if allocations exist
    if (!allocations || allocations.length === 0) {
      errors.push('At least one charity must be selected');
    }

    // Check total weight
    const totalWeight = allocations.reduce(
      (sum, alloc) => sum + alloc.weight,
      0
    );
    if (totalWeight > 10000) {
      errors.push('Total vote weight cannot exceed 100%');
    }

    if (totalWeight === 0) {
      errors.push('Total vote weight must be greater than 0');
    }

    // Check individual allocations
    allocations.forEach((allocation, index) => {
      if (allocation.weight < 0) {
        errors.push(`Allocation ${index + 1} cannot have negative weight`);
      }
      if (!allocation.gaugeAddress) {
        errors.push(`Allocation ${index + 1} must have a valid gauge address`);
      }
      if (!allocation.charityId) {
        errors.push(`Allocation ${index + 1} must have a valid charity ID`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get current voting period information
   */
  async getVotingPeriodInfo(): Promise<{
    isActive: boolean;
    epochId: bigint;
    epochStart: bigint;
    epochVoteStart: bigint;
    epochVoteEnd: bigint;
  }> {
    try {
      const [isActive, epochId, epochStart, epochVoteStart, epochVoteEnd] =
        await Promise.all([
          readContract(config, {
            address: this.gaugeVoterAddress,
            abi: gaugeVoterABI,
            functionName: 'votingActive',
          }),
          readContract(config, {
            address: this.gaugeVoterAddress,
            abi: gaugeVoterABI,
            functionName: 'epochId',
          }),
          readContract(config, {
            address: this.gaugeVoterAddress,
            abi: gaugeVoterABI,
            functionName: 'epochStart',
          }),
          readContract(config, {
            address: this.gaugeVoterAddress,
            abi: gaugeVoterABI,
            functionName: 'epochVoteStart',
          }),
          readContract(config, {
            address: this.gaugeVoterAddress,
            abi: gaugeVoterABI,
            functionName: 'epochVoteEnd',
          }),
        ]);

      return {
        isActive: isActive as boolean,
        epochId: epochId as bigint,
        epochStart: epochStart as bigint,
        epochVoteStart: epochVoteStart as bigint,
        epochVoteEnd: epochVoteEnd as bigint,
      };
    } catch (error) {
      console.error('Error getting voting period info:', error);
      throw new Error('Failed to get voting period information');
    }
  }
}

export const holidayCharityGaugeService = new HolidayCharityGaugeService();
