'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MilitaryHoliday, HolidayCharityProposal } from '@/types';
import { mockMilitaryHolidays } from '@/data/mockData';

export interface HolidayState {
  // Data
  holidays: MilitaryHoliday[];
  generatedProposals: string[]; // IDs of auto-generated proposals

  // UI State
  selectedHoliday: MilitaryHoliday | null;
  isGeneratingProposal: boolean;

  // Actions
  setHolidays: (holidays: MilitaryHoliday[]) => void;
  addHoliday: (holiday: MilitaryHoliday) => void;
  updateHoliday: (id: string, updates: Partial<MilitaryHoliday>) => void;
  setSelectedHoliday: (holiday: MilitaryHoliday | null) => void;

  // Automated proposal generation
  checkForUpcomingHolidays: () => MilitaryHoliday[];
  generateHolidayProposal: (
    holidayId: string
  ) => Promise<HolidayCharityProposal>;
  markProposalGenerated: (proposalId: string) => void;
  isProposalGenerated: (holidayId: string) => boolean;

  // Computed getters
  getHolidayById: (id: string) => MilitaryHoliday | undefined;
  getUpcomingHolidays: (daysAhead?: number) => MilitaryHoliday[];
  getEligibleHolidays: () => MilitaryHoliday[];
  getHolidaysByCategory: (
    category: MilitaryHoliday['category']
  ) => MilitaryHoliday[];
}

export const useHolidayStore = create<HolidayState>()(
  persist(
    (set, get) => ({
      // Initial state
      holidays: mockMilitaryHolidays,
      generatedProposals: [],
      selectedHoliday: null,
      isGeneratingProposal: false,

      // Actions
      setHolidays: holidays => set({ holidays }),

      addHoliday: holiday => {
        set(state => ({
          holidays: [...state.holidays, holiday],
        }));
      },

      updateHoliday: (id, updates) => {
        set(state => ({
          holidays: state.holidays.map(h =>
            h.id === id ? { ...h, ...updates } : h
          ),
        }));
      },

      setSelectedHoliday: holiday => set({ selectedHoliday: holiday }),

      // Automated proposal generation
      checkForUpcomingHolidays: () => {
        const now = new Date();
        const twoWeeksFromNow = new Date(
          now.getTime() + 14 * 24 * 60 * 60 * 1000
        );

        return get().holidays.filter(holiday => {
          const holidayDate = new Date(holiday.date);
          const fourteenDaysBefore = new Date(
            holidayDate.getTime() - 14 * 24 * 60 * 60 * 1000
          );

          return (
            holiday.isVotingEligible &&
            now >= fourteenDaysBefore &&
            now <= twoWeeksFromNow &&
            !get().isProposalGenerated(holiday.id)
          );
        });
      },

      generateHolidayProposal: async holidayId => {
        set({ isGeneratingProposal: true });

        try {
          const holiday = get().getHolidayById(holidayId);
          if (!holiday) {
            throw new Error('Holiday not found');
          }

          // Get verified charities from charity store
          const { useCharityStore } = await import('./useCharityStore');
          const charityStore = useCharityStore.getState();

          // Ensure we have charity data
          if (charityStore.charities.length === 0) {
            await charityStore.fetchCharities();
          }

          // Get all verified charities
          const verifiedCharities = charityStore.charities
            .filter(charity => charity.verification.is501c3)
            .map(charity => charity.id);

          if (verifiedCharities.length < 2) {
            throw new Error(
              `Not enough verified charities (${verifiedCharities.length}) for ${holiday.name}`
            );
          }

          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 1000));

          const proposalId = `hcp-${holidayId}-${Date.now()}`;
          const now = new Date();
          const votingEndsAt = new Date(
            holiday.date.getTime() - 24 * 60 * 60 * 1000
          ); // 1 day before holiday

          const proposal: HolidayCharityProposal = {
            id: proposalId,
            type: 'holiday_charity',
            title: `${holiday.name} ${new Date().getFullYear()} Charity Selection`,
            author: 'system',
            status: 'active',
            timeLeft: `${Math.ceil((votingEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days left`,
            yesPercentage: 0,
            noPercentage: 0,
            abstainPercentage: 0,
            description: `Select which charity will receive $${holiday.fundAllocation.toLocaleString()} in funding for ${holiday.name} ${new Date().getFullYear()}. ${holiday.description}`,
            createdAt: now,
            votingEndsAt,
            holidayId: holiday.id,
            availableCharities: verifiedCharities,
            charityVotes: verifiedCharities.reduce(
              (acc, charityId) => {
                acc[charityId] = { votes: 0, percentage: 0 };
                return acc;
              },
              {} as Record<string, { votes: number; percentage: number }>
            ),
            totalVotes: 0,
            isAutoGenerated: true,
            fundAmount: holiday.fundAllocation,
            votingType: 'charity_selection',
          };

          // Mark as generated
          get().markProposalGenerated(proposalId);

          return proposal;
        } finally {
          set({ isGeneratingProposal: false });
        }
      },

      markProposalGenerated: proposalId => {
        set(state => ({
          generatedProposals: [...state.generatedProposals, proposalId],
        }));
      },

      isProposalGenerated: holidayId => {
        return get().generatedProposals.some(id => id.includes(holidayId));
      },

      // Computed getters
      getHolidayById: id => {
        return get().holidays.find(h => h.id === id);
      },

      getUpcomingHolidays: (daysAhead = 90) => {
        const now = new Date();
        const futureDate = new Date(
          now.getTime() + daysAhead * 24 * 60 * 60 * 1000
        );

        return get()
          .holidays.filter(holiday => {
            const holidayDate = new Date(holiday.date);
            return holidayDate >= now && holidayDate <= futureDate;
          })
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );
      },

      getEligibleHolidays: () => {
        return get().holidays.filter(holiday => holiday.isVotingEligible);
      },

      getHolidaysByCategory: category => {
        return get().holidays.filter(holiday => holiday.category === category);
      },
    }),
    {
      name: 'vmf-holiday-store',
      partialize: state => ({
        holidays: state.holidays,
        generatedProposals: state.generatedProposals,
      }),
    }
  )
);
