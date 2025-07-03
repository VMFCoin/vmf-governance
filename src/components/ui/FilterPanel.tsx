'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  Calendar,
  Clock,
  TrendingUp,
  BarChart3,
  Heart,
  Building,
  Code,
  CheckCircle,
  XCircle,
  AlertCircle,
  Timer,
  X,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Archive,
  Zap,
  Star,
  History,
  Save,
  Bookmark,
  BookmarkPlus,
  Trash2,
  Edit3,
  Download,
  Upload,
  Settings,
  Brain,
  Clock3,
} from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { cn } from '@/lib/utils';
import { useFilterPersistence } from '@/hooks/useFilterPersistence';

// Re-export types from the user store for compatibility
export type {
  SortOption,
  FilterOption,
  ProposalTypeFilter,
  FilterState,
} from '@/stores/useUserStore';

// Import types for local use
import type {
  SortOption,
  FilterOption,
  ProposalTypeFilter,
  FilterState,
} from '@/stores/useUserStore';

export interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  statusCounts: Record<FilterOption, number>;
  className?: string;
  // New props for persistence features
  enablePersistence?: boolean;
  showAnalytics?: boolean;
}

const statusOptions = [
  { value: 'all' as FilterOption, label: 'All Status', count: 0 },
  { value: 'active' as FilterOption, label: 'Active', count: 0 },
  { value: 'passed' as FilterOption, label: 'Passed', count: 0 },
  { value: 'failed' as FilterOption, label: 'Failed', count: 0 },
  { value: 'pending' as FilterOption, label: 'Pending', count: 0 },
];

// Quick filter presets
const quickPresets = [
  {
    name: 'Ending Soon',
    icon: <Clock className="w-4 h-4" />,
    filters: {
      sortBy: 'timeLeft' as SortOption,
      filterBy: 'active' as FilterOption,
    },
  },
  {
    name: 'Most Voted',
    icon: <TrendingUp className="w-4 h-4" />,
    filters: {
      sortBy: 'mostVotes' as SortOption,
      filterBy: 'all' as FilterOption,
    },
  },
  {
    name: 'Holiday Only',
    icon: <Heart className="w-4 h-4" />,
    filters: { proposalTypeFilter: 'holiday_charity' as ProposalTypeFilter },
  },
  {
    name: 'Recent',
    icon: <Star className="w-4 h-4" />,
    filters: { sortBy: 'newest' as SortOption },
  },
];

export function FilterPanel({
  filters,
  onFiltersChange,
  onClearFilters,
  statusCounts,
  className,
  enablePersistence = true,
  showAnalytics = false,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [saveConfigName, setSaveConfigName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use filter persistence hook if enabled
  const filterPersistence = useFilterPersistence(
    enablePersistence ? filters : undefined
  );

  // Click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);

  const hasActiveFilters = filters.searchTerm || filters.filterBy !== 'all';

  const updateFilters = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates };
    onFiltersChange(newFilters);

    // Update persistence if enabled
    if (enablePersistence) {
      filterPersistence.setFilters(newFilters);
    }
  };

  // Save current filter configuration
  const handleSaveConfiguration = async () => {
    if (!saveConfigName.trim()) return;

    try {
      await filterPersistence.saveConfiguration(saveConfigName);
      setSaveConfigName('');
      setShowSaveModal(false);
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  };

  // Load saved configuration
  const handleLoadConfiguration = async (id: string) => {
    try {
      await filterPersistence.loadConfiguration(id);
      // The filters will be updated through the persistence hook
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  };

  // Apply smart suggestion
  const applySmartSuggestion = (suggestion: FilterState) => {
    onFiltersChange(suggestion);
    if (enablePersistence) {
      filterPersistence.setFilters(suggestion);
    }
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  // Apply preset function
  const applyPreset = (preset: (typeof quickPresets)[0]) => {
    updateFilters({
      ...filters,
      ...preset.filters,
    });
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Filter Button */}
      <Button
        onClick={handleToggle}
        variant="ghost"
        size="sm"
        className="flex items-center gap-1 sm:gap-2 text-patriotWhite hover:text-patriotRed hover:bg-patriotRed/10 h-11 sm:h-12 px-3 sm:px-6 rounded-xl border border-patriotBlue/30 bg-backgroundLight text-sm sm:text-base"
      >
        {/* <Filter className="w-4 h-4" /> */}
        <span className="font-medium">Filters</span>
        {hasActiveFilters && (
          <div className="w-2 h-2 bg-patriotRed rounded-full ml-1" />
        )}
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </Button>

      {/* Expandable Filter Dropdown */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 w-[90vw] max-w-[600px] sm:w-[600px] bg-backgroundDark border border-patriotBlue/30 rounded-xl shadow-2xl z-50"
          >
            <div className="p-6">
              {/* Header with persistence controls */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-patriotWhite">
                  Filter Options
                </h3>
                <div className="flex items-center gap-2">
                  {/* Persistence Controls */}
                  {enablePersistence && (
                    <>
                      <Button
                        onClick={() => setShowSaveModal(true)}
                        variant="ghost"
                        size="sm"
                        className="text-textSecondary hover:text-patriotWhite hover:bg-patriotBlue/10 h-8 w-8 p-0 rounded-lg"
                        disabled={!hasActiveFilters}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => setShowManageModal(true)}
                        variant="ghost"
                        size="sm"
                        className="text-textSecondary hover:text-patriotWhite hover:bg-patriotBlue/10 h-8 w-8 p-0 rounded-lg"
                      >
                        <Bookmark className="w-4 h-4" />
                      </Button>
                    </>
                  )}

                  {hasActiveFilters && (
                    <Button
                      onClick={onClearFilters}
                      variant="ghost"
                      size="sm"
                      className="text-textSecondary hover:text-patriotWhite hover:bg-patriotRed/10 h-8 px-3 rounded-lg"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {/* Quick Presets */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-patriotWhite flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Quick Filters
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {quickPresets.map(preset => (
                      <Button
                        key={preset.name}
                        onClick={() => applyPreset(preset)}
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2 text-textSecondary hover:text-patriotWhite hover:bg-patriotBlue/10 border border-patriotBlue/20 h-10 rounded-lg justify-start"
                      >
                        {preset.icon}
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-patriotWhite">
                    Status
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() =>
                          updateFilters({ filterBy: option.value })
                        }
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all h-10',
                          filters.filterBy === option.value
                            ? 'bg-patriotRed text-white'
                            : 'bg-backgroundLight text-textSecondary hover:bg-backgroundAccent hover:text-textBase border border-patriotBlue/20'
                        )}
                      >
                        <span className="capitalize">{option.label}</span>
                        <span className="px-2 py-1 bg-black/20 rounded-md text-xs font-semibold">
                          {statusCounts[option.value]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Saved Configurations */}
                {enablePersistence &&
                  filterPersistence.savedConfigurations.length > 0 && (
                    <div className="space-y-3 border-t border-patriotBlue/20 pt-6">
                      <label className="text-sm font-medium text-patriotWhite flex items-center gap-2">
                        <Bookmark className="w-4 h-4" />
                        Saved Configurations
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {filterPersistence.savedConfigurations
                          .slice(0, 4)
                          .map(config => (
                            <Button
                              key={config.id}
                              onClick={() => handleLoadConfiguration(config.id)}
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-2 text-textSecondary hover:text-patriotWhite hover:bg-patriotBlue/10 border border-patriotBlue/20 h-10 rounded-lg justify-start"
                            >
                              <BookmarkPlus className="w-4 h-4" />
                              <span className="truncate">{config.name}</span>
                            </Button>
                          ))}
                      </div>
                    </div>
                  )}

                {/* Smart Suggestions & Recent Filters */}
                {enablePersistence &&
                  (filterPersistence.smartSuggestions.length > 0 ||
                    filterPersistence.recentFilters.length > 0) && (
                    <div className="space-y-4 border-t border-patriotBlue/20 pt-6">
                      {/* Smart Suggestions */}
                      {filterPersistence.smartSuggestions.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-patriotWhite flex items-center gap-2">
                            <Brain className="w-4 h-4" />
                            Smart Suggestions
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {filterPersistence.smartSuggestions
                              .slice(0, 3)
                              .map((suggestion, index) => (
                                <Button
                                  key={index}
                                  onClick={() =>
                                    applySmartSuggestion(suggestion)
                                  }
                                  variant="ghost"
                                  size="sm"
                                  className="flex items-center gap-2 text-textSecondary hover:text-patriotWhite hover:bg-patriotBlue/10 border border-patriotBlue/20 h-9 rounded-lg"
                                >
                                  <Star className="w-3 h-3" />
                                  <span className="text-xs">
                                    {suggestion.searchTerm ||
                                      `${suggestion.filterBy} ${suggestion.proposalTypeFilter}`}
                                  </span>
                                </Button>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Recent Filters */}
                      {filterPersistence.recentFilters.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-patriotWhite flex items-center gap-2">
                            <Clock3 className="w-4 h-4" />
                            Recent Filters
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {filterPersistence.recentFilters
                              .slice(0, 3)
                              .map((recentFilter, index) => (
                                <Button
                                  key={index}
                                  onClick={() =>
                                    applySmartSuggestion(recentFilter)
                                  }
                                  variant="ghost"
                                  size="sm"
                                  className="flex items-center gap-2 text-textSecondary hover:text-patriotWhite hover:bg-patriotBlue/10 border border-patriotBlue/20 h-9 rounded-lg"
                                >
                                  <History className="w-3 h-3" />
                                  <span className="text-xs">
                                    {recentFilter.searchTerm ||
                                      `${recentFilter.filterBy} ${recentFilter.proposalTypeFilter}`}
                                  </span>
                                </Button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Configuration Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-backgroundDark border border-patriotBlue/30 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-patriotWhite mb-4">
              Save Filter Configuration
            </h3>
            <Input
              placeholder="Enter configuration name..."
              value={saveConfigName}
              onChange={e => setSaveConfigName(e.target.value)}
              className="mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setShowSaveModal(false)}
                variant="ghost"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveConfiguration}
                variant="primary"
                size="sm"
                disabled={!saveConfigName.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Configurations Modal */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-backgroundDark border border-patriotBlue/30 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-patriotWhite">
                Manage Filter Configurations
              </h3>
              <Button
                onClick={() => setShowManageModal(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {filterPersistence.savedConfigurations.map(config => (
                <div
                  key={config.id}
                  className="flex items-center justify-between p-3 bg-backgroundAccent rounded-lg"
                >
                  <div className="flex-1">
                    <div className="text-patriotWhite font-medium">
                      {config.name}
                    </div>
                    <div className="text-sm text-textSecondary">
                      Used {config.usageCount} times • Last used{' '}
                      {new Date(config.lastUsed).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleLoadConfiguration(config.id)}
                      variant="ghost"
                      size="sm"
                      className="text-patriotBlue hover:text-patriotWhite"
                    >
                      Load
                    </Button>
                    <Button
                      onClick={() =>
                        filterPersistence.deleteConfiguration(config.id)
                      }
                      variant="ghost"
                      size="sm"
                      className="text-patriotRed hover:text-patriotWhite"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
