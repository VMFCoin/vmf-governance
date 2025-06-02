import { render, screen } from '../../utils/test-utils';
import { VoteChart } from '@/components/voting/VoteChart';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    circle: ({ children, ...props }: any) => (
      <circle {...props}>{children}</circle>
    ),
  },
  useSpring: jest.fn(() => ({ set: jest.fn() })),
  useTransform: jest.fn(() => 0),
}));

// Mock PercentageCounter component
jest.mock('@/components/ui/AnimatedCounter', () => ({
  PercentageCounter: ({ value }: { value: number }) => <span>{value}%</span>,
}));

describe('VoteChart', () => {
  // Mock window.innerWidth for mobile tests
  const mockInnerWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
  };

  beforeEach(() => {
    mockInnerWidth(1024); // Default to desktop
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(
        <VoteChart
          yesPercentage={60}
          noPercentage={30}
          abstainPercentage={10}
        />
      );

      expect(screen.getByText('60%')).toBeInTheDocument();
      expect(screen.getByText('30%')).toBeInTheDocument();
      expect(screen.getByText('10%')).toBeInTheDocument();
    });

    it('renders without abstain votes when percentage is 0', () => {
      render(
        <VoteChart yesPercentage={70} noPercentage={30} abstainPercentage={0} />
      );

      expect(screen.getByText('70%')).toBeInTheDocument();
      expect(screen.getByText('30%')).toBeInTheDocument();
      expect(screen.queryByText('Abstain')).not.toBeInTheDocument();
    });

    it('displays participation percentage', () => {
      render(
        <VoteChart
          yesPercentage={40}
          noPercentage={35}
          abstainPercentage={25}
        />
      );

      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('Participation')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('renders with small size', () => {
      const { container } = render(
        <VoteChart
          yesPercentage={50}
          noPercentage={30}
          abstainPercentage={20}
          size="sm"
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders with medium size (default)', () => {
      const { container } = render(
        <VoteChart
          yesPercentage={50}
          noPercentage={30}
          abstainPercentage={20}
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders with large size', () => {
      const { container } = render(
        <VoteChart
          yesPercentage={50}
          noPercentage={30}
          abstainPercentage={20}
          size="lg"
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Variant Types', () => {
    it('renders circle variant by default', () => {
      const { container } = render(
        <VoteChart
          yesPercentage={50}
          noPercentage={30}
          abstainPercentage={20}
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders circle variant when explicitly set', () => {
      const { container } = render(
        <VoteChart
          yesPercentage={50}
          noPercentage={30}
          abstainPercentage={20}
          variant="circle"
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders bar variant when explicitly set', () => {
      render(
        <VoteChart
          yesPercentage={50}
          noPercentage={30}
          abstainPercentage={20}
          variant="bar"
        />
      );

      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
      expect(screen.getByText('Abstain')).toBeInTheDocument();
    });
  });

  describe('Mobile Optimization', () => {
    beforeEach(() => {
      mockInnerWidth(500); // Mobile width
    });

    it('switches to bar chart on mobile when variant is auto', () => {
      render(
        <VoteChart
          yesPercentage={50}
          noPercentage={30}
          abstainPercentage={20}
          variant="auto"
          mobileOptimized={true}
        />
      );

      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('respects mobileOptimized=false', () => {
      const { container } = render(
        <VoteChart
          yesPercentage={50}
          noPercentage={30}
          abstainPercentage={20}
          variant="auto"
          mobileOptimized={false}
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <VoteChart
          yesPercentage={50}
          noPercentage={30}
          abstainPercentage={20}
          className="custom-chart"
        />
      );

      expect(container.firstChild).toHaveClass('custom-chart');
    });
  });

  describe('Legend Display', () => {
    it('shows all vote types in legend', () => {
      render(
        <VoteChart
          yesPercentage={40}
          noPercentage={35}
          abstainPercentage={25}
        />
      );

      expect(screen.getByText(/Yes/)).toBeInTheDocument();
      expect(screen.getByText(/No/)).toBeInTheDocument();
      expect(screen.getByText(/Abstain/)).toBeInTheDocument();
    });

    it('hides abstain from legend when percentage is 0', () => {
      render(
        <VoteChart yesPercentage={60} noPercentage={40} abstainPercentage={0} />
      );

      expect(screen.getByText(/Yes/)).toBeInTheDocument();
      expect(screen.getByText(/No/)).toBeInTheDocument();
      expect(screen.queryByText(/Abstain/)).not.toBeInTheDocument();
    });

    it('displays correct percentages in legend', () => {
      render(
        <VoteChart
          yesPercentage={45}
          noPercentage={35}
          abstainPercentage={20}
        />
      );

      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByText('35%')).toBeInTheDocument();
      expect(screen.getByText('20%')).toBeInTheDocument();
    });
  });

  describe('Bar Chart Variant', () => {
    it('renders progress bars for each vote type', () => {
      const { container } = render(
        <VoteChart
          yesPercentage={50}
          noPercentage={30}
          abstainPercentage={20}
          variant="bar"
        />
      );

      const progressBars = container.querySelectorAll(
        '.bg-green-500, .bg-red-500, .bg-gray-500'
      );
      expect(progressBars).toHaveLength(3);
    });

    it('shows vote type labels', () => {
      render(
        <VoteChart
          yesPercentage={50}
          noPercentage={30}
          abstainPercentage={20}
          variant="bar"
        />
      );

      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
      expect(screen.getByText('Abstain')).toBeInTheDocument();
    });

    it('hides abstain bar when percentage is 0', () => {
      render(
        <VoteChart
          yesPercentage={70}
          noPercentage={30}
          abstainPercentage={0}
          variant="bar"
        />
      );

      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
      expect(screen.queryByText('Abstain')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero percentages correctly', () => {
      render(
        <VoteChart yesPercentage={0} noPercentage={0} abstainPercentage={0} />
      );

      expect(screen.getAllByText('0%')).toHaveLength(3); // Center + Yes + No
      expect(screen.getByText('Participation')).toBeInTheDocument();
    });

    it('handles 100% single vote type', () => {
      render(
        <VoteChart yesPercentage={100} noPercentage={0} abstainPercentage={0} />
      );

      expect(screen.getAllByText('100%')).toHaveLength(2); // Center + Yes
    });

    it('handles decimal percentages', () => {
      render(
        <VoteChart
          yesPercentage={33.33}
          noPercentage={33.33}
          abstainPercentage={33.34}
        />
      );

      expect(screen.getAllByText('33.33%')).toHaveLength(2); // Yes + No
      expect(screen.getByText('33.34%')).toBeInTheDocument(); // Abstain
    });
  });

  describe('Accessibility', () => {
    it('provides meaningful content for screen readers', () => {
      render(
        <VoteChart
          yesPercentage={60}
          noPercentage={30}
          abstainPercentage={10}
        />
      );

      expect(screen.getByText('Participation')).toBeInTheDocument();
      expect(screen.getByText(/Yes/)).toBeInTheDocument();
      expect(screen.getByText(/No/)).toBeInTheDocument();
      expect(screen.getByText(/Abstain/)).toBeInTheDocument();
    });
  });
});
