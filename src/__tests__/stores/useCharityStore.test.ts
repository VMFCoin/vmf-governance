import { act, renderHook } from '@testing-library/react';
import { useCharityStore } from '@/stores/useCharityStore';
import {
  createMockLocalStorage,
  createMockDate,
  mockRandomUUID,
  createMockCharitySubmission,
  createMockCharity,
  resetAllStores,
  waitForAsync,
  expectCharityStructure,
} from './store-test-helpers';
import { Charity, CharitySubmission } from '@/types';

// Mock the data imports
jest.mock('@/data/mockData', () => ({
  mockCharities: [],
}));

describe('useCharityStore', () => {
  let mockLocalStorage: ReturnType<typeof createMockLocalStorage>;
  let mockDate: Date;

  beforeEach(() => {
    // Reset all stores and mocks
    resetAllStores();

    // Setup mocks
    mockLocalStorage = createMockLocalStorage();
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

    mockDate = createMockDate('2024-01-15T10:00:00.000Z');
    mockRandomUUID();

    // Clear console logs for cleaner test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useCharityStore());

      expect(result.current.charities).toEqual([]);
      expect(result.current.selectedCharity).toBeNull();
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.searchQuery).toBe('');
      expect(result.current.categoryFilter).toBe('all');
      expect(result.current.verificationFilter).toBe('all');
      expect(result.current.pendingSubmissions).toEqual([]);
    });
  });

  describe('Basic Charity Management', () => {
    it('should add a charity to the store', () => {
      const { result } = renderHook(() => useCharityStore());

      const mockCharity = createMockCharity();

      act(() => {
        result.current.addCharity(mockCharity);
      });

      expect(result.current.charities).toHaveLength(1);
      expect(result.current.charities[0]).toEqual(mockCharity);
    });

    it('should update an existing charity', () => {
      const { result } = renderHook(() => useCharityStore());

      const mockCharity = createMockCharity();

      act(() => {
        result.current.addCharity(mockCharity);
      });

      act(() => {
        result.current.updateCharity(mockCharity.id, {
          verificationStatus: 'verified',
          verifiedAt: new Date(),
        });
      });

      expect(result.current.charities[0].verificationStatus).toBe('verified');
      expect(result.current.charities[0].verifiedAt).toBeDefined();
    });

    it('should set selected charity', () => {
      const { result } = renderHook(() => useCharityStore());

      const mockCharity = createMockCharity();

      act(() => {
        result.current.setSelectedCharity(mockCharity);
      });

      expect(result.current.selectedCharity).toEqual(mockCharity);
    });

    it('should clear selected charity', () => {
      const { result } = renderHook(() => useCharityStore());

      const mockCharity = createMockCharity();

      act(() => {
        result.current.setSelectedCharity(mockCharity);
      });

      expect(result.current.selectedCharity).toEqual(mockCharity);

      act(() => {
        result.current.setSelectedCharity(null);
      });

      expect(result.current.selectedCharity).toBeNull();
    });
  });

  describe('Charity Submission', () => {
    beforeEach(() => {
      // Mock setTimeout for submission simulation
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should submit a charity proposal successfully', async () => {
      const { result } = renderHook(() => useCharityStore());
      const charityData = createMockCharitySubmission();

      const submissionPromise = act(async () => {
        result.current.submitCharityProposal(charityData);
      });

      // Fast-forward timers to complete the submission
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await submissionPromise;

      // Check that charity was added to pending submissions
      expect(result.current.pendingSubmissions).toHaveLength(1);

      const pendingSubmission = result.current.pendingSubmissions[0];
      expect(pendingSubmission.name).toBe(charityData.name);
      expect(pendingSubmission.ein).toBe(charityData.ein);
      expect(pendingSubmission.category).toBe(charityData.category);
    });

    it('should handle submission errors gracefully', async () => {
      const { result } = renderHook(() => useCharityStore());
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Create invalid charity data
      const invalidCharityData = createMockCharitySubmission({
        name: '',
        ein: '',
      });

      const submissionPromise = act(async () => {
        try {
          result.current.submitCharityProposal(invalidCharityData);
        } catch (error) {
          // Expected to throw
        }
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await submissionPromise;

      expect(result.current.isSubmitting).toBe(false);
    });

    it('should set isSubmitting state correctly during submission', async () => {
      const { result } = renderHook(() => useCharityStore());
      const charityData = createMockCharitySubmission();

      // Start submission
      act(() => {
        result.current.submitCharityProposal(charityData);
      });

      // Check that isSubmitting is true
      expect(result.current.isSubmitting).toBe(true);

      // Complete submission
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Check that isSubmitting is false
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should get pending submissions', () => {
      const { result } = renderHook(() => useCharityStore());
      const charityData = createMockCharitySubmission();

      // Add a pending submission manually
      act(() => {
        result.current.pendingSubmissions.push(charityData);
      });

      const pending = result.current.getPendingSubmissions();
      expect(pending).toHaveLength(1);
      expect(pending[0]).toEqual(charityData);
    });
  });

  describe('Filtering and Sorting', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useCharityStore());

      // Add test charities
      const charities = [
        createMockCharity({
          id: 'charity-1',
          name: 'Veterans Support Foundation',
          category: 'veterans',
          verificationStatus: 'verified',
          addedAt: new Date('2024-01-10'),
        }),
        createMockCharity({
          id: 'charity-2',
          name: 'Military Family Aid',
          category: 'military_families',
          verificationStatus: 'pending',
          addedAt: new Date('2024-01-12'),
        }),
        createMockCharity({
          id: 'charity-3',
          name: 'Disabled Veterans Assistance',
          category: 'disabled_veterans',
          verificationStatus: 'verified',
          addedAt: new Date('2024-01-08'),
        }),
      ];

      act(() => {
        charities.forEach(charity => result.current.addCharity(charity));
      });
    });

    it('should filter charities by category', () => {
      const { result } = renderHook(() => useCharityStore());

      act(() => {
        result.current.setCategoryFilter('veterans');
      });

      const filtered = result.current.getFilteredCharities();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].category).toBe('veterans');
    });

    it('should filter charities by verification status', () => {
      const { result } = renderHook(() => useCharityStore());

      act(() => {
        result.current.setVerificationFilter('verified');
      });

      const filtered = result.current.getFilteredCharities();
      expect(filtered).toHaveLength(2);
      filtered.forEach(charity => {
        expect(charity.verificationStatus).toBe('verified');
      });
    });

    it('should search charities by name and description', () => {
      const { result } = renderHook(() => useCharityStore());

      act(() => {
        result.current.setSearchQuery('Veterans');
      });

      const filtered = result.current.getFilteredCharities();
      expect(filtered).toHaveLength(2); // Both "Veterans Support" and "Disabled Veterans"
      filtered.forEach(charity => {
        expect(charity.name.toLowerCase()).toContain('veterans');
      });
    });

    it('should combine multiple filters', () => {
      const { result } = renderHook(() => useCharityStore());

      act(() => {
        result.current.setCategoryFilter('veterans');
        result.current.setVerificationFilter('verified');
        result.current.setSearchQuery('Veterans');
      });

      const filtered = result.current.getFilteredCharities();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('charity-1');
    });
  });

  describe('Computed Getters', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useCharityStore());

      const charities = [
        createMockCharity({
          id: 'charity-1',
          category: 'veterans',
          verificationStatus: 'verified',
        }),
        createMockCharity({
          id: 'charity-2',
          category: 'military_families',
          verificationStatus: 'pending',
        }),
        createMockCharity({
          id: 'charity-3',
          category: 'veterans',
          verificationStatus: 'verified',
        }),
      ];

      act(() => {
        charities.forEach(charity => result.current.addCharity(charity));
      });
    });

    it('should get charity by ID', () => {
      const { result } = renderHook(() => useCharityStore());

      const found = result.current.getCharityById('charity-1');
      expect(found).toBeDefined();
      expect(found?.id).toBe('charity-1');

      const notFound = result.current.getCharityById('nonexistent');
      expect(notFound).toBeUndefined();
    });

    it('should get charities by category (verified only)', () => {
      const { result } = renderHook(() => useCharityStore());

      const veteransCharities =
        result.current.getCharitiesByCategory('veterans');
      expect(veteransCharities).toHaveLength(2);
      veteransCharities.forEach(charity => {
        expect(charity.category).toBe('veterans');
        expect(charity.verificationStatus).toBe('verified');
      });
    });

    it('should get verified charities', () => {
      const { result } = renderHook(() => useCharityStore());

      const verifiedCharities = result.current.getVerifiedCharities();
      expect(verifiedCharities).toHaveLength(2);
      verifiedCharities.forEach(charity => {
        expect(charity.verificationStatus).toBe('verified');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid charity data gracefully', () => {
      const { result } = renderHook(() => useCharityStore());
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Try to add invalid charity
      act(() => {
        try {
          result.current.addCharity({} as Charity);
        } catch (error) {
          // Expected to throw
        }
      });

      // The store should still function even with invalid data
      expect(result.current.charities).toHaveLength(1);
    });

    it('should handle update of non-existent charity', () => {
      const { result } = renderHook(() => useCharityStore());

      act(() => {
        result.current.updateCharity('nonexistent', {
          verificationStatus: 'verified',
        });
      });

      // Should not crash, just do nothing
      expect(result.current.charities).toHaveLength(0);
    });
  });

  describe('Data Persistence', () => {
    it('should persist charity data to localStorage', () => {
      const { result } = renderHook(() => useCharityStore());
      const mockCharity = createMockCharity();

      act(() => {
        result.current.addCharity(mockCharity);
      });

      // Check that data was saved to localStorage
      const savedData = mockLocalStorage.getItem('vmf-charity-store');
      expect(savedData).toBeTruthy();

      const parsedData = JSON.parse(savedData!);
      expect(parsedData.charities).toHaveLength(1);
      expect(parsedData.charities[0].id).toBe(mockCharity.id);
    });

    it('should load charity data from localStorage on initialization', () => {
      const mockCharity = createMockCharity();

      // Pre-populate localStorage
      mockLocalStorage.setItem(
        'vmf-charity-store',
        JSON.stringify({
          charities: [mockCharity],
          pendingSubmissions: [],
        })
      );

      const { result } = renderHook(() => useCharityStore());

      expect(result.current.charities).toHaveLength(1);
      expect(result.current.charities[0].id).toBe(mockCharity.id);
    });
  });
});
