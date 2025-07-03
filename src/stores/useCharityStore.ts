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

  // Pagination
  currentPage: number;
  totalCount: number;
  hasMore: boolean;
  isLoadingMore: boolean;

  // UI State
  selectedCharity: Charity | null;
  isSubmitting: boolean;
  searchQuery: string;
  categoryFilter: CharityCategory | 'all';
  verificationFilter: 'all' | 'verified' | 'pending' | 'rejected';
  sortBy: 'name' | 'established' | 'impact';

  // Actions
  fetchCharities: (reset?: boolean) => Promise<void>;
  loadMoreCharities: () => Promise<void>;
  searchCharities: (query: string) => Promise<void>;
  addCharity: (charity: {
    name: string;
    description: string;
    website_url: string;
    logo_url: string;
    contact_email: string;
    charity_address?: string;
  }) => Promise<Charity>;
  updateCharity: (
    id: string,
    updates: {
      name?: string;
      description?: string;
      website_url?: string;
      logo_url?: string;
      contact_email?: string;
      charity_address?: string;
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
  resetFilters: () => void;

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
      currentPage: 1,
      totalCount: 0,
      hasMore: true,
      isLoadingMore: false,
      selectedCharity: null,
      isSubmitting: false,
      searchQuery: '',
      categoryFilter: 'all',
      verificationFilter: 'all',
      sortBy: 'name',

      // Actions - Updated to use Supabase with pagination
      fetchCharities: async (reset = true) => {
        const state = get();
        const page = reset ? 1 : state.currentPage;

        set({
          isLoading: reset,
          isLoadingMore: !reset,
          error: null,
        });

        try {
          const result = await charityService.getAllCharities(page, 20);

          set(prevState => ({
            charities: reset
              ? result.charities
              : [...prevState.charities, ...result.charities],
            totalCount: result.totalCount,
            hasMore: result.hasMore,
            currentPage: page,
            isLoading: false,
            isLoadingMore: false,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch charities',
            isLoading: false,
            isLoadingMore: false,
          });
        }
      },

      loadMoreCharities: async () => {
        const state = get();
        if (!state.hasMore || state.isLoadingMore) return;

        const nextPage = state.currentPage + 1;
        set({ currentPage: nextPage });
        await get().fetchCharities(false);
      },

      searchCharities: async (query: string) => {
        set({ isLoading: true, error: null, searchQuery: query });

        try {
          if (query.trim()) {
            const result = await charityService.searchCharities(query, 1, 20);
            set({
              charities: result.charities,
              totalCount: result.totalCount,
              hasMore: result.hasMore,
              currentPage: 1,
              isLoading: false,
            });
          } else {
            await get().fetchCharities(true);
          }
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to search charities',
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
            totalCount: state.totalCount + 1,
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
            totalCount: Math.max(0, state.totalCount - 1),
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
          await get().addCharity({
            name: charityData.name,
            description: charityData.description,
            website_url: charityData.website,
            logo_url: '/images/charities/default-charity.svg',
            contact_email: charityData.contactEmail,
            charity_address: `${charityData.address.street}, ${charityData.address.city}, ${charityData.address.state}`,
          });

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
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
        get().searchCharities(query);
      },

      setCategoryFilter: (category: CharityCategory | 'all') =>
        set({ categoryFilter: category }),
      setVerificationFilter: (
        filter: 'all' | 'verified' | 'pending' | 'rejected'
      ) => set({ verificationFilter: filter }),
      setSortBy: (sort: 'name' | 'established' | 'impact') =>
        set({ sortBy: sort }),
      clearError: () => set({ error: null }),

      resetFilters: () => {
        set({
          searchQuery: '',
          categoryFilter: 'all',
          verificationFilter: 'all',
          sortBy: 'name',
        });
        get().fetchCharities(true);
      },

      // Computed getters (client-side filtering for non-search filters)
      getFilteredCharities: () => {
        const { charities, categoryFilter, verificationFilter, sortBy } = get();

        let filtered = charities;

        // Category filter
        if (categoryFilter !== 'all') {
          filtered = filtered.filter(
            charity => charity.category === categoryFilter
          );
        }

        // Verification filter
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
        pendingSubmissions: state.pendingSubmissions,
        categoryFilter: state.categoryFilter,
        verificationFilter: state.verificationFilter,
        sortBy: state.sortBy,
      }),
    }
  )
);
