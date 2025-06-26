import { Address } from 'viem';
import {
  readContract,
  writeContract,
  simulateContract,
  watchContractEvent,
  getAccount,
  waitForTransactionReceipt,
} from '@wagmi/core';
import { config } from '@/lib/wagmi';
import { votingEscrowABI } from '@/contracts/abis/VotingEscrow';
import { nftLockABI } from '@/contracts/abis/NFTLock';
import { curveABI } from '@/contracts/abis/Curve';
import { DEPLOYED_CONTRACTS } from '@/contracts/addresses';
import { TokenLock, MockLockedBalance } from '@/types';
import {
  ExtendedLockInfo,
  VotingPowerBreakdown,
  ExtendedVotingPowerBreakdown,
} from '@/types/lock';

export interface LockInfo {
  tokenId: number;
  amount: bigint;
  end: number;
  votingPower: bigint;
  owner?: Address;
  createdAt?: Date;
}

export interface LockCreatedEvent {
  provider: Address;
  tokenId: bigint;
  value: bigint;
  locktime: bigint;
  depositType: bigint;
  timestamp: bigint;
}

export interface WithdrawEvent {
  provider: Address;
  tokenId: bigint;
  value: bigint;
  timestamp: bigint;
}

export class RealEscrowService {
  private votingEscrowAddress: Address;
  private nftLockAddress: Address;
  private curveAddress: Address;
  private readonly WARMUP_PERIOD = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

  constructor() {
    this.votingEscrowAddress = DEPLOYED_CONTRACTS.VOTING_ESCROW as Address;
    this.nftLockAddress = DEPLOYED_CONTRACTS.NFT_LOCK as Address;
    this.curveAddress = DEPLOYED_CONTRACTS.CURVE as Address;
  }

  /**
   * Check if a token has completed its warmup period using curve contract
   */
  async isTokenWarm(tokenId: bigint): Promise<boolean> {
    try {
      const isWarm = await readContract(config, {
        address: this.curveAddress,
        abi: curveABI,
        functionName: 'isWarm',
        args: [tokenId],
      });
      return isWarm as boolean;
    } catch (error) {
      console.error('Error checking if token is warm:', error);
      return false;
    }
  }

  /**
   * Get voting power from curve contract (respects warmup)
   */
  async getTokenVotingPowerFromCurve(tokenId: bigint): Promise<bigint> {
    try {
      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      const votingPower = await readContract(config, {
        address: this.curveAddress,
        abi: curveABI,
        functionName: 'votingPowerAt',
        args: [tokenId, currentTime],
      });
      return votingPower as bigint;
    } catch (error) {
      console.error('Error getting voting power from curve:', error);
      return BigInt(0);
    }
  }

  /**
   * Get warmup period in seconds from curve contract
   */
  async getWarmupPeriod(): Promise<number> {
    try {
      const warmupPeriod = await readContract(config, {
        address: this.curveAddress,
        abi: curveABI,
        functionName: 'warmupPeriod',
        args: [],
      });
      return Number(warmupPeriod);
    } catch (error) {
      console.error('Error getting warmup period:', error);
      return 259200; // Default 3 days in seconds
    }
  }

  async createLock(
    amount: bigint,
    _unlockTime?: number,
    _owner?: string
  ): Promise<string> {
    try {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      // Use VotingEscrow contract with correct function signature
      // VotingEscrowIncreasing.createLock(uint256 _value) only takes amount
      const { request } = await simulateContract(config, {
        address: this.votingEscrowAddress,
        abi: votingEscrowABI,
        functionName: 'createLock',
        args: [amount], // Only amount parameter, no duration
        account: account.address,
      });

      // Execute the transaction
      const hash = await writeContract(config, request);

      // Wait for transaction confirmation
      const receipt = await waitForTransactionReceipt(config, { hash });

      return hash;
    } catch (error) {
      console.error('Error creating lock:', error);
      throw error;
    }
  }

  async getVotingPower(tokenId: number): Promise<bigint> {
    try {
      const power = await readContract(config, {
        address: this.votingEscrowAddress,
        abi: votingEscrowABI,
        functionName: 'votingPower',
        args: [BigInt(tokenId)],
      });
      return BigInt(power as string);
    } catch (error) {
      console.error('Error getting voting power:', error);
      throw error;
    }
  }

  async getVotingPowerAt(tokenId: number, timestamp: number): Promise<bigint> {
    try {
      const power = await readContract(config, {
        address: this.votingEscrowAddress,
        abi: votingEscrowABI,
        functionName: 'votingPowerAt',
        args: [BigInt(tokenId), BigInt(timestamp)],
      });
      return BigInt(power as string);
    } catch (error) {
      console.error('Error getting voting power at timestamp:', error);
      throw error;
    }
  }

  async getUserLocks(address: Address): Promise<LockInfo[]> {
    try {
      // Use VotingEscrow.ownedTokens to get user's token IDs
      const tokenIds = await readContract(config, {
        address: this.votingEscrowAddress,
        abi: votingEscrowABI,
        functionName: 'ownedTokens',
        args: [address],
      });

      const locks: LockInfo[] = [];
      const tokenIdArray = tokenIds as bigint[];

      for (const tokenId of tokenIdArray) {
        const lockInfo = await this.getLockInfo(Number(tokenId));
        locks.push(lockInfo);
      }

      return locks;
    } catch (error) {
      console.error('Error getting user locks:', error);
      throw error;
    }
  }

  async getLockInfo(tokenId: number): Promise<LockInfo> {
    try {
      // Use VotingEscrow.locked to get lock details
      const lockInfo = await readContract(config, {
        address: this.votingEscrowAddress,
        abi: votingEscrowABI,
        functionName: 'locked',
        args: [BigInt(tokenId)],
      });

      // LockedBalance struct: { amount: uint208, start: uint48 }
      const { amount, start } = lockInfo as { amount: bigint; start: bigint };

      return {
        tokenId,
        amount,
        end: Number(start), // start time, not end time in increasing escrow
        votingPower: await this.getVotingPower(tokenId),
      };
    } catch (error) {
      console.error('Error getting lock info:', error);
      throw error;
    }
  }

  async getLockDetails(tokenId: number): Promise<{
    owner: Address;
    amount: bigint;
    end: number;
    votingPower: bigint;
  }> {
    try {
      // Get owner from NFT contract
      const owner = await readContract(config, {
        address: this.nftLockAddress,
        abi: nftLockABI,
        functionName: 'ownerOf',
        args: [BigInt(tokenId)],
      });

      // Get lock info from VotingEscrow
      const lockInfo = await readContract(config, {
        address: this.votingEscrowAddress,
        abi: votingEscrowABI,
        functionName: 'locked',
        args: [BigInt(tokenId)],
      });

      const { amount, start } = lockInfo as { amount: bigint; start: bigint };
      const votingPower = await this.getVotingPower(tokenId);

      return {
        owner: owner as Address,
        amount,
        end: Number(start),
        votingPower,
      };
    } catch (error) {
      console.error('Error getting lock details:', error);
      throw error;
    }
  }

  // Note: VotingEscrowIncreasing doesn't support increasing amount or time
  // These functions are kept for interface compatibility but will throw errors
  async increaseLockAmount(tokenId: number, amount: bigint): Promise<string> {
    throw new Error(
      'VotingEscrowIncreasing does not support increasing lock amounts'
    );
  }

  async increaseLockTime(tokenId: number, unlockTime: number): Promise<string> {
    throw new Error(
      'VotingEscrowIncreasing does not support increasing lock time'
    );
  }

  async withdraw(tokenId: number): Promise<string> {
    try {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      // Use VotingEscrow.withdraw function
      const { request } = await simulateContract(config, {
        address: this.votingEscrowAddress,
        abi: votingEscrowABI,
        functionName: 'withdraw',
        args: [BigInt(tokenId)],
        account: account.address,
      });

      const hash = await writeContract(config, request);
      return hash;
    } catch (error) {
      console.error('Error withdrawing:', error);
      throw error;
    }
  }

  async beginWithdrawal(tokenId: number): Promise<string> {
    try {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      // Use VotingEscrow.beginWithdrawal function
      const { request } = await simulateContract(config, {
        address: this.votingEscrowAddress,
        abi: votingEscrowABI,
        functionName: 'beginWithdrawal',
        args: [BigInt(tokenId)],
        account: account.address,
      });

      const hash = await writeContract(config, request);
      return hash;
    } catch (error) {
      console.error('Error beginning withdrawal:', error);
      throw error;
    }
  }

  /**
   * Check warmup period completion
   * Note: This is a simplified check - in reality, warmup logic might be in a different contract
   */
  async checkWarmupPeriod(tokenId: number): Promise<{
    isComplete: boolean;
    remainingTime: number;
  }> {
    try {
      const lockInfo = await this.getLockInfo(tokenId);
      if (!lockInfo) {
        throw new Error('Lock not found');
      }

      const now = Date.now();
      // Use current time as fallback if createdAt is not available
      const createdTime =
        lockInfo.createdAt?.getTime() || now - this.WARMUP_PERIOD;
      const warmupEndTime = createdTime + this.WARMUP_PERIOD;
      const isComplete = now >= warmupEndTime;
      const remainingTime = Math.max(0, warmupEndTime - now);

      return {
        isComplete,
        remainingTime,
      };
    } catch (error) {
      console.error('Error checking warmup period:', error);
      throw error;
    }
  }

  /**
   * Get all token IDs owned by an address
   */
  async getUserTokens(address: Address): Promise<number[]> {
    try {
      // Use VotingEscrow.ownedTokens function
      const tokenIds = await readContract(config, {
        address: this.votingEscrowAddress,
        abi: votingEscrowABI,
        functionName: 'ownedTokens',
        args: [address],
      });

      const tokenIdArray = tokenIds as bigint[];
      return tokenIdArray.map(id => Number(id));
    } catch (error) {
      console.error('Error getting user tokens:', error);
      throw new Error('Failed to get user tokens');
    }
  }

  /**
   * Get locked balance information for a token
   */
  async getLockedBalance(tokenId: number): Promise<MockLockedBalance> {
    try {
      const lockInfo = await this.getLockInfo(tokenId);
      const votingPower = await this.getVotingPower(tokenId);

      return {
        amount: BigInt(lockInfo.amount),
        end: Number(lockInfo.end),
        votingPower,
      };
    } catch (error) {
      console.error('Error getting locked balance:', error);
      throw new Error('Failed to get locked balance');
    }
  }

  /**
   * Get detailed lock information
   */
  async getLock(tokenId: number): Promise<TokenLock | null> {
    try {
      const lockInfo = await this.getLockInfo(tokenId);
      if (!lockInfo) {
        return null;
      }

      // Get creation timestamp from events (simplified - in production, you'd query events)
      const now = new Date();
      const startTimestamp = Number(lockInfo.end) * 1000; // Convert to milliseconds
      const amount = BigInt(lockInfo.amount);

      // For increasing escrow, we use start time, not end time
      const createdAt = new Date(startTimestamp);

      const lock: TokenLock = {
        id: tokenId,
        owner: lockInfo.owner?.toLowerCase() || '0x0',
        amount,
        lockDuration: 0, // No fixed duration in increasing escrow
        createdAt,
        expiresAt: new Date(0), // No fixed expiry in increasing escrow
        warmupEndsAt: new Date(createdAt.getTime() + this.WARMUP_PERIOD),
        votingPower: await this.getVotingPower(tokenId),
        isWarmupComplete:
          Date.now() >= createdAt.getTime() + this.WARMUP_PERIOD,
      };

      return lock;
    } catch (error) {
      console.error('Error getting lock:', error);
      return null;
    }
  }

  /**
   * Get user's voting power breakdown with proper warmup detection
   */
  async getUserVotingPowerBreakdown(
    userAddress: `0x${string}`
  ): Promise<ExtendedVotingPowerBreakdown> {
    try {
      const tokenIds = await this.getUserTokens(userAddress as Address);
      const locks: ExtendedLockInfo[] = [];

      let totalLocked = BigInt(0);
      let activeVotingPower = BigInt(0);
      let warmingUpLocked = BigInt(0);
      let activeLocked = BigInt(0);
      let warmingUpCount = 0;
      let activeCount = 0;

      for (const tokenId of tokenIds) {
        const lockInfo = await this.getLockInfo(tokenId);
        if (lockInfo && lockInfo.amount > BigInt(0)) {
          // Check warmup status from curve contract
          const isWarm = await this.isTokenWarm(BigInt(tokenId));

          // Get voting power (will be 0 during warmup)
          const votingPower = await this.getTokenVotingPowerFromCurve(
            BigInt(tokenId)
          );

          // Get warmup period info
          const warmupPeriod = await this.getWarmupPeriod();
          const lockStartTime = Number(lockInfo.end) * 1000; // Convert to milliseconds
          const warmupEndTime = lockStartTime + warmupPeriod * 1000;
          const timeToWarmupComplete = Math.max(0, warmupEndTime - Date.now());

          const extendedLock: ExtendedLockInfo = {
            tokenId,
            amount: lockInfo.amount,
            end: lockInfo.end,
            votingPower,
            owner: lockInfo.owner,
            createdAt: new Date(lockStartTime),
            isWarm,
            isWarmupComplete: isWarm,
            warmupEndTime: new Date(warmupEndTime),
            timeToWarmupComplete,
            status: isWarm ? 'active' : 'warming_up',
          };

          locks.push(extendedLock);

          // Count totals
          totalLocked += lockInfo.amount;

          if (isWarm) {
            // Lock is active
            activeVotingPower += votingPower;
            activeLocked += lockInfo.amount;
            activeCount++;
          } else {
            // Lock is in warmup
            warmingUpLocked += lockInfo.amount;
            warmingUpCount++;
          }
        }
      }

      return {
        totalLocked,
        totalVotingPower: activeVotingPower, // Only active locks have voting power
        activeVotingPower,
        warmingUpLocked,
        warmingUpCount,
        activeLocked,
        activeCount,
        locks,
      } as ExtendedVotingPowerBreakdown;
    } catch (error) {
      console.error('Error fetching user voting power breakdown:', error);
      throw new Error('Failed to get user voting power breakdown');
    }
  }

  /**
   * Subscribe to Deposit events (lock creation)
   */
  subscribeToLockEvents(
    callback: (event: {
      provider: Address;
      tokenId: bigint;
      value: bigint;
      locktime: bigint;
    }) => void
  ): () => void {
    const unwatch = watchContractEvent(config, {
      address: this.votingEscrowAddress,
      abi: votingEscrowABI,
      eventName: 'Deposit',
      onLogs: logs => {
        logs.forEach((log: any) => {
          const { args } = log;
          if (
            args &&
            'provider' in args &&
            'tokenId' in args &&
            'value' in args &&
            'locktime' in args
          ) {
            callback({
              provider: args.provider as Address,
              tokenId: args.tokenId as bigint,
              value: args.value as bigint,
              locktime: args.locktime as bigint,
            });
          }
        });
      },
    });

    return unwatch;
  }

  /**
   * Subscribe to Withdraw events
   */
  subscribeToWithdrawEvents(
    callback: (event: {
      provider: Address;
      tokenId: bigint;
      value: bigint;
    }) => void
  ): () => void {
    const unwatch = watchContractEvent(config, {
      address: this.votingEscrowAddress,
      abi: votingEscrowABI,
      eventName: 'Withdraw',
      onLogs: logs => {
        logs.forEach((log: any) => {
          const { args } = log;
          if (
            args &&
            'provider' in args &&
            'tokenId' in args &&
            'value' in args
          ) {
            callback({
              provider: args.provider as Address,
              tokenId: args.tokenId as bigint,
              value: args.value as bigint,
            });
          }
        });
      },
    });

    return unwatch;
  }
}

// Export singleton instance
export const realEscrowService = new RealEscrowService();
