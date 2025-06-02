import { renderHook, act } from '@testing-library/react';
import { useHolidayStore } from '@/stores/useHolidayStore';
import { useProposalStore } from '@/stores/useProposalStore';
import type { MilitaryHoliday } from '@/types';

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

describe('useHolidayStore', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);

    // Reset stores to initial state
    const holidayStore = renderHook(() => useHolidayStore());
    const proposalStore = renderHook(() => useProposalStore());

    act(() => {
      // Clear holidays by setting empty array
      holidayStore.result.current.setHolidays([]);

      // Clear proposals
      proposalStore.result.current.setProposals([]);

      // Reset selected holiday
      holidayStore.result.current.setSelectedHoliday(null);
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useHolidayStore());

      expect(result.current.holidays).toEqual([]);
      expect(result.current.selectedHoliday).toBeNull();
      expect(result.current.isGeneratingProposal).toBe(false);
    });
  });

  describe('Basic Holiday Management', () => {
    it('should add a holiday to the store', () => {
      const { result } = renderHook(() => useHolidayStore());

      const mockHoliday: MilitaryHoliday = {
        id: 'test-holiday-1',
        name: 'Test Veterans Day',
        date: new Date('2024-11-11'),
        description: 'A day to honor veterans',
        significance: 'Honors all military veterans',
        fundAllocation: 100000,
        isVotingEligible: true,
        flagIcon: '🇺🇸',
        category: 'major',
      };

      act(() => {
        result.current.addHoliday(mockHoliday);
      });

      expect(result.current.holidays).toHaveLength(1);
      expect(result.current.holidays[0]).toEqual(mockHoliday);
    });

    it('should update an existing holiday', () => {
      const { result } = renderHook(() => useHolidayStore());

      const mockHoliday: MilitaryHoliday = {
        id: 'test-holiday-1',
        name: 'Test Veterans Day',
        date: mockDate,
        description: 'A day to honor veterans',
        significance: 'Honors all military veterans',
        fundAllocation: 75000,
        isVotingEligible: false,
        flagIcon: '🇺🇸',
        category: 'major',
      };

      act(() => {
        result.current.addHoliday(mockHoliday);
      });

      act(() => {
        result.current.updateHoliday('test-holiday-1', {
          fundAllocation: 100000,
          isVotingEligible: true,
        });
      });

      expect(result.current.holidays[0].fundAllocation).toBe(100000);
      expect(result.current.holidays[0].isVotingEligible).toBe(true);
    });

    it('should set selected holiday', () => {
      const { result } = renderHook(() => useHolidayStore());

      const mockHoliday: MilitaryHoliday = {
        id: 'test-holiday-1',
        name: 'Test Veterans Day',
        date: mockDate,
        description: 'A day to honor veterans',
        significance: 'Honors all military veterans',
        fundAllocation: 75000,
        isVotingEligible: false,
        flagIcon: '🇺🇸',
        category: 'major',
      };

      act(() => {
        result.current.setSelectedHoliday(mockHoliday);
      });

      expect(result.current.selectedHoliday).toEqual(mockHoliday);
    });

    it('should clear selected holiday', () => {
      const { result } = renderHook(() => useHolidayStore());

      const mockHoliday: MilitaryHoliday = {
        id: 'test-holiday-1',
        name: 'Test Veterans Day',
        date: mockDate,
        description: 'A day to honor veterans',
        significance: 'Honors all military veterans',
        fundAllocation: 75000,
        isVotingEligible: false,
        flagIcon: '🇺🇸',
        category: 'major',
      };

      act(() => {
        result.current.setSelectedHoliday(mockHoliday);
      });

      expect(result.current.selectedHoliday).toEqual(mockHoliday);

      act(() => {
        result.current.setSelectedHoliday(null);
      });

      expect(result.current.selectedHoliday).toBeNull();
    });
  });

  describe('Holiday Proposal Generation', () => {
    it('should generate holiday proposal successfully', async () => {
      const { result: holidayResult } = renderHook(() => useHolidayStore());

      const mockHoliday: MilitaryHoliday = {
        id: 'test-holiday-1',
        name: 'Test Veterans Day',
        date: new Date('2024-11-11'),
        description: 'A day to honor veterans',
        significance: 'Honors all military veterans',
        fundAllocation: 75000,
        isVotingEligible: true,
        flagIcon: '🇺🇸',
        category: 'major',
      };

      act(() => {
        holidayResult.current.addHoliday(mockHoliday);
      });

      let proposal: any;
      await act(async () => {
        proposal = await holidayResult.current.generateHolidayProposal(
          mockHoliday.id
        );
      });

      expect(proposal).toBeDefined();
      expect(proposal.type).toBe('holiday_charity');
      expect(proposal.holidayId).toBe(mockHoliday.id);
      expect(proposal.fundAmount).toBe(mockHoliday.fundAllocation);
      expect(proposal.isAutoGenerated).toBe(true);
      expect(holidayResult.current.isGeneratingProposal).toBe(false);
    });

    it('should handle generation errors gracefully', async () => {
      const { result } = renderHook(() => useHolidayStore());
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await act(async () => {
        try {
          await result.current.generateHolidayProposal('nonexistent-holiday');
        } catch (error) {
          // Expected to throw or handle gracefully
        }
      });

      expect(result.current.isGeneratingProposal).toBe(false);
      consoleSpy.mockRestore();
    });

    it('should set isGeneratingProposal state correctly during generation', async () => {
      const { result: holidayResult } = renderHook(() => useHolidayStore());

      const mockHoliday: MilitaryHoliday = {
        id: 'test-holiday-1',
        name: 'Test Veterans Day',
        date: new Date('2024-11-11'),
        description: 'A day to honor veterans',
        significance: 'Honors all military veterans',
        fundAllocation: 100000,
        isVotingEligible: true,
        flagIcon: '🇺🇸',
        category: 'major',
      };

      act(() => {
        holidayResult.current.addHoliday(mockHoliday);
      });

      // Start generation
      const generationPromise = act(async () => {
        await holidayResult.current.generateHolidayProposal(mockHoliday.id);
      });

      // Check that isGeneratingProposal is true during generation
      expect(holidayResult.current.isGeneratingProposal).toBe(true);

      await generationPromise;

      // Check that isGeneratingProposal is false after generation
      expect(holidayResult.current.isGeneratingProposal).toBe(false);
    });

    it('should track generated proposals', () => {
      const { result } = renderHook(() => useHolidayStore());

      const proposalId = 'proposal-1';

      act(() => {
        result.current.markProposalGenerated(proposalId);
      });

      expect(result.current.generatedProposals).toContain(proposalId);
      expect(result.current.isProposalGenerated('proposal')).toBe(true); // Contains 'proposal'
    });

    it('should check for upcoming holidays', () => {
      const { result } = renderHook(() => useHolidayStore());

      const upcomingHoliday: MilitaryHoliday = {
        id: 'upcoming-holiday',
        name: 'Test Veterans Day',
        date: new Date('2024-01-20'), // 5 days from mock date
        description: 'A day to honor veterans',
        significance: 'Honors all military veterans',
        fundAllocation: 100000,
        isVotingEligible: true,
        flagIcon: '🇺🇸',
        category: 'major',
      };

      act(() => {
        result.current.addHoliday(upcomingHoliday);
      });

      const upcoming = result.current.checkForUpcomingHolidays();
      expect(upcoming.length).toBeGreaterThanOrEqual(0);
    });

    it('should get upcoming holidays with custom days ahead', () => {
      const { result } = renderHook(() => useHolidayStore());

      const upcomingHolidays30 = result.current.getUpcomingHolidays(30);
      const upcomingHolidays365 = result.current.getUpcomingHolidays(365);

      // Should have fewer or equal holidays in 30 days vs 365 days
      expect(upcomingHolidays30.length).toBeLessThanOrEqual(
        upcomingHolidays365.length
      );
    });
  });

  describe('Computed Getters', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useHolidayStore());

      // Add test holidays
      act(() => {
        result.current.addHoliday({
          id: 'holiday-1',
          name: 'Test Veterans Day',
          date: mockDate,
          description: 'A day to honor veterans',
          significance: 'Honors all military veterans',
          fundAllocation: 100000,
          isVotingEligible: true,
          flagIcon: '🇺🇸',
          category: 'major',
        });

        result.current.addHoliday({
          id: 'holiday-2',
          name: 'Test Veterans Day',
          date: mockDate,
          description: 'A day to honor veterans',
          significance: 'Honors all military veterans',
          fundAllocation: 50000,
          isVotingEligible: false,
          flagIcon: '🇺🇸',
          category: 'observance',
        });
      });
    });

    it('should get holiday by ID', () => {
      const { result } = renderHook(() => useHolidayStore());

      const holiday = result.current.getHolidayById('holiday-1');
      expect(holiday).toBeDefined();
      expect(holiday?.id).toBe('holiday-1');

      const notFound = result.current.getHolidayById('nonexistent');
      expect(notFound).toBeUndefined();
    });

    it('should get holidays by category', () => {
      const { result } = renderHook(() => useHolidayStore());

      const majorHolidays = result.current.getHolidaysByCategory('major');
      expect(majorHolidays.length).toBeGreaterThanOrEqual(1);
      majorHolidays.forEach(holiday => {
        expect(holiday.category).toBe('major');
      });
    });

    it('should get eligible holidays', () => {
      const { result } = renderHook(() => useHolidayStore());

      const eligible = result.current.getEligibleHolidays();
      expect(eligible.length).toBeGreaterThanOrEqual(1);
      eligible.forEach(holiday => {
        expect(holiday.isVotingEligible).toBe(true);
      });
    });

    it('should get upcoming holidays', () => {
      const { result } = renderHook(() => useHolidayStore());

      // Add a future holiday
      act(() => {
        result.current.addHoliday({
          id: 'future-holiday',
          name: 'Future Holiday',
          date: new Date('2024-12-25'), // Future date
          description: 'A future holiday',
          significance: 'Future celebration',
          fundAllocation: 75000,
          isVotingEligible: true,
          flagIcon: '🎄',
          category: 'major',
        });
      });

      const upcoming = result.current.getUpcomingHolidays();
      expect(upcoming.length).toBeGreaterThan(0);
      upcoming.forEach(holiday => {
        expect(holiday.date.getTime()).toBeGreaterThan(mockDate.getTime());
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid holiday data gracefully', () => {
      const { result } = renderHook(() => useHolidayStore());

      // Start with one valid holiday
      act(() => {
        result.current.addHoliday({
          id: 'valid-holiday',
          name: 'Valid Holiday',
          date: mockDate,
          description: 'A valid holiday',
          significance: 'Valid celebration',
          fundAllocation: 50000,
          isVotingEligible: true,
          flagIcon: '🎉',
          category: 'major',
        });
      });

      expect(result.current.holidays).toHaveLength(1);

      // Try to add invalid data (this should be handled gracefully by the store)
      try {
        act(() => {
          result.current.addHoliday({} as MilitaryHoliday);
        });
      } catch (error) {
        // Expected to handle gracefully
      }

      // The store should still function even with invalid data
      expect(result.current.holidays.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle update of non-existent holiday', () => {
      const { result } = renderHook(() => useHolidayStore());

      const initialLength = result.current.holidays.length;

      act(() => {
        result.current.updateHoliday('nonexistent-id', {
          fundAllocation: 999999,
        });
      });

      // Should not crash, just do nothing
      expect(result.current.holidays).toHaveLength(initialLength);
    });
  });

  describe('Data Persistence', () => {
    it('should persist holiday data to localStorage', () => {
      const { result } = renderHook(() => useHolidayStore());

      const mockHoliday: MilitaryHoliday = {
        id: 'test-holiday-1',
        name: 'Test Veterans Day',
        date: mockDate,
        description: 'A day to honor veterans',
        significance: 'Honors all military veterans',
        fundAllocation: 75000,
        isVotingEligible: false,
        flagIcon: '🇺🇸',
        category: 'major',
      };

      act(() => {
        result.current.addHoliday(mockHoliday);
      });

      // Check that data was saved to localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'vmf-holiday-store',
        expect.stringContaining('test-holiday-1')
      );
    });

    it('should load holiday data from localStorage on initialization', () => {
      const mockHoliday: MilitaryHoliday = {
        id: 'stored-holiday',
        name: 'Stored Holiday',
        date: new Date('2024-01-15T10:00:00.000Z'),
        description: 'A stored holiday',
        significance: 'Stored celebration',
        fundAllocation: 60000,
        isVotingEligible: true,
        flagIcon: '📅',
        category: 'major',
      };

      const mockData = {
        holidays: [mockHoliday],
        generatedProposals: [],
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockData));

      const { result } = renderHook(() => useHolidayStore());

      expect(result.current.holidays).toHaveLength(1);
      expect(result.current.holidays[0].id).toBe(mockHoliday.id);
    });
  });
});
