'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Trophy,
  Users,
  Vote,
  Clock,
  Zap,
  Heart,
  Activity,
  BarChart3,
  PieChart,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Target,
  Award,
  Flame,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useCharityStore } from '@/stores/useCharityStore';
import {
  deployedGaugeService,
  HolidayVotingResults,
  CharityGaugeMapping,
} from '@/services/deployedGaugeService';
import { voteTrackingService } from '@/services/voteTrackingService';
import { Charity } from '@/types';
import { cn } from '@/lib/utils';
import { fadeInVariants, slideInVariants } from '@/lib/animations';

interface LiveVotingResultsProps {
  charityMappings: CharityGaugeMapping[];
  refreshInterval?: number; // in milliseconds
  showTopN?: number;
  className?: string;
}

interface CharityResult {
  charityId: string;
  charityName: string;
  charity?: Charity;
  gaugeAddress: string;
  totalVotes: bigint;
  percentage: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
  isLeading: boolean;
  votesFormatted: string;
}

interface VotingStats {
  totalVotes: bigint;
  totalParticipants: number;
  leadingCharity: CharityResult | null;
  totalVotingPower: bigint;
  participationRate: number;
}

export function LiveVotingResults({
  charityMappings,
  refreshInterval = 30000, // 30 seconds default
  showTopN = 10,
  className,
}: LiveVotingResultsProps) {
  const [results, setResults] = useState<CharityResult[]>([]);
  const [stats, setStats] = useState<VotingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');

  const { showError } = useToast();
  const getCharityById = useCharityStore(state => state.getCharityById);

  // Format voting power for display
  const formatVotingPower = (power: bigint): string => {
    const formatted = Number(power) / 1e18;
    if (formatted < 1) return formatted.toFixed(4);
    if (formatted < 1000) return formatted.toFixed(2);
    if (formatted < 1000000) return `${(formatted / 1000).toFixed(2)}K`;
    return `${(formatted / 1000000).toFixed(2)}M`;
  };

  // Calculate trend based on previous results
  const calculateTrend = (
    currentVotes: bigint,
    previousVotes: bigint
  ): 'up' | 'down' | 'stable' => {
    const current = Number(currentVotes);
    const previous = Number(previousVotes);
    const threshold = previous * 0.05; // 5% threshold

    if (current > previous + threshold) return 'up';
    if (current < previous - threshold) return 'down';
    return 'stable';
  };

  // Fetch voting results
  const fetchResults = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Extract gauge addresses from mappings
      const gaugeAddresses = charityMappings.map(
        mapping => mapping.gaugeAddress
      );

      // Get real-time results using voteTrackingService
      const liveResults =
        await voteTrackingService.calculateLiveResults(gaugeAddresses);

      // Create results array with charity data
      const charityResults: CharityResult[] = liveResults.tallies
        .map(tally => {
          // Find the corresponding charity mapping
          const mapping = charityMappings.find(
            m => m.gaugeAddress === tally.gaugeAddress
          );
          const charity = mapping
            ? getCharityById(mapping.charityId)
            : undefined;

          return {
            charityId:
              mapping?.charityId || `gauge-${tally.gaugeAddress.slice(0, 8)}`,
            charityName:
              mapping?.charityName ||
              `Gauge ${tally.gaugeAddress.slice(0, 8)}...`,
            charity,
            gaugeAddress: tally.gaugeAddress,
            totalVotes: tally.totalVotes,
            percentage: tally.percentage,
            rank: tally.rank,
            trend: 'stable' as const, // Will be calculated with previous data
            isLeading: tally.rank === 1 && tally.totalVotes > 0,
            votesFormatted: formatVotingPower(tally.totalVotes),
          };
        })
        .slice(0, showTopN);

      // Use real stats from voteTrackingService
      const newStats: VotingStats = {
        totalVotes: liveResults.totalVotes,
        totalParticipants: liveResults.totalParticipants,
        leadingCharity: charityResults[0] || null,
        totalVotingPower: await deployedGaugeService.getTotalVotingPowerCast(),
        participationRate:
          liveResults.totalVotes > 0
            ? (liveResults.totalParticipants /
                Math.max(liveResults.totalParticipants, 100)) *
              100
            : 0,
      };

      setResults(charityResults);
      setStats(newStats);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching voting results:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch voting results';
      setError(errorMessage);
      showError('Update Failed', errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (charityMappings.length > 0) {
      fetchResults();
    }
  }, [charityMappings]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval > 0 && charityMappings.length > 0) {
      const interval = setInterval(() => {
        fetchResults(true);
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, charityMappings]);

  // Manual refresh
  const handleRefresh = () => {
    fetchResults(true);
  };

  // Get trend icon
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down':
        return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  // Get rank icon
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Award className="w-5 h-5 text-slate-300" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <Target className="w-5 h-5 text-slate-400" />;
    }
  };

  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
          <span className="text-slate-300">Loading voting results...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('p-6 border-red-500/30 bg-red-500/5', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <div>
              <h3 className="font-semibold text-red-400">
                Error Loading Results
              </h3>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="border-red-400 text-red-400 hover:bg-red-500/10"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-green-500/30">
            <Activity className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              Live Voting Results
            </h3>
            <p className="text-sm text-slate-400">
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString()}`
                : 'Real-time charity voting'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-800/50 rounded-lg border border-slate-700/50">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-2 text-sm rounded-l-lg transition-colors',
                viewMode === 'list'
                  ? 'bg-blue-500/20 text-blue-400 border-r border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-300'
              )}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={cn(
                'px-3 py-2 text-sm rounded-r-lg transition-colors',
                viewMode === 'chart'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              )}
            >
              <PieChart className="w-4 h-4" />
            </button>
          </div>

          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:border-green-400 hover:text-green-400"
          >
            <RefreshCw
              className={cn('w-4 h-4 mr-1', isRefreshing && 'animate-spin')}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 border-slate-700/50 bg-slate-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Total Votes</p>
                <p className="text-lg font-bold text-white">
                  {formatVotingPower(stats.totalVotes)}
                </p>
              </div>
              <Vote className="w-8 h-8 text-blue-400" />
            </div>
          </Card>

          <Card className="p-4 border-slate-700/50 bg-slate-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Participants</p>
                <p className="text-lg font-bold text-white">
                  {stats.totalParticipants.toLocaleString()}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-400" />
            </div>
          </Card>

          <Card className="p-4 border-slate-700/50 bg-slate-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Participation</p>
                <p className="text-lg font-bold text-white">
                  {stats.participationRate.toFixed(1)}%
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-400" />
            </div>
          </Card>

          <Card className="p-4 border-slate-700/50 bg-slate-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Leading</p>
                <p className="text-sm font-semibold text-white truncate">
                  {stats.leadingCharity?.charityName || 'No votes yet'}
                </p>
              </div>
              <Trophy className="w-8 h-8 text-yellow-400" />
            </div>
          </Card>
        </div>
      )}

      {/* Results Display */}
      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div
            key="list"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            className="space-y-3"
          >
            {results.length === 0 ? (
              <Card className="p-8 text-center border-slate-700/50 bg-slate-800/50">
                <Vote className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-slate-300 mb-2">
                  No Votes Yet
                </h4>
                <p className="text-sm text-slate-400">
                  Be the first to vote for your favorite charity!
                </p>
              </Card>
            ) : (
              results.map((result, index) => (
                <motion.div
                  key={result.charityId}
                  variants={slideInVariants}
                  initial="initial"
                  animate="enter"
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className={cn(
                      'p-4 border-slate-700/50 bg-slate-800/50 hover:border-slate-600/50 transition-all duration-300',
                      result.isLeading && 'border-yellow-500/30 bg-yellow-500/5'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Rank */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-700/50 border border-slate-600/30">
                          {result.isLeading ? (
                            <div className="relative">
                              {getRankIcon(result.rank)}
                              <Flame className="w-3 h-3 text-orange-400 absolute -top-1 -right-1" />
                            </div>
                          ) : (
                            getRankIcon(result.rank)
                          )}
                        </div>

                        {/* Charity Info */}
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-600/30">
                            {result.charity?.logo ? (
                              <img
                                src={result.charity.logo}
                                alt={result.charityName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-700/50 flex items-center justify-center">
                                <Heart className="w-4 h-4 text-red-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">
                              {result.charityName}
                            </h4>
                            <div className="flex items-center space-x-2 text-xs text-slate-400">
                              <span>
                                {result.charity?.impactMetrics.veteransServed.toLocaleString()}{' '}
                                veterans served
                              </span>
                              {getTrendIcon(result.trend)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Vote Stats */}
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">
                          {result.votesFormatted}
                        </div>
                        <div className="text-sm text-slate-400">
                          {result.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>Vote Share</span>
                        <span>{result.percentage.toFixed(2)}%</span>
                      </div>
                      <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className={cn(
                            'h-full rounded-full',
                            result.isLeading
                              ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                              : 'bg-gradient-to-r from-blue-400 to-purple-400'
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${result.percentage}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key="chart"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            exit="exit"
          >
            <Card className="p-6 border-slate-700/50 bg-slate-800/50">
              <div className="text-center">
                <PieChart className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-slate-300 mb-2">
                  Chart View
                </h4>
                <p className="text-sm text-slate-400">
                  Chart visualization coming soon!
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-refresh indicator */}
      {refreshInterval > 0 && (
        <div className="flex items-center justify-center text-xs text-slate-400">
          <Clock className="w-3 h-3 mr-1" />
          Auto-refreshes every {Math.floor(refreshInterval / 1000)} seconds
        </div>
      )}
    </div>
  );
}
