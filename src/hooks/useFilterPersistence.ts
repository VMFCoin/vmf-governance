import { useState, useEffect, useCallback } from 'react';
import { filterPersistenceService } from '@/services/filterPersistenceService';
import { FilterState, SavedFilterConfiguration } from '@/stores/useUserStore';

export interface UseFilterPersistenceReturn {
  // Current filter state
  filters: FilterState;
  setFilters: (filters: FilterState) => void;

  // Saved configurations
  savedConfigurations: SavedFilterConfiguration[];
  saveConfiguration: (name: string) => Promise<string>;
  loadConfiguration: (id: string) => Promise<void>;
  deleteConfiguration: (id: string) => Promise<void>;
  updateConfiguration: (
    id: string,
    updates: Partial<SavedFilterConfiguration>
  ) => Promise<void>;

  // Recent filters
  recentFilters: FilterState[];

  // Search history
  searchHistory: Array<{ term: string; timestamp: Date; resultsCount: number }>;
  addSearchToHistory: (term: string, resultsCount: number) => void;

  // Analytics
  analytics: ReturnType<typeof filterPersistenceService.getFilterAnalytics>;
  mostUsedFilters: ReturnType<
    typeof filterPersistenceService.getMostUsedFilters
  >;

  // Smart suggestions
  smartSuggestions: FilterState[];

  // Default preferences
  defaultPreferences: ReturnType<
    typeof filterPersistenceService.getDefaultPreferences
  >;
  updateDefaultPreferences: (
    defaults: Parameters<
      typeof filterPersistenceService.updateDefaultFilters
    >[0]
  ) => void;

  // Utilities
  resetToDefaults: () => void;
  clearAllFilters: () => void;
  exportConfigurations: () => string;
  importConfigurations: (
    jsonData: string
  ) => Promise<{ success: boolean; imported: number; errors: string[] }>;
}

export function useFilterPersistence(
  initialFilters?: Partial<FilterState>
): UseFilterPersistenceReturn {
  // Initialize filters with defaults or provided initial filters
  const [filters, setFiltersState] = useState<FilterState>(() => {
    const defaultFilters = filterPersistenceService.loadDefaultFilters();
    if (initialFilters) {
      return filterPersistenceService.validateFilterState({
        ...defaultFilters,
        ...initialFilters,
      });
    }
    return defaultFilters;
  });

  // Saved configurations state
  const [savedConfigurations, setSavedConfigurations] = useState<
    SavedFilterConfiguration[]
  >([]);

  // Recent filters state
  const [recentFilters, setRecentFilters] = useState<FilterState[]>([]);

  // Search history state
  const [searchHistory, setSearchHistory] = useState<
    Array<{ term: string; timestamp: Date; resultsCount: number }>
  >([]);

  // Analytics state
  const [analytics, setAnalytics] = useState(
    filterPersistenceService.getFilterAnalytics()
  );
  const [mostUsedFilters, setMostUsedFilters] = useState(
    filterPersistenceService.getMostUsedFilters()
  );

  // Smart suggestions state
  const [smartSuggestions, setSmartSuggestions] = useState<FilterState[]>([]);

  // Default preferences state
  const [defaultPreferences, setDefaultPreferences] = useState(
    filterPersistenceService.getDefaultPreferences()
  );

  // Load initial data
  useEffect(() => {
    refreshData();
  }, []);

  // Update smart suggestions when filters change
  useEffect(() => {
    const suggestions =
      filterPersistenceService.getSmartFilterSuggestions(filters);
    setSmartSuggestions(suggestions);
  }, [filters]);

  // Refresh all data from the service
  const refreshData = useCallback(() => {
    setSavedConfigurations(filterPersistenceService.getSavedConfigurations());
    setRecentFilters(filterPersistenceService.getRecentFilters());
    setSearchHistory(filterPersistenceService.getSearchHistory());
    setAnalytics(filterPersistenceService.getFilterAnalytics());
    setMostUsedFilters(filterPersistenceService.getMostUsedFilters());
    setDefaultPreferences(filterPersistenceService.getDefaultPreferences());
  }, []);

  // Set filters with persistence
  const setFilters = useCallback(
    (newFilters: FilterState) => {
      const validatedFilters =
        filterPersistenceService.validateFilterState(newFilters);
      setFiltersState(validatedFilters);
      filterPersistenceService.saveCurrentFilters(validatedFilters);
      refreshData(); // Refresh to get updated analytics
    },
    [refreshData]
  );

  // Save configuration
  const saveConfiguration = useCallback(
    async (name: string): Promise<string> => {
      try {
        const id = filterPersistenceService.saveFilterConfiguration(
          name,
          filters
        );
        refreshData();
        return id;
      } catch (error) {
        throw new Error(
          `Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    },
    [filters, refreshData]
  );

  // Load configuration
  const loadConfiguration = useCallback(
    async (id: string): Promise<void> => {
      try {
        const configFilters =
          filterPersistenceService.loadFilterConfiguration(id);
        if (configFilters) {
          setFiltersState(configFilters);
          refreshData();
        } else {
          throw new Error('Configuration not found');
        }
      } catch (error) {
        throw new Error(
          `Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    },
    [refreshData]
  );

  // Delete configuration
  const deleteConfiguration = useCallback(
    async (id: string): Promise<void> => {
      try {
        filterPersistenceService.deleteFilterConfiguration(id);
        refreshData();
      } catch (error) {
        throw new Error(
          `Failed to delete configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    },
    [refreshData]
  );

  // Update configuration
  const updateConfiguration = useCallback(
    async (
      id: string,
      updates: Partial<SavedFilterConfiguration>
    ): Promise<void> => {
      try {
        filterPersistenceService.updateFilterConfiguration(id, updates);
        refreshData();
      } catch (error) {
        throw new Error(
          `Failed to update configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    },
    [refreshData]
  );

  // Add search to history
  const addSearchToHistory = useCallback(
    (term: string, resultsCount: number) => {
      filterPersistenceService.addSearchToHistory(term, resultsCount);
      refreshData();
    },
    [refreshData]
  );

  // Update default preferences
  const updateDefaultPreferences = useCallback(
    (
      defaults: Parameters<
        typeof filterPersistenceService.updateDefaultFilters
      >[0]
    ) => {
      filterPersistenceService.updateDefaultFilters(defaults);
      refreshData();
    },
    [refreshData]
  );

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    const defaultFilters = filterPersistenceService.loadDefaultFilters();
    setFiltersState(defaultFilters);
    filterPersistenceService.saveCurrentFilters(defaultFilters);
    refreshData();
  }, [refreshData]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const clearedFilters: FilterState = {
      searchTerm: '',
      sortBy: filters.sortBy,
      filterBy: 'all',
      proposalTypeFilter: 'all',
    };
    setFiltersState(clearedFilters);
    filterPersistenceService.saveCurrentFilters(clearedFilters);
    refreshData();
  }, [filters.sortBy, refreshData]);

  // Export configurations
  const exportConfigurations = useCallback(() => {
    return filterPersistenceService.exportFilterConfigurations();
  }, []);

  // Import configurations
  const importConfigurations = useCallback(
    async (jsonData: string) => {
      try {
        const result =
          filterPersistenceService.importFilterConfigurations(jsonData);
        refreshData();
        return result;
      } catch (error) {
        return {
          success: false,
          imported: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },
    [refreshData]
  );

  return {
    // Current filter state
    filters,
    setFilters,

    // Saved configurations
    savedConfigurations,
    saveConfiguration,
    loadConfiguration,
    deleteConfiguration,
    updateConfiguration,

    // Recent filters
    recentFilters,

    // Search history
    searchHistory,
    addSearchToHistory,

    // Analytics
    analytics,
    mostUsedFilters,

    // Smart suggestions
    smartSuggestions,

    // Default preferences
    defaultPreferences,
    updateDefaultPreferences,

    // Utilities
    resetToDefaults,
    clearAllFilters,
    exportConfigurations,
    importConfigurations,
  };
}
