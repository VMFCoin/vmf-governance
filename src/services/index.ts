// Core Services
export { realEscrowService } from './realEscrowService';
export { realVotingService } from './realVotingService';
export { realTokenService } from './realTokenService';
export { realExitQueueService } from './realExitQueueService';

// Gauge Services
export { deployedGaugeService } from './deployedGaugeService';
export { holidayCharityGaugeService } from './holidayCharityGaugeService';

// Holiday & Charity Services
export { holidayProposalService } from './holidayProposalService';
export { charityService } from './charityService';

// Phase 22.5 Services - Vote Finalization & Fund Distribution
export { fundDistributionService } from './fundDistributionService';
export { voteFinalizationService } from './voteFinalizationService';

// Phase 23.3 Services - Treasury Integration
export { treasuryService } from './treasuryService';

// Utility Services
export { transactionManager } from './transactionManager';
export { notificationService } from './notificationService';
export { realTimeService } from './realTimeService';
export { eventMonitor } from './eventMonitor';
export { profileService } from './profileService';
export { voteTrackingService } from './voteTrackingService';

// Mock Services (for development)
export { mockEscrowService } from './mockEscrowService';
export { mockGaugeVotingService } from './mockGaugeVotingService';
export { mockTokenService } from './mockTokenService';

// Legacy Services
export { exitQueueService } from './exitQueueService';

// Types
export type {
  DeployedGaugeInfo,
  GaugeMetadata,
  CharityGaugeMapping,
  HolidayVotingResults,
} from './deployedGaugeService';

export type {
  HolidayCharityVote,
  CharityVoteAllocation,
  HolidayGaugeVoteParams,
  VoteResult,
} from './holidayCharityGaugeService';

// Phase 22.5 Types
export type {
  DistributionTransaction,
  DistributionStatus,
  DistributionHistory,
  WinnerDetermination,
} from './fundDistributionService';

export type {
  VoteFinalizationResult,
  FinalizationStatus,
  FinalizationTransaction,
  VotingStatistics,
} from './voteFinalizationService';

// Phase 23.3 Types - Treasury Integration
export type {
  TreasuryBalance,
  TreasuryAsset,
  TreasuryTransaction,
  TreasuryPerformance,
  DistributionPlan,
} from './treasuryService';
