import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock providers for testing
const MockProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: MockProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render, userEvent };

// Mock data generators for tests
export const mockProposal = {
  id: '1',
  title: 'Test Proposal',
  author: 'TestAuthor.eth',
  status: 'active' as const,
  timeLeft: '5 days left',
  yesPercentage: 60,
  noPercentage: 30,
  abstainPercentage: 10,
  description: 'This is a test proposal description',
};

export const mockCommunityPost = {
  id: '1',
  title: 'Test Community Post',
  content: 'This is test content for a community post',
  author: 'TestUser',
  authorAddress: '0x1234567890123456789012345678901234567890',
  createdAt: new Date('2024-01-01'),
  upvotes: 10,
  downvotes: 2,
  category: 'idea' as const,
  tags: ['test', 'community'],
  isPromoted: false,
  userVote: null,
};

export const mockUser = {
  id: '1',
  address: '0x1234567890123456789012345678901234567890',
  ensName: 'testuser.eth',
  votingPower: 1000,
};

// Zustand store mocking utilities
export const createMockStore = <T extends Record<string, any>>(
  initialState: T
) => {
  let state = { ...initialState };

  const getState = () => state;
  const setState = (partial: Partial<T> | ((state: T) => Partial<T>)) => {
    const nextState = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...nextState };
  };

  return { getState, setState };
};

// Animation testing utilities
export const waitForAnimation = (duration = 100) =>
  new Promise(resolve => setTimeout(resolve, duration));

// Form testing utilities
export const fillForm = async (
  getByLabelText: any,
  formData: Record<string, string>
) => {
  const user = userEvent.setup();
  for (const [label, value] of Object.entries(formData)) {
    const input = getByLabelText(label);
    await user.clear(input);
    await user.type(input, value);
  }
};

// Accessibility testing utilities
export const checkAccessibility = async (container: HTMLElement) => {
  const { axe, toHaveNoViolations } = await import('jest-axe');
  expect.extend(toHaveNoViolations);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};

// Mock intersection observer for testing
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.IntersectionObserver = mockIntersectionObserver;
};

// Simple test to prevent Jest from failing
describe('Test Utils', () => {
  it('should export test utilities', () => {
    expect(customRender).toBeDefined();
    expect(MockProviders).toBeDefined();
    expect(mockProposal).toBeDefined();
    expect(mockCommunityPost).toBeDefined();
    expect(mockUser).toBeDefined();
  });
});
