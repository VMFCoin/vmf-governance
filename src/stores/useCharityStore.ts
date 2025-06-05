'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Charity, CharityCategory, CharitySubmission } from '@/types';
import { charityService } from '@/services/charityService';

export interface CharityState {
  // Data
  charities: Charity[];
  pendingSubmissions: CharitySubmission[];
  isLoading: boolean;
  error: string | null;

  // UI State
  selectedCharity: Charity | null;
  isSubmitting: boolean;
  searchQuery: string;
  categoryFilter: CharityCategory | 'all';
  verificationFilter: 'all' | 'verified' | 'pending' | 'rejected';
  sortBy: 'name' | 'established' | 'impact';

  // Actions
  fetchCharities: () => Promise<void>;
  addCharity: (charity: {
    name: string;
    website: string;
    logo: string;
    mission: string;
    description: string;
  }) => Promise<Charity>;
  updateCharity: (
    id: string,
    updates: {
      name?: string;
      website?: string;
      logo?: string;
      mission?: string;
      description?: string;
    }
  ) => Promise<void>;
  deleteCharity: (id: string) => Promise<void>;
  uploadCharityLogo: (file: File) => Promise<string>;
  setSelectedCharity: (charity: Charity | null) => void;

  // Submission actions (for proposals)
  submitCharityForDirectory: (charityData: CharitySubmission) => Promise<void>;
  getPendingSubmissions: () => CharitySubmission[];

  // Filter actions
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (filter: CharityCategory | 'all') => void;
  setVerificationFilter: (
    filter: 'all' | 'verified' | 'pending' | 'rejected'
  ) => void;
  setSortBy: (sort: 'name' | 'established' | 'impact') => void;
  clearError: () => void;

  // Computed getters
  getFilteredCharities: () => Charity[];
  getCharityById: (id: string) => Charity | undefined;
  getVerifiedCharities: () => Charity[];
  getFeaturedCharities: () => Charity[];
  getCharitiesByCategory: (category: CharityCategory) => Charity[];
}

export const useCharityStore = create<CharityState>()(
  persist(
    (set, get) => ({
      // Initial state
      charities: [],
      pendingSubmissions: [],
      isLoading: false,
      error: null,
      selectedCharity: null,
      isSubmitting: false,
      searchQuery: '',
      categoryFilter: 'all',
      verificationFilter: 'all',
      sortBy: 'name',

      // Actions - Updated to use Supabase
      fetchCharities: async () => {
        set({ isLoading: true, error: null });
        try {
          const charities = await charityService.getAllCharities();
          set({ charities, isLoading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch charities',
            isLoading: false,
          });
        }
      },

      addCharity: async charityData => {
        set({ isLoading: true, error: null });
        try {
          const newCharity = await charityService.createCharity(charityData);
          set(state => ({
            charities: [newCharity, ...state.charities],
            isLoading: false,
          }));
          return newCharity;
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to add charity',
            isLoading: false,
          });
          throw error;
        }
      },

      updateCharity: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          const updatedCharity = await charityService.updateCharity(
            id,
            updates
          );
          set(state => ({
            charities: state.charities.map(c =>
              c.id === id ? updatedCharity : c
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to update charity',
            isLoading: false,
          });
          throw error;
        }
      },

      deleteCharity: async id => {
        set({ isLoading: true, error: null });
        try {
          await charityService.deleteCharity(id);
          set(state => ({
            charities: state.charities.filter(c => c.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to delete charity',
            isLoading: false,
          });
          throw error;
        }
      },

      uploadCharityLogo: async (file: File) => {
        try {
          return await charityService.uploadCharityLogo(file);
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to upload logo',
          });
          throw error;
        }
      },

      setSelectedCharity: charity => set({ selectedCharity: charity }),

      // Submission actions (for proposals)
      submitCharityForDirectory: async (charityData: CharitySubmission) => {
        set({ isSubmitting: true });
        try {
          // For now, we'll just add it directly to the directory
          // In the future, this could create a charity directory proposal
          await get().addCharity({
            name: charityData.name,
            website: charityData.website,
            logo: '/images/charities/default-charity.svg', // Default logo
            mission: charityData.missionStatement,
            description: charityData.description,
          });

          // Add to pending submissions for tracking
          set(state => ({
            pendingSubmissions: [...state.pendingSubmissions, charityData],
          }));
        } catch (error) {
          throw error;
        } finally {
          set({ isSubmitting: false });
        }
      },

      getPendingSubmissions: () => get().pendingSubmissions,

      // Filter actions
      setSearchQuery: (query: string) => set({ searchQuery: query }),
      setCategoryFilter: (category: CharityCategory | 'all') =>
        set({ categoryFilter: category }),
      setVerificationFilter: (
        filter: 'all' | 'verified' | 'pending' | 'rejected'
      ) => set({ verificationFilter: filter }),
      setSortBy: (sort: 'name' | 'established' | 'impact') =>
        set({ sortBy: sort }),
      clearError: () => set({ error: null }),

      // Computed getters (using hardcoded values for complex metadata)
      getFilteredCharities: () => {
        const {
          charities,
          searchQuery,
          categoryFilter,
          verificationFilter,
          sortBy,
        } = get();

        let filtered = charities;

        // Search filter
        if (searchQuery) {
          filtered = filtered.filter(
            charity =>
              charity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              charity.description
                .toLowerCase()
                .includes(searchQuery.toLowerCase())
          );
        }

        // Category filter (using hardcoded category)
        if (categoryFilter !== 'all') {
          filtered = filtered.filter(
            charity => charity.category === categoryFilter
          );
        }

        // Verification filter (using hardcoded verification)
        if (verificationFilter !== 'all') {
          if (verificationFilter === 'verified') {
            filtered = filtered.filter(charity => charity.verification.is501c3);
          } else if (verificationFilter === 'pending') {
            filtered = filtered.filter(
              charity => !charity.verification.is501c3
            );
          }
        }

        // Sort
        filtered.sort((a, b) => {
          switch (sortBy) {
            case 'name':
              return a.name.localeCompare(b.name);
            case 'established':
              return b.establishedYear - a.establishedYear;
            case 'impact':
              return (
                b.impactMetrics.veteransServed - a.impactMetrics.veteransServed
              );
            default:
              return 0;
          }
        });

        return filtered;
      },

      getCharityById: (id: string) => {
        return get().charities.find(charity => charity.id === id);
      },

      getVerifiedCharities: () => {
        return get().charities.filter(charity => charity.verification.is501c3);
      },

      getFeaturedCharities: () => {
        return get().charities.filter(charity => charity.featured);
      },

      getCharitiesByCategory: (category: CharityCategory) => {
        return get().charities.filter(charity => charity.category === category);
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
