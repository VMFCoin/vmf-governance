'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Notification } from '@/types';

// Filter-related types for user preferences
export type SortOption = 'newest' | 'oldest' | 'mostVotes' | 'timeLeft';
export type FilterOption = 'all' | 'active' | 'passed' | 'failed' | 'pending';
export type ProposalTypeFilter =
  | 'all'
  | 'holiday_charity'
  | 'charity_directory'
  | 'platform_feature'
  | 'legacy';

export interface FilterState {
  searchTerm: string;
  sortBy: SortOption;
  filterBy: FilterOption;
  proposalTypeFilter: ProposalTypeFilter;
}

export interface SavedFilterConfiguration {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: Date;
  usageCount: number;
  lastUsed: Date;
}

export interface FilterAnalytics {
  mostUsedSort: Record<SortOption, number>;
  mostUsedStatus: Record<FilterOption, number>;
  mostUsedType: Record<ProposalTypeFilter, number>;
  searchHistory: Array<{
    term: string;
    timestamp: Date;
    resultsCount: number;
  }>;
}

export interface UserPreferences {
  theme: 'patriotic' | 'dark' | 'light';
  notifications: {
    email: boolean;
    push: boolean;
    voteReminders: boolean;
    newProposals: boolean;
    communityUpdates: boolean;
  };
  privacy: {
    showVotingHistory: boolean;
    showProfile: boolean;
    allowDirectMessages: boolean;
  };
  display: {
    compactMode: boolean;
    showAnimations: boolean;
    autoPlayVideos: boolean;
  };
  filters: {
    // Default filter preferences
    defaultSort: SortOption;
    defaultStatus: FilterOption;
    defaultType: ProposalTypeFilter;
    persistSearchTerms: boolean;

    // Saved filter configurations
    savedConfigurations: SavedFilterConfiguration[];

    // Recent filter combinations (last 10)
    recentFilters: Array<{
      filters: FilterState;
      timestamp: Date;
    }>;

    // Filter usage analytics
    analytics: FilterAnalytics;
  };
}

export interface UserState {
  // User data
  userId: string | null;
  preferences: UserPreferences;
  notifications: Notification[];

  // Voting history
  votingHistory: Array<{
    proposalId: string;
    proposalTitle: string;
    vote: 'yes' | 'no' | 'abstain';
    timestamp: Date;
    votingPower: number;
  }>;

  // Community activity
  communityActivity: Array<{
    type: 'post_created' | 'post_upvoted' | 'post_downvoted' | 'comment_added';
    postId: string;
    timestamp: Date;
  }>;

  // UI State
  hasSeenWelcome: boolean;
  lastActiveTab: string;

  // Actions
  setUserId: (id: string | null) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  addNotification: (notification: {
    type: Notification['type'];
    title: string;
    message: string;
    actionUrl?: string;
  }) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  addVotingRecord: (record: {
    proposalId: string;
    proposalTitle: string;
    vote: 'yes' | 'no' | 'abstain';
    votingPower: number;
  }) => void;
  addCommunityActivity: (activity: {
    type: 'post_created' | 'post_upvoted' | 'post_downvoted' | 'comment_added';
    postId: string;
  }) => void;
  setHasSeenWelcome: (seen: boolean) => void;
  setLastActiveTab: (tab: string) => void;

  // Filter preference actions
  saveFilterConfiguration: (name: string, filters: FilterState) => void;
  deleteFilterConfiguration: (id: string) => void;
  updateFilterConfiguration: (
    id: string,
    updates: Partial<SavedFilterConfiguration>
  ) => void;
  addRecentFilter: (filters: FilterState) => void;
  trackFilterUsage: (filters: FilterState) => void;
  addSearchToHistory: (term: string, resultsCount: number) => void;
  updateFilterDefaults: (defaults: {
    defaultSort?: SortOption;
    defaultStatus?: FilterOption;
    defaultType?: ProposalTypeFilter;
    persistSearchTerms?: boolean;
  }) => void;

  // Computed getters
  getUnreadNotifications: () => Notification[];
  getRecentVotingHistory: (limit?: number) => UserState['votingHistory'];
  getVotingStats: () => {
    totalVotes: number;
    yesVotes: number;
    noVotes: number;
    abstainVotes: number;
    totalVotingPower: number;
  };

  // Filter preference getters
  getSavedFilterConfigurations: () => SavedFilterConfiguration[];
  getFilterConfiguration: (id: string) => SavedFilterConfiguration | null;
  getRecentFilters: () => FilterState[];
  getFilterAnalytics: () => FilterAnalytics;
  getDefaultFilters: () => FilterState;
  getSmartFilterSuggestions: (currentFilters: FilterState) => FilterState[];
}

const defaultPreferences: UserPreferences = {
  theme: 'patriotic',
  notifications: {
    email: true,
    push: true,
    voteReminders: true,
    newProposals: true,
    communityUpdates: false,
  },
  privacy: {
    showVotingHistory: true,
    showProfile: true,
    allowDirectMessages: true,
  },
  display: {
    compactMode: false,
    showAnimations: true,
    autoPlayVideos: false,
  },
  filters: {
    defaultSort: 'newest',
    defaultStatus: 'all',
    defaultType: 'all',
    persistSearchTerms: true,
    savedConfigurations: [],
    recentFilters: [],
    analytics: {
      mostUsedSort: {
        newest: 0,
        oldest: 0,
        mostVotes: 0,
        timeLeft: 0,
      },
      mostUsedStatus: {
        all: 0,
        active: 0,
        passed: 0,
        failed: 0,
        pending: 0,
      },
      mostUsedType: {
        all: 0,
        holiday_charity: 0,
        charity_directory: 0,
        platform_feature: 0,
        legacy: 0,
      },
      searchHistory: [],
    },
  },
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      userId: null,
      preferences: defaultPreferences,
      notifications: [],
      votingHistory: [],
      communityActivity: [],
      hasSeenWelcome: false,
      lastActiveTab: 'vote',

      // Actions
      setUserId: id => set({ userId: id }),

      updatePreferences: updates => {
        set(state => ({
          preferences: { ...state.preferences, ...updates },
        }));
      },

      addNotification: notification => {
        const newNotification: Notification = {
          ...notification,
          id: `notification-${Date.now()}`,
          userId: get().userId || 'anonymous',
          isRead: false,
          createdAt: new Date(),
        };

        set(state => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep only 50 most recent
        }));
      },

      markNotificationRead: id => {
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }));
      },

      clearAllNotifications: () => {
        set({ notifications: [] });
      },

      addVotingRecord: record => {
        const votingRecord = {
          ...record,
          timestamp: new Date(),
        };

        set(state => ({
          votingHistory: [votingRecord, ...state.votingHistory].slice(0, 100), // Keep only 100 most recent
        }));

        // Add notification for successful vote
        get().addNotification({
          type: 'vote_reminder',
          title: 'Vote Recorded',
          message: `Your ${record.vote} vote on "${record.proposalTitle}" has been recorded.`,
          actionUrl: `/proposal/${record.proposalId}`,
        });
      },

      addCommunityActivity: activity => {
        const activityRecord = {
          ...activity,
          timestamp: new Date(),
        };

        set(state => ({
          communityActivity: [activityRecord, ...state.communityActivity].slice(
            0,
            100
          ),
        }));
      },

      setHasSeenWelcome: seen => set({ hasSeenWelcome: seen }),
      setLastActiveTab: tab => set({ lastActiveTab: tab }),

      // Filter preference actions
      saveFilterConfiguration: (name, filters) => {
        set(state => ({
          preferences: {
            ...state.preferences,
            filters: {
              ...state.preferences.filters,
              savedConfigurations: [
                ...(state.preferences?.filters?.savedConfigurations || []),
                {
                  id: `filter-${Date.now()}`,
                  name,
                  filters,
                  createdAt: new Date(),
                  usageCount: 0,
                  lastUsed: new Date(),
                },
              ],
            },
          },
        }));
      },

      deleteFilterConfiguration: id => {
        set(state => ({
          preferences: {
            ...state.preferences,
            filters: {
              ...state.preferences.filters,
              savedConfigurations: (
                state.preferences?.filters?.savedConfigurations || []
              ).filter(f => f.id !== id),
            },
          },
        }));
      },

      updateFilterConfiguration: (id, updates) => {
        set(state => ({
          preferences: {
            ...state.preferences,
            filters: {
              ...state.preferences.filters,
              savedConfigurations: (
                state.preferences?.filters?.savedConfigurations || []
              ).map(f => (f.id === id ? { ...f, ...updates } : f)),
            },
          },
        }));
      },

      addRecentFilter: filters => {
        set(state => ({
          preferences: {
            ...state.preferences,
            filters: {
              ...state.preferences.filters,
              recentFilters: [
                ...(state.preferences?.filters?.recentFilters || []).slice(
                  0,
                  9
                ),
                {
                  filters,
                  timestamp: new Date(),
                },
              ],
            },
          },
        }));
      },

      trackFilterUsage: filters => {
        set(state => {
          const currentAnalytics = state.preferences?.filters?.analytics || {
            mostUsedSort: {},
            mostUsedStatus: {},
            mostUsedType: {},
            searchHistory: [],
          };

          return {
            preferences: {
              ...state.preferences,
              filters: {
                ...state.preferences.filters,
                analytics: {
                  ...currentAnalytics,
                  mostUsedStatus: {
                    ...currentAnalytics.mostUsedStatus,
                    [filters.filterBy]:
                      (currentAnalytics.mostUsedStatus[filters.filterBy] || 0) +
                      1,
                  },
                },
              },
            },
          };
        });
      },

      addSearchToHistory: (term, resultsCount) => {
        set(state => {
          const currentAnalytics = state.preferences?.filters?.analytics || {
            mostUsedSort: {},
            mostUsedStatus: {},
            mostUsedType: {},
            searchHistory: [],
          };

          return {
            preferences: {
              ...state.preferences,
              filters: {
                ...state.preferences.filters,
                analytics: {
                  ...currentAnalytics,
                  searchHistory: [
                    ...currentAnalytics.searchHistory.slice(0, 9),
                    {
                      term,
                      timestamp: new Date(),
                      resultsCount,
                    },
                  ],
                },
              },
            },
          };
        });
      },

      updateFilterDefaults: defaults => {
        set(state => {
          const currentFilters = state.preferences?.filters || {
            defaultSort: 'newest' as SortOption,
            defaultStatus: 'all' as FilterOption,
            defaultType: 'all' as ProposalTypeFilter,
            persistSearchTerms: false,
            savedConfigurations: [],
            recentFilters: [],
            analytics: {
              mostUsedSort: {},
              mostUsedStatus: {},
              mostUsedType: {},
              searchHistory: [],
            },
          };

          return {
            preferences: {
              ...state.preferences,
              filters: {
                ...currentFilters,
                defaultSort: defaults.defaultSort || currentFilters.defaultSort,
                defaultStatus:
                  defaults.defaultStatus || currentFilters.defaultStatus,
                defaultType: defaults.defaultType || currentFilters.defaultType,
                persistSearchTerms:
                  defaults.persistSearchTerms ??
                  currentFilters.persistSearchTerms,
              },
            },
          };
        });
      },

      // Computed getters
      getUnreadNotifications: () => {
        return get().notifications.filter(n => !n.isRead);
      },

      getRecentVotingHistory: (limit = 10) => {
        return get().votingHistory.slice(0, limit);
      },

      getVotingStats: () => {
        const history = get().votingHistory;

        const stats = history.reduce(
          (acc, record) => {
            acc.totalVotes++;
            acc.totalVotingPower += record.votingPower;

            switch (record.vote) {
              case 'yes':
                acc.yesVotes++;
                break;
              case 'no':
                acc.noVotes++;
                break;
              case 'abstain':
                acc.abstainVotes++;
                break;
            }

            return acc;
          },
          {
            totalVotes: 0,
            yesVotes: 0,
            noVotes: 0,
            abstainVotes: 0,
            totalVotingPower: 0,
          }
        );

        return stats;
      },

      // Filter preference getters
      getSavedFilterConfigurations: () => {
        const state = get();
        return state.preferences?.filters?.savedConfigurations || [];
      },

      getFilterConfiguration: id => {
        const state = get();
        const configurations =
          state.preferences?.filters?.savedConfigurations || [];
        return configurations.find(f => f.id === id) || null;
      },

      getRecentFilters: () => {
        const state = get();
        const recentFilters = state.preferences?.filters?.recentFilters || [];
        return recentFilters.map(f => f.filters);
      },

      getFilterAnalytics: () => {
        const state = get();
        return (
          state.preferences?.filters?.analytics || {
            mostUsedSort: {
              newest: 0,
              oldest: 0,
              mostVotes: 0,
              timeLeft: 0,
            },
            mostUsedStatus: {
              all: 0,
              active: 0,
              passed: 0,
              failed: 0,
              pending: 0,
            },
            mostUsedType: {
              all: 0,
              holiday_charity: 0,
              charity_directory: 0,
              platform_feature: 0,
              legacy: 0,
            },
            searchHistory: [],
          }
        );
      },

      getDefaultFilters: () => {
        const state = get();
        const filters = state.preferences?.filters;

        return {
          searchTerm: '',
          sortBy: filters?.defaultSort || 'newest',
          filterBy: filters?.defaultStatus || 'all',
          proposalTypeFilter: filters?.defaultType || 'all',
        };
      },

      getSmartFilterSuggestions: currentFilters => {
        const state = get();
        const analytics = state.preferences?.filters?.analytics;
        const suggestions: FilterState[] = [];

        // Return empty suggestions if analytics is not available
        if (!analytics) {
          return suggestions;
        }

        // Generate suggestions based on usage patterns
        const mostUsedSort = Object.entries(analytics.mostUsedSort).sort(
          ([, a], [, b]) => b - a
        )[0]?.[0] as SortOption;
        const mostUsedStatus = Object.entries(analytics.mostUsedStatus).sort(
          ([, a], [, b]) => b - a
        )[0]?.[0] as FilterOption;
        const mostUsedType = Object.entries(analytics.mostUsedType).sort(
          ([, a], [, b]) => b - a
        )[0]?.[0] as ProposalTypeFilter;

        // Suggest most used combination
        if (mostUsedSort && mostUsedStatus && mostUsedType) {
          suggestions.push({
            searchTerm: '',
            sortBy: mostUsedSort,
            filterBy: mostUsedStatus,
            proposalTypeFilter: mostUsedType,
          });
        }

        // Suggest recent popular searches
        const recentSearches = analytics.searchHistory
          .filter(h => h.resultsCount > 0)
          .slice(0, 3);

        recentSearches.forEach(search => {
          suggestions.push({
            searchTerm: search.term,
            sortBy: currentFilters.sortBy,
            filterBy: currentFilters.filterBy,
            proposalTypeFilter: currentFilters.proposalTypeFilter,
          });
        });

        return suggestions;
      },
    }),
    {
      name: 'vmf-user-storage',
      partialize: state => ({
        userId: state.userId,
        preferences: state.preferences,
        notifications: state.notifications,
        votingHistory: state.votingHistory,
        communityActivity: state.communityActivity,
        hasSeenWelcome: state.hasSeenWelcome,
        lastActiveTab: state.lastActiveTab,
      }),
    }
  )
);
