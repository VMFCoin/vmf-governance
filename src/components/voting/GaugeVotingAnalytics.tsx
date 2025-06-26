'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Users,
  Zap,
  Clock,
  Award,
  RefreshCw,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Activity,
  Target,
  Gauge,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import {
  deployedGaugeService,
  DeployedGaugeInfo,
  HolidayVotingResults,
} from '@/services/deployedGaugeService';
import { holidayCharityGaugeService } from '@/services/holidayCharityGaugeService';
import { cn } from '@/lib/utils';
import { fadeInVariants } from '@/lib/animations';
import { Address } from 'viem';

interface GaugeVotingAnalyticsProps {
  holidayId?: string;
  charityIds?: string[];
  className?: string;
}

export function GaugeVotingAnalytics({
  holidayId,
  charityIds,
  className,
}: GaugeVotingAnalyticsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allGauges, setAllGauges] = useState<DeployedGaugeInfo[]>([]);
  const [holidayResults, setHolidayResults] =
    useState<HolidayVotingResults | null>(null);
  const [votingPeriodInfo, setVotingPeriodInfo] = useState<any>(null);
  const [totalVotingPower, setTotalVotingPower] = useState<bigint>(BigInt(0));
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showDetails, setShowDetails] = useState(false);

  const { showError } = useToast();

  // Load gauge analytics data
  const loadAnalyticsData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get all deployed gauges
      const gauges = await deployedGaugeService.getAllGaugeInfo();
      setAllGauges(gauges);

      // Get holiday-specific results if provided
      if (holidayId && charityIds) {
        const results = await deployedGaugeService.getHolidayVotingResults(
          holidayId,
          charityIds
        );
        setHolidayResults(results);
      }

      // Get voting period information
      const periodInfo = await holidayCharityGaugeService.getVotingPeriodInfo();
      setVotingPeriodInfo(periodInfo);

      // Get total voting power cast
      const totalPower = await deployedGaugeService.getTotalVotingPowerCast();
      setTotalVotingPower(totalPower);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to load analytics'
      );
      showError('Analytics Error', 'Failed to load voting analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize data on mount
  useEffect(() => {
    loadAnalyticsData();
  }, [holidayId, charityIds]);

  // Real-time updates
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const unsubscribe = holidayCharityGaugeService.subscribeToVotingEvents(
      () => {
        // Refresh data when new votes come in
        loadAnalyticsData();
      }
    );

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadAnalyticsData();
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [isRealTimeEnabled]);

  // Calculate analytics metrics
  const analytics = useMemo(() => {
    const activeGauges = allGauges.filter(gauge => gauge.active);
    const totalVotes = allGauges.reduce(
      (sum, gauge) => sum + Number(gauge.totalVotes),
      0
    );
    const averageVotesPerGauge =
      activeGauges.length > 0 ? totalVotes / activeGauges.length : 0;

    // Holiday-specific metrics
    const holidayMetrics = holidayResults
      ? {
          totalHolidayVotes: Number(holidayResults.totalVotes),
          charitiesCount: holidayResults.charityMappings.length,
          leadingCharity: holidayResults.leadingCharity,
          votingComplete: holidayResults.votingComplete,
        }
      : null;

    return {
      totalGauges: allGauges.length,
      activeGauges: activeGauges.length,
      totalVotes,
      averageVotesPerGauge,
      totalVotingPowerCast: Number(totalVotingPower) / 1e18,
      holidayMetrics,
    };
  }, [allGauges, holidayResults, totalVotingPower]);

  // Top performing gauges
  const topGauges = useMemo(() => {
    return [...allGauges]
      .sort((a, b) => Number(b.totalVotes) - Number(a.totalVotes))
      .slice(0, 5);
  }, [allGauges]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatVotingPower = (power: number): string => {
    if (power === 0) return '0';
    if (power < 1) return power.toFixed(4);
    return power.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Gauge Voting Analytics
            </h2>
            <p className="text-sm text-slate-400">
              Real-time voting data and insights
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
            className={cn(
              'border-slate-600 text-slate-300',
              isRealTimeEnabled && 'border-green-500/50 text-green-400'
            )}
          >
            {isRealTimeEnabled ? (
              <Eye className="w-4 h-4 mr-1" />
            ) : (
              <EyeOff className="w-4 h-4 mr-1" />
            )}
            Live Updates
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={loadAnalyticsData}
            disabled={isLoading}
            className="text-slate-300 hover:text-white"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="p-4 border-red-500/50 bg-red-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={loadAnalyticsData}
              className="text-red-400 hover:text-red-300"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Gauges',
            value: analytics.totalGauges,
            icon: Gauge,
            color: 'blue',
            subtext: `${analytics.activeGauges} active`,
          },
          {
            label: 'Total Votes',
            value: formatNumber(analytics.totalVotes),
            icon: Users,
            color: 'green',
            subtext: `${formatNumber(analytics.averageVotesPerGauge)} avg per gauge`,
          },
          {
            label: 'Voting Power Cast',
            value: formatVotingPower(analytics.totalVotingPowerCast),
            icon: Zap,
            color: 'yellow',
            subtext: 'VMF tokens',
          },
          {
            label: 'Voting Status',
            value: votingPeriodInfo?.isActive ? 'Active' : 'Inactive',
            icon: Activity,
            color: votingPeriodInfo?.isActive ? 'green' : 'red',
            subtext: `Epoch ${votingPeriodInfo?.epochId?.toString() || 'N/A'}`,
          },
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={cn(
                'p-4 border-slate-700/50 bg-slate-800/50',
                metric.color === 'blue' && 'border-blue-500/30 bg-blue-500/5',
                metric.color === 'green' &&
                  'border-green-500/30 bg-green-500/5',
                metric.color === 'yellow' &&
                  'border-yellow-500/30 bg-yellow-500/5',
                metric.color === 'red' && 'border-red-500/30 bg-red-500/5'
              )}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    metric.color === 'blue' && 'bg-blue-500/20 text-blue-400',
                    metric.color === 'green' &&
                      'bg-green-500/20 text-green-400',
                    metric.color === 'yellow' &&
                      'bg-yellow-500/20 text-yellow-400',
                    metric.color === 'red' && 'bg-red-500/20 text-red-400'
                  )}
                >
                  <metric.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-400">{metric.label}</div>
                  <div className="text-lg font-bold text-white truncate">
                    {metric.value}
                  </div>
                  <div className="text-xs text-slate-500">{metric.subtext}</div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Holiday-Specific Results */}
      {analytics.holidayMetrics && (
        <Card className="p-6 border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Award className="w-6 h-6 text-yellow-400" />
              <h3 className="text-lg font-bold text-white">
                Holiday Voting Results
              </h3>
            </div>
            <div
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium',
                analytics.holidayMetrics.votingComplete
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-blue-500/20 text-blue-400'
              )}
            >
              {analytics.holidayMetrics.votingComplete
                ? 'Complete'
                : 'In Progress'}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-slate-400">Total Holiday Votes</div>
              <div className="text-2xl font-bold text-white">
                {formatNumber(analytics.holidayMetrics.totalHolidayVotes)}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Charities</div>
              <div className="text-2xl font-bold text-white">
                {analytics.holidayMetrics.charitiesCount}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Leading Charity</div>
              <div className="text-lg font-bold text-yellow-400 truncate">
                {analytics.holidayMetrics.leadingCharity?.charityName || 'N/A'}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Top Performing Gauges */}
      <Card className="p-6 border-slate-700/50 bg-slate-800/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span>Top Performing Gauges</span>
          </h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDetails(!showDetails)}
            className="text-slate-400 hover:text-white"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>

        <div className="space-y-3">
          {topGauges.map((gauge, index) => (
            <motion.div
              key={gauge.address}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/30"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold',
                    index === 0 && 'bg-yellow-500 text-yellow-900',
                    index === 1 && 'bg-slate-400 text-slate-900',
                    index === 2 && 'bg-amber-600 text-amber-100',
                    index > 2 && 'bg-slate-600 text-slate-200'
                  )}
                >
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-white">{gauge.name}</div>
                  {showDetails && (
                    <div className="text-xs text-slate-400 font-mono">
                      {gauge.address.slice(0, 8)}...{gauge.address.slice(-6)}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-white">
                  {formatNumber(Number(gauge.totalVotes))}
                </div>
                <div className="text-xs text-slate-400">votes</div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Last Updated */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
        </div>
        {isRealTimeEnabled && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Live updates enabled</span>
          </div>
        )}
      </div>
    </div>
  );
}
