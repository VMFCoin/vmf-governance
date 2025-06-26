'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  BarChart3,
  Calendar,
  Users,
  Target,
  Activity,
  Award,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Card, Button, Badge } from '../ui';
import { useWalletStore } from '@/stores/useWalletStore';
import { useTokenLockStore } from '@/stores/useTokenLockStore';
import {
  votingPowerCalculator,
  type PowerAnalytics,
  type HistoricalPowerData,
  type PowerDecayProjection,
} from '@/lib/votingPowerCalculations';
import {
  cn,
  formatTokenAmount,
  formatPercentage,
  formatDuration,
} from '@/lib/utils';
import {
  fadeInVariants,
  slideUpVariants,
  staggerContainer,
} from '@/lib/animations';

interface VotingPowerChartProps {
  className?: string;
  showComparison?: boolean;
  showProjections?: boolean;
  timeframe?: '7d' | '30d' | '90d';
}

interface ChartDataPoint {
  timestamp: number;
  date: string;
  power: number;
  projectedPower?: number;
  decayPower?: number;
}

interface ComparisonData {
  category: string;
  value: number;
  color: string;
}

export const VotingPowerChart: React.FC<VotingPowerChartProps> = ({
  className,
  showComparison = true,
  showProjections = true,
  timeframe = '30d',
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [powerAnalytics, setPowerAnalytics] = useState<PowerAnalytics | null>(
    null
  );
  const [decayProjections, setDecayProjections] = useState<
    PowerDecayProjection[]
  >([]);
  const [selectedView, setSelectedView] = useState<
    'historical' | 'projections' | 'comparison'
  >('historical');
  const [isExpanded, setIsExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { address, isConnected } = useWalletStore();
  const { userLocks, fetchUserLocks } = useTokenLockStore();

  // Fetch power analytics data
  const fetchPowerAnalytics = async () => {
    if (!isConnected || !address || userLocks.length === 0) return;

    setIsLoading(true);
    try {
      const tokenIds = userLocks.map(lock => lock.id);
      const analytics = await votingPowerCalculator.getPowerAnalytics(
        address as `0x${string}`,
        tokenIds
      );
      setPowerAnalytics(analytics);

      // Fetch decay projections for each lock
      const projections: PowerDecayProjection[] = [];
      for (const tokenId of tokenIds) {
        try {
          const futureTime = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60; // 90 days
          const projection = await votingPowerCalculator.calculatePowerDecay(
            tokenId,
            futureTime
          );
          projections.push(projection);
        } catch (error) {
          console.warn(`Failed to get projection for token ${tokenId}:`, error);
        }
      }
      setDecayProjections(projections);
    } catch (error) {
      console.error('Failed to fetch power analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    votingPowerCalculator.clearCache();
    await fetchUserLocks(address!);
    await fetchPowerAnalytics();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchPowerAnalytics();
  }, [isConnected, address, userLocks.length]);

  // Prepare chart data
  const chartData = useMemo((): ChartDataPoint[] => {
    if (!powerAnalytics) return [];

    const data: ChartDataPoint[] = [];

    // Historical data
    powerAnalytics.historicalData.forEach(point => {
      data.push({
        timestamp: point.timestamp,
        date: new Date(point.timestamp * 1000).toLocaleDateString(),
        power: Number(point.power) / 1e18,
      });
    });

    // Add projected data if enabled
    if (showProjections && decayProjections.length > 0) {
      const currentTime = Math.floor(Date.now() / 1000);
      const futureTime = currentTime + 90 * 24 * 60 * 60;

      // Use first projection as representative
      const projection = decayProjections[0];
      projection.projections.forEach(proj => {
        const existingPoint = data.find(d => d.timestamp === proj.timestamp);
        if (existingPoint) {
          existingPoint.projectedPower = Number(proj.power) / 1e18;
        } else if (proj.timestamp > currentTime) {
          data.push({
            timestamp: proj.timestamp,
            date: new Date(proj.timestamp * 1000).toLocaleDateString(),
            power: 0,
            projectedPower: Number(proj.power) / 1e18,
          });
        }
      });
    }

    return data.sort((a, b) => a.timestamp - b.timestamp);
  }, [powerAnalytics, decayProjections, showProjections]);

  // Prepare comparison data
  const comparisonData = useMemo((): ComparisonData[] => {
    if (!powerAnalytics) return [];

    const userPower = Number(powerAnalytics.currentPower) / 1e18;
    const comparison = powerAnalytics.userComparison;

    return [
      {
        category: 'Your Power',
        value: userPower,
        color: '#3B82F6',
      },
      {
        category: `Top ${comparison.percentile}%`,
        value: userPower * 1.5, // Estimated top percentile power
        color: '#10B981',
      },
      {
        category: 'Average User',
        value: userPower * 0.6, // Estimated average power
        color: '#6B7280',
      },
    ];
  }, [powerAnalytics]);

  const formatPower = (value: number): string => {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const getTrendIcon = () => {
    if (!powerAnalytics) return <Activity className="w-4 h-4" />;

    switch (powerAnalytics.powerTrend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    if (!powerAnalytics) return 'text-gray-400';

    switch (powerAnalytics.powerTrend) {
      case 'increasing':
        return 'text-green-400';
      case 'decreasing':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (!isConnected) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center">
          <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-patriotWhite mb-2">
            Connect Wallet
          </h3>
          <p className="text-textSecondary text-sm">
            Connect your wallet to view voting power analytics
          </p>
        </div>
      </Card>
    );
  }

  if (userLocks.length === 0) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-patriotWhite mb-2">
            No Locks Found
          </h3>
          <p className="text-textSecondary text-sm">
            Create token locks to view voting power analytics
          </p>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="enter"
      className={cn('space-y-6', className)}
    >
      {/* Header */}
      <motion.div variants={fadeInVariants}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-patriotBlue/20 to-patriotRed/20 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-patriotBlue" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-patriotWhite">
                  Voting Power Analytics
                </h3>
                <p className="text-textSecondary text-sm">
                  Real-time power tracking and projections
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={cn('w-4 h-4', refreshing && 'animate-spin')}
              />
              Refresh
            </Button>
          </div>

          {/* Key Metrics */}
          {powerAnalytics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-patriotBlue/20 to-patriotBlue/10 rounded-lg p-4 border border-patriotBlue/30">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm font-medium text-patriotWhite">
                    Current Power
                  </span>
                </div>
                <div className="text-2xl font-bold text-patriotWhite">
                  {formatPower(Number(powerAnalytics.currentPower) / 1e18)}
                </div>
                <div className="text-xs text-textSecondary">
                  VMF Voting Power
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500/20 to-green-500/10 rounded-lg p-4 border border-green-500/30">
                <div className="flex items-center gap-2 mb-2">
                  {getTrendIcon()}
                  <span className="text-sm font-medium text-patriotWhite">
                    Trend (30d)
                  </span>
                </div>
                <div className={cn('text-2xl font-bold', getTrendColor())}>
                  {powerAnalytics.trendPercentage.toFixed(1)}%
                </div>
                <div className="text-xs text-textSecondary capitalize">
                  {powerAnalytics.powerTrend}
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500/20 to-purple-500/10 rounded-lg p-4 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-medium text-patriotWhite">
                    Rank
                  </span>
                </div>
                <div className="text-2xl font-bold text-purple-400">
                  #{powerAnalytics.userComparison.rank}
                </div>
                <div className="text-xs text-textSecondary">
                  Top {powerAnalytics.userComparison.percentile}%
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500/20 to-orange-500/10 rounded-lg p-4 border border-orange-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-orange-400" />
                  <span className="text-sm font-medium text-patriotWhite">
                    Efficiency
                  </span>
                </div>
                <div className="text-2xl font-bold text-orange-400">
                  {powerAnalytics.userComparison.averageEfficiency.toFixed(2)}
                </div>
                <div className="text-xs text-textSecondary">Power per VMF</div>
              </div>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex bg-backgroundAccent rounded-lg p-1 mb-6">
            {[
              { key: 'historical' as const, label: 'Historical', icon: Clock },
              {
                key: 'projections' as const,
                label: 'Projections',
                icon: TrendingUp,
              },
              { key: 'comparison' as const, label: 'Comparison', icon: Users },
            ].map(option => (
              <button
                key={option.key}
                onClick={() => setSelectedView(option.key)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all',
                  selectedView === option.key
                    ? 'bg-patriotBlue text-patriotWhite shadow-sm'
                    : 'text-textSecondary hover:text-patriotWhite'
                )}
              >
                <option.icon className="w-4 h-4" />
                {option.label}
              </button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Chart Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedView}
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          exit="exit"
        >
          <Card className="p-6">
            {isLoading ? (
              <div className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-patriotBlue mx-auto mb-4" />
                  <p className="text-textSecondary">Loading analytics...</p>
                </div>
              </div>
            ) : (
              <>
                {selectedView === 'historical' && (
                  <div>
                    <h4 className="text-lg font-semibold text-patriotWhite mb-4">
                      Historical Voting Power
                    </h4>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                          />
                          <XAxis
                            dataKey="date"
                            stroke="#9CA3AF"
                            fontSize={12}
                          />
                          <YAxis
                            stroke="#9CA3AF"
                            fontSize={12}
                            tickFormatter={formatPower}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#F3F4F6',
                            }}
                            formatter={(value: number) => [
                              formatPower(value),
                              'Voting Power',
                            ]}
                          />
                          <Area
                            type="monotone"
                            dataKey="power"
                            stroke="#3B82F6"
                            fill="url(#powerGradient)"
                            strokeWidth={2}
                          />
                          <defs>
                            <linearGradient
                              id="powerGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#3B82F6"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="#3B82F6"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {selectedView === 'projections' && (
                  <div>
                    <h4 className="text-lg font-semibold text-patriotWhite mb-4">
                      Power Decay Projections
                    </h4>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                          />
                          <XAxis
                            dataKey="date"
                            stroke="#9CA3AF"
                            fontSize={12}
                          />
                          <YAxis
                            stroke="#9CA3AF"
                            fontSize={12}
                            tickFormatter={formatPower}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#F3F4F6',
                            }}
                            formatter={(value: number, name: string) => [
                              formatPower(value),
                              name === 'power' ? 'Historical' : 'Projected',
                            ]}
                          />
                          <Line
                            type="monotone"
                            dataKey="power"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="projectedPower"
                            stroke="#EF4444"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-blue-500"></div>
                        <span className="text-textSecondary">
                          Historical Power
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-red-500 border-dashed"></div>
                        <span className="text-textSecondary">
                          Projected Decay
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedView === 'comparison' && showComparison && (
                  <div>
                    <h4 className="text-lg font-semibold text-patriotWhite mb-4">
                      User Comparison
                    </h4>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                          />
                          <XAxis
                            dataKey="category"
                            stroke="#9CA3AF"
                            fontSize={12}
                          />
                          <YAxis
                            stroke="#9CA3AF"
                            fontSize={12}
                            tickFormatter={formatPower}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#F3F4F6',
                            }}
                            formatter={(value: number) => [
                              formatPower(value),
                              'Voting Power',
                            ]}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {comparisonData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Detailed Analytics */}
      {powerAnalytics && (
        <motion.div variants={fadeInVariants}>
          <Card className="p-6">
            <Button
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full justify-between text-patriotWhite hover:bg-patriotBlue/20 mb-4"
            >
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                Detailed Analytics
              </span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h5 className="font-semibold text-patriotWhite">
                        Projections
                      </h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-textSecondary">
                            7-day projection:
                          </span>
                          <span className="text-patriotWhite">
                            {formatPower(
                              Number(powerAnalytics.projectedPower7d) / 1e18
                            )}{' '}
                            VMF
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-textSecondary">
                            30-day projection:
                          </span>
                          <span className="text-patriotWhite">
                            {formatPower(
                              Number(powerAnalytics.projectedPower30d) / 1e18
                            )}{' '}
                            VMF
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="font-semibold text-patriotWhite">
                        Portfolio Stats
                      </h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-textSecondary">
                            Total locks:
                          </span>
                          <span className="text-patriotWhite">
                            {powerAnalytics.userComparison.lockCount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-textSecondary">
                            Average efficiency:
                          </span>
                          <span className="text-patriotWhite">
                            {powerAnalytics.userComparison.averageEfficiency.toFixed(
                              3
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};
