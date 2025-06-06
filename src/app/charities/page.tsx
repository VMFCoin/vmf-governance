'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Users,
  DollarSign,
  Building,
  Heart,
  X,
  ChevronDown,
  Loader2,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { CharityCard } from '@/components/charities/CharityCard';
import { CharityImpactModal } from '@/components/charities/CharityImpactModal';
import { Header } from '@/components/layout/Header';
import { useCharityStore } from '@/stores/useCharityStore';
import { Charity, CharityCategory } from '@/types';
import { cn } from '@/lib/utils';

// Utility function for category display names
const getCategoryDisplayName = (category: CharityCategory): string => {
  const categoryNames: Record<CharityCategory, string> = {
    disabled_veterans: 'Disabled Veterans',
    military_families: 'Military Families',
    veteran_housing: 'Veteran Housing',
    mental_health: 'Mental Health',
    education: 'Education',
    employment: 'Employment',
    general_support: 'General Support',
  };
  return categoryNames[category];
};

const categories: CharityCategory[] = [
  'disabled_veterans',
  'military_families',
  'veteran_housing',
  'mental_health',
  'education',
  'employment',
  'general_support',
];

export default function CharitiesPage() {
  const {
    charities,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    fetchCharities,
    loadMoreCharities,
    hasMore,
    getFilteredCharities,
    categoryFilter,
    verificationFilter,
    setCategoryFilter,
    setVerificationFilter,
    resetFilters,
    totalCount,
  } = useCharityStore();

  const [selectedCharity, setSelectedCharity] = useState<Charity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [searchError, setSearchError] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Get filtered charities
  const filteredCharities = getFilteredCharities();

  // Memoized statistics calculation
  const stats = useMemo(() => {
    if (!filteredCharities.length) {
      return {
        totalVeteransServed: 0,
        totalFundingDistributed: 0,
        categoriesSupported: 0,
      };
    }

    return {
      totalVeteransServed: filteredCharities.reduce(
        (sum: number, charity: Charity) =>
          sum + charity.impactMetrics.veteransServed,
        0
      ),
      totalFundingDistributed: filteredCharities.reduce(
        (sum: number, charity: Charity) =>
          sum + charity.impactMetrics.fundingReceived,
        0
      ),
      categoriesSupported: new Set(
        filteredCharities.map((c: Charity) => c.category)
      ).size,
    };
  }, [filteredCharities]);

  // Memoized event handlers
  const handleViewImpact = useCallback((charity: Charity) => {
    setSelectedCharity(charity);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedCharity(null);
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      // Clear previous search error
      setSearchError('');

      // Basic input validation
      if (value.length > 100) {
        setSearchError('Search query is too long (max 100 characters)');
        return;
      }

      // Prevent potential XSS in search
      const sanitizedValue = value.replace(/<[^>]*>/g, '').trim();
      setSearchQuery(sanitizedValue);
    },
    [setSearchQuery]
  );

  const clearSearch = useCallback(() => {
    setLocalSearchQuery('');
    setSearchQuery('');
    setSearchError('');
  }, [setSearchQuery]);

  // Enhanced error handling with retry logic
  const handleRetry = useCallback(async () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      try {
        await fetchCharities(true);
      } catch (err) {
        console.error('Retry failed:', err);
      }
    }
  }, [retryCount, maxRetries, fetchCharities]);

  useEffect(() => {
    const initializeCharities = async () => {
      try {
        await fetchCharities(true);
        setRetryCount(0); // Reset retry count on success
      } catch (err) {
        console.error('Failed to load charities:', err);
      }
    };

    if (charities.length === 0) {
      initializeCharities();
    }
  }, [fetchCharities, charities.length]);

  // Error state with retry option
  if (error && !charities.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <h2 className="text-lg font-semibold text-red-800 mb-2">
                Unable to Load Charities
              </h2>
              <p className="text-red-600 mb-4">
                {error || 'An unexpected error occurred'}
              </p>
              {retryCount < maxRetries && (
                <button
                  onClick={handleRetry}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry ({retryCount + 1}/{maxRetries})
                </button>
              )}
              {retryCount >= maxRetries && (
                <p className="text-sm text-red-500">
                  Please refresh the page or try again later.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveFilters =
    searchQuery || categoryFilter !== 'all' || verificationFilter !== 'all';

  // Infinite scroll handler
  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading && !searchQuery) {
      loadMoreCharities();
    }
  }, [hasMore, isLoading, searchQuery, loadMoreCharities]);

  return (
    <div className="min-h-screen landing-page-flag">
      <Header />

      {/* Hero Section with American Flag Background */}
      <section className="relative py-20 hero-section">
        <div className="absolute inset-0 bg-backgroundDark/60" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-display font-bold text-patriotWhite mb-6">
              Charity Directory
            </h1>
            <p className="text-xl text-textSecondary max-w-3xl mx-auto mb-8 leading-relaxed">
              Discover and support verified veteran-focused charities making a
              real difference in the lives of those who served our nation.
            </p>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="p-6 text-center bg-patriotBlue/20 border-patriotBlue/40 hover:bg-patriotBlue/30 transition-all duration-300">
                  <Users className="w-10 h-10 text-patriotBlue mx-auto mb-4" />
                  <div className="text-3xl font-bold text-patriotWhite mb-2">
                    {stats.totalVeteransServed.toLocaleString()}
                  </div>
                  <div className="text-sm text-textSecondary font-medium">
                    Veterans Served
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="p-6 text-center bg-starGold/20 border-starGold/40 hover:bg-starGold/30 transition-all duration-300">
                  <DollarSign className="w-10 h-10 text-starGold mx-auto mb-4" />
                  <div className="text-3xl font-bold text-patriotWhite mb-2">
                    ${(stats.totalFundingDistributed / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-textSecondary font-medium">
                    Total Funding
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="p-6 text-center bg-patriotRed/20 border-patriotRed/40 hover:bg-patriotRed/30 transition-all duration-300">
                  <Building className="w-10 h-10 text-patriotRed mx-auto mb-4" />
                  <div className="text-3xl font-bold text-patriotWhite mb-2">
                    {stats.categoriesSupported}
                  </div>
                  <div className="text-sm text-textSecondary font-medium">
                    Focus Areas
                  </div>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Filters Section */}
      <section className="py-8 bg-backgroundAccent/30 border-b border-patriotBlue/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            {/* Enhanced Search */}
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-textSecondary" />
              <Input
                type="text"
                placeholder="Search charities by name or description..."
                value={localSearchQuery}
                onChange={handleSearchChange}
                className="pl-12 pr-10 py-3 bg-backgroundLight/80 border-patriotBlue/30 focus:border-patriotBlue focus:ring-2 focus:ring-patriotBlue/20 text-patriotWhite placeholder:text-textSecondary"
              />
              {localSearchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-textSecondary hover:text-patriotWhite transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="w-4 h-4 text-patriotBlue animate-spin" />
                </div>
              )}
            </div>

            {/* Enhanced Filters */}
            <div className="flex flex-wrap gap-4 items-center w-full lg:w-auto">
              {/* Custom Category Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-3 bg-backgroundLight border border-patriotBlue/30 rounded-lg text-patriotWhite hover:border-patriotBlue transition-all duration-200 min-w-[180px] justify-between',
                    isDropdownOpen &&
                      'border-patriotBlue ring-2 ring-patriotBlue/20'
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-textSecondary" />
                    <span className="text-sm font-medium">
                      {categoryFilter === 'all'
                        ? 'All Categories'
                        : getCategoryDisplayName(categoryFilter)}
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-textSecondary transition-transform duration-200',
                      isDropdownOpen && 'rotate-180'
                    )}
                  />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-backgroundLight border border-patriotBlue/30 rounded-lg shadow-xl z-50 overflow-hidden"
                    >
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setCategoryFilter('all');
                            setIsDropdownOpen(false);
                          }}
                          className={cn(
                            'w-full text-left px-4 py-2 text-sm hover:bg-patriotBlue/20 transition-colors',
                            categoryFilter === 'all'
                              ? 'bg-patriotBlue/30 text-patriotWhite'
                              : 'text-textSecondary hover:text-patriotWhite'
                          )}
                        >
                          All Categories
                        </button>
                        {categories.map(category => (
                          <button
                            key={category}
                            onClick={() => {
                              setCategoryFilter(category);
                              setIsDropdownOpen(false);
                            }}
                            className={cn(
                              'w-full text-left px-4 py-2 text-sm hover:bg-patriotBlue/20 transition-colors',
                              categoryFilter === category
                                ? 'bg-patriotBlue/30 text-patriotWhite'
                                : 'text-textSecondary hover:text-patriotWhite'
                            )}
                          >
                            {getCategoryDisplayName(category)}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Verification Filter */}
              <select
                value={verificationFilter}
                onChange={e => setVerificationFilter(e.target.value as any)}
                className="px-4 py-3 bg-backgroundLight border border-patriotBlue/30 rounded-lg text-patriotWhite focus:border-patriotBlue focus:ring-2 focus:ring-patriotBlue/20 text-sm"
              >
                <option value="all">All Status</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
              </select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  onClick={resetFilters}
                  variant="ghost"
                  className="flex items-center space-x-2 px-4 py-3 text-textSecondary hover:text-patriotWhite"
                >
                  <X className="w-4 h-4" />
                  <span>Clear All</span>
                </Button>
              )}
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-textSecondary">
              Showing{' '}
              <span className="text-patriotWhite font-semibold">
                {filteredCharities.length}
              </span>{' '}
              of{' '}
              <span className="text-patriotWhite font-semibold">
                {totalCount}
              </span>{' '}
              charities
              {hasActiveFilters && (
                <span className="ml-2 text-sm">• Filters applied</span>
              )}
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-textSecondary">
                  Active filters:
                </span>
                <div className="flex flex-wrap gap-2">
                  {searchQuery && (
                    <span className="px-2 py-1 bg-patriotBlue/20 text-patriotBlue rounded-full text-xs">
                      Search: &quot;{searchQuery}&quot;
                    </span>
                  )}
                  {categoryFilter !== 'all' && (
                    <span className="px-2 py-1 bg-patriotRed/20 text-patriotRed rounded-full text-xs">
                      {getCategoryDisplayName(categoryFilter)}
                    </span>
                  )}
                  {verificationFilter !== 'all' && (
                    <span className="px-2 py-1 bg-starGold/20 text-starGold rounded-full text-xs">
                      {verificationFilter === 'verified'
                        ? 'Verified'
                        : 'Pending'}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Enhanced Charities Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading && charities.length === 0 ? (
            // Loading skeleton
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-16 w-16 bg-backgroundAccent rounded-lg mb-4" />
                  <div className="h-6 bg-backgroundAccent rounded mb-2" />
                  <div className="h-4 bg-backgroundAccent rounded mb-4" />
                  <div className="h-20 bg-backgroundAccent rounded" />
                </Card>
              ))}
            </div>
          ) : filteredCharities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <Heart className="w-20 h-20 text-textSecondary mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-patriotWhite mb-4">
                No charities found
              </h3>
              <p className="text-textSecondary mb-6 max-w-md mx-auto">
                {hasActiveFilters
                  ? 'Try adjusting your search criteria or browse all charities.'
                  : "We're working on adding more verified charities to our directory."}
              </p>
              {hasActiveFilters && (
                <Button onClick={resetFilters} variant="outline">
                  Clear All Filters
                </Button>
              )}
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
              >
                <AnimatePresence>
                  {filteredCharities.map((charity, index) => (
                    <motion.div
                      key={charity.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.1,
                        layout: { duration: 0.3 },
                      }}
                    >
                      <CharityCard
                        charity={charity}
                        onViewImpact={handleViewImpact}
                        className="h-full"
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Load More Button */}
              {hasMore && !searchQuery && (
                <div className="text-center mt-12">
                  <Button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    variant="outline"
                    size="lg"
                    className="border-patriotBlue/30 text-patriotBlue hover:bg-patriotBlue/20"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading More...
                      </>
                    ) : (
                      'Load More Charities'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Impact Modal */}
      <CharityImpactModal
        charity={selectedCharity}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
