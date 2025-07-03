'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Heart,
  Building,
  Code,
  Zap,
  Shield,
  Lock,
  LogOut,
  Search,
  X,
} from 'lucide-react';
import { Header, Footer, Button, Card } from '@/components';
import {
  ProposalCardSkeleton,
  FilterPanel,
  FilterChip,
  ProposalTypeFilter,
  SortDropdown,
} from '@/components/ui';
import {
  FilterState,
  SortOption,
  FilterOption,
} from '@/components/ui/FilterPanel';
import type { ProposalTypeFilter as ProposalTypeFilterType } from '@/stores/useUserStore';
import { TypeSpecificProposalCard } from '@/components/proposals';
import { HolidayCharityCard } from '@/components/proposals/holiday-charity';
import { NotificationTester } from '@/components/notifications';
import { mockProposals } from '@/data/mockData';
import { Proposal, ProposalType } from '@/types';
import { useHolidayStore } from '@/stores/useHolidayStore';
import { HolidayProposalLogic } from '@/services/holidayProposalLogic';
import { holidayProposalLogic } from '@/services/holidayProposalLogic';
import { searchProposals } from '@/lib/searchUtils';
import { useFilterPersistence } from '@/hooks/useFilterPersistence';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Animation variants for smooth transitions
const fadeInVariants = {
  initial: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const slideInVariants = {
  initial: { opacity: 0, x: -20 },
  enter: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};

export default function VotePage() {
  // Use filter persistence hook instead of local state
  const {
    filters,
    setFilters,
    clearAllFilters,
    addSearchToHistory,
    savedConfigurations,
    recentFilters,
    analytics,
  } = useFilterPersistence();

  // Holiday store integration for upcoming holiday display
  const { getNextHolidayToVoteFor } = useHolidayStore();
  const nextHoliday = getNextHolidayToVoteFor();
  const holidayLogic = HolidayProposalLogic.getInstance();
  const nextHolidayStatus = nextHoliday
    ? holidayLogic.getHolidayProposalStatus(nextHoliday)
    : null;

  // Comprehensive holiday information for informative display
  const [holidayInfo, setHolidayInfo] = useState<{
    nextHoliday: any;
    status: any;
    displayMessage: string;
  } | null>(null);

  // Search input ref for keyboard shortcut
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get comprehensive holiday information
  useEffect(() => {
    const upcomingHolidayInfo = holidayProposalLogic.getUpcomingHolidayInfo();
    setHolidayInfo(upcomingHolidayInfo);
  }, []);

  // Keyboard shortcut for search (Ctrl+F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter and sort proposals with enhanced search
  const filteredAndSortedProposals = useMemo(() => {
    let filtered = mockProposals;

    // Apply proposal type filter
    if (filters.proposalTypeFilter !== 'all') {
      filtered = filtered.filter(
        proposal => proposal.type === filters.proposalTypeFilter
      );
    }

    // Apply enhanced search filter
    if (filters.searchTerm) {
      filtered = searchProposals(filtered, filters.searchTerm);
    }

    // Apply status filter
    if (filters.filterBy !== 'all') {
      filtered = filtered.filter(
        proposal => proposal.status === filters.filterBy
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return (
            parseInt(b.id.split('-').pop() || '0') -
            parseInt(a.id.split('-').pop() || '0')
          );
        case 'oldest':
          return (
            parseInt(a.id.split('-').pop() || '0') -
            parseInt(b.id.split('-').pop() || '0')
          );
        case 'mostVotes':
          return (
            b.yesPercentage +
            b.noPercentage -
            (a.yesPercentage + a.noPercentage)
          );
        case 'timeLeft':
          return (
            new Date(a.votingEndsAt).getTime() -
            new Date(b.votingEndsAt).getTime()
          );
        default:
          return 0;
      }
    });

    return sorted;
  }, [filters, mockProposals]);

  // Update search history when search results change
  useEffect(() => {
    if (filters.searchTerm) {
      addSearchToHistory(filters.searchTerm, filteredAndSortedProposals.length);
    }
  }, [
    filters.searchTerm,
    filteredAndSortedProposals.length,
    addSearchToHistory,
  ]);

  const getStatusCount = (status: FilterOption) => {
    if (status === 'all') return mockProposals.length;
    return mockProposals.filter(proposal => proposal.status === status).length;
  };

  const getProposalTypeCount = (type: ProposalTypeFilterType) => {
    if (type === 'all') return mockProposals.length;
    return mockProposals.filter(proposal => proposal.type === type).length;
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  // Status counts for filter panel
  const statusCounts: Record<FilterOption, number> = {
    all: getStatusCount('all'),
    active: getStatusCount('active'),
    passed: getStatusCount('passed'),
    failed: getStatusCount('failed'),
    pending: getStatusCount('pending'),
  };

  // Type counts for filter panel
  const typeCounts: Record<ProposalTypeFilterType, number> = {
    all: getProposalTypeCount('all'),
    holiday_charity: getProposalTypeCount('holiday_charity'),
    charity_directory: getProposalTypeCount('charity_directory'),
    platform_feature: getProposalTypeCount('platform_feature'),
    legacy: getProposalTypeCount('legacy'),
  };

  // Helper function to get filter chip labels
  const getFilterChipLabel = (key: string, value: string) => {
    switch (key) {
      case 'searchTerm':
        return `Search: "${value}"`;
      case 'filterBy':
        return `Status: ${value.charAt(0).toUpperCase() + value.slice(1)}`;
      case 'proposalTypeFilter':
        const typeLabels: Record<ProposalTypeFilterType, string> = {
          all: 'All Types',
          holiday_charity: 'Holiday Charity',
          charity_directory: 'Charity Directory',
          platform_feature: 'Platform Features',
          legacy: 'Legacy',
        };
        return `Type: ${typeLabels[value as ProposalTypeFilterType]}`;
      case 'sortBy':
        const sortLabels: Record<SortOption, string> = {
          newest: 'Newest First',
          oldest: 'Oldest First',
          mostVotes: 'Most Votes',
          timeLeft: 'Time Remaining',
        };
        return `Sort: ${sortLabels[value as SortOption]}`;
      default:
        return value;
    }
  };

  const HolidayEmptyState = () => {
    if (!holidayInfo?.nextHoliday) return null;

    const { nextHoliday, status, displayMessage } = holidayInfo;
    const daysUntil = Math.ceil(
      (new Date(nextHoliday.date).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return (
      <motion.div
        className="text-center py-16 px-4"
        variants={fadeInVariants}
        initial="initial"
        animate="enter"
      >
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-patriotRed to-patriotBlue rounded-full flex items-center justify-center">
              <Heart className="w-12 h-12 text-patriotWhite" />
            </div>
            <h2 className="text-3xl font-bold text-patriotWhite mb-4">
              No Active Holiday Proposals
            </h2>
            <p className="text-textSecondary text-lg mb-6">{displayMessage}</p>
          </div>

          <div className="bg-backgroundLight rounded-2xl p-8 border border-patriotBlue/20">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-patriotRed/20 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">{nextHoliday.icon}</span>
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold text-patriotWhite">
                  {nextHoliday.name}
                </h3>
                <p className="text-textSecondary">
                  {new Date(nextHoliday.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-patriotRed mb-1">
                  {daysUntil}
                </div>
                <div className="text-sm text-textSecondary">Days Until</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-patriotBlue mb-1">
                  ${nextHoliday.fundAmount?.toLocaleString() || 'TBD'}
                </div>
                <div className="text-sm text-textSecondary">Fund Amount</div>
              </div>
            </div>
            <p className="text-textSecondary text-sm">
              Voting will begin approximately 2 weeks before the holiday date.
              Stay tuned for charity proposal announcements!
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  const hasActiveFilters =
    filters.searchTerm ||
    filters.filterBy !== 'all' ||
    filters.proposalTypeFilter !== 'all' ||
    filters.sortBy !== 'newest';

  return (
    <div className="min-h-screen bg-backgroundDark text-textBase">
      <Header />
      <main className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <motion.div
            className="mb-8"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
          >
            <div className="flex items-center gap-4 mb-6">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-patriotBlue hover:text-patriotRed"
              >
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-patriotWhite mb-4">
                  Governance Proposals
                </h1>
                <p className="text-textSecondary text-lg">
                  Participate in VMF governance by voting on proposals that
                  shape our platform and support our veterans.
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  asChild
                  variant="primary"
                  className="bg-patriotRed hover:bg-patriotRed/90"
                >
                  <Link href="/proposal/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Submit Proposal
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Search Bar & Filter Button */}
          <motion.div
            className="mb-6"
            variants={slideInVariants}
            initial="initial"
            animate="enter"
          >
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
              {/* Search Bar */}
              <div className="relative flex-1 w-full sm:max-w-2xl">
                <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-textSecondary">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Search by title, description, or charity..."
                  value={filters.searchTerm}
                  onChange={e => {
                    setFilters({ ...filters, searchTerm: e.target.value });
                    if (e.target.value) {
                      addSearchToHistory(
                        e.target.value,
                        filteredAndSortedProposals.length
                      );
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && filters.searchTerm) {
                      addSearchToHistory(
                        filters.searchTerm,
                        filteredAndSortedProposals.length
                      );
                    }
                  }}
                  ref={searchInputRef}
                  className="w-full h-11 sm:h-12 pl-10 sm:pl-12 pr-10 sm:pr-12 bg-backgroundLight border border-patriotBlue/30 rounded-xl text-patriotWhite placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-patriotRed focus:border-transparent transition-all text-sm sm:text-base"
                />
                {filters.searchTerm && (
                  <button
                    onClick={() => setFilters({ ...filters, searchTerm: '' })}
                    className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-textSecondary hover:text-patriotWhite transition-colors"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
                <div className="hidden sm:block absolute right-14 sm:right-16 top-1/2 transform -translate-y-1/2 text-xs text-textSecondary">
                  Ctrl+F
                </div>
              </div>

              {/* Controls Row */}
              <div className="flex gap-2 sm:gap-3 items-center justify-end sm:justify-start">
                {/* Sort Dropdown */}
                <SortDropdown
                  selectedSort={filters.sortBy}
                  onSortChange={sortBy => setFilters({ ...filters, sortBy })}
                  className="flex-shrink-0"
                />

                {/* Filter Button */}
                <FilterPanel
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onClearFilters={clearAllFilters}
                  statusCounts={statusCounts}
                  className="flex-shrink-0"
                />
              </div>
            </div>
          </motion.div>

          {/* Proposal Type Filter */}
          <motion.div
            className="mb-6"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
          >
            <ProposalTypeFilter
              selectedType={filters.proposalTypeFilter}
              onTypeChange={type =>
                setFilters({ ...filters, proposalTypeFilter: type })
              }
              typeCounts={typeCounts}
              className="w-full"
            />
          </motion.div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <motion.div
              className="mb-6"
              variants={fadeInVariants}
              initial="initial"
              animate="enter"
            >
              <div className="flex flex-wrap gap-2">
                {filters.searchTerm && (
                  <FilterChip
                    label={getFilterChipLabel('searchTerm', filters.searchTerm)}
                    onRemove={() => setFilters({ ...filters, searchTerm: '' })}
                  />
                )}
                {filters.filterBy !== 'all' && (
                  <FilterChip
                    label={getFilterChipLabel('filterBy', filters.filterBy)}
                    onRemove={() => setFilters({ ...filters, filterBy: 'all' })}
                  />
                )}
                {filters.proposalTypeFilter !== 'all' && (
                  <FilterChip
                    label={getFilterChipLabel(
                      'proposalTypeFilter',
                      filters.proposalTypeFilter
                    )}
                    onRemove={() =>
                      setFilters({ ...filters, proposalTypeFilter: 'all' })
                    }
                  />
                )}
                {filters.sortBy !== 'newest' && (
                  <FilterChip
                    label={getFilterChipLabel('sortBy', filters.sortBy)}
                    onRemove={() =>
                      setFilters({ ...filters, sortBy: 'newest' })
                    }
                  />
                )}
              </div>
            </motion.div>
          )}

          {/* Results Summary */}
          <motion.div
            className="mb-8"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
          >
            <div className="flex items-center justify-between">
              <p className="text-textSecondary">
                Showing{' '}
                <span className="text-patriotWhite font-semibold">
                  {filteredAndSortedProposals.length}
                </span>{' '}
                of{' '}
                <span className="text-patriotWhite font-semibold">
                  {mockProposals.length}
                </span>{' '}
                proposals
                {hasActiveFilters && (
                  <span className="ml-2 text-sm">• Filters applied</span>
                )}
              </p>
            </div>
          </motion.div>

          {/* Proposals Grid */}
          <motion.div
            className="space-y-6"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
          >
            {filteredAndSortedProposals.length > 0 ? (
              <div className="grid gap-6">
                {filteredAndSortedProposals.map((proposal, index) => (
                  <motion.div
                    key={proposal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <TypeSpecificProposalCard proposal={proposal} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 mx-auto mb-6 bg-backgroundLight rounded-full flex items-center justify-center">
                    <Shield className="w-8 h-8 text-textSecondary" />
                  </div>
                  <h3 className="text-xl font-semibold text-patriotWhite mb-2">
                    No Proposals Found
                  </h3>
                  <p className="text-textSecondary mb-6">
                    {hasActiveFilters
                      ? 'No proposals match your current filters. Try adjusting your search criteria or clearing all filters.'
                      : 'There are currently no proposals to display.'}
                  </p>
                  {hasActiveFilters && (
                    <Button
                      onClick={clearAllFilters}
                      variant="outline"
                      className="border-patriotBlue text-patriotBlue hover:bg-patriotBlue hover:text-patriotWhite"
                    >
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {/* Holiday Empty State for Holiday Charity Filter */}
          {filters.proposalTypeFilter === 'holiday_charity' &&
            filteredAndSortedProposals.length === 0 && <HolidayEmptyState />}
        </div>
      </main>
      <Footer />
    </div>
  );
}
