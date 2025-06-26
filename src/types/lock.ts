import { TokenLock } from './index';

export interface ExtendedLockInfo {
  tokenId: number;
  amount: bigint;
  end: number;
  votingPower: bigint;
  owner?: string;
  createdAt?: Date;
  isWarm: boolean;
  isWarmupComplete: boolean;
  warmupEndTime: Date;
  timeToWarmupComplete: number; // milliseconds
  status: 'active' | 'warming_up';
}

export interface VotingPowerBreakdown {
  totalLocked: bigint;
  totalVotingPower: bigint;
  activeVotingPower: bigint;
  warmingUpLocked: bigint;
  warmingUpCount: number;
  activeLocked: bigint;
  activeCount: number;
  locks: TokenLock[];
}

export interface ExtendedVotingPowerBreakdown {
  totalLocked: bigint;
  totalVotingPower: bigint;
  activeVotingPower: bigint;
  warmingUpLocked: bigint;
  warmingUpCount: number;
  activeLocked: bigint;
  activeCount: number;
  locks: ExtendedLockInfo[];
}
