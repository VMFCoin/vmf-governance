'use client';

import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { Header, Footer, Button, Card, Input, Dropdown } from '@/components';
import { ProposalCardSkeleton } from '@/components/ui';
import { TypeSpecificProposalCard } from '@/components/proposals';
import { mockProposals } from '@/data/mockData';
import { Proposal } from '@/types';

type SortOption = 'newest' | 'oldest' | 'mostVotes' | 'timeLeft';
type FilterOption = 'all' | 'active' | 'passed' | 'failed' | 'pending';

export default function VotePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

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

  return (
    <main className="min-h-screen landing-page-flag">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Link
          href="/"
          className="inline-flex items-center text-patriotRed hover:text-red-400 mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-display font-bold text-patriotWhite mb-4">
            Active Proposals
          </h1>
          <p className="text-xl text-textSecondary leading-relaxed">
            Vote on proposals that matter to the veteran community
          </p>
        </div>

        {/* Enhanced Filters and Search */}
        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-textSecondary w-5 h-5" />
              <Input
                type="text"
                placeholder="Search proposals, authors, or descriptions..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-base"
              />
            </div>
          </div>

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
              className="w-full h-12 font-semibold"
            >
              <Link href="/submit">
                <Plus className="w-5 h-5 mr-2" />
                Submit Proposal
              </Link>
            </Button>
          </div>
        </div>

        {/* Enhanced Status Filter Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {(
              ['all', 'active', 'passed', 'failed', 'pending'] as FilterOption[]
            ).map(status => (
              <button
                key={status}
                onClick={() => setFilterBy(status)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  filterBy === status
                    ? 'bg-patriotRed text-patriotWhite shadow-patriot-glow scale-105'
                    : 'bg-backgroundLight text-textSecondary hover:bg-backgroundAccent hover:text-textBase hover:shadow-lg hover:scale-102'
                }`}
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
        {filteredAndSortedProposals.length > 0 ? (
          <div className="grid lg:grid-cols-2 gap-8">
            {filteredAndSortedProposals.map(proposal => (
              <TypeSpecificProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        ) : (
          <Card className="text-center py-16">
            <Filter className="w-16 h-16 text-textSecondary mx-auto mb-6 opacity-50" />
            <h3 className="text-2xl font-semibold text-patriotWhite mb-3">
              No proposals found
            </h3>
            <p className="text-textSecondary mb-8 text-lg leading-relaxed max-w-md mx-auto">
              Try adjusting your search terms or filter criteria to find what
              you're looking for
            </p>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setSearchTerm('');
                setFilterBy('all');
                setSortBy('newest');
              }}
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Reset All Filters
            </Button>
          </Card>
        )}
      </div>

      <Footer />
    </main>
  );
}
