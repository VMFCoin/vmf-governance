'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  Calendar,
  DollarSign,
  Activity,
  PieChart,
} from 'lucide-react';
import { Button, Card, Badge } from '../ui';
import { useTokenLockStore } from '@/stores/useTokenLockStore';
import { useWalletStore } from '@/stores/useWalletStore';
import {
  votingPowerCalculator,
  type PowerDecayProjection,
} from '@/lib/votingPowerCalculations';
import {
  cn,
  formatTokenAmount,
  formatDuration,
  formatPercentage,
} from '@/lib/utils';
import {
  fadeInVariants,
  staggerContainer,
  slideInVariants,
} from '@/lib/animations';

interface LockAnalyticsDashboardProps {
  className?: string;
}

interface AnalyticsData {
  totalValue: bigint;
  totalVotingPower: bigint;
  averageEfficiency: number;
  portfolioRisk: number;
  powerDecayRate: number;
  optimizationScore: number;
  timeToNextExpiry: number;
  diversificationIndex: number;
}

interface LockMetrics {
  id: number;
  efficiency: number;
  riskScore: number;
  powerDecay: PowerDecayProjection | null;
  timeToExpiry: number;
  performanceRank: number;
}

export const LockAnalyticsDashboard: React.FC<LockAnalyticsDashboardProps> = ({
  className,
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [lockMetrics, setLockMetrics] = useState<Map<number, LockMetrics>>(
    new Map()
  );
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    '1M' | '3M' | '6M' | '1Y'
  >('6M');
  const [isLoading, setIsLoading] = useState(false);

  const { isConnected, address } = useWalletStore();
  const { userLocks, fetchUserLocks } = useTokenLockStore();

  // Calculate comprehensive analytics
  const calculateAnalytics = async () => {
    if (!userLocks.length) return;

    setIsLoading(true);
    try {
      let totalValue = BigInt(0);
      let totalVotingPower = BigInt(0);
      let totalEfficiency = 0;
      let totalRisk = 0;
      let totalDecayRate = 0;
      const metrics = new Map<number, LockMetrics>();

      // Calculate metrics for each lock
      for (let i = 0; i < userLocks.length; i++) {
        const lock = userLocks[i];
        totalValue += lock.amount;
        totalVotingPower += lock.votingPower;

        // Calculate efficiency
        const efficiency = await votingPowerCalculator.calculateLockEfficiency(
          lock.id
        );
        totalEfficiency += efficiency;

        // Calculate risk score based on time to expiry and amount
        const timeToExpiry = lock.expiresAt.getTime() - Date.now();
        const riskScore =
          timeToExpiry < 30 * 24 * 60 * 60 * 1000
            ? 80
            : timeToExpiry < 90 * 24 * 60 * 60 * 1000
              ? 50
              : 20;
        totalRisk += riskScore;

        // Calculate power decay projection
        const futureTime =
          Math.floor(Date.now() / 1000) +
          getTimeframeSeconds(selectedTimeframe);
        const powerDecay = await votingPowerCalculator.calculatePowerDecay(
          lock.id,
          futureTime
        );

        const currentPower = powerDecay.currentPower;
        const futurePower =
          powerDecay.projections[powerDecay.projections.length - 1]?.power ||
          BigInt(0);
        const decayRate =
          currentPower > 0
            ? Number(
                ((currentPower - futurePower) * BigInt(100)) / currentPower
              )
            : 0;
        totalDecayRate += decayRate;

        metrics.set(lock.id, {
          id: lock.id,
          efficiency,
          riskScore,
          powerDecay,
          timeToExpiry,
          performanceRank: i + 1, // Will be recalculated
        });
      }

      // Calculate portfolio-level metrics
      const averageEfficiency =
        userLocks.length > 0 ? totalEfficiency / userLocks.length : 0;
      const portfolioRisk =
        userLocks.length > 0 ? totalRisk / userLocks.length : 0;
      const powerDecayRate =
        userLocks.length > 0 ? totalDecayRate / userLocks.length : 0;

      // Calculate optimization score (higher is better)
      const optimizationScore = Math.max(
        0,
        100 - portfolioRisk - powerDecayRate * 2
      );

      // Calculate time to next expiry
      const nextExpiry = Math.min(
        ...userLocks.map(lock => lock.expiresAt.getTime())
      );
      const timeToNextExpiry = nextExpiry - Date.now();

      // Calculate diversification index (based on lock duration spread)
      const durations = userLocks.map(lock => lock.lockDuration);
      const avgDuration =
        durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const variance =
        durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) /
        durations.length;
      const diversificationIndex = Math.min(
        100,
        (Math.sqrt(variance) / avgDuration) * 100
      );

      // Rank locks by performance (efficiency * (100 - risk))
      const rankedMetrics = Array.from(metrics.values())
        .sort(
          (a, b) =>
            b.efficiency * (100 - b.riskScore) -
            a.efficiency * (100 - a.riskScore)
        )
        .map((metric, index) => ({ ...metric, performanceRank: index + 1 }));

      rankedMetrics.forEach(metric => metrics.set(metric.id, metric));

      setAnalyticsData({
        totalValue,
        totalVotingPower,
        averageEfficiency,
        portfolioRisk,
        powerDecayRate,
        optimizationScore,
        timeToNextExpiry,
        diversificationIndex,
      });

      setLockMetrics(metrics);
    } catch (error) {
      console.error('Error calculating analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeframeSeconds = (timeframe: string): number => {
    switch (timeframe) {
      case '1M':
        return 30 * 24 * 60 * 60;
      case '3M':
        return 90 * 24 * 60 * 60;
      case '6M':
        return 180 * 24 * 60 * 60;
      case '1Y':
        return 365 * 24 * 60 * 60;
      default:
        return 180 * 24 * 60 * 60;
    }
  };

  // Performance categories
  const getPerformanceCategory = (efficiency: number, risk: number) => {
    const score = (efficiency * (100 - risk)) / 100;
    if (score > 80)
      return {
        label: 'Excellent',
        color: 'text-green-400',
        bg: 'bg-green-500/20',
      };
    if (score > 60)
      return { label: 'Good', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    if (score > 40)
      return {
        label: 'Average',
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/20',
      };
    return { label: 'Poor', color: 'text-red-400', bg: 'bg-red-500/20' };
  };

  const getRiskColor = (risk: number) => {
    if (risk < 30) return 'text-green-400';
    if (risk < 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchUserLocks(address);
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (userLocks.length > 0) {
      calculateAnalytics();
    }
  }, [userLocks, selectedTimeframe]);

  if (!isConnected) {
    return (
      <motion.div
        variants={fadeInVariants}
        initial="initial"
        animate="enter"
        className={className}
      >
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-patriotBlue/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-patriotBlue" />
          </div>
          <h3 className="text-xl font-display font-bold text-patriotWhite mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-textSecondary">
            Connect your wallet to view detailed lock analytics
          </p>
        </Card>
      </motion.div>
    );
  }

  if (userLocks.length === 0) {
    return (
      <motion.div
        variants={fadeInVariants}
        initial="initial"
        animate="enter"
        className={className}
      >
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-patriotBlue/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <PieChart className="w-8 h-8 text-patriotBlue" />
          </div>
          <h3 className="text-xl font-display font-bold text-patriotWhite mb-2">
            No Locks Found
          </h3>
          <p className="text-textSecondary mb-4">
            Create your first token lock to start tracking analytics
          </p>
        </Card>
      </motion.div>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-patriotWhite mb-2">
            Lock Analytics Dashboard
          </h2>
          <p className="text-textSecondary">
            Comprehensive insights into your token lock performance
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex bg-backgroundAccent rounded-lg p-1">
          {(['1M', '3M', '6M', '1Y'] as const).map(timeframe => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={cn(
                'px-3 py-2 rounded-md text-sm font-medium transition-all',
                selectedTimeframe === timeframe
                  ? 'bg-patriotBlue text-patriotWhite shadow-sm'
                  : 'text-textSecondary hover:text-patriotWhite'
              )}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>

      {analyticsData && (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div variants={slideInVariants} custom={0}>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="w-5 h-5 text-patriotBlue" />
                  <h3 className="font-semibold text-patriotWhite">
                    Total Value
                  </h3>
                </div>
                <p className="text-2xl font-bold text-patriotWhite mb-1">
                  {formatTokenAmount(analyticsData.totalValue)}
                </p>
                <p className="text-sm text-textSecondary">VMF Tokens Locked</p>
              </Card>
            </motion.div>

            <motion.div variants={slideInVariants} custom={1}>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="w-5 h-5 text-patriotBlue" />
                  <h3 className="font-semibold text-patriotWhite">
                    Voting Power
                  </h3>
                </div>
                <p className="text-2xl font-bold text-patriotWhite mb-1">
                  {formatTokenAmount(analyticsData.totalVotingPower)}
                </p>
                <p className="text-sm text-textSecondary">Total VP Available</p>
              </Card>
            </motion.div>

            <motion.div variants={slideInVariants} custom={2}>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="w-5 h-5 text-patriotBlue" />
                  <h3 className="font-semibold text-patriotWhite">
                    Efficiency
                  </h3>
                </div>
                <p className="text-2xl font-bold text-green-400 mb-1">
                  {formatPercentage(analyticsData.averageEfficiency)}
                </p>
                <p className="text-sm text-textSecondary">
                  Average Lock Efficiency
                </p>
              </Card>
            </motion.div>

            <motion.div variants={slideInVariants} custom={3}>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-patriotBlue" />
                  <h3 className="font-semibold text-patriotWhite">
                    Risk Score
                  </h3>
                </div>
                <p
                  className={cn(
                    'text-2xl font-bold mb-1',
                    getRiskColor(analyticsData.portfolioRisk)
                  )}
                >
                  {analyticsData.portfolioRisk.toFixed(0)}
                </p>
                <p className="text-sm text-textSecondary">
                  Portfolio Risk Level
                </p>
              </Card>
            </motion.div>
          </div>

          {/* Advanced Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-display font-bold text-patriotWhite mb-4">
                Portfolio Health
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-textSecondary">Optimization Score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-backgroundAccent rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
                        style={{ width: `${analyticsData.optimizationScore}%` }}
                      />
                    </div>
                    <span className="text-patriotWhite font-semibold">
                      {analyticsData.optimizationScore.toFixed(0)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-textSecondary">Power Decay Rate</span>
                  <span
                    className={cn(
                      'font-semibold',
                      getRiskColor(analyticsData.powerDecayRate)
                    )}
                  >
                    {analyticsData.powerDecayRate.toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-textSecondary">
                    Diversification Index
                  </span>
                  <span className="text-patriotWhite font-semibold">
                    {analyticsData.diversificationIndex.toFixed(0)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-textSecondary">Next Expiry</span>
                  <span className="text-patriotWhite font-semibold">
                    {formatDuration(analyticsData.timeToNextExpiry)}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-display font-bold text-patriotWhite mb-4">
                Power Decay Projection
              </h3>
              <div className="h-48 flex items-center justify-center text-textSecondary">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Power decay chart</p>
                  <p className="text-sm">(Visualization pending)</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Individual Lock Performance */}
          <Card className="p-6">
            <h3 className="text-xl font-display font-bold text-patriotWhite mb-4">
              Individual Lock Performance
            </h3>
            <div className="space-y-4">
              {userLocks.map((lock, index) => {
                const metrics = lockMetrics.get(lock.id);
                if (!metrics) return null;

                const performance = getPerformanceCategory(
                  metrics.efficiency,
                  metrics.riskScore
                );

                return (
                  <motion.div
                    key={lock.id}
                    variants={slideInVariants}
                    custom={index}
                    className="p-4 bg-backgroundAccent rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-patriotBlue/20 rounded-full flex items-center justify-center">
                          <span className="text-patriotBlue font-bold">
                            #{metrics.performanceRank}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-patriotWhite">
                            Lock #{lock.id}
                          </h4>
                          <p className="text-sm text-textSecondary">
                            {formatTokenAmount(lock.amount)} VMF
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={performance.bg}>
                          <span className={performance.color}>
                            {performance.label}
                          </span>
                        </Badge>
                        <div className="text-right">
                          <p className="font-semibold text-patriotWhite">
                            {formatTokenAmount(lock.votingPower)} VP
                          </p>
                          <p className="text-sm text-textSecondary">
                            {formatPercentage(metrics.efficiency)} efficiency
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-textSecondary">Risk Score</p>
                        <p
                          className={cn(
                            'font-semibold',
                            getRiskColor(metrics.riskScore)
                          )}
                        >
                          {metrics.riskScore.toFixed(0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-textSecondary">Time to Expiry</p>
                        <p className="text-patriotWhite font-semibold">
                          {formatDuration(metrics.timeToExpiry)}
                        </p>
                      </div>
                      <div>
                        <p className="text-textSecondary">
                          Power Decay ({selectedTimeframe})
                        </p>
                        <p
                          className={cn(
                            'font-semibold',
                            getRiskColor(
                              metrics.powerDecay?.projections[0]
                                ?.percentageRemaining
                                ? 100 -
                                    metrics.powerDecay.projections[0]
                                      .percentageRemaining
                                : 0
                            )
                          )}
                        >
                          {metrics.powerDecay?.projections[0]?.percentageRemaining.toFixed(
                            1
                          ) || '0'}
                          % remaining
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-patriotBlue"></div>
        </div>
      )}
    </motion.div>
  );
};
