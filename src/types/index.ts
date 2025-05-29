// Core types for the application
export interface Proposal {
  id: string;
  title: string;
  author: string;
  status: 'active' | 'passed' | 'failed' | 'pending';
  timeLeft: string;
  yesPercentage: number;
  noPercentage: number;
  abstainPercentage: number;
  description?: string;
}

// Additional types for the application
export interface User {
  id: string;
  address: string;
  ensName?: string;
  votingPower: number;
}

export interface VoteRecord {
  proposalId: string;
  userId: string;
  vote: 'yes' | 'no' | 'abstain';
  timestamp: Date;
  votingPower: number;
}

export interface Holiday {
  id: string;
  name: string;
  date: Date;
  description?: string;
  isVotingDay?: boolean;
}

// Proposal submission form types
export interface ProposalFormData {
  title: string;
  category: string;
  summary: string;
  description: string;
  fundingAmount: string;
  timeline: string;
  beneficiaries: string;
  attachments: File[];
}

export interface FormErrors {
  title?: string;
  category?: string;
  summary?: string;
  description?: string;
  fundingAmount?: string;
  timeline?: string;
  beneficiaries?: string;
  attachments?: string;
}

export interface Step {
  id: number;
  title: string;
  description: string;
}

// Community features types for Phase 5
export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  author: string;
  authorAddress: string;
  createdAt: Date;
  upvotes: number;
  downvotes: number;
  category: 'idea' | 'discussion' | 'feedback' | 'announcement';
  tags: string[];
  isPromoted?: boolean;
  userVote?: 'up' | 'down' | null;
}

export interface Reaction {
  id: string;
  postId: string;
  userId: string;
  type: 'up' | 'down';
  timestamp: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'holiday' | 'voting' | 'community' | 'announcement';
  description?: string;
  isVotingDay?: boolean;
  flagIcon?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Notification {
  id: string;
  userId: string;
  type: 'vote_reminder' | 'new_proposal' | 'community_post' | 'event_reminder';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}
