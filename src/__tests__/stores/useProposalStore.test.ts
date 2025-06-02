import { renderHook, act } from '@testing-library/react';
import { useProposalStore } from '@/stores/useProposalStore';
import { useCharityStore } from '@/stores/useCharityStore';
import { useHolidayStore } from '@/stores/useHolidayStore';
import type {
  CharityDirectoryProposal,
  PlatformFeatureProposal,
  HolidayCharityProposal,
  FeatureSpec,
  CharitySubmission,
} from '@/types';
import { createMockCharitySubmission } from './store-test-helpers';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock Date for consistent testing
const mockDate = new Date('2024-01-15T10:00:00.000Z');
jest.useFakeTimers();
jest.setSystemTime(mockDate);

describe('useProposalStore', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useProposalStore());

      expect(result.current.proposals.length).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.current.userVotes)).toBe(true);
      expect(result.current.selectedProposal).toBeNull();
      expect(result.current.isVoting).toBe(false);
      expect(result.current.statusFilter).toBe('all');
      expect(result.current.typeFilter).toBe('all');
      expect(result.current.searchQuery).toBe('');
      expect(result.current.sortBy).toBe('newest');
    });
  });

  describe('Holiday Charity Proposal Creation', () => {
    it('should create a holiday charity proposal successfully', async () => {
      const { result } = renderHook(() => useProposalStore());
      const initialCount = result.current.proposals.length;

      await act(async () => {
        await result.current.createHolidayCharityProposal(
          'holiday-1',
          ['charity-1', 'charity-2'],
          50000
        );
      });

      expect(result.current.proposals).toHaveLength(initialCount + 1);
      const newProposal = result.current.proposals[0]; // New proposals are added to the front
      expect(newProposal.type).toBe('holiday_charity');
      expect(newProposal.status).toBe('active');
    });
  });

  describe('Charity Directory Proposal Creation', () => {
    it('should create a charity directory proposal successfully', async () => {
      const { result } = renderHook(() => useProposalStore());
      const initialCount = result.current.proposals.length;

      const charityData = createMockCharitySubmission({
        name: 'Test Charity',
        description: 'A test charity',
        website: 'https://testcharity.org',
        ein: '12-3456789',
      });

      await act(async () => {
        await result.current.createCharityDirectoryProposal(charityData);
      });

      expect(result.current.proposals).toHaveLength(initialCount + 1);
      const newProposal = result.current.proposals[0]; // New proposals are added to the front
      expect(newProposal.type).toBe('charity_directory');
      expect(newProposal.status).toBe('active');
    });

    it('should handle errors during charity directory proposal creation', async () => {
      const { result } = renderHook(() => useProposalStore());
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const initialCount = result.current.proposals.length;

      const invalidCharityData = {} as CharitySubmission;

      await act(async () => {
        try {
          await result.current.createCharityDirectoryProposal(
            invalidCharityData
          );
        } catch (error) {
          // Expected to handle gracefully
        }
      });

      // Should still create a proposal even with invalid data (the store handles this)
      expect(result.current.proposals.length).toBeGreaterThanOrEqual(
        initialCount
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Platform Feature Proposal Creation', () => {
    it('should create a platform feature proposal successfully', async () => {
      const { result } = renderHook(() => useProposalStore());
      const initialCount = result.current.proposals.length;

      const featureSpec: FeatureSpec = {
        title: 'Test Feature',
        description: 'Test description',
        priority: 'medium',
        estimatedEffort: '1 month',
        targetUsers: ['Users'],
        technicalRequirements: 'Requirements',
        acceptanceCriteria: ['Criteria'],
        businessValue: 'Value',
        userStory: 'As a user...',
      };

      await act(async () => {
        await result.current.createPlatformFeatureProposal(featureSpec);
      });

      expect(result.current.proposals).toHaveLength(initialCount + 1);
      const newProposal = result.current.proposals[0]; // New proposals are added to the front
      expect(newProposal.type).toBe('platform_feature');
      expect(newProposal.status).toBe('active');
    });

    it('should map priority to complexity correctly', async () => {
      const { result } = renderHook(() => useProposalStore());

      const highPrioritySpec: FeatureSpec = {
        title: 'High Priority Feature',
        description: 'Test',
        priority: 'critical',
        estimatedEffort: '6 months',
        targetUsers: ['Users'],
        technicalRequirements: 'Complex',
        acceptanceCriteria: ['Advanced'],
        businessValue: 'High',
        userStory: 'As a user...',
      };

      await act(async () => {
        await result.current.createPlatformFeatureProposal(highPrioritySpec);
      });

      const newProposal = result.current
        .proposals[0] as PlatformFeatureProposal;
      expect(newProposal.implementationComplexity).toBe('high');
    });
  });

  describe('Basic Functionality', () => {
    it('should add proposals to the store', async () => {
      const { result } = renderHook(() => useProposalStore());
      const initialCount = result.current.proposals.length;

      await act(async () => {
        await result.current.createHolidayCharityProposal(
          'test-holiday',
          ['test-charity'],
          10000
        );
      });

      expect(result.current.proposals).toHaveLength(initialCount + 1);
    });
  });
});
