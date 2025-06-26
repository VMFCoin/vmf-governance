import { Address } from 'viem';
import {
  readContract,
  writeContract,
  simulateContract,
  watchContractEvent,
  getAccount,
} from '@wagmi/core';
import { config } from '@/lib/wagmi';
import { exitQueueABI } from '@/contracts/abis/ExitQueue';
import { getContractAddressFromEnv } from '@/contracts/addresses';

// Define ExitQueueEntry interface locally
export interface ExitQueueEntry {
  tokenId: number;
  position: number;
  enteredAt: Date;
  canClaim: boolean;
  estimatedClaimTime?: Date;
}

export interface QueueEnteredEvent {
  tokenId: bigint;
  owner: Address;
  timestamp: bigint;
}

export interface QueueExitedEvent {
  tokenId: bigint;
  owner: Address;
  timestamp: bigint;
}

export interface ClaimedFromQueueEvent {
  tokenId: bigint;
  owner: Address;
  amount: bigint;
  timestamp: bigint;
}

export interface ExitQueueService {
  joinQueue(tokenId: number): Promise<string>;
  leaveQueue(tokenId: number): Promise<string>;
  claimToken(tokenId: number): Promise<string>;
  getQueuePosition(tokenId: number): Promise<number>;
  isInQueue(tokenId: number): Promise<boolean>;
  canClaim(tokenId: number): Promise<boolean>;
  getQueueLength(): Promise<number>;
  getQueueInfo(tokenId: number): Promise<ExitQueueEntry | null>;
  getUserQueueEntries(userTokenIds: number[]): Promise<ExitQueueEntry[]>;
}

export class RealExitQueueService implements ExitQueueService {
  private exitQueueAddress: Address;

  constructor() {
    this.exitQueueAddress = getContractAddressFromEnv('EXIT_QUEUE') as Address;
  }

  async joinQueue(tokenId: number): Promise<string> {
    try {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      // Simulate the transaction first
      const { request } = await simulateContract(config, {
        address: this.exitQueueAddress,
        abi: exitQueueABI,
        functionName: 'joinQueue',
        args: [BigInt(tokenId)],
        account: account.address,
      });

      // Execute the transaction
      const hash = await writeContract(config, request);
      return hash;
    } catch (error) {
      console.error('Error joining queue:', error);
      throw error;
    }
  }

  async leaveQueue(tokenId: number): Promise<string> {
    try {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      // Simulate the transaction first
      const { request } = await simulateContract(config, {
        address: this.exitQueueAddress,
        abi: exitQueueABI,
        functionName: 'leaveQueue',
        args: [BigInt(tokenId)],
        account: account.address,
      });

      // Execute the transaction
      const hash = await writeContract(config, request);
      return hash;
    } catch (error) {
      console.error('Error leaving queue:', error);
      throw error;
    }
  }

  async claimToken(tokenId: number): Promise<string> {
    try {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      // Simulate the transaction first
      const { request } = await simulateContract(config, {
        address: this.exitQueueAddress,
        abi: exitQueueABI,
        functionName: 'claimToken',
        args: [BigInt(tokenId)],
        account: account.address,
      });

      // Execute the transaction
      const hash = await writeContract(config, request);
      return hash;
    } catch (error) {
      console.error('Error claiming token:', error);
      throw error;
    }
  }

  async getQueuePosition(tokenId: number): Promise<number> {
    try {
      const position = await readContract(config, {
        address: this.exitQueueAddress,
        abi: exitQueueABI,
        functionName: 'getQueuePosition',
        args: [BigInt(tokenId)],
      });
      return Number(position);
    } catch (error) {
      console.error('Error getting queue position:', error);
      throw error;
    }
  }

  async isInQueue(tokenId: number): Promise<boolean> {
    try {
      const inQueue = await readContract(config, {
        address: this.exitQueueAddress,
        abi: exitQueueABI,
        functionName: 'isInQueue',
        args: [BigInt(tokenId)],
      });
      return inQueue as boolean;
    } catch (error) {
      console.error('Error checking if in queue:', error);
      throw error;
    }
  }

  async canClaim(tokenId: number): Promise<boolean> {
    try {
      const canClaimToken = await readContract(config, {
        address: this.exitQueueAddress,
        abi: exitQueueABI,
        functionName: 'canClaim',
        args: [BigInt(tokenId)],
      });
      return canClaimToken as boolean;
    } catch (error) {
      console.error('Error checking if can claim:', error);
      throw error;
    }
  }

  async getQueueLength(): Promise<number> {
    try {
      const length = await readContract(config, {
        address: this.exitQueueAddress,
        abi: exitQueueABI,
        functionName: 'queueLength',
      });
      return Number(length);
    } catch (error) {
      console.error('Error getting queue length:', error);
      throw error;
    }
  }

  async getQueuedToken(index: number): Promise<number> {
    try {
      const tokenId = await readContract(config, {
        address: this.exitQueueAddress,
        abi: exitQueueABI,
        functionName: 'queuedTokens',
        args: [BigInt(index)],
      });
      return Number(tokenId);
    } catch (error) {
      console.error('Error getting queued token:', error);
      throw error;
    }
  }

  async getQueueTimestamp(tokenId: number): Promise<number> {
    try {
      const timestamp = await readContract(config, {
        address: this.exitQueueAddress,
        abi: exitQueueABI,
        functionName: 'queueTimestamp',
        args: [BigInt(tokenId)],
      });
      return Number(timestamp);
    } catch (error) {
      console.error('Error getting queue timestamp:', error);
      throw error;
    }
  }

  /**
   * Get detailed queue information for a token
   */
  async getQueueInfo(tokenId: number): Promise<ExitQueueEntry | null> {
    try {
      const [isInQueue, canClaim] = await Promise.all([
        this.isInQueue(tokenId),
        this.canClaim(tokenId),
      ]);

      if (!isInQueue) {
        return null;
      }

      const [position, timestamp] = await Promise.all([
        this.getQueuePosition(tokenId),
        this.getQueueTimestamp(tokenId),
      ]);

      return {
        tokenId,
        position,
        enteredAt: new Date(timestamp * 1000),
        canClaim,
        estimatedClaimTime: this.calculateEstimatedClaimTime(position),
      };
    } catch (error) {
      console.error('Error getting queue info:', error);
      throw new Error('Failed to get queue info');
    }
  }

  /**
   * Get all tokens in the queue
   */
  async getAllQueuedTokens(): Promise<number[]> {
    try {
      const queueLength = await this.getQueueLength();
      const tokenIds: number[] = [];

      for (let i = 0; i < queueLength; i++) {
        const tokenId = await this.getQueuedToken(i);
        tokenIds.push(tokenId);
      }

      return tokenIds;
    } catch (error) {
      console.error('Error getting all queued tokens:', error);
      throw new Error('Failed to get all queued tokens');
    }
  }

  /**
   * Get queue entries for multiple tokens
   */
  async getQueueEntries(tokenIds: number[]): Promise<ExitQueueEntry[]> {
    try {
      const entries: ExitQueueEntry[] = [];

      for (const tokenId of tokenIds) {
        const entry = await this.getQueueInfo(tokenId);
        if (entry) {
          entries.push(entry);
        }
      }

      // Sort by position
      return entries.sort((a, b) => a.position - b.position);
    } catch (error) {
      console.error('Error getting queue entries:', error);
      throw new Error('Failed to get queue entries');
    }
  }

  /**
   * Get user's queue entries
   */
  async getUserQueueEntries(userTokenIds: number[]): Promise<ExitQueueEntry[]> {
    try {
      const queueEntries: ExitQueueEntry[] = [];

      for (const tokenId of userTokenIds) {
        const entry = await this.getQueueInfo(tokenId);
        if (entry) {
          queueEntries.push(entry);
        }
      }

      return queueEntries.sort((a, b) => a.position - b.position);
    } catch (error) {
      console.error('Error getting user queue entries:', error);
      throw new Error('Failed to get user queue entries');
    }
  }

  /**
   * Calculate estimated claim time based on queue position
   * This is a simplified calculation - in reality, it would depend on
   * the queue processing rate and other factors
   */
  private calculateEstimatedClaimTime(position: number): Date {
    // Assume 1 token is processed per day (this would be configurable)
    const PROCESSING_RATE_PER_DAY = 1;
    const daysToProcess = Math.ceil(position / PROCESSING_RATE_PER_DAY);
    const estimatedTime = new Date();
    estimatedTime.setDate(estimatedTime.getDate() + daysToProcess);
    return estimatedTime;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    totalInQueue: number;
    averageWaitTime: number; // in days
    processingRate: number; // tokens per day
  }> {
    try {
      const totalInQueue = await this.getQueueLength();

      // These would be calculated based on historical data in a real implementation
      const averageWaitTime = totalInQueue * 1; // 1 day per position (simplified)
      const processingRate = 1; // 1 token per day (simplified)

      return {
        totalInQueue,
        averageWaitTime,
        processingRate,
      };
    } catch (error) {
      console.error('Error getting queue stats:', error);
      throw new Error('Failed to get queue stats');
    }
  }

  /**
   * Check if user can enter queue with a token
   */
  async canEnterQueue(tokenId: number): Promise<{
    canEnter: boolean;
    reason?: string;
  }> {
    try {
      const isAlreadyInQueue = await this.isInQueue(tokenId);

      if (isAlreadyInQueue) {
        return {
          canEnter: false,
          reason: 'Token is already in the exit queue',
        };
      }

      // Additional checks could be added here, such as:
      // - Token must be expired
      // - Token must be owned by the caller
      // - etc.

      return { canEnter: true };
    } catch (error) {
      console.error('Error checking if can enter queue:', error);
      throw new Error('Failed to check if can enter queue');
    }
  }

  subscribeToJoinQueueEvents(
    callback: (event: {
      tokenId: bigint;
      owner: Address;
      position: bigint;
    }) => void
  ): () => void {
    const unwatch = watchContractEvent(config, {
      address: this.exitQueueAddress,
      abi: exitQueueABI,
      eventName: 'JoinedQueue',
      onLogs: logs => {
        logs.forEach((log: any) => {
          const { args } = log;
          if (
            args &&
            'tokenId' in args &&
            'owner' in args &&
            'position' in args
          ) {
            callback({
              tokenId: args.tokenId as bigint,
              owner: args.owner as Address,
              position: args.position as bigint,
            });
          }
        });
      },
    });

    return unwatch;
  }

  subscribeToLeaveQueueEvents(
    callback: (event: { tokenId: bigint; owner: Address }) => void
  ): () => void {
    const unwatch = watchContractEvent(config, {
      address: this.exitQueueAddress,
      abi: exitQueueABI,
      eventName: 'LeftQueue',
      onLogs: logs => {
        logs.forEach((log: any) => {
          const { args } = log;
          if (args && 'tokenId' in args && 'owner' in args) {
            callback({
              tokenId: args.tokenId as bigint,
              owner: args.owner as Address,
            });
          }
        });
      },
    });

    return unwatch;
  }

  subscribeToClaimEvents(
    callback: (event: {
      tokenId: bigint;
      owner: Address;
      amount: bigint;
    }) => void
  ): () => void {
    const unwatch = watchContractEvent(config, {
      address: this.exitQueueAddress,
      abi: exitQueueABI,
      eventName: 'TokenClaimed',
      onLogs: logs => {
        logs.forEach((log: any) => {
          const { args } = log;
          if (
            args &&
            'tokenId' in args &&
            'owner' in args &&
            'amount' in args
          ) {
            callback({
              tokenId: args.tokenId as bigint,
              owner: args.owner as Address,
              amount: args.amount as bigint,
            });
          }
        });
      },
    });

    return unwatch;
  }

  /**
   * Batch check multiple tokens for queue eligibility
   */
  async batchCheckQueueEligibility(tokenIds: number[]): Promise<
    {
      tokenId: number;
      canEnter: boolean;
      reason?: string;
    }[]
  > {
    try {
      const results = await Promise.all(
        tokenIds.map(async tokenId => {
          const eligibility = await this.canEnterQueue(tokenId);
          return {
            tokenId,
            ...eligibility,
          };
        })
      );

      return results;
    } catch (error) {
      console.error('Error batch checking queue eligibility:', error);
      throw new Error('Failed to batch check queue eligibility');
    }
  }
}

// Export singleton instance
export const realExitQueueService = new RealExitQueueService();
