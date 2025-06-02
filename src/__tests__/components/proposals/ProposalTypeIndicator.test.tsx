import { render, screen } from '@testing-library/react';
import {
  mockHolidayCharityProposal,
  mockCharityDirectoryProposal,
  mockPlatformFeatureProposal,
  mockLegacyProposal,
  renderProposalComponent,
} from '../../utils/proposal-test-utils';
import { ProposalTypeIndicator } from '@/components/proposals/shared/ProposalTypeIndicator';
import { ProposalType } from '@/types';

describe('ProposalTypeIndicator Component', () => {
  // Test all proposal types
  const proposalTypes: ProposalType[] = [
    'holiday_charity',
    'charity_directory',
    'platform_feature',
    'legacy',
  ];

  describe('Rendering', () => {
    it('renders with default props', () => {
      renderProposalComponent(<ProposalTypeIndicator type="holiday_charity" />);

      const indicator = screen.getByText('Holiday Charity');
      expect(indicator).toBeInTheDocument();
      expect(indicator.closest('div')).toHaveClass(
        'bg-gradient-to-r',
        'from-patriotRed'
      );
    });

    it('renders all proposal types correctly', () => {
      const expectedLabels = {
        holiday_charity: 'Holiday Charity',
        charity_directory: 'Charity Directory',
        platform_feature: 'Platform Feature',
        legacy: 'General Proposal',
      };

      proposalTypes.forEach(type => {
        const { rerender } = renderProposalComponent(
          <ProposalTypeIndicator type={type} />
        );

        expect(screen.getByText(expectedLabels[type])).toBeInTheDocument();

        // Clean up for next iteration
        rerender(<div />);
      });
    });

    it('renders correct emojis for each type', () => {
      const expectedEmojis = {
        holiday_charity: '🎖️',
        charity_directory: '🏛️',
        platform_feature: '⚙️',
        legacy: '📄',
      };

      proposalTypes.forEach(type => {
        const { rerender } = renderProposalComponent(
          <ProposalTypeIndicator type={type} />
        );

        expect(screen.getByText(expectedEmojis[type])).toBeInTheDocument();

        // Clean up for next iteration
        rerender(<div />);
      });
    });
  });

  describe('Size Variants', () => {
    it('renders small size correctly', () => {
      renderProposalComponent(
        <ProposalTypeIndicator type="holiday_charity" size="sm" />
      );

      const container = screen.getByText('Holiday Charity').closest('div');
      expect(container).toHaveClass('px-2', 'py-1', 'text-xs');
    });

    it('renders medium size correctly (default)', () => {
      renderProposalComponent(
        <ProposalTypeIndicator type="holiday_charity" size="md" />
      );

      const container = screen.getByText('Holiday Charity').closest('div');
      expect(container).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });

    it('renders large size correctly', () => {
      renderProposalComponent(
        <ProposalTypeIndicator type="holiday_charity" size="lg" />
      );

      const container = screen.getByText('Holiday Charity').closest('div');
      expect(container).toHaveClass('px-4', 'py-2', 'text-base');
    });
  });

  describe('Label Display', () => {
    it('shows label by default', () => {
      renderProposalComponent(<ProposalTypeIndicator type="holiday_charity" />);

      expect(screen.getByText('Holiday Charity')).toBeInTheDocument();
    });

    it('hides label when showLabel is false', () => {
      renderProposalComponent(
        <ProposalTypeIndicator type="holiday_charity" showLabel={false} />
      );

      expect(screen.queryByText('Holiday Charity')).not.toBeInTheDocument();
      // But emoji and icon should still be present
      expect(screen.getByText('🎖️')).toBeInTheDocument();
    });

    it('shows label when showLabel is explicitly true', () => {
      renderProposalComponent(
        <ProposalTypeIndicator type="charity_directory" showLabel={true} />
      );

      expect(screen.getByText('Charity Directory')).toBeInTheDocument();
    });
  });

  describe('Styling and Colors', () => {
    it('applies correct styling for holiday charity type', () => {
      renderProposalComponent(<ProposalTypeIndicator type="holiday_charity" />);

      const container = screen.getByText('Holiday Charity').closest('div');
      expect(container).toHaveClass(
        'bg-gradient-to-r',
        'from-patriotRed',
        'text-patriotWhite',
        'shadow-patriot-glow'
      );
    });

    it('applies correct styling for charity directory type', () => {
      renderProposalComponent(
        <ProposalTypeIndicator type="charity_directory" />
      );

      const container = screen.getByText('Charity Directory').closest('div');
      expect(container).toHaveClass(
        'bg-gradient-to-r',
        'from-blue-600',
        'text-white',
        'shadow-blue-glow'
      );
    });

    it('applies correct styling for platform feature type', () => {
      renderProposalComponent(
        <ProposalTypeIndicator type="platform_feature" />
      );

      const container = screen.getByText('Platform Feature').closest('div');
      expect(container).toHaveClass(
        'bg-gradient-to-r',
        'from-purple-600',
        'text-white',
        'shadow-lg'
      );
    });

    it('applies correct styling for legacy type', () => {
      renderProposalComponent(<ProposalTypeIndicator type="legacy" />);

      const container = screen.getByText('General Proposal').closest('div');
      expect(container).toHaveClass(
        'bg-gradient-to-r',
        'from-backgroundLight',
        'text-textBase',
        'shadow-md'
      );
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      renderProposalComponent(
        <ProposalTypeIndicator
          type="holiday_charity"
          className="custom-test-class"
        />
      );

      const container = screen.getByText('Holiday Charity').closest('div');
      expect(container).toHaveClass('custom-test-class');
    });

    it('merges custom className with default classes', () => {
      renderProposalComponent(
        <ProposalTypeIndicator
          type="holiday_charity"
          className="custom-test-class"
        />
      );

      const container = screen.getByText('Holiday Charity').closest('div');
      expect(container).toHaveClass('custom-test-class');
      expect(container).toHaveClass('inline-flex', 'items-center', 'gap-2');
    });
  });

  describe('Icons', () => {
    it('renders Calendar icon for holiday charity type', () => {
      renderProposalComponent(<ProposalTypeIndicator type="holiday_charity" />);

      // Check for Calendar icon (Lucide icons render as SVG)
      const container = screen.getByText('Holiday Charity').closest('div');
      const svg = container?.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders Building2 icon for charity directory type', () => {
      renderProposalComponent(
        <ProposalTypeIndicator type="charity_directory" />
      );

      const container = screen.getByText('Charity Directory').closest('div');
      const svg = container?.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders Settings icon for platform feature type', () => {
      renderProposalComponent(
        <ProposalTypeIndicator type="platform_feature" />
      );

      const container = screen.getByText('Platform Feature').closest('div');
      const svg = container?.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders FileText icon for legacy type', () => {
      renderProposalComponent(<ProposalTypeIndicator type="legacy" />);

      const container = screen.getByText('General Proposal').closest('div');
      const svg = container?.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Hover Effects', () => {
    it('has hover scale effect class', () => {
      renderProposalComponent(<ProposalTypeIndicator type="holiday_charity" />);

      const container = screen.getByText('Holiday Charity').closest('div');
      expect(container).toHaveClass('hover:scale-105');
    });

    it('has transition classes for smooth animations', () => {
      renderProposalComponent(<ProposalTypeIndicator type="holiday_charity" />);

      const container = screen.getByText('Holiday Charity').closest('div');
      expect(container).toHaveClass('transition-all', 'duration-300');
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      renderProposalComponent(<ProposalTypeIndicator type="holiday_charity" />);

      const container = screen.getByText('Holiday Charity').closest('div');
      expect(container).toBeInTheDocument();
      expect(container?.tagName).toBe('DIV');
    });

    it('includes both emoji and text for better accessibility', () => {
      renderProposalComponent(<ProposalTypeIndicator type="holiday_charity" />);

      expect(screen.getByText('🎖️')).toBeInTheDocument();
      expect(screen.getByText('Holiday Charity')).toBeInTheDocument();
    });

    it('maintains accessibility when label is hidden', () => {
      renderProposalComponent(
        <ProposalTypeIndicator type="holiday_charity" showLabel={false} />
      );

      // Emoji should still provide context
      expect(screen.getByText('🎖️')).toBeInTheDocument();
      // Icon should be present
      const container = screen.getByText('🎖️').closest('div');
      const svg = container?.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined type gracefully by defaulting to legacy', () => {
      renderProposalComponent(
        <ProposalTypeIndicator type={undefined as any} />
      );

      expect(screen.getByText('General Proposal')).toBeInTheDocument();
      expect(screen.getByText('📄')).toBeInTheDocument();
    });

    it('handles invalid type by defaulting to legacy', () => {
      renderProposalComponent(
        <ProposalTypeIndicator type={'invalid_type' as any} />
      );

      expect(screen.getByText('General Proposal')).toBeInTheDocument();
      expect(screen.getByText('📄')).toBeInTheDocument();
    });
  });
});
