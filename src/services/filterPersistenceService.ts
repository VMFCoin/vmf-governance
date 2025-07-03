import {
  useUserStore,
  FilterState,
  SavedFilterConfiguration,
  type SortOption,
  type FilterOption,
  type ProposalTypeFilter,
} from '@/stores/useUserStore';

export class FilterPersistenceService {
  private static instance: FilterPersistenceService;
  private userStore = useUserStore;

  private constructor() {}

  static getInstance(): FilterPersistenceService {
    if (!FilterPersistenceService.instance) {
      FilterPersistenceService.instance = new FilterPersistenceService();
    }
    return FilterPersistenceService.instance;
  }

  // Core filter state management
  saveCurrentFilters(filters: FilterState): void {
    this.userStore.getState().addRecentFilter(filters);
    this.userStore.getState().trackFilterUsage(filters);
  }

  loadDefaultFilters(): FilterState {
    return this.userStore.getState().getDefaultFilters();
  }

  // Filter configuration management
  saveFilterConfiguration(name: string, filters: FilterState): string {
    this.userStore.getState().saveFilterConfiguration(name, filters);

    // Return the ID of the newly created configuration
    const configurations = this.userStore
      .getState()
      .getSavedFilterConfigurations();
    return configurations[configurations.length - 1].id;
  }

  deleteFilterConfiguration(id: string): void {
    this.userStore.getState().deleteFilterConfiguration(id);
  }

  updateFilterConfiguration(
    id: string,
    updates: Partial<SavedFilterConfiguration>
  ): void {
    this.userStore.getState().updateFilterConfiguration(id, updates);
  }

  loadFilterConfiguration(id: string): FilterState | null {
    const config = this.userStore.getState().getFilterConfiguration(id);
    if (config) {
      // Update usage statistics
      this.userStore.getState().updateFilterConfiguration(id, {
        usageCount: config.usageCount + 1,
        lastUsed: new Date(),
      });

      return config.filters;
    }
    return null;
  }

  getSavedConfigurations(): SavedFilterConfiguration[] {
    return this.userStore.getState().getSavedFilterConfigurations();
  }

  // Recent filters management
  getRecentFilters(): FilterState[] {
    return this.userStore.getState().getRecentFilters();
  }

  // Search history management
  addSearchToHistory(term: string, resultsCount: number): void {
    if (term.trim()) {
      this.userStore.getState().addSearchToHistory(term, resultsCount);
    }
  }

  getSearchHistory(): Array<{
    term: string;
    timestamp: Date;
    resultsCount: number;
  }> {
    return this.userStore.getState().getFilterAnalytics().searchHistory;
  }

  // Analytics and insights
  getFilterAnalytics() {
    return this.userStore.getState().getFilterAnalytics();
  }

  getMostUsedFilters(): {
    sort: SortOption;
    status: FilterOption;
    type: ProposalTypeFilter;
  } {
    const analytics = this.getFilterAnalytics();

    const mostUsedSort =
      (Object.entries(analytics.mostUsedSort).sort(
        ([, a], [, b]) => b - a
      )[0]?.[0] as SortOption) || 'newest';

    const mostUsedStatus =
      (Object.entries(analytics.mostUsedStatus).sort(
        ([, a], [, b]) => b - a
      )[0]?.[0] as FilterOption) || 'all';

    const mostUsedType =
      (Object.entries(analytics.mostUsedType).sort(
        ([, a], [, b]) => b - a
      )[0]?.[0] as ProposalTypeFilter) || 'all';

    return {
      sort: mostUsedSort,
      status: mostUsedStatus,
      type: mostUsedType,
    };
  }

  // Smart suggestions
  getSmartFilterSuggestions(currentFilters: FilterState): FilterState[] {
    return this.userStore.getState().getSmartFilterSuggestions(currentFilters);
  }

  // Default preferences management
  updateDefaultFilters(defaults: {
    defaultSort?: SortOption;
    defaultStatus?: FilterOption;
    defaultType?: ProposalTypeFilter;
    persistSearchTerms?: boolean;
  }): void {
    this.userStore.getState().updateFilterDefaults(defaults);
  }

  getDefaultPreferences() {
    const prefs = this.userStore.getState().preferences?.filters;

    // Return fallback values if preferences.filters is not initialized
    if (!prefs) {
      return {
        defaultSort: 'newest' as SortOption,
        defaultStatus: 'all' as FilterOption,
        defaultType: 'all' as ProposalTypeFilter,
        persistSearchTerms: true,
      };
    }

    return {
      defaultSort: prefs.defaultSort,
      defaultStatus: prefs.defaultStatus,
      defaultType: prefs.defaultType,
      persistSearchTerms: prefs.persistSearchTerms,
    };
  }

  // Cross-session persistence utilities
  shouldPersistSearchTerm(): boolean {
    return (
      this.userStore.getState().preferences?.filters?.persistSearchTerms ||
      false
    );
  }

  // Filter validation and sanitization
  validateFilterState(filters: Partial<FilterState>): FilterState {
    const defaults = this.loadDefaultFilters();

    return {
      searchTerm: filters.searchTerm || defaults.searchTerm,
      sortBy: this.isValidSortOption(filters.sortBy)
        ? filters.sortBy
        : defaults.sortBy,
      filterBy: this.isValidFilterOption(filters.filterBy)
        ? filters.filterBy
        : defaults.filterBy,
      proposalTypeFilter: this.isValidProposalTypeFilter(
        filters.proposalTypeFilter
      )
        ? filters.proposalTypeFilter
        : defaults.proposalTypeFilter,
    };
  }

  private isValidSortOption(value: any): value is SortOption {
    return ['newest', 'oldest', 'mostVotes', 'timeLeft'].includes(value);
  }

  private isValidFilterOption(value: any): value is FilterOption {
    return ['all', 'active', 'passed', 'failed', 'pending'].includes(value);
  }

  private isValidProposalTypeFilter(value: any): value is ProposalTypeFilter {
    return [
      'all',
      'holiday_charity',
      'charity_directory',
      'platform_feature',
      'legacy',
    ].includes(value);
  }

  // Bulk operations
  exportFilterConfigurations(): string {
    const configurations = this.getSavedConfigurations();
    return JSON.stringify(configurations, null, 2);
  }

  importFilterConfigurations(jsonData: string): {
    success: boolean;
    imported: number;
    errors: string[];
  } {
    try {
      const configurations = JSON.parse(jsonData) as SavedFilterConfiguration[];
      const errors: string[] = [];
      let imported = 0;

      configurations.forEach((config, index) => {
        try {
          // Validate configuration structure
          if (!config.name || !config.filters) {
            errors.push(`Configuration ${index + 1}: Missing required fields`);
            return;
          }

          // Validate filters
          const validatedFilters = this.validateFilterState(config.filters);

          // Save configuration
          this.saveFilterConfiguration(config.name, validatedFilters);
          imported++;
        } catch (error) {
          errors.push(
            `Configuration ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      });

      return {
        success: errors.length === 0,
        imported,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [
          error instanceof Error ? error.message : 'Invalid JSON format',
        ],
      };
    }
  }

  // Performance optimization
  clearOldAnalytics(daysToKeep: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const analytics = this.getFilterAnalytics();
    const filteredHistory = analytics.searchHistory.filter(
      item => new Date(item.timestamp) > cutoffDate
    );

    // Update the analytics with filtered history
    this.userStore.setState(state => ({
      preferences: {
        ...state.preferences,
        filters: {
          ...state.preferences.filters,
          analytics: {
            ...(state.preferences?.filters?.analytics || {
              mostUsedSort: {},
              mostUsedStatus: {},
              mostUsedType: {},
              searchHistory: [],
            }),
            searchHistory: filteredHistory,
          },
        },
      },
    }));
  }
}

// Export singleton instance
export const filterPersistenceService = FilterPersistenceService.getInstance();
