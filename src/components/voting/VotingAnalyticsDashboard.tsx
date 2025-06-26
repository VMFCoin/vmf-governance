'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Vote,
  Trophy,
  Target,
  Activity,
  Clock,
  Filter,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Settings,
  Info,
  ArrowUp,
  ArrowDown,
  Minus,
  Heart,
  DollarSign,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useCharityStore } from '@/stores/useCharityStore';
import {
  deployedGaugeService,
  HolidayVotingResults,
  CharityGaugeMapping,
} from '@/services/deployedGaugeService';
import { Charity } from '@/types';
import { cn } from '@/lib/utils';
import { fadeInVariants, slideInVariants } from '@/lib/animations';

interface VotingAnalyticsDashboardProps {
  charityMappings: CharityGaugeMapping[];
  className?: string;
}

interface AnalyticsMetric {
  id: string;
  label: string;
  value: string | number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  description: string;
}

interface CharityAnalytics {
  charityId: string;
  charityName: string;
  charity?: Charity;
  totalVotes: bigint;
  percentage: number;
  rank: number;
  votingPower: bigint;
  participationRate: number;
  avgVoteSize: number;
  uniqueVoters: number;
  momentum: 'gaining' | 'losing' | 'stable';
  efficiency: number;
}

interface TimeSeriesData {
  timestamp: Date;
  totalVotes: number;
  participants: number;
  topCharity: string;
}

export function VotingAnalyticsDashboard({
  charityMappings,
  className,
}: VotingAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<CharityAnalytics[]>([]);
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    '1h' | '24h' | '7d' | '30d'
  >('24h');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'votes',
    'participants',
    'distribution',
  ]);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'trends'>(
    'overview'
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { showSuccess, showError } = useToast();
  const getCharityById = useCharityStore(state => state.getCharityById);

  // Format numbers for display
  const formatNumber = (num: number | bigint): string => {
    const value = typeof num === 'bigint' ? Number(num) : num;
    if (value < 1000) return value.toFixed(0);
    if (value < 1000000) return `${(value / 1000).toFixed(1)}K`;
    return `${(value / 1000000).toFixed(1)}M`;
  };

  // Format voting power
  const formatVotingPower = (power: bigint): string => {
    const formatted = Number(power) / 1e18;
    if (formatted < 1) return formatted.toFixed(4);
    if (formatted < 1000) return formatted.toFixed(2);
    if (formatted < 1000000) return `${(formatted / 1000).toFixed(2)}K`;
    return `${(formatted / 1000000).toFixed(2)}M`;
  };

  // Calculate momentum based on voting trends
  const calculateMomentum = (
    currentVotes: bigint,
    previousVotes: bigint
  ): 'gaining' | 'losing' | 'stable' => {
    const current = Number(currentVotes);
    const previous = Number(previousVotes);
    const change = (current - previous) / previous;

    if (change > 0.1) return 'gaining';
    if (change < -0.1) return 'losing';
    return 'stable';
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      // For now, we'll use mock data since we need specific holiday and charity IDs
      // In a real implementation, these would be passed as props or retrieved from context
      const mockHolidayId = 'veterans-day-2024';
      const charityIds = charityMappings.map(mapping => mapping.charityId);

      const votingResults = await deployedGaugeService.getHolidayVotingResults(
        mockHolidayId,
        charityIds
      );

      if (!votingResults) {
        throw new Error('No voting results available');
      }

      // Calculate total votes from charity mappings
      const totalVotes = votingResults.charityMappings.reduce(
        (sum, mapping) => sum + mapping.votes,
        BigInt(0)
      );

      // Create charity analytics
      const charityAnalytics: CharityAnalytics[] = votingResults.charityMappings
        .map(mapping => {
          const percentage =
            totalVotes > 0
              ? (Number(mapping.votes) / Number(totalVotes)) * 100
              : 0;
          const charity = getCharityById(mapping.charityId);

          // Mock additional analytics data
          const uniqueVoters =
            Math.floor(Number(mapping.votes) / 1000) +
            Math.floor(Math.random() * 50);
          const avgVoteSize =
            uniqueVoters > 0 ? Number(mapping.votes) / uniqueVoters : 0;
          const mockTotalParticipants = 1000; // Mock value
          const participationRate =
            mockTotalParticipants > 0
              ? (uniqueVoters / mockTotalParticipants) * 100
              : 0;

          return {
            charityId: mapping.charityId,
            charityName: mapping.charityName,
            charity,
            totalVotes: mapping.votes,
            percentage,
            rank: 0, // Will be set after sorting
            votingPower: mapping.votes,
            participationRate,
            avgVoteSize,
            uniqueVoters,
            momentum: calculateMomentum(
              mapping.votes,
              BigInt(Math.floor(Number(mapping.votes) * 0.8))
            ),
            efficiency: charity
              ? (charity.impactMetrics.veteransServed /
                  Number(mapping.votes || 1)) *
                100
              : 0,
          };
        })
        .sort((a, b) => Number(b.totalVotes) - Number(a.totalVotes))
        .map((item, index) => ({ ...item, rank: index + 1 }));

      // Create metrics
      const topCharity = charityAnalytics[0];
      const mockTotalParticipants = 1000; // Mock value
      const mockTotalVotingPower = totalVotes * BigInt(2); // Mock available voting power

      const analyticsMetrics: AnalyticsMetric[] = [
        {
          id: 'total-votes',
          label: 'Total Votes',
          value: formatVotingPower(totalVotes),
          change: 12.5,
          changeType: 'positive',
          trend: 'up',
          icon: <Vote className="w-5 h-5" />,
          description: 'Total voting power allocated across all charities',
        },
        {
          id: 'participants',
          label: 'Active Voters',
          value: mockTotalParticipants.toLocaleString(),
          change: 8.3,
          changeType: 'positive',
          trend: 'up',
          icon: <Users className="w-5 h-5" />,
          description: 'Number of unique addresses that have voted',
        },
        {
          id: 'leading-charity',
          label: 'Leading Charity',
          value: topCharity?.charityName || 'None',
          change: topCharity?.percentage || 0,
          changeType: 'neutral',
          trend: 'stable',
          icon: <Trophy className="w-5 h-5" />,
          description: 'Charity currently receiving the most votes',
        },
        {
          id: 'participation-rate',
          label: 'Participation Rate',
          value: `${((Number(totalVotes) / Number(mockTotalVotingPower)) * 100).toFixed(1)}%`,
          change: 5.2,
          changeType: 'positive',
          trend: 'up',
          icon: <Activity className="w-5 h-5" />,
          description: 'Percentage of available voting power being used',
        },
        {
          id: 'avg-vote-size',
          label: 'Average Vote Size',
          value: formatVotingPower(
            totalVotes / BigInt(Math.max(mockTotalParticipants, 1))
          ),
          change: -2.1,
          changeType: 'negative',
          trend: 'down',
          icon: <Target className="w-5 h-5" />,
          description: 'Average voting power per participant',
        },
        {
          id: 'vote-distribution',
          label: 'Vote Distribution',
          value: `${charityAnalytics.filter(c => c.percentage > 0).length}/${charityMappings.length}`,
          change: 0,
          changeType: 'neutral',
          trend: 'stable',
          icon: <PieChart className="w-5 h-5" />,
          description: 'Number of charities receiving votes',
        },
      ];

      setAnalytics(charityAnalytics);
      setMetrics(analyticsMetrics);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching analytics:', error);
      showError('Analytics Error', 'Failed to load voting analytics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (charityMappings.length > 0) {
      fetchAnalytics();
    }
  }, [charityMappings]);

  // Manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAnalytics();
  };

  // Toggle metric visibility
  const toggleMetric = (metricId: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metricId)
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  // Export data
  const handleExport = () => {
    const data = {
      metrics,
      analytics,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voting-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccess('Export Complete', 'Analytics data exported successfully');
  };

  // Get trend icon
  const getTrendIcon = (
    trend: 'up' | 'down' | 'stable',
    changeType: 'positive' | 'negative' | 'neutral'
  ) => {
    const colorClass =
      changeType === 'positive'
        ? 'text-green-400'
        : changeType === 'negative'
          ? 'text-red-400'
          : 'text-slate-400';

    switch (trend) {
      case 'up':
        return <ArrowUp className={cn('w-4 h-4', colorClass)} />;
      case 'down':
        return <ArrowDown className={cn('w-4 h-4', colorClass)} />;
      default:
        return <Minus className={cn('w-4 h-4', colorClass)} />;
    }
  };

  // Get momentum color
  const getMomentumColor = (momentum: 'gaining' | 'losing' | 'stable') => {
    switch (momentum) {
      case 'gaining':
        return 'text-green-400';
      case 'losing':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center space-x-3">
          <BarChart3 className="w-6 h-6 animate-pulse text-blue-400" />
          <span className="text-slate-300">Loading analytics...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
            <BarChart3 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Voting Analytics</h3>
            <p className="text-sm text-slate-400">
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString()}`
                : 'Comprehensive voting insights'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-800/50 rounded-lg border border-slate-700/50">
            {[
              {
                id: 'overview',
                icon: <Eye className="w-4 h-4" />,
                label: 'Overview',
              },
              {
                id: 'detailed',
                icon: <BarChart3 className="w-4 h-4" />,
                label: 'Detailed',
              },
              {
                id: 'trends',
                icon: <TrendingUp className="w-4 h-4" />,
                label: 'Trends',
              },
            ].map((mode, index) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as any)}
                className={cn(
                  'px-3 py-2 text-sm transition-colors',
                  index === 0 && 'rounded-l-lg',
                  index === 2 && 'rounded-r-lg',
                  index === 1 && 'border-x border-slate-700/50',
                  viewMode === mode.id
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-slate-400 hover:text-slate-300'
                )}
              >
                {mode.icon}
              </button>
            ))}
          </div>

          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:border-blue-400 hover:text-blue-400"
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>

          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:border-purple-400 hover:text-purple-400"
          >
            <RefreshCw
              className={cn('w-4 h-4 mr-1', isRefreshing && 'animate-spin')}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            variants={slideInVariants}
            initial="initial"
            animate="enter"
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4 border-slate-700/50 bg-slate-800/50 hover:border-slate-600/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-slate-400">
                  {metric.icon}
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                {getTrendIcon(metric.trend, metric.changeType)}
              </div>

              <div className="space-y-1">
                <div className="text-2xl font-bold text-white">
                  {metric.value}
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      metric.changeType === 'positive'
                        ? 'text-green-400'
                        : metric.changeType === 'negative'
                          ? 'text-red-400'
                          : 'text-slate-400'
                    )}
                  >
                    {metric.changeType !== 'neutral' &&
                      (metric.change > 0 ? '+' : '')}
                    {metric.change}%
                  </span>
                  <span className="text-xs text-slate-500">
                    vs previous period
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-700/50">
                <p className="text-xs text-slate-400">{metric.description}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Analytics Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'overview' && (
          <motion.div
            key="overview"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            className="space-y-6"
          >
            {/* Top Performing Charities */}
            <Card className="p-6 border-slate-700/50 bg-slate-800/50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">
                  Top Performing Charities
                </h4>
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>

              <div className="space-y-3">
                {analytics.slice(0, 5).map((charity, index) => (
                  <div
                    key={charity.charityId}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 border border-slate-600/30"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-600/50 flex items-center justify-center text-sm font-bold text-white">
                        {charity.rank}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded overflow-hidden">
                          {charity.charity?.logo ? (
                            <img
                              src={charity.charity.logo}
                              alt={charity.charityName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-600/50 flex items-center justify-center">
                              <Heart className="w-3 h-3 text-red-400" />
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-white">
                          {charity.charityName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-white">
                          {formatVotingPower(charity.totalVotes)}
                        </div>
                        <div className="text-xs text-slate-400">
                          {charity.percentage.toFixed(1)}%
                        </div>
                      </div>
                      <div
                        className={cn(
                          'text-sm font-medium',
                          getMomentumColor(charity.momentum)
                        )}
                      >
                        {charity.momentum}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Voting Distribution */}
            <Card className="p-6 border-slate-700/50 bg-slate-800/50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">
                  Vote Distribution
                </h4>
                <PieChart className="w-5 h-5 text-blue-400" />
              </div>

              <div className="space-y-3">
                {analytics
                  .filter(c => c.percentage > 0)
                  .map(charity => (
                    <div key={charity.charityId} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">
                          {charity.charityName}
                        </span>
                        <span className="text-white font-medium">
                          {charity.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-700/50 rounded-full h-2">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${charity.percentage}%` }}
                          transition={{ duration: 1, delay: 0.1 }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </motion.div>
        )}

        {viewMode === 'detailed' && (
          <motion.div
            key="detailed"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            exit="exit"
          >
            <Card className="p-6 border-slate-700/50 bg-slate-800/50">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-slate-300 mb-2">
                  Detailed Analytics
                </h4>
                <p className="text-sm text-slate-400">
                  Advanced analytics features coming soon!
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        {viewMode === 'trends' && (
          <motion.div
            key="trends"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            exit="exit"
          >
            <Card className="p-6 border-slate-700/50 bg-slate-800/50">
              <div className="text-center">
                <TrendingUp className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-slate-300 mb-2">
                  Trend Analysis
                </h4>
                <p className="text-sm text-slate-400">
                  Historical trend analysis coming soon!
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
