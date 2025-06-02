'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Filter,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  BarChart3,
  Plus,
  RefreshCw,
  ArrowRight,
  FileText,
  User,
} from 'lucide-react';
import { Header, Footer, Button, Card, Input, Dropdown } from '@/components';
import { ProposalCardSkeleton } from '@/components/ui';
import { TypeSpecificProposalCard } from '@/components/proposals';
import { mockProposals } from '@/data/mockData';
import { Proposal } from '@/types';
import { useMobile } from '@/hooks/useMobile';
import { motion } from 'framer-motion';

type SortOption = 'newest' | 'oldest' | 'mostVotes' | 'timeLeft';
type FilterOption = 'all' | 'active' | 'passed' | 'failed' | 'pending';

export default function VotePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const { isMobile, isSmallMobile } = useMobile();
  const touchStartY = useRef<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobile) return;
      touchStartY.current = e.touches[0].clientY;
    },
    [isMobile]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobile || !scrollContainerRef.current) return;

      const currentY = e.touches[0].clientY;
      const scrollTop = scrollContainerRef.current.scrollTop;

      // Only allow pull-to-refresh when at the top of the page
      if (scrollTop === 0 && currentY > touchStartY.current) {
        const distance = Math.min(currentY - touchStartY.current, 120);
        setPullDistance(distance);
        setIsPulling(distance > 60);
      }
    },
    [isMobile]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isMobile) return;

    if (isPulling && pullDistance > 60) {
      setIsRefreshing(true);
      // Simulate refresh
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsRefreshing(false);
    }

    setPullDistance(0);
    setIsPulling(false);
  }, [isMobile, isPulling, pullDistance]);

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  }, []);

  // Sort options for dropdown
  const sortOptions = [
    {
      value: 'newest',
      label: 'Newest First',
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      value: 'oldest',
      label: 'Oldest First',
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      value: 'mostVotes',
      label: 'Most Votes',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      value: 'timeLeft',
      label: 'Time Remaining',
      icon: <Clock className="w-4 h-4" />,
    },
  ];

  // Filter and sort proposals
  const filteredAndSortedProposals = useMemo(() => {
    let filtered = mockProposals;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        proposal =>
          proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          proposal.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
          proposal.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(proposal => proposal.status === filterBy);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return parseInt(b.id) - parseInt(a.id);
        case 'oldest':
          return parseInt(a.id) - parseInt(b.id);
        case 'mostVotes':
          return (
            b.yesPercentage +
            b.noPercentage -
            (a.yesPercentage + a.noPercentage)
          );
        case 'timeLeft':
          // Simple sorting by time left (active proposals first)
          if (a.status === 'active' && b.status !== 'active') return -1;
          if (b.status === 'active' && a.status !== 'active') return 1;
          return 0;
        default:
          return 0;
      }
    });

    return sorted;
  }, [searchTerm, sortBy, filterBy]);

  const getStatusIcon = (status: Proposal['status']) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4 text-patriotRed" />;
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusCount = (status: FilterOption) => {
    if (status === 'all') return mockProposals.length;
    return mockProposals.filter(p => p.status === status).length;
  };

  const getStatusStyles = (status: Proposal['status']) => {
    switch (status) {
      case 'active':
        return 'bg-patriotRed text-patriotWhite';
      case 'passed':
        return 'bg-green-500 text-white';
      case 'failed':
        return 'bg-gray-500 text-white';
      case 'pending':
        return 'bg-yellow-500 text-white';
    }
  };

  const formatTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const targetDate = new Date(endDate);
    const diff = targetDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      return `in ${days}d ${hours}h`;
    } else if (hours > 0) {
      return `in ${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `in ${minutes}m`;
    } else {
      return `in ${seconds}s`;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <main className="min-h-screen landing-page-flag">
      <Header />

      {/* Pull-to-refresh indicator */}
      {isMobile && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex justify-center"
          style={{
            transform: `translateY(${Math.max(0, pullDistance - 60)}px)`,
            opacity: pullDistance > 20 ? 1 : 0,
            transition: isPulling ? 'none' : 'all 0.3s ease-out',
          }}
        >
          <div className="bg-patriotRed text-white px-4 py-2 rounded-b-lg shadow-lg flex items-center space-x-2">
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span className="text-sm font-medium">
              {isRefreshing
                ? 'Refreshing...'
                : isPulling
                  ? 'Release to refresh'
                  : 'Pull to refresh'}
            </span>
          </div>
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className={`mx-auto py-8 ${isMobile ? 'px-4' : 'max-w-7xl px-4 sm:px-6 lg:px-8'}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Breadcrumb */}
        <Link
          href="/"
          className={`inline-flex items-center text-patriotRed hover:text-red-400 mb-8 transition-colors group ${
            isMobile ? 'text-sm' : ''
          }`}
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        {/* Header */}
        <div className={`mb-10 ${isMobile ? 'mb-6' : 'mb-10'}`}>
          <h1
            className={`font-display font-bold text-patriotWhite mb-4 ${
              isMobile ? 'text-2xl' : 'text-4xl'
            }`}
          >
            Active Proposals
          </h1>
          <p
            className={`text-textSecondary leading-relaxed ${
              isMobile ? 'text-base' : 'text-xl'
            }`}
          >
            Vote on proposals that matter to the veteran community
          </p>

          {/* Mobile refresh button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="mt-4 flex items-center space-x-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>
          )}
        </div>

        {/* Enhanced Filters and Search */}
        <div
          className={`gap-6 mb-8 ${
            isMobile ? 'space-y-4' : 'grid lg:grid-cols-4'
          }`}
        >
          {/* Search */}
          <div className={isMobile ? '' : 'lg:col-span-2'}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-textSecondary w-5 h-5" />
              <Input
                type="text"
                placeholder={
                  isMobile
                    ? 'Search proposals...'
                    : 'Search proposals, authors, or descriptions...'
                }
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={`pl-12 text-base ${isMobile ? 'h-12' : 'h-12'}`}
              />
            </div>
          </div>

          {/* Sort and Submit - Mobile: Stack vertically */}
          <div
            className={`${isMobile ? 'grid grid-cols-2 gap-3' : 'contents'}`}
          >
            {/* Sort Dropdown */}
            <div>
              <Dropdown
                options={sortOptions}
                value={sortBy}
                onChange={value => setSortBy(value as SortOption)}
                placeholder="Sort by..."
              />
            </div>

            {/* Submit Proposal Button */}
            <div>
              <Button
                asChild
                variant="primary"
                size="md"
                className={`w-full font-semibold ${isMobile ? 'h-12 text-sm' : 'h-12'}`}
              >
                <Link href="/submit">
                  <Plus
                    className={`mr-2 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`}
                  />
                  {isMobile ? 'Submit' : 'Submit Proposal'}
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Status Filter Tabs */}
        <div className={`mb-8 ${isMobile ? 'mb-6' : 'mb-8'}`}>
          <div
            className={`flex gap-3 ${isMobile ? 'flex-wrap gap-2' : 'flex-wrap'}`}
          >
            {(
              ['all', 'active', 'passed', 'failed', 'pending'] as FilterOption[]
            ).map(status => (
              <button
                key={status}
                onClick={() => setFilterBy(status)}
                className={`flex items-center gap-2 font-semibold transition-all duration-300 ${
                  isMobile
                    ? 'px-3 py-2 rounded-lg text-sm'
                    : 'px-5 py-3 rounded-xl'
                } ${
                  filterBy === status
                    ? 'bg-patriotRed text-patriotWhite shadow-patriot-glow scale-105'
                    : 'bg-backgroundLight text-textSecondary hover:bg-backgroundAccent hover:text-textBase hover:shadow-lg hover:scale-102'
                }`}
                style={{ touchAction: 'manipulation' }}
              >
                {status !== 'all' &&
                  getStatusIcon(status as Proposal['status'])}
                <span className="capitalize">{status}</span>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    filterBy === status
                      ? 'bg-white/20 text-patriotWhite'
                      : 'bg-backgroundDark text-textSecondary'
                  }`}
                >
                  {getStatusCount(status)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <p className="text-textSecondary font-medium">
              Showing{' '}
              <span className="text-patriotWhite font-bold">
                {filteredAndSortedProposals.length}
              </span>{' '}
              of{' '}
              <span className="text-patriotWhite font-bold">
                {mockProposals.length}
              </span>{' '}
              proposals
            </p>
            {(searchTerm || filterBy !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterBy('all');
                  setSortBy('newest');
                }}
                className="text-patriotRed hover:text-red-400"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Proposals Grid */}
        <div
          className={`${
            isMobile
              ? 'space-y-4'
              : 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8'
          }`}
        >
          {filteredAndSortedProposals.map((proposal, index) => (
            <motion.div
              key={proposal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: 'easeOut',
              }}
              whileHover={
                !isMobile
                  ? {
                      y: -8,
                      scale: 1.02,
                      transition: { duration: 0.2 },
                    }
                  : undefined
              }
              whileTap={
                isMobile
                  ? {
                      scale: 0.98,
                      transition: { duration: 0.1 },
                    }
                  : undefined
              }
              className={`group ${isMobile ? 'w-full' : ''}`}
            >
              <Link href={`/vote/${proposal.id}`}>
                <Card
                  className={`h-full transition-all duration-300 cursor-pointer ${
                    isMobile
                      ? 'p-4 hover:shadow-lg active:shadow-xl'
                      : 'p-6 hover:shadow-patriot-glow hover:border-patriotRed/30'
                  } ${
                    proposal.status === 'active'
                      ? 'ring-2 ring-patriotRed/20 shadow-patriot-glow'
                      : ''
                  }`}
                >
                  {/* Status Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={`inline-flex items-center gap-2 font-semibold rounded-lg transition-all ${
                        isMobile ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
                      } ${getStatusStyles(proposal.status)}`}
                    >
                      {getStatusIcon(proposal.status)}
                      <span className="capitalize">{proposal.status}</span>
                    </div>

                    {/* Mobile: Show voting deadline */}
                    {isMobile && proposal.status === 'active' && (
                      <div className="text-xs text-textSecondary">
                        {formatTimeRemaining(proposal.votingEndsAt)}
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    className={`font-display font-bold text-patriotWhite mb-3 group-hover:text-patriotRed transition-colors ${
                      isMobile ? 'text-lg line-clamp-2' : 'text-xl line-clamp-2'
                    }`}
                  >
                    {proposal.title}
                  </h3>

                  {/* Description */}
                  <p
                    className={`text-textSecondary mb-4 ${
                      isMobile ? 'text-sm line-clamp-3' : 'line-clamp-3'
                    }`}
                  >
                    {proposal.description}
                  </p>

                  {/* Author and Date */}
                  <div
                    className={`flex items-center justify-between mb-4 ${
                      isMobile ? 'text-xs' : 'text-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-patriotRed rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-textSecondary">
                        {proposal.author}
                      </span>
                    </div>
                    <span className="text-textSecondary">
                      {formatDate(proposal.createdAt)}
                    </span>
                  </div>

                  {/* Vote Progress */}
                  {proposal.status === 'active' && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span
                          className={`font-semibold text-textBase ${
                            isMobile ? 'text-xs' : 'text-sm'
                          }`}
                        >
                          Vote Progress
                        </span>
                        <span
                          className={`text-textSecondary ${
                            isMobile ? 'text-xs' : 'text-sm'
                          }`}
                        >
                          {proposal.yesPercentage +
                            proposal.noPercentage +
                            proposal.abstainPercentage}
                          % voted
                        </span>
                      </div>

                      <div className="relative">
                        <div className="w-full bg-backgroundDark rounded-full h-2">
                          <motion.div
                            className="bg-gradient-to-r from-patriotRed to-red-400 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(proposal.yesPercentage / 100) * 100}%`,
                            }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                          />
                        </div>

                        {/* Mobile: Show vote percentages */}
                        {isMobile && (
                          <div className="flex justify-between mt-1 text-xs text-textSecondary">
                            <span>
                              Yes: {Math.round(proposal.yesPercentage)}%
                            </span>
                            <span>
                              No: {Math.round(100 - proposal.yesPercentage)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Footer */}
                  <div
                    className={`flex items-center justify-between pt-4 border-t border-backgroundLight ${
                      isMobile ? 'text-xs' : 'text-sm'
                    }`}
                  >
                    {proposal.status === 'active' ? (
                      <>
                        <span className="text-textSecondary">
                          Ends {formatTimeRemaining(proposal.votingEndsAt)}
                        </span>
                        <div className="flex items-center gap-1 text-patriotRed font-semibold group-hover:gap-2 transition-all">
                          <span>{isMobile ? 'Vote' : 'Vote Now'}</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-textSecondary">
                          {proposal.status === 'passed'
                            ? 'Passed'
                            : proposal.status === 'failed'
                              ? 'Failed'
                              : 'Pending'}
                        </span>
                        <div className="flex items-center gap-1 text-textSecondary group-hover:text-patriotRed transition-colors">
                          <span>View Details</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAndSortedProposals.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center py-16 ${isMobile ? 'py-12 px-4' : 'py-16'}`}
          >
            <div
              className={`mx-auto mb-6 ${
                isMobile ? 'w-16 h-16' : 'w-24 h-24'
              } bg-backgroundLight rounded-full flex items-center justify-center`}
            >
              <FileText
                className={`text-textSecondary ${
                  isMobile ? 'w-8 h-8' : 'w-12 h-12'
                }`}
              />
            </div>
            <h3
              className={`font-display font-bold text-patriotWhite mb-4 ${
                isMobile ? 'text-xl' : 'text-2xl'
              }`}
            >
              No proposals found
            </h3>
            <p
              className={`text-textSecondary mb-8 max-w-md mx-auto ${
                isMobile ? 'text-sm' : 'text-base'
              }`}
            >
              {searchTerm || filterBy !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Be the first to submit a proposal to the community.'}
            </p>
            <Button
              asChild
              variant="primary"
              size={isMobile ? 'sm' : 'md'}
              className="font-semibold"
            >
              <Link href="/submit">
                <Plus className="w-4 h-4 mr-2" />
                Submit Proposal
              </Link>
            </Button>
          </motion.div>
        )}

        {/* Mobile: Floating Action Button for Quick Actions */}
        {isMobile && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="fixed bottom-6 right-6 z-40"
          >
            <Button
              asChild
              variant="primary"
              size="lg"
              className="rounded-full w-14 h-14 shadow-2xl hover:shadow-patriot-glow"
            >
              <Link href="/submit">
                <Plus className="w-6 h-6" />
              </Link>
            </Button>
          </motion.div>
        )}
      </div>

      <Footer />
    </main>
  );
}
