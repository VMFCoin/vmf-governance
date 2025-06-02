import React from 'react';
import { render, screen } from '@testing-library/react';
import { BinaryVotingCard } from '@/components/proposals/shared/BinaryVotingCard';
import {
  renderProposalComponent,
  mockCharityDirectoryProposal,
  mockPlatformFeatureProposal,
  createProposalWithStatus,
  createProposalWithVoting,
} from '../../utils/proposal-test-utils';

// Mock the VoteChart component to isolate the issue
jest.mock('@/components/voting', () => ({
  VotingPower: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="voting-power">{children}</div>
  ),
  VoteChart: ({ yesPercentage, noPercentage, abstainPercentage }: any) => (
    <div data-testid="vote-chart">
      <div data-testid="yes-percentage">{yesPercentage}%</div>
      <div data-testid="no-percentage">{noPercentage}%</div>
      <div data-testid="abstain-percentage">{abstainPercentage}%</div>
    </div>
  ),
}));

describe('BinaryVotingCard Component', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      renderProposalComponent(
        <BinaryVotingCard proposal={mockCharityDirectoryProposal} />
      );

      expect(
        screen.getByText(mockCharityDirectoryProposal.title)
      ).toBeInTheDocument();
      expect(
        screen.getByText(mockCharityDirectoryProposal.author)
      ).toBeInTheDocument();
      expect(screen.getByTestId('vote-chart')).toBeInTheDocument();
    });

    it('displays proposal status correctly', () => {
      renderProposalComponent(
        <BinaryVotingCard proposal={mockCharityDirectoryProposal} />
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('displays time left', () => {
      renderProposalComponent(
        <BinaryVotingCard proposal={mockCharityDirectoryProposal} />
      );

      expect(
        screen.getByText(mockCharityDirectoryProposal.timeLeft)
      ).toBeInTheDocument();
    });
  });

  describe('Vote Results', () => {
    it('displays vote percentages correctly', () => {
      renderProposalComponent(
        <BinaryVotingCard proposal={mockCharityDirectoryProposal} />
      );

      expect(screen.getByTestId('yes-percentage')).toHaveTextContent('75%');
      expect(screen.getByTestId('no-percentage')).toHaveTextContent('15%');
      expect(screen.getByTestId('abstain-percentage')).toHaveTextContent('10%');
    });
  });
});
