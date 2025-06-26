import { Address } from 'viem';
import { readContract } from '@wagmi/core';
import { config } from '@/lib/wagmi';
import { getContractAddressFromEnv } from '@/contracts/addresses';
import {
  createPublicClient,
  custom,
  getContract,
  type PublicClient,
  http,
  parseEther,
} from 'viem';
import { mainnet } from 'viem/chains';
import { TokenLock } from '@/types';
import VotingEscrowABI from '@/contracts/abis/VotingEscrow.json';
import NFTLockABI from '@/contracts/abis/NFTLock.json';

export interface LockOptimization {
  currentPower: bigint;
  optimizedPower: bigint;
  recommendations: LockRecommendation[];
  potentialGain: bigint;
  efficiency: number;
}

export interface LockRecommendation {
  type: 'increase_amount' | 'increase_duration' | 'create_new' | 'merge_locks';
  description: string;
  tokenId?: number;
  suggestedAmount?: bigint;
  suggestedDuration?: number;
  expectedPowerGain: bigint;
  cost: bigint;
  efficiency: number;
}

export interface PowerDecayProjection {
  currentPower: bigint;
  projections: {
    timestamp: number;
    power: bigint;
    percentageRemaining: number;
  }[];
  halfLifeTimestamp: number;
  expirationTimestamp: number;
}

export interface OptimizationRecommendation {
  lockId: number;
  title: string;
  description: string;
  action: string;
  category: 'power' | 'risk' | 'efficiency' | 'timing' | 'gas';
  priority: 'high' | 'medium' | 'low';
  potentialGain: bigint;
  riskReduction?: number;
  efficiencyImprovement?: number;
  gasOptimization?: bigint;
  timeToImplement?: number;
  steps?: string[];
}

export interface HistoricalPowerData {
  timestamp: number;
  power: bigint;
  tokenId: number;
  blockNumber: number;
}

export interface UserComparison {
  userAddress: Address;
  totalPower: bigint;
  lockCount: number;
  averageEfficiency: number;
  rank: number;
  percentile: number;
}

export interface PowerAnalytics {
  currentPower: bigint;
  powerTrend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
  projectedPower7d: bigint;
  projectedPower30d: bigint;
  historicalData: HistoricalPowerData[];
  userComparison: UserComparison;
}

export class VotingPowerCalculator {
  private publicClient: PublicClient;
  private votingEscrowContract: any;
  private nftLockContract: any;
  private readonly votingEscrowAddress: Address;
  private readonly nftLockAddress: Address;

  // Constants from VotingEscrow contract
  private readonly MAXTIME = 4 * 365 * 24 * 60 * 60; // 4 years in seconds
  private readonly WEEK = 7 * 24 * 60 * 60; // 1 week in seconds
  private readonly MULTIPLIER = BigInt(10 ** 18);

  constructor() {
    this.votingEscrowAddress = getContractAddressFromEnv(
      'VOTING_ESCROW'
    ) as Address;
    this.nftLockAddress = getContractAddressFromEnv('NFT_LOCK') as Address;

    // Initialize public client for read operations
    // Check if we're in a browser environment
    const transport =
      typeof window !== 'undefined' && window.ethereum
        ? custom(window.ethereum)
        : http(); // Fallback for SSR

    this.publicClient = createPublicClient({
      chain: mainnet,
      transport,
    });

    // Initialize contracts for read operations
    this.votingEscrowContract = getContract({
      address: this.votingEscrowAddress,
      abi: VotingEscrowABI,
      client: this.publicClient,
    });

    this.nftLockContract = getContract({
      address: this.nftLockAddress,
      abi: NFTLockABI,
      client: this.publicClient,
    });
  }

  async getCurrentVotingPower(tokenId: number): Promise<bigint> {
    try {
      const votingPower = (await readContract(config, {
        address: this.nftLockAddress,
        abi: NFTLockABI,
        functionName: 'balanceOfNFT',
        args: [BigInt(tokenId)],
      })) as bigint;
      return votingPower;
    } catch (error) {
      console.error('Error getting current voting power:', error);
      throw error;
    }
  }

  async getVotingPowerAt(tokenId: number, timestamp: number): Promise<bigint> {
    try {
      const votingPower = (await readContract(config, {
        address: this.nftLockAddress,
        abi: NFTLockABI,
        functionName: 'balanceOfNFTAt',
        args: [BigInt(tokenId), BigInt(timestamp)],
      })) as bigint;
      return votingPower;
    } catch (error) {
      console.error('Error getting voting power at timestamp:', error);
      throw error;
    }
  }

  async getLockInfo(tokenId: number): Promise<{
    amount: bigint;
    end: number;
  }> {
    try {
      const lockInfo = (await readContract(config, {
        address: this.nftLockAddress,
        abi: NFTLockABI,
        functionName: 'locked',
        args: [BigInt(tokenId)],
      })) as [bigint, bigint];

      const [amount, end] = lockInfo;
      return {
        amount,
        end: Number(end),
      };
    } catch (error) {
      console.error('Error getting lock info:', error);
      throw error;
    }
  }

  /**
   * Calculate voting power based on amount and duration
   */
  private calculateVotingPower(amount: bigint, duration: number): bigint {
    // Simplified voting power calculation: power = amount * (duration / MAXTIME)
    const durationRatio = BigInt(Math.floor((duration / this.MAXTIME) * 1000));
    return (amount * durationRatio) / BigInt(1000);
  }

  /**
   * Calculate power decay over time for a specific lock
   */
  async calculatePowerDecay(
    tokenId: number,
    futureTime: number
  ): Promise<PowerDecayProjection> {
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      const currentPower = await this.getCurrentVotingPower(tokenId);

      // Get lock information
      const lockInfo = await this.getLockInfo(tokenId);
      const lockEnd = lockInfo.end;

      if (futureTime > lockEnd) {
        futureTime = lockEnd;
      }

      const projections = [];
      const timeStep = Math.max(1, Math.floor((futureTime - currentTime) / 20)); // 20 data points

      for (let t = currentTime; t <= futureTime; t += timeStep) {
        const power = await this.getVotingPowerAt(tokenId, t);
        const percentageRemaining =
          currentPower > 0 ? Number((power * BigInt(100)) / currentPower) : 0;

        projections.push({
          timestamp: t,
          power,
          percentageRemaining,
        });
      }

      // Calculate half-life (when power drops to 50%)
      const halfPower = currentPower / BigInt(2);
      let halfLifeTimestamp = lockEnd;

      for (const projection of projections) {
        if (projection.power <= halfPower) {
          halfLifeTimestamp = projection.timestamp;
          break;
        }
      }

      return {
        currentPower,
        projections,
        halfLifeTimestamp,
        expirationTimestamp: lockEnd,
      };
    } catch (error) {
      console.error('Error calculating power decay:', error);
      throw new Error('Failed to calculate power decay');
    }
  }

  /**
   * Calculate optimal lock duration for a given amount and target power
   */
  async calculateOptimalLockDuration(
    amount: bigint,
    targetVotingPower: bigint
  ): Promise<number> {
    try {
      const lockInfo = await readContract(config, {
        address: this.nftLockAddress,
        abi: NFTLockABI,
        functionName: 'locked',
        args: [BigInt(1)], // Use a sample token ID
      });

      // Calculate optimal duration based on target voting power
      const maxLockTime = 4 * 365 * 24 * 60 * 60; // 4 years in seconds
      const minLockTime = 7 * 24 * 60 * 60; // 1 week in seconds

      // Binary search for optimal duration
      let low = minLockTime;
      let high = maxLockTime;
      let optimalDuration = minLockTime;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const projectedPower = this.calculateVotingPower(amount, mid);

        if (projectedPower >= targetVotingPower) {
          optimalDuration = mid;
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      }

      return optimalDuration;
    } catch (error) {
      console.error('Error calculating optimal lock duration:', error);
      throw error;
    }
  }

  /**
   * Optimize lock portfolio for maximum voting power efficiency
   */
  async optimizeLockPortfolio(tokenIds: number[]): Promise<LockOptimization> {
    try {
      let currentPower = BigInt(0);
      const locks: TokenLock[] = [];
      const recommendations: LockRecommendation[] = [];

      // Calculate current total power and analyze each lock
      for (const tokenId of tokenIds) {
        const power = await this.getCurrentVotingPower(tokenId);
        currentPower += power;

        const lockInfo = await this.getLockInfo(tokenId);
        const amount = lockInfo.amount as bigint;
        const end = lockInfo.end;
        const currentTime = Math.floor(Date.now() / 1000);
        const remainingTime = end - currentTime;

        locks.push({
          id: tokenId,
          owner: '', // Will be filled by caller
          amount,
          lockDuration: remainingTime,
          createdAt: new Date(),
          expiresAt: new Date(end * 1000),
          warmupEndsAt: new Date(),
          votingPower: power,
          isWarmupComplete: true,
        });

        // Generate recommendations for each lock
        if (remainingTime < this.WEEK * 4) {
          // Less than 4 weeks remaining
          recommendations.push({
            type: 'increase_duration',
            description: `Extend lock #${tokenId} duration to maintain voting power`,
            tokenId,
            suggestedDuration: this.WEEK * 52, // 1 year
            expectedPowerGain: power / BigInt(2), // Estimated gain
            cost: BigInt(0), // No additional tokens needed
            efficiency: 0.8,
          });
        }

        if (amount < BigInt(1000) * this.MULTIPLIER) {
          // Less than 1000 tokens
          recommendations.push({
            type: 'increase_amount',
            description: `Increase lock #${tokenId} amount for better efficiency`,
            tokenId,
            suggestedAmount: BigInt(1000) * this.MULTIPLIER,
            expectedPowerGain: power,
            cost: BigInt(1000) * this.MULTIPLIER - amount,
            efficiency: 0.9,
          });
        }
      }

      // Sort recommendations by efficiency
      recommendations.sort((a, b) => b.efficiency - a.efficiency);

      // Calculate optimized power (simplified estimation)
      const optimizedPower =
        currentPower +
        recommendations
          .slice(0, 3) // Top 3 recommendations
          .reduce((sum, rec) => sum + rec.expectedPowerGain, BigInt(0));

      const potentialGain = optimizedPower - currentPower;
      const efficiency =
        currentPower > 0
          ? Number((potentialGain * BigInt(100)) / currentPower)
          : 0;

      return {
        currentPower,
        optimizedPower,
        recommendations: recommendations.slice(0, 5), // Top 5 recommendations
        potentialGain,
        efficiency,
      };
    } catch (error) {
      console.error('Error optimizing lock portfolio:', error);
      throw new Error('Failed to optimize lock portfolio');
    }
  }

  /**
   * Calculate voting power efficiency (power per token)
   */
  async calculateLockEfficiency(tokenId: number): Promise<number> {
    try {
      const power = await this.getCurrentVotingPower(tokenId);
      const lockInfo = await this.getLockInfo(tokenId);
      const amount = lockInfo.amount as bigint;

      if (amount === BigInt(0)) return 0;

      // Efficiency = voting power per token
      return Number((power * BigInt(1000)) / amount) / 1000;
    } catch (error) {
      console.error('Error calculating lock efficiency:', error);
      return 0;
    }
  }

  /**
   * Estimate gas costs for lock operations
   */
  async estimateGasCosts(): Promise<{
    createLock: bigint;
    increaseLockAmount: bigint;
    increaseLockDuration: bigint;
    exitLock: bigint;
  }> {
    try {
      // These are estimated values - in production, you'd call estimateGas
      return {
        createLock: BigInt(150000), // ~150k gas
        increaseLockAmount: BigInt(100000), // ~100k gas
        increaseLockDuration: BigInt(80000), // ~80k gas
        exitLock: BigInt(120000), // ~120k gas
      };
    } catch (error) {
      console.error('Error estimating gas costs:', error);
      return {
        createLock: BigInt(200000),
        increaseLockAmount: BigInt(150000),
        increaseLockDuration: BigInt(100000),
        exitLock: BigInt(150000),
      };
    }
  }

  /**
   * Calculate break-even analysis for lock strategies
   */
  calculateBreakEvenAnalysis(
    amount: bigint,
    duration: number,
    expectedRewards: bigint
  ): {
    breakEvenTime: number;
    roi: number;
    riskScore: number;
  } {
    try {
      // Simplified break-even calculation
      const annualizedRewards =
        (expectedRewards * BigInt(365 * 24 * 60 * 60)) / BigInt(duration);
      const breakEvenTime = duration / 2; // Simplified assumption

      const roi =
        amount > 0 ? Number((expectedRewards * BigInt(100)) / amount) : 0;

      // Risk score based on lock duration (longer = higher risk)
      const riskScore = Math.min(100, (duration / this.MAXTIME) * 100);

      return {
        breakEvenTime,
        roi,
        riskScore,
      };
    } catch (error) {
      console.error('Error calculating break-even analysis:', error);
      return {
        breakEvenTime: duration,
        roi: 0,
        riskScore: 50,
      };
    }
  }

  /**
   * Calculate power gain from extending a lock
   */
  async calculateExtensionPowerGain(
    tokenId: number,
    additionalDays: number
  ): Promise<bigint> {
    try {
      const currentPower = await this.getCurrentVotingPower(tokenId);
      const lockInfo = await this.votingEscrowContract.read.locked(tokenId);

      // Calculate new end time
      const currentEndTime = Number(lockInfo.end);
      const newEndTime = currentEndTime + additionalDays * 24 * 60 * 60;

      // Calculate power with extended duration
      const extendedPower = await this.getVotingPowerAt(tokenId, newEndTime);

      return extendedPower > currentPower
        ? extendedPower - currentPower
        : BigInt(0);
    } catch (error) {
      console.error('Error calculating extension power gain:', error);
      return BigInt(0);
    }
  }

  /**
   * Calculate power gain from increasing lock amount
   */
  async calculateIncreasePowerGain(
    tokenId: number,
    additionalAmount: bigint
  ): Promise<bigint> {
    try {
      const currentPower = await this.getCurrentVotingPower(tokenId);
      const lockInfo = await this.votingEscrowContract.read.locked(tokenId);

      // Calculate power with increased amount
      const newAmount = lockInfo.amount + additionalAmount;
      const increasedPower = await this.getVotingPowerAt(
        tokenId,
        Number(lockInfo.end)
      );

      return increasedPower > currentPower
        ? increasedPower - currentPower
        : BigInt(0);
    } catch (error) {
      console.error('Error calculating increase power gain:', error);
      return BigInt(0);
    }
  }

  /**
   * Calculate power gain from merging two locks
   */
  async calculateMergePowerGain(
    fromTokenId: number,
    toTokenId: number
  ): Promise<bigint> {
    try {
      const fromPower = await this.getCurrentVotingPower(fromTokenId);
      const toPower = await this.getCurrentVotingPower(toTokenId);
      const combinedCurrentPower = fromPower + toPower;

      const fromLock = await this.votingEscrowContract.read.locked(fromTokenId);
      const toLock = await this.votingEscrowContract.read.locked(toTokenId);

      // Merged lock takes the later end time and combined amount
      const mergedAmount = fromLock.amount + toLock.amount;
      const mergedEndTime = Math.max(Number(fromLock.end), Number(toLock.end));

      const mergedPower = await this.getVotingPowerAt(
        fromTokenId,
        mergedEndTime
      );

      return mergedPower > combinedCurrentPower
        ? mergedPower - combinedCurrentPower
        : BigInt(0);
    } catch (error) {
      console.error('Error calculating merge power gain:', error);
      return BigInt(0);
    }
  }

  /**
   * Generate optimization recommendations for a specific lock
   */
  async generateOptimizationRecommendations(
    lockId: number
  ): Promise<OptimizationRecommendation[]> {
    try {
      const recommendations: OptimizationRecommendation[] = [];

      // Get lock details
      const lockDetails = await this.votingEscrowContract.read.locked([
        BigInt(lockId),
      ]);
      const currentTime = Math.floor(Date.now() / 1000);
      const timeToExpiry = Number(lockDetails.end) - currentTime;

      // Check if lock is expiring soon (within 30 days)
      if (timeToExpiry < 30 * 24 * 60 * 60 && timeToExpiry > 0) {
        recommendations.push({
          lockId,
          title: 'Extend Lock Duration',
          description:
            'Your lock expires soon. Extending it will maintain your voting power.',
          action: 'extend',
          category: 'timing',
          priority: 'high',
          potentialGain: lockDetails.amount / BigInt(4), // Estimate 25% power gain
          riskReduction: 15,
          timeToImplement: 5 * 60, // 5 minutes
          steps: [
            'Navigate to lock management',
            'Select extend duration option',
            'Choose new expiry date',
            'Confirm transaction',
          ],
        });
      }

      // Check for efficiency improvements
      const efficiency = await this.calculateLockEfficiency(lockId);
      if (efficiency < 70) {
        recommendations.push({
          lockId,
          title: 'Optimize Lock Efficiency',
          description:
            'Your lock efficiency is below optimal. Consider rebalancing.',
          action: 'rebalance',
          category: 'efficiency',
          priority: 'medium',
          potentialGain: lockDetails.amount / BigInt(10), // Estimate 10% improvement
          efficiencyImprovement: 85 - efficiency,
          timeToImplement: 10 * 60, // 10 minutes
          steps: [
            'Analyze current lock parameters',
            'Calculate optimal duration',
            'Modify lock settings',
            'Execute rebalancing transaction',
          ],
        });
      }

      // Check for gas optimization opportunities
      if (Number(lockDetails.amount) < 1000) {
        // Small locks
        recommendations.push({
          lockId,
          title: 'Consider Lock Consolidation',
          description:
            'Small locks have higher gas costs per token. Consider merging.',
          action: 'merge',
          category: 'gas',
          priority: 'low',
          potentialGain: BigInt(0),
          gasOptimization: parseEther('0.01'), // Estimate gas savings
          timeToImplement: 15 * 60, // 15 minutes
          steps: [
            'Identify locks to merge',
            'Calculate combined parameters',
            'Execute merge transaction',
            'Verify consolidated lock',
          ],
        });
      }

      return recommendations;
    } catch (error) {
      console.error('Error generating optimization recommendations:', error);
      return [];
    }
  }

  /**
   * Generate portfolio-level optimization recommendations
   */
  async generatePortfolioOptimizations(
    lockIds: number[]
  ): Promise<OptimizationRecommendation[]> {
    try {
      const recommendations: OptimizationRecommendation[] = [];

      if (lockIds.length === 0) return recommendations;

      // Analyze portfolio diversification
      const lockDetails = await Promise.all(
        lockIds.map(id => this.votingEscrowContract.read.locked([BigInt(id)]))
      );

      const totalValue = lockDetails.reduce(
        (sum, lock) => sum + lock.amount,
        BigInt(0)
      );
      const avgDuration =
        lockDetails.reduce((sum, lock) => sum + Number(lock.end), 0) /
        lockDetails.length;
      const currentTime = Math.floor(Date.now() / 1000);

      // Check for concentration risk
      const maxLockValue = lockDetails.reduce(
        (max, lock) => (lock.amount > max ? lock.amount : max),
        BigInt(0)
      );
      const concentrationRatio = Number(
        (maxLockValue * BigInt(100)) / totalValue
      );

      if (concentrationRatio > 50) {
        recommendations.push({
          lockId: 0, // Portfolio-level recommendation
          title: 'Reduce Concentration Risk',
          description:
            'Your portfolio is heavily concentrated in one lock. Consider diversifying.',
          action: 'split',
          category: 'risk',
          priority: 'medium',
          potentialGain: totalValue / BigInt(20), // Estimate 5% risk-adjusted gain
          riskReduction: concentrationRatio - 40,
          timeToImplement: 20 * 60, // 20 minutes
          steps: [
            'Identify over-concentrated locks',
            'Plan diversification strategy',
            'Split large locks into smaller ones',
            'Verify balanced portfolio',
          ],
        });
      }

      // Check for timing optimization
      const expirySpread =
        Math.max(...lockDetails.map(lock => Number(lock.end))) -
        Math.min(...lockDetails.map(lock => Number(lock.end)));

      if (expirySpread < 30 * 24 * 60 * 60) {
        // Less than 30 days spread
        recommendations.push({
          lockId: 0,
          title: 'Stagger Lock Expiries',
          description:
            'Your locks expire around the same time. Staggering reduces timing risk.',
          action: 'rebalance',
          category: 'timing',
          priority: 'low',
          potentialGain: totalValue / BigInt(50), // Estimate 2% improvement
          riskReduction: 10,
          timeToImplement: 30 * 60, // 30 minutes
          steps: [
            'Analyze current expiry schedule',
            'Plan staggered expiry dates',
            'Adjust individual lock durations',
            'Implement staggered schedule',
          ],
        });
      }

      return recommendations;
    } catch (error) {
      console.error('Error generating portfolio optimizations:', error);
      return [];
    }
  }

  /**
   * Get historical voting power data for a token
   */
  async getHistoricalPowerData(
    tokenId: number,
    fromTimestamp: number,
    toTimestamp: number = Math.floor(Date.now() / 1000)
  ): Promise<HistoricalPowerData[]> {
    try {
      const historicalData: HistoricalPowerData[] = [];
      const timeStep = Math.max(3600, (toTimestamp - fromTimestamp) / 100); // Max 100 data points, min 1 hour intervals

      for (
        let timestamp = fromTimestamp;
        timestamp <= toTimestamp;
        timestamp += timeStep
      ) {
        try {
          const power = await this.getVotingPowerAt(
            tokenId,
            Math.floor(timestamp)
          );
          historicalData.push({
            timestamp: Math.floor(timestamp),
            power,
            tokenId,
            blockNumber: 0, // Would need block number lookup for precise tracking
          });
        } catch (error) {
          // Skip failed lookups but continue processing
          console.warn(`Failed to get power at timestamp ${timestamp}:`, error);
        }
      }

      return historicalData.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('Error getting historical power data:', error);
      throw error;
    }
  }

  /**
   * Calculate power trend analysis
   */
  async calculatePowerTrend(
    tokenId: number,
    days: number = 30
  ): Promise<{
    trend: 'increasing' | 'decreasing' | 'stable';
    trendPercentage: number;
    dataPoints: { timestamp: number; power: bigint }[];
  }> {
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      const startTime = currentTime - days * 24 * 60 * 60;

      const historicalData = await this.getHistoricalPowerData(
        tokenId,
        startTime,
        currentTime
      );

      if (historicalData.length < 2) {
        return {
          trend: 'stable',
          trendPercentage: 0,
          dataPoints: historicalData.map(d => ({
            timestamp: d.timestamp,
            power: d.power,
          })),
        };
      }

      const firstPower = Number(historicalData[0].power);
      const lastPower = Number(historicalData[historicalData.length - 1].power);

      const percentageChange =
        firstPower > 0 ? ((lastPower - firstPower) / firstPower) * 100 : 0;

      let trend: 'increasing' | 'decreasing' | 'stable';
      if (Math.abs(percentageChange) < 1) {
        trend = 'stable';
      } else if (percentageChange > 0) {
        trend = 'increasing';
      } else {
        trend = 'decreasing';
      }

      return {
        trend,
        trendPercentage: Math.abs(percentageChange),
        dataPoints: historicalData.map(d => ({
          timestamp: d.timestamp,
          power: d.power,
        })),
      };
    } catch (error) {
      console.error('Error calculating power trend:', error);
      throw error;
    }
  }

  /**
   * Get user's total voting power across all locks
   */
  async getUserTotalVotingPower(userAddress: Address): Promise<bigint> {
    try {
      const totalPower = (await readContract(config, {
        address: this.votingEscrowAddress,
        abi: VotingEscrowABI,
        functionName: 'votingPowerForAccount',
        args: [userAddress],
      })) as bigint;
      return totalPower;
    } catch (error) {
      console.error('Error getting user total voting power:', error);
      throw error;
    }
  }

  /**
   * Compare user's voting power with other users (simplified implementation)
   */
  async getUserComparison(
    userAddress: Address,
    userTokenIds: number[]
  ): Promise<UserComparison> {
    try {
      const totalPower = await this.getUserTotalVotingPower(userAddress);
      const lockCount = userTokenIds.length;

      // Calculate average efficiency across all locks
      let totalEfficiency = 0;
      for (const tokenId of userTokenIds) {
        const efficiency = await this.calculateLockEfficiency(tokenId);
        totalEfficiency += efficiency;
      }
      const averageEfficiency = lockCount > 0 ? totalEfficiency / lockCount : 0;

      // Simplified ranking (in a real implementation, this would query multiple users)
      // For now, we'll provide a mock ranking based on power levels
      const powerNumber = Number(totalPower) / 1e18;
      let rank = 1;
      let percentile = 99;

      if (powerNumber < 1000) {
        rank = Math.floor(Math.random() * 1000) + 500;
        percentile = Math.max(10, 90 - Math.floor(powerNumber / 100));
      } else if (powerNumber < 10000) {
        rank = Math.floor(Math.random() * 500) + 100;
        percentile = Math.max(50, 95 - Math.floor(powerNumber / 1000));
      } else {
        rank = Math.floor(Math.random() * 100) + 1;
        percentile = Math.max(80, 99 - Math.floor(powerNumber / 10000));
      }

      return {
        userAddress,
        totalPower,
        lockCount,
        averageEfficiency,
        rank,
        percentile,
      };
    } catch (error) {
      console.error('Error getting user comparison:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive power analytics for a user
   */
  async getPowerAnalytics(
    userAddress: Address,
    tokenIds: number[]
  ): Promise<PowerAnalytics> {
    try {
      const currentPower = await this.getUserTotalVotingPower(userAddress);

      // Get trend analysis for the first token (or aggregate if multiple)
      const primaryTokenId = tokenIds[0] || 0;
      let trendData: {
        trend: 'increasing' | 'decreasing' | 'stable';
        trendPercentage: number;
        dataPoints: { timestamp: number; power: bigint }[];
      } = {
        trend: 'stable',
        trendPercentage: 0,
        dataPoints: [],
      };

      if (primaryTokenId > 0) {
        trendData = await this.calculatePowerTrend(primaryTokenId, 30);
      }

      // Calculate projected power
      const projectedPower7d = await this.calculateProjectedPower(tokenIds, 7);
      const projectedPower30d = await this.calculateProjectedPower(
        tokenIds,
        30
      );

      // Get historical data for the primary token
      const currentTime = Math.floor(Date.now() / 1000);
      const thirtyDaysAgo = currentTime - 30 * 24 * 60 * 60;
      const historicalData =
        primaryTokenId > 0
          ? await this.getHistoricalPowerData(
              primaryTokenId,
              thirtyDaysAgo,
              currentTime
            )
          : [];

      // Get user comparison
      const userComparison = await this.getUserComparison(
        userAddress,
        tokenIds
      );

      return {
        currentPower,
        powerTrend: trendData.trend,
        trendPercentage: trendData.trendPercentage,
        projectedPower7d,
        projectedPower30d,
        historicalData,
        userComparison,
      };
    } catch (error) {
      console.error('Error getting power analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate projected voting power for future dates
   */
  private async calculateProjectedPower(
    tokenIds: number[],
    days: number
  ): Promise<bigint> {
    try {
      const futureTimestamp =
        Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;
      let totalProjectedPower = BigInt(0);

      for (const tokenId of tokenIds) {
        try {
          const projectedPower = await this.getVotingPowerAt(
            tokenId,
            futureTimestamp
          );
          totalProjectedPower += projectedPower;
        } catch (error) {
          // Skip failed projections but continue
          console.warn(`Failed to project power for token ${tokenId}:`, error);
        }
      }

      return totalProjectedPower;
    } catch (error) {
      console.error('Error calculating projected power:', error);
      return BigInt(0);
    }
  }

  /**
   * Get real-time voting power with caching
   */
  private powerCache = new Map<string, { power: bigint; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 seconds

  async getCachedVotingPower(tokenId: number): Promise<bigint> {
    const cacheKey = `power-${tokenId}`;
    const cached = this.powerCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.CACHE_TTL) {
      return cached.power;
    }

    const power = await this.getCurrentVotingPower(tokenId);
    this.powerCache.set(cacheKey, { power, timestamp: now });
    return power;
  }

  /**
   * Clear power cache
   */
  clearCache(): void {
    this.powerCache.clear();
  }
}

// Singleton instance
export const votingPowerCalculator = new VotingPowerCalculator();
