import { render, screen, userEvent } from '../utils/test-utils';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-patriotRed');
  });

  it('renders different variants correctly', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-patriotRed');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-backgroundLight');

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-patriotRed');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-patriotRed');
  });

  it('renders different sizes correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-9');

    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-11');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-13');

    rerender(<Button size="xl">Extra Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-16');
  });

  it('handles disabled state correctly', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = jest.fn();

    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole('button');

    await userEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const handleClick = jest.fn();

    render(
      <Button onClick={handleClick} disabled>
        Disabled
      </Button>
    );
    const button = screen.getByRole('button');

    await userEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('supports keyboard navigation', async () => {
    const handleClick = jest.fn();

    render(<Button onClick={handleClick}>Press Enter</Button>);
    const button = screen.getByRole('button');

    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);

    await userEvent.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('renders with custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('renders as different HTML elements when asChild is used', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });

  it('has proper ARIA attributes', () => {
    render(<Button aria-label="Custom label">Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Custom label');
  });

  it('maintains focus styles for accessibility', () => {
    render(<Button>Focus me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
  });

  it('renders primary variant with gradient overlay', () => {
    render(<Button variant="primary">Primary</Button>);
    const button = screen.getByRole('button');
    const gradient = button.querySelector('.absolute.inset-0');
    expect(gradient).toBeInTheDocument();
  });

  it('does not render gradient overlay for non-primary variants', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button');
    const gradient = button.querySelector('.absolute.inset-0');
    expect(gradient).not.toBeInTheDocument();
  });
});
