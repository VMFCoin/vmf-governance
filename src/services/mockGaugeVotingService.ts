import { MockGaugeVote, GaugeInfo, MockTransaction } from '@/types';
import { mockEscrowService } from './mockEscrowService';

export class MockGaugeVotingService {
  private gauges = new Map<string, GaugeInfo>();
  private votes = new Map<string, bigint>(); // gauge -> total votes
  private userVotes = new Map<number, MockGaugeVote[]>(); // tokenId -> votes
  private votingPowerUsed = new Map<number, bigint>(); // tokenId -> power used

  constructor() {
    this.initializeMockGauges();
  }

  private initializeMockGauges() {
    // Create some mock gauges for testing
    const mockGauges = [
      {
        id: 'holiday-veterans-day-2024',
        target: 'veterans-day-charity-selection',
        metadata: JSON.stringify({
          name: 'Veterans Day 2024 Charity Selection',
          description: 'Select charity for Veterans Day 2024 funding',
          type: 'holiday_charity',
        }),
      },
      {
        id: 'charity-directory-wounded-warrior',
        target: 'charity-directory-proposal-123',
        metadata: JSON.stringify({
          name: 'Add Wounded Warrior Project',
          description: 'Proposal to add WWP to charity directory',
          type: 'charity_directory',
        }),
      },
    ];

    mockGauges.forEach(gauge => {
      const gaugeInfo: GaugeInfo = {
        ...gauge,
        totalVotes: BigInt(0),
        isActive: true,
        createdAt: new Date(),
      };
      this.gauges.set(gauge.id, gaugeInfo);
      this.votes.set(gauge.id, BigInt(0));
    });
  }

  async createGauge(target: string, metadata: string): Promise<string> {
    const gaugeId = `gauge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const gauge: GaugeInfo = {
      id: gaugeId,
      target,
      metadata,
      totalVotes: BigInt(0),
      isActive: true,
      createdAt: new Date(),
    };

    this.gauges.set(gaugeId, gauge);
    this.votes.set(gaugeId, BigInt(0));

    return gaugeId;
  }

  async vote(
    tokenId: number,
    votes: MockGaugeVote[]
  ): Promise<MockTransaction> {
    // Check if token exists and has voting power
    const lock = await mockEscrowService.getLock(tokenId);
    if (!lock) {
      throw new Error('Token not found');
    }

    if (!lock.isWarmupComplete) {
      throw new Error('Warmup period not complete');
    }

    const votingPower = await mockEscrowService.getVotingPower(tokenId);
    if (votingPower === BigInt(0)) {
      throw new Error('No voting power available');
    }

    // Validate vote weights sum to 10000 (100%)
    const totalWeight = votes.reduce((sum, vote) => sum + vote.weight, 0);
    if (totalWeight > 10000) {
      throw new Error('Total vote weight cannot exceed 100%');
    }

    // Clear existing votes for this token
    this.clearTokenVotes(tokenId);

    // Apply new votes
    votes.forEach(vote => {
      const voteAmount = (votingPower * BigInt(vote.weight)) / BigInt(10000);
      const currentVotes = this.votes.get(vote.gauge) || BigInt(0);
      this.votes.set(vote.gauge, currentVotes + voteAmount);
    });

    // Store user votes
    this.userVotes.set(tokenId, votes);
    this.votingPowerUsed.set(tokenId, votingPower);

    // Return mock transaction
    const transaction: MockTransaction = {
      hash: this.generateTxHash(),
      status: 'pending',
      type: 'vote',
      timestamp: new Date(),
    };

    // Simulate confirmation
    setTimeout(() => {
      transaction.status = 'confirmed';
    }, 2000);

    return transaction;
  }

  async getGaugeVotes(gauge: string): Promise<bigint> {
    return this.votes.get(gauge) || BigInt(0);
  }

  async isVoting(tokenId: number): Promise<boolean> {
    return this.userVotes.has(tokenId);
  }

  async resetVotes(tokenId: number): Promise<MockTransaction> {
    this.clearTokenVotes(tokenId);
    this.userVotes.delete(tokenId);
    this.votingPowerUsed.delete(tokenId);

    return {
      hash: this.generateTxHash(),
      status: 'confirmed',
      type: 'vote',
      timestamp: new Date(),
    };
  }

  async getVotingPowerUsed(tokenId: number): Promise<bigint> {
    return this.votingPowerUsed.get(tokenId) || BigInt(0);
  }

  async getUserVotes(tokenId: number): Promise<MockGaugeVote[]> {
    return this.userVotes.get(tokenId) || [];
  }

  async getGaugeInfo(gaugeId: string): Promise<GaugeInfo | null> {
    return this.gauges.get(gaugeId) || null;
  }

  async getAllActiveGauges(): Promise<GaugeInfo[]> {
    return Array.from(this.gauges.values()).filter(gauge => gauge.isActive);
  }

  private clearTokenVotes(tokenId: number): void {
    const existingVotes = this.userVotes.get(tokenId) || [];
    const existingPower = this.votingPowerUsed.get(tokenId) || BigInt(0);

    // Remove previous votes from gauge totals
    existingVotes.forEach(vote => {
      const voteAmount = (existingPower * BigInt(vote.weight)) / BigInt(10000);
      const currentVotes = this.votes.get(vote.gauge) || BigInt(0);
      this.votes.set(vote.gauge, currentVotes - voteAmount);
    });
  }

  private generateTxHash(): string {
    return (
      '0x' +
      Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')
    );
  }
}

export const mockGaugeVotingService = new MockGaugeVotingService();
