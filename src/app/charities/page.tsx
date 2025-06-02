'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
} from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { CharityCard } from '@/components/charities/CharityCard';
import { CharityImpactModal } from '@/components/charities/CharityImpactModal';
import {
  charities,
  getCharityStats,
  searchCharities,
  getCategoryDisplayName,
} from '@/data/charities';
import { Charity, CharityCategory } from '@/types';
import { cn } from '@/lib/utils';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    CharityCategory | 'all'
  >('all');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [selectedCharity, setSelectedCharity] = useState<Charity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const stats = getCharityStats();

  // Debounced search to improve performance
  const debouncedSearch = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  }, []);

  // Filter charities based on search, category, and featured status
  const filteredCharities = useMemo(() => {
    let result = charities;

    // Apply search filter
    if (searchQuery.trim()) {
      result = searchCharities(searchQuery);
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(charity => charity.category === selectedCategory);
    }

    // Apply featured filter
    if (showFeaturedOnly) {
      result = result.filter(charity => charity.featured);
    }

    return result;
  }, [searchQuery, selectedCategory, showFeaturedOnly]);

  const handleViewImpact = (charity: Charity) => {
    setSelectedCharity(charity);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCharity(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setShowFeaturedOnly(false);
  };

  const hasActiveFilters =
    searchQuery || selectedCategory !== 'all' || showFeaturedOnly;

  return (
    <div className="min-h-screen landing-page-flag">
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
                placeholder="Search charities by name, mission, or tags..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-12 pr-10 py-3 bg-backgroundLight/80 border-patriotBlue/30 focus:border-patriotBlue focus:ring-2 focus:ring-patriotBlue/20 text-patriotWhite placeholder:text-textSecondary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
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
                      {selectedCategory === 'all'
                        ? 'All Categories'
                        : getCategoryDisplayName(selectedCategory)}
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
                            setSelectedCategory('all');
                            setIsDropdownOpen(false);
                          }}
                          className={cn(
                            'w-full text-left px-4 py-2 text-sm hover:bg-patriotBlue/20 transition-colors',
                            selectedCategory === 'all'
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
                              setSelectedCategory(category);
                              setIsDropdownOpen(false);
                            }}
                            className={cn(
                              'w-full text-left px-4 py-2 text-sm hover:bg-patriotBlue/20 transition-colors',
                              selectedCategory === category
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

              {/* Enhanced Featured Toggle */}
              <Button
                variant={showFeaturedOnly ? 'primary' : 'secondary'}
                onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
                className="flex items-center justify-center px-4 py-3"
              >
                <span className="font-medium">Featured Only</span>
              </Button>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="flex items-center space-x-2 px-4 py-3 text-textSecondary hover:text-patriotWhite"
                >
                  <X className="w-4 h-4" />
                  <span>Clear All</span>
                </Button>
              )}
            </div>
          </div>

          {/* Enhanced Results Count */}
          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-textSecondary">
              Showing{' '}
              <span className="text-patriotWhite font-semibold">
                {filteredCharities.length}
              </span>{' '}
              of{' '}
              <span className="text-patriotWhite font-semibold">
                {charities.length}
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
                  {selectedCategory !== 'all' && (
                    <span className="px-2 py-1 bg-patriotRed/20 text-patriotRed rounded-full text-xs">
                      {getCategoryDisplayName(selectedCategory)}
                    </span>
                  )}
                  {showFeaturedOnly && (
                    <span className="px-2 py-1 bg-starGold/20 text-starGold rounded-full text-xs">
                      Featured
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
          {filteredCharities.length === 0 ? (
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
                <Button onClick={clearFilters} variant="outline">
                  Clear All Filters
                </Button>
              )}
            </motion.div>
          ) : (
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
