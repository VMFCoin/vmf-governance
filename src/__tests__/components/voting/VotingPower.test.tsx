import React from 'react';
import { render, screen } from '../../utils/test-utils';
import { VotingPower } from '@/components/voting/VotingPower';

describe('VotingPower', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<VotingPower percentage={75} />);

      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('Your Voting Power')).toBeInTheDocument();
    });

    it('renders with custom percentage', () => {
      render(<VotingPower percentage={42} />);

      expect(screen.getByText('42%')).toBeInTheDocument();
    });

    it('renders with custom label', () => {
      render(<VotingPower percentage={60} label="Custom Power" />);

      expect(screen.getByText('60%')).toBeInTheDocument();
      expect(screen.getByText('Custom Power')).toBeInTheDocument();
    });

    it('renders without label when label is empty string', () => {
      render(<VotingPower percentage={50} label="" />);

      expect(screen.queryByText('Your Voting Power')).not.toBeInTheDocument();
    });

    it('renders with default label when label is undefined', () => {
      render(<VotingPower percentage={50} label={undefined} />);

      expect(screen.getByText('Your Voting Power')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('renders with small size', () => {
      const { container } = render(<VotingPower percentage={50} size="sm" />);

      const sizeContainer = container.querySelector('.w-16.h-16');
      expect(sizeContainer).toBeInTheDocument();
    });

    it('renders with medium size (default)', () => {
      const { container } = render(<VotingPower percentage={50} />);

      const sizeContainer = container.querySelector('.w-32.h-32');
      expect(sizeContainer).toBeInTheDocument();
    });

    it('renders with large size', () => {
      const { container } = render(<VotingPower percentage={50} size="lg" />);

      const sizeContainer = container.querySelector('.w-64.h-64');
      expect(sizeContainer).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <VotingPower percentage={50} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Visual Elements', () => {
    it('displays percentage value', () => {
      render(<VotingPower percentage={85} />);

      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('displays label when provided', () => {
      render(<VotingPower percentage={75} label="Test Label" />);

      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('displays default label when none provided', () => {
      render(<VotingPower percentage={75} />);

      expect(screen.getByText('Your Voting Power')).toBeInTheDocument();
    });

    it('has circular container with correct styling', () => {
      const { container } = render(<VotingPower percentage={50} />);

      const circleElement = container.querySelector('.rounded-full');
      expect(circleElement).toHaveClass('border-8', 'border-patriotBlue');
    });

    it('has inner circle with correct styling', () => {
      const { container } = render(<VotingPower percentage={50} />);

      const innerCircle = container.querySelector('.bg-backgroundDark');
      expect(innerCircle).toHaveClass('absolute', 'rounded-full');
    });
  });

  describe('Gradient Calculation', () => {
    it('applies gradient style for 0%', () => {
      const { container } = render(<VotingPower percentage={0} />);

      const circleElement = container.querySelector('.border-patriotBlue');
      expect(circleElement).toHaveStyle(
        'background: conic-gradient(from 0deg, #B22234 0deg, #B22234 0deg, #1B2951 0deg, #1B2951 360deg)'
      );
    });

    it('applies gradient style for 50%', () => {
      const { container } = render(<VotingPower percentage={50} />);

      const circleElement = container.querySelector('.border-patriotBlue');
      expect(circleElement).toHaveStyle(
        'background: conic-gradient(from 0deg, #B22234 0deg, #B22234 180deg, #1B2951 180deg, #1B2951 360deg)'
      );
    });

    it('applies gradient style for 100%', () => {
      const { container } = render(<VotingPower percentage={100} />);

      const circleElement = container.querySelector('.border-patriotBlue');
      expect(circleElement).toHaveStyle(
        'background: conic-gradient(from 0deg, #B22234 0deg, #B22234 360deg, #1B2951 360deg, #1B2951 360deg)'
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles 0% correctly', () => {
      render(<VotingPower percentage={0} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles 100% correctly', () => {
      render(<VotingPower percentage={100} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('handles decimal percentages', () => {
      render(<VotingPower percentage={33.33} />);

      expect(screen.getByText('33.33%')).toBeInTheDocument();
    });

    it('handles negative percentages gracefully', () => {
      render(<VotingPower percentage={-10} />);

      expect(screen.getByText('-10%')).toBeInTheDocument();
    });

    it('handles percentages over 100', () => {
      render(<VotingPower percentage={150} />);

      expect(screen.getByText('150%')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper structure for screen readers', () => {
      render(<VotingPower percentage={75} />);

      const percentageElement = screen.getByText('75%');
      const labelElement = screen.getByText('Your Voting Power');

      expect(percentageElement).toBeInTheDocument();
      expect(labelElement).toBeInTheDocument();
    });

    it('maintains readable text contrast', () => {
      render(<VotingPower percentage={50} />);

      const percentageElement = screen.getByText('50%');
      const labelElement = screen.getByText('Your Voting Power');

      expect(percentageElement).toHaveClass('text-patriotWhite');
      expect(labelElement).toHaveClass('text-patriotWhite');
    });
  });
});
