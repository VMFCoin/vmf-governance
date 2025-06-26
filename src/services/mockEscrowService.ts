import {
  TokenLock,
  MockLockedBalance,
  CreateLockParams,
  MockTransaction,
} from '@/types';
import { mockTokenService } from './mockTokenService';

export class MockEscrowService {
  private locks = new Map<number, TokenLock>();
  private userTokens = new Map<string, number[]>();
  private nextTokenId = 1;
  private readonly WARMUP_PERIOD = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
  private readonly ESCROW_ADDRESS = '0xESCROW_CONTRACT_ADDRESS';

  constructor() {
    // Initialize with some mock locks for testing
    this.initializeMockLocks();
  }

  private initializeMockLocks() {
    // Create some mock locks for testing addresses
    const mockAddress = '0x1234567890123456789012345678901234567890';
    const now = new Date();

    // Mock lock 1: Recently created (still in warmup)
    const lock1: TokenLock = {
      id: 1,
      owner: mockAddress.toLowerCase(),
      amount: BigInt('100000000000000000000'), // 100 tokens
      lockDuration: 365 * 24 * 60 * 60, // 1 year
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
      expiresAt: new Date(now.getTime() + 364 * 24 * 60 * 60 * 1000),
      warmupEndsAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days left
      votingPower: this.calculateVotingPower(
        BigInt('100000000000000000000'),
        365 * 24 * 60 * 60
      ),
      isWarmupComplete: false,
    };

    // Mock lock 2: Completed warmup
    const lock2: TokenLock = {
      id: 2,
      owner: mockAddress.toLowerCase(),
      amount: BigInt('500000000000000000000'), // 500 tokens
      lockDuration: 2 * 365 * 24 * 60 * 60, // 2 years
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      expiresAt: new Date(now.getTime() + (2 * 365 - 4) * 24 * 60 * 60 * 1000),
      warmupEndsAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
      votingPower: this.calculateVotingPower(
        BigInt('500000000000000000000'),
        2 * 365 * 24 * 60 * 60
      ),
      isWarmupComplete: true,
    };

    this.locks.set(1, lock1);
    this.locks.set(2, lock2);
    this.userTokens.set(mockAddress.toLowerCase(), [1, 2]);
    this.nextTokenId = 3;
  }

  async createLock(
    amount: bigint,
    duration: number,
    owner: string
  ): Promise<number> {
    // Check allowance first
    const allowance = await mockTokenService.getAllowance(
      owner,
      this.ESCROW_ADDRESS
    );
    if (allowance < amount) {
      throw new Error('Insufficient allowance. Please approve tokens first.');
    }

    // Transfer tokens to escrow
    await mockTokenService.transfer(owner, this.ESCROW_ADDRESS, amount);

    const tokenId = this.nextTokenId++;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + duration * 1000);
    const warmupEndsAt = new Date(now.getTime() + this.WARMUP_PERIOD);

    const lock: TokenLock = {
      id: tokenId,
      owner: owner.toLowerCase(),
      amount,
      lockDuration: duration,
      createdAt: now,
      expiresAt,
      warmupEndsAt,
      votingPower: this.calculateVotingPower(amount, duration),
      isWarmupComplete: false,
    };

    this.locks.set(tokenId, lock);

    // Add to user's token list
    const userLocks = this.userTokens.get(owner.toLowerCase()) || [];
    userLocks.push(tokenId);
    this.userTokens.set(owner.toLowerCase(), userLocks);

    // Schedule warmup completion
    setTimeout(() => {
      const updatedLock = this.locks.get(tokenId);
      if (updatedLock) {
        updatedLock.isWarmupComplete = true;
        this.locks.set(tokenId, updatedLock);
      }
    }, this.WARMUP_PERIOD);

    return tokenId;
  }

  async getVotingPower(tokenId: number): Promise<bigint> {
    const lock = this.locks.get(tokenId);
    if (!lock) {
      throw new Error('Token not found');
    }

    // Return 0 if warmup period hasn't completed
    if (!lock.isWarmupComplete) {
      return BigInt(0);
    }

    // Check if lock has expired
    if (new Date() > lock.expiresAt) {
      return BigInt(0);
    }

    return lock.votingPower;
  }

  async checkWarmupPeriod(tokenId: number): Promise<boolean> {
    const lock = this.locks.get(tokenId);
    if (!lock) {
      throw new Error('Token not found');
    }

    return lock.isWarmupComplete || new Date() >= lock.warmupEndsAt;
  }

  async getUserTokens(address: string): Promise<number[]> {
    return this.userTokens.get(address.toLowerCase()) || [];
  }

  async getLockedBalance(tokenId: number): Promise<MockLockedBalance> {
    const lock = this.locks.get(tokenId);
    if (!lock) {
      throw new Error('Token not found');
    }

    return {
      amount: lock.amount,
      end: Math.floor(lock.expiresAt.getTime() / 1000),
      votingPower: lock.isWarmupComplete ? lock.votingPower : BigInt(0),
    };
  }

  async getLock(tokenId: number): Promise<TokenLock | null> {
    return this.locks.get(tokenId) || null;
  }

  async getUserVotingPowerBreakdown(address: string): Promise<{
    totalLocked: bigint;
    totalVotingPower: bigint;
    locks: TokenLock[];
  }> {
    const tokenIds = await this.getUserTokens(address);
    const locks = tokenIds
      .map(id => this.locks.get(id))
      .filter(Boolean) as TokenLock[];

    const totalLocked = locks.reduce(
      (sum, lock) => sum + lock.amount,
      BigInt(0)
    );
    const totalVotingPower = locks.reduce(
      (sum, lock) =>
        sum + (lock.isWarmupComplete ? lock.votingPower : BigInt(0)),
      BigInt(0)
    );

    return {
      totalLocked,
      totalVotingPower,
      locks,
    };
  }

  private calculateVotingPower(amount: bigint, duration: number): bigint {
    // Simple voting power calculation: amount * (duration / max_duration)
    // Max duration is 4 years (4 * 365 * 24 * 60 * 60 seconds)
    const maxDuration = 4 * 365 * 24 * 60 * 60;
    const durationMultiplier = Math.min(duration / maxDuration, 1);

    // Voting power = amount * duration_multiplier
    // Convert to basis points for precision
    const multiplierBasisPoints = Math.floor(durationMultiplier * 10000);
    return (amount * BigInt(multiplierBasisPoints)) / BigInt(10000);
  }

  // Helper method to simulate warmup completion for testing
  completeWarmup(tokenId: number): void {
    const lock = this.locks.get(tokenId);
    if (lock) {
      lock.isWarmupComplete = true;
      this.locks.set(tokenId, lock);
    }
  }

  /**
   * Extend a lock's duration
   */
  async extendLock(
    tokenId: number,
    newEndTime: number,
    owner: string
  ): Promise<void> {
    const lock = this.locks.get(tokenId);
    if (!lock) {
      throw new Error('Token not found');
    }

    if (lock.owner !== owner.toLowerCase()) {
      throw new Error('Not the owner of this lock');
    }

    if (new Date() > lock.expiresAt) {
      throw new Error('Cannot extend expired lock');
    }

    const newExpiresAt = new Date(newEndTime * 1000);
    if (newExpiresAt <= lock.expiresAt) {
      throw new Error('New end time must be later than current end time');
    }

    // Update lock
    lock.expiresAt = newExpiresAt;
    lock.lockDuration = Math.floor(
      (newExpiresAt.getTime() - lock.createdAt.getTime()) / 1000
    );
    lock.votingPower = this.calculateVotingPower(
      lock.amount,
      lock.lockDuration
    );

    this.locks.set(tokenId, lock);
  }

  /**
   * Increase a lock's amount
   */
  async increaseLockAmount(
    tokenId: number,
    additionalAmount: bigint,
    owner: string
  ): Promise<void> {
    const lock = this.locks.get(tokenId);
    if (!lock) {
      throw new Error('Token not found');
    }

    if (lock.owner !== owner.toLowerCase()) {
      throw new Error('Not the owner of this lock');
    }

    if (new Date() > lock.expiresAt) {
      throw new Error('Cannot increase expired lock');
    }

    // Check allowance and transfer tokens
    const allowance = await mockTokenService.getAllowance(
      owner,
      this.ESCROW_ADDRESS
    );
    if (allowance < additionalAmount) {
      throw new Error('Insufficient allowance. Please approve tokens first.');
    }

    await mockTokenService.transfer(
      owner,
      this.ESCROW_ADDRESS,
      additionalAmount
    );

    // Update lock
    lock.amount += additionalAmount;
    lock.votingPower = this.calculateVotingPower(
      lock.amount,
      lock.lockDuration
    );

    this.locks.set(tokenId, lock);
  }

  /**
   * Merge two locks
   */
  async mergeLocks(
    fromTokenId: number,
    toTokenId: number,
    owner: string
  ): Promise<void> {
    const fromLock = this.locks.get(fromTokenId);
    const toLock = this.locks.get(toTokenId);

    if (!fromLock || !toLock) {
      throw new Error('One or both tokens not found');
    }

    if (
      fromLock.owner !== owner.toLowerCase() ||
      toLock.owner !== owner.toLowerCase()
    ) {
      throw new Error('Not the owner of one or both locks');
    }

    if (new Date() > fromLock.expiresAt || new Date() > toLock.expiresAt) {
      throw new Error('Cannot merge expired locks');
    }

    // Merge into the lock with the later expiration
    const targetLock =
      fromLock.expiresAt > toLock.expiresAt ? fromLock : toLock;
    const sourceLock =
      fromLock.expiresAt > toLock.expiresAt ? toLock : fromLock;
    const targetTokenId = targetLock.id;
    const sourceTokenId = sourceLock.id;

    // Update target lock
    targetLock.amount += sourceLock.amount;
    targetLock.votingPower = this.calculateVotingPower(
      targetLock.amount,
      targetLock.lockDuration
    );

    // Remove source lock
    this.locks.delete(sourceTokenId);

    // Update user's token list
    const userTokens = this.userTokens.get(owner.toLowerCase()) || [];
    const updatedTokens = userTokens.filter(id => id !== sourceTokenId);
    this.userTokens.set(owner.toLowerCase(), updatedTokens);

    this.locks.set(targetTokenId, targetLock);
  }

  /**
   * Withdraw from an expired lock
   */
  async withdrawLock(tokenId: number, owner: string): Promise<void> {
    const lock = this.locks.get(tokenId);
    if (!lock) {
      throw new Error('Token not found');
    }

    if (lock.owner !== owner.toLowerCase()) {
      throw new Error('Not the owner of this lock');
    }

    if (new Date() <= lock.expiresAt) {
      throw new Error('Lock has not expired yet');
    }

    // Transfer tokens back to owner
    await mockTokenService.transfer(this.ESCROW_ADDRESS, owner, lock.amount);

    // Remove lock
    this.locks.delete(tokenId);

    // Update user's token list
    const userTokens = this.userTokens.get(owner.toLowerCase()) || [];
    const updatedTokens = userTokens.filter(id => id !== tokenId);
    this.userTokens.set(owner.toLowerCase(), updatedTokens);
  }
}

export const mockEscrowService = new MockEscrowService();
