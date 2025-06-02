import React from 'react';
import { render, screen } from '@testing-library/react';
import { TypeSpecificProposalCard } from '@/components/proposals/shared/TypeSpecificProposalCard';
import {
  renderProposalComponent,
  mockHolidayCharityProposal,
  mockCharityDirectoryProposal,
  mockPlatformFeatureProposal,
  mockLegacyProposal,
} from '../../utils/proposal-test-utils';

// Mock all the specific proposal card components
jest.mock('@/components/proposals/holiday-charity', () => ({
  HolidayCharityCard: ({ proposal, className }: any) => (
    <div data-testid="holiday-charity-card" className={className}>
      <div data-testid="proposal-type">holiday_charity</div>
      <div data-testid="proposal-title">{proposal.title}</div>
    </div>
  ),
}));

jest.mock('@/components/proposals/charity-directory', () => ({
  CharityDirectoryCard: ({ proposal, className }: any) => (
    <div data-testid="charity-directory-card" className={className}>
      <div data-testid="proposal-type">charity_directory</div>
      <div data-testid="proposal-title">{proposal.title}</div>
    </div>
  ),
}));

jest.mock('@/components/proposals/platform-feature', () => ({
  PlatformFeatureCard: ({ proposal, className }: any) => (
    <div data-testid="platform-feature-card" className={className}>
      <div data-testid="proposal-type">platform_feature</div>
      <div data-testid="proposal-title">{proposal.title}</div>
    </div>
  ),
}));

jest.mock('@/components/proposals/legacy', () => ({
  LegacyProposalCard: ({ proposal, className }: any) => (
    <div data-testid="legacy-proposal-card" className={className}>
      <div data-testid="proposal-type">legacy</div>
      <div data-testid="proposal-title">{proposal.title}</div>
    </div>
  ),
}));

describe('TypeSpecificProposalCard Component', () => {
  describe('Holiday Charity Proposals', () => {
    it('renders HolidayCharityCard for holiday_charity type', () => {
      renderProposalComponent(
        <TypeSpecificProposalCard proposal={mockHolidayCharityProposal} />
      );

      expect(screen.getByTestId('holiday-charity-card')).toBeInTheDocument();
      expect(screen.getByTestId('proposal-type')).toHaveTextContent(
        'holiday_charity'
      );
      expect(screen.getByTestId('proposal-title')).toHaveTextContent(
        mockHolidayCharityProposal.title
      );
    });

    it('passes className to HolidayCharityCard', () => {
      renderProposalComponent(
        <TypeSpecificProposalCard
          proposal={mockHolidayCharityProposal}
          className="custom-class"
        />
      );

      expect(screen.getByTestId('holiday-charity-card')).toHaveClass(
        'custom-class'
      );
    });
  });

  describe('Charity Directory Proposals', () => {
    it('renders CharityDirectoryCard for charity_directory type', () => {
      renderProposalComponent(
        <TypeSpecificProposalCard proposal={mockCharityDirectoryProposal} />
      );

      expect(screen.getByTestId('charity-directory-card')).toBeInTheDocument();
      expect(screen.getByTestId('proposal-type')).toHaveTextContent(
        'charity_directory'
      );
      expect(screen.getByTestId('proposal-title')).toHaveTextContent(
        mockCharityDirectoryProposal.title
      );
    });

    it('passes className to CharityDirectoryCard', () => {
      renderProposalComponent(
        <TypeSpecificProposalCard
          proposal={mockCharityDirectoryProposal}
          className="custom-class"
        />
      );

      expect(screen.getByTestId('charity-directory-card')).toHaveClass(
        'custom-class'
      );
    });
  });

  describe('Platform Feature Proposals', () => {
    it('renders PlatformFeatureCard for platform_feature type', () => {
      renderProposalComponent(
        <TypeSpecificProposalCard proposal={mockPlatformFeatureProposal} />
      );

      expect(screen.getByTestId('platform-feature-card')).toBeInTheDocument();
      expect(screen.getByTestId('proposal-type')).toHaveTextContent(
        'platform_feature'
      );
      expect(screen.getByTestId('proposal-title')).toHaveTextContent(
        mockPlatformFeatureProposal.title
      );
    });

    it('passes className to PlatformFeatureCard', () => {
      renderProposalComponent(
        <TypeSpecificProposalCard
          proposal={mockPlatformFeatureProposal}
          className="custom-class"
        />
      );

      expect(screen.getByTestId('platform-feature-card')).toHaveClass(
        'custom-class'
      );
    });
  });

  describe('Legacy Proposals', () => {
    it('renders LegacyProposalCard for legacy type', () => {
      renderProposalComponent(
        <TypeSpecificProposalCard proposal={mockLegacyProposal} />
      );

      expect(screen.getByTestId('legacy-proposal-card')).toBeInTheDocument();
      expect(screen.getByTestId('proposal-type')).toHaveTextContent('legacy');
      expect(screen.getByTestId('proposal-title')).toHaveTextContent(
        mockLegacyProposal.title
      );
    });

    it('passes className to LegacyProposalCard', () => {
      renderProposalComponent(
        <TypeSpecificProposalCard
          proposal={mockLegacyProposal}
          className="custom-class"
        />
      );

      expect(screen.getByTestId('legacy-proposal-card')).toHaveClass(
        'custom-class'
      );
    });
  });

  describe('Fallback Behavior', () => {
    it('falls back to LegacyProposalCard for unknown proposal types', () => {
      const unknownProposal = {
        ...mockLegacyProposal,
        type: 'unknown_type' as any,
      };

      renderProposalComponent(
        <TypeSpecificProposalCard proposal={unknownProposal} />
      );

      expect(screen.getByTestId('legacy-proposal-card')).toBeInTheDocument();
      expect(screen.getByTestId('proposal-type')).toHaveTextContent('legacy');
    });

    it('converts unknown proposal to legacy format correctly', () => {
      const unknownProposal = {
        ...mockCharityDirectoryProposal,
        type: 'unknown_type' as any,
      };

      renderProposalComponent(
        <TypeSpecificProposalCard proposal={unknownProposal} />
      );

      expect(screen.getByTestId('legacy-proposal-card')).toBeInTheDocument();
      expect(screen.getByTestId('proposal-title')).toHaveTextContent(
        unknownProposal.title
      );
    });
  });

  describe('Type Guards', () => {
    it('correctly identifies holiday charity proposals', () => {
      renderProposalComponent(
        <TypeSpecificProposalCard proposal={mockHolidayCharityProposal} />
      );

      expect(screen.getByTestId('holiday-charity-card')).toBeInTheDocument();
      expect(
        screen.queryByTestId('legacy-proposal-card')
      ).not.toBeInTheDocument();
    });

    it('correctly identifies charity directory proposals', () => {
      renderProposalComponent(
        <TypeSpecificProposalCard proposal={mockCharityDirectoryProposal} />
      );

      expect(screen.getByTestId('charity-directory-card')).toBeInTheDocument();
      expect(
        screen.queryByTestId('legacy-proposal-card')
      ).not.toBeInTheDocument();
    });

    it('correctly identifies platform feature proposals', () => {
      renderProposalComponent(
        <TypeSpecificProposalCard proposal={mockPlatformFeatureProposal} />
      );

      expect(screen.getByTestId('platform-feature-card')).toBeInTheDocument();
      expect(
        screen.queryByTestId('legacy-proposal-card')
      ).not.toBeInTheDocument();
    });

    it('correctly identifies legacy proposals', () => {
      renderProposalComponent(
        <TypeSpecificProposalCard proposal={mockLegacyProposal} />
      );

      expect(screen.getByTestId('legacy-proposal-card')).toBeInTheDocument();
      expect(
        screen.queryByTestId('holiday-charity-card')
      ).not.toBeInTheDocument();
    });
  });
});
