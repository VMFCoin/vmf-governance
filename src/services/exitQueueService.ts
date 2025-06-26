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

export interface ExitQueueEntry {
  tokenId: number;
  holder: Address;
  exitDate: Date;
  position: number;
  canExit: boolean;
  estimatedExitFee: bigint;
  timeToMinLock: number; // seconds until min lock is reached
}

export interface QueueStats {
  totalInQueue: number;
  nextExitDate: Date;
  cooldownPeriod: number; // in seconds
  feePercent: number; // percentage as basis points
  minLockPeriod: number; // in seconds
}

export class ExitQueueService {
  private exitQueueAddress: Address;

  constructor() {
    this.exitQueueAddress = getContractAddressFromEnv('EXIT_QUEUE') as Address;
  }

  /**
   * Enter the exit queue for a token
   */
  async enterExitQueue(tokenId: number): Promise<string> {
    try {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      // Simulate the transaction first
      const { request } = await simulateContract(config, {
        address: this.exitQueueAddress,
        abi: exitQueueABI,
        functionName: 'queueExit',
        args: [BigInt(tokenId), account.address],
        account: account.address,
      });

      // Execute the transaction
      const hash = await writeContract(config, request);
      return hash;
    } catch (error) {
      console.error('Error entering exit queue:', error);
      throw error;
    }
  }

  /**
   * Exit from the queue and claim tokens
   */
  async exitFromQueue(tokenId: number): Promise<string> {
    try {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      // Simulate the transaction first
      const { request } = await simulateContract(config, {
        address: this.exitQueueAddress,
        abi: exitQueueABI,
        functionName: 'exit',
        args: [BigInt(tokenId)],
        account: account.address,
      });

      // Execute the transaction
      const hash = await writeContract(config, request);
      return hash;
    } catch (error) {
      console.error('Error exiting from queue:', error);
      throw error;
    }
  }

  /**
   * Check if a token can exit the queue
   */
  async canExit(tokenId: number): Promise<boolean> {
    try {
      const canExitResult = await readContract(config, {
        address: this.exitQueueAddress,
        abi: exitQueueABI,
        functionName: 'canExit',
        args: [BigInt(tokenId)],
      });
      return canExitResult as boolean;
    } catch (error) {
      console.error('Error checking if can exit:', error);
      return false;
    }
  }

  /**
   * Get queue information for a specific token
   */
  async getQueueInfo(tokenId: number): Promise<ExitQueueEntry | null> {
    try {
      const queueData = (await readContract(config, {
        address: this.exitQueueAddress,
        abi: exitQueueABI,
        functionName: 'queue',
        args: [BigInt(tokenId)],
      })) as { holder: Address; exitDate: bigint };

      if (queueData.holder === '0x0000000000000000000000000000000000000000') {
        return null; // Not in queue
      }

      const [canExit, estimatedFee, timeToMinLock] = await Promise.all([
        this.canExit(tokenId),
        this.calculateExitFee(tokenId),
        this.getTimeToMinLock(tokenId),
      ]);

      return {
        tokenId,
        holder: queueData.holder,
        exitDate: new Date(Number(queueData.exitDate) * 1000),
        position: 0, // Will be calculated separately if needed
        canExit,
        estimatedExitFee: estimatedFee,
        timeToMinLock: Number(timeToMinLock),
      };
    } catch (error) {
      console.error('Error getting queue info:', error);
      return null;
    }
  }

  /**
   * Calculate the exit fee for a token
   */
  async calculateExitFee(tokenId: number): Promise<bigint> {
    try {
      const fee = await readContract(config, {
        address: this.exitQueueAddress,
        abi: exitQueueABI,
        functionName: 'calculateFee',
        args: [BigInt(tokenId)],
      });
      return fee as bigint;
    } catch (error) {
      console.error('Error calculating exit fee:', error);
      return BigInt(0);
    }
  }

  /**
   * Get time remaining until minimum lock period is reached
   */
  async getTimeToMinLock(tokenId: number): Promise<bigint> {
    try {
      const timeToMinLock = await readContract(config, {
        address: this.exitQueueAddress,
        abi: exitQueueABI,
        functionName: 'timeToMinLock',
        args: [BigInt(tokenId)],
      });
      return timeToMinLock as bigint;
    } catch (error) {
      console.error('Error getting time to min lock:', error);
      return BigInt(0);
    }
  }

  /**
   * Get the ticket holder for a token
   */
  async getTicketHolder(tokenId: number): Promise<Address | null> {
    try {
      const holder = await readContract(config, {
        address: this.exitQueueAddress,
        abi: exitQueueABI,
        functionName: 'ticketHolder',
        args: [BigInt(tokenId)],
      });
      const holderAddress = holder as Address;
      return holderAddress === '0x0000000000000000000000000000000000000000'
        ? null
        : holderAddress;
    } catch (error) {
      console.error('Error getting ticket holder:', error);
      return null;
    }
  }

  /**
   * Get queue statistics and configuration
   */
  async getQueueStats(): Promise<QueueStats> {
    try {
      const [nextExitDate, cooldown, feePercent, minLock] = await Promise.all([
        readContract(config, {
          address: this.exitQueueAddress,
          abi: exitQueueABI,
          functionName: 'nextExitDate',
        }),
        readContract(config, {
          address: this.exitQueueAddress,
          abi: exitQueueABI,
          functionName: 'cooldown',
        }),
        readContract(config, {
          address: this.exitQueueAddress,
          abi: exitQueueABI,
          functionName: 'feePercent',
        }),
        readContract(config, {
          address: this.exitQueueAddress,
          abi: exitQueueABI,
          functionName: 'minLock',
        }),
      ]);

      return {
        totalInQueue: 0, // This would need to be calculated by iterating through events
        nextExitDate: new Date(Number(nextExitDate) * 1000),
        cooldownPeriod: Number(cooldown),
        feePercent: Number(feePercent),
        minLockPeriod: Number(minLock),
      };
    } catch (error) {
      console.error('Error getting queue stats:', error);
      throw error;
    }
  }

  /**
   * Check if a token is eligible to enter the exit queue
   */
  async canEnterQueue(tokenId: number): Promise<{
    canEnter: boolean;
    reason?: string;
  }> {
    try {
      const timeToMinLock = await this.getTimeToMinLock(tokenId);

      if (Number(timeToMinLock) > 0) {
        return {
          canEnter: false,
          reason: `Minimum lock period not reached. ${Math.ceil(Number(timeToMinLock) / 86400)} days remaining.`,
        };
      }

      const ticketHolder = await this.getTicketHolder(tokenId);
      if (ticketHolder) {
        return {
          canEnter: false,
          reason: 'Token is already in the exit queue.',
        };
      }

      return { canEnter: true };
    } catch (error) {
      console.error('Error checking queue eligibility:', error);
      return {
        canEnter: false,
        reason: 'Error checking eligibility. Please try again.',
      };
    }
  }

  /**
   * Subscribe to ExitQueued events
   */
  subscribeToExitQueuedEvents(
    callback: (event: {
      tokenId: bigint;
      holder: Address;
      exitDate: bigint;
    }) => void
  ): () => void {
    const unsubscribe = watchContractEvent(config, {
      address: this.exitQueueAddress,
      abi: exitQueueABI,
      eventName: 'ExitQueued',
      onLogs: logs => {
        logs.forEach(log => {
          if ('args' in log && log.args) {
            const args = log.args as any;
            callback({
              tokenId: args.tokenId as bigint,
              holder: args.holder as Address,
              exitDate: args.exitDate as bigint,
            });
          }
        });
      },
    });

    return unsubscribe;
  }

  /**
   * Subscribe to Exit events
   */
  subscribeToExitEvents(
    callback: (event: { tokenId: bigint; fee: bigint }) => void
  ): () => void {
    const unsubscribe = watchContractEvent(config, {
      address: this.exitQueueAddress,
      abi: exitQueueABI,
      eventName: 'Exit',
      onLogs: logs => {
        logs.forEach(log => {
          if ('args' in log && log.args) {
            const args = log.args as any;
            callback({
              tokenId: args.tokenId as bigint,
              fee: args.fee as bigint,
            });
          }
        });
      },
    });

    return unsubscribe;
  }

  /**
   * Get multiple queue entries for batch processing
   */
  async getBatchQueueInfo(
    tokenIds: number[]
  ): Promise<(ExitQueueEntry | null)[]> {
    try {
      const promises = tokenIds.map(tokenId => this.getQueueInfo(tokenId));
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error getting batch queue info:', error);
      return tokenIds.map(() => null);
    }
  }
}

// Export singleton instance
export const exitQueueService = new ExitQueueService();
