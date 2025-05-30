'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Charity, CharitySubmission } from '@/types';
import { mockCharities } from '@/data/mockData';

export interface CharityState {
  // Data
  charities: Charity[];
  pendingSubmissions: CharitySubmission[];

  // UI State
  selectedCharity: Charity | null;
  isSubmitting: boolean;
  searchQuery: string;
  categoryFilter:
    | 'all'
    | 'veterans'
    | 'military_families'
    | 'disabled_veterans'
    | 'mental_health'
    | 'general_support';
  verificationFilter: 'all' | 'verified' | 'pending' | 'rejected';

  // Actions
  setCharities: (charities: Charity[]) => void;
  addCharity: (charity: Charity) => void;
  updateCharity: (id: string, updates: Partial<Charity>) => void;
  setSelectedCharity: (charity: Charity | null) => void;

  // Submission actions
  submitCharityProposal: (charityData: CharitySubmission) => Promise<void>;
  getPendingSubmissions: () => CharitySubmission[];

  // Filter actions
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (filter: CharityState['categoryFilter']) => void;
  setVerificationFilter: (filter: CharityState['verificationFilter']) => void;

  // Computed getters
  getFilteredCharities: () => Charity[];
  getCharityById: (id: string) => Charity | undefined;
  getVerifiedCharities: () => Charity[];
  getCharitiesByCategory: (category: Charity['category']) => Charity[];
}

export const useCharityStore = create<CharityState>()(
  persist(
    (set, get) => ({
      // Initial state
      charities: mockCharities,
      pendingSubmissions: [],
      selectedCharity: null,
      isSubmitting: false,
      searchQuery: '',
      categoryFilter: 'all',
      verificationFilter: 'all',

      // Actions
      setCharities: charities => set({ charities }),

      addCharity: charity => {
        set(state => ({
          charities: [...state.charities, charity],
        }));
      },

      updateCharity: (id, updates) => {
        set(state => ({
          charities: state.charities.map(c =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      setSelectedCharity: charity => set({ selectedCharity: charity }),

      // Submission actions
      submitCharityProposal: async charityData => {
        set({ isSubmitting: true });

        try {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 1500));

          // Add to pending submissions
          set(state => ({
            pendingSubmissions: [...state.pendingSubmissions, charityData],
          }));

          // In real implementation, this would create a CharityDirectoryProposal
          console.log('Charity proposal submitted:', charityData);
        } finally {
          set({ isSubmitting: false });
        }
      },

      getPendingSubmissions: () => get().pendingSubmissions,

      // Filter actions
      setSearchQuery: query => set({ searchQuery: query }),
      setCategoryFilter: filter => set({ categoryFilter: filter }),
      setVerificationFilter: filter => set({ verificationFilter: filter }),

      // Computed getters
      getFilteredCharities: () => {
        const { charities, searchQuery, categoryFilter, verificationFilter } =
          get();

        let filtered = charities;

        // Filter by category
        if (categoryFilter !== 'all') {
          filtered = filtered.filter(c => c.category === categoryFilter);
        }

        // Filter by verification status
        if (verificationFilter !== 'all') {
          filtered = filtered.filter(
            c => c.verificationStatus === verificationFilter
          );
        }

        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(
            c =>
              c.name.toLowerCase().includes(query) ||
              c.description.toLowerCase().includes(query) ||
              c.category.toLowerCase().includes(query)
          );
        }

        return filtered;
      },

      getCharityById: id => {
        return get().charities.find(c => c.id === id);
      },

      getVerifiedCharities: () => {
        return get().charities.filter(c => c.verificationStatus === 'verified');
      },

      getCharitiesByCategory: category => {
        return get().charities.filter(
          c => c.category === category && c.verificationStatus === 'verified'
        );
      },
    }),
    {
      name: 'vmf-charity-store',
      partialize: state => ({
        charities: state.charities,
        pendingSubmissions: state.pendingSubmissions,
      }),
    }
  )
);
