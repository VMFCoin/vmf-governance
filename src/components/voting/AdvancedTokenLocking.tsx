'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Plus,
  TrendingUp,
  Clock,
  DollarSign,
  BarChart3,
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import { Button, Card, Input, Badge } from '../ui';
import { TokenLockingModal, VotingPowerDisplay } from './';
import { useTokenLockStore } from '@/stores/useTokenLockStore';
import { useWalletStore } from '@/stores/useWalletStore';
import {
  votingPowerCalculator,
  type LockOptimization,
  type PowerDecayProjection,
} from '@/lib/votingPowerCalculations';
import { cn, formatTokenAmount, formatDuration } from '@/lib/utils';
import {
  fadeInVariants,
  staggerContainer,
  slideInVariants,
} from '@/lib/animations';

interface AdvancedTokenLockingProps {
  className?: string;
}

interface LockAnalytics {
  totalValue: bigint;
  averageEfficiency: number;
  totalDecayRate: number;
  riskScore: number;
  optimizationPotential: number;
}

export const AdvancedTokenLocking: React.FC<AdvancedTokenLockingProps> = ({
  className,
}) => {
  const [isLockingModalOpen, setIsLockingModalOpen] = useState(false);
  const [selectedView, setSelectedView] = useState<
    'overview' | 'analytics' | 'optimization'
  >('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [optimization, setOptimization] = useState<LockOptimization | null>(
    null
  );
  const [analytics, setAnalytics] = useState<LockAnalytics | null>(null);
  const [powerProjections, setPowerProjections] = useState<
    Map<number, PowerDecayProjection>
  >(new Map());

  const { isConnected, address } = useWalletStore();
  const {
    userLocks,
    votingPowerBreakdown,
    isLoading: storeLoading,
    error,
    fetchUserLocks,
  } = useTokenLockStore();

  // Fetch and analyze lock data
  const analyzePortfolio = useCallback(async () => {
    if (!isConnected || !address || userLocks.length === 0) return;

    setIsLoading(true);
    try {
      const tokenIds = userLocks.map(lock => lock.id);

      // Get optimization recommendations
      const optimizationData =
        await votingPowerCalculator.optimizeLockPortfolio(tokenIds);
      setOptimization(optimizationData);

      // Calculate analytics
      let totalValue = BigInt(0);
      let totalEfficiency = 0;
      let totalDecayRate = 0;
      const projections = new Map<number, PowerDecayProjection>();

      for (const lock of userLocks) {
        totalValue += lock.amount;

        // Calculate efficiency
        const efficiency = await votingPowerCalculator.calculateLockEfficiency(
          lock.id
        );
        totalEfficiency += efficiency;

        // Calculate power decay projection (6 months ahead)
        const futureTime =
          Math.floor(Date.now() / 1000) + 6 * 30 * 24 * 60 * 60;
        const projection = await votingPowerCalculator.calculatePowerDecay(
          lock.id,
          futureTime
        );
        projections.set(lock.id, projection);

        // Calculate decay rate
        const currentPower = projection.currentPower;
        const futurePower =
          projection.projections[projection.projections.length - 1]?.power ||
          BigInt(0);
        const decayRate =
          currentPower > 0
            ? Number(
                ((currentPower - futurePower) * BigInt(100)) / currentPower
              )
            : 0;
        totalDecayRate += decayRate;
      }

      setPowerProjections(projections);

      const averageEfficiency =
        userLocks.length > 0 ? totalEfficiency / userLocks.length : 0;
      const averageDecayRate =
        userLocks.length > 0 ? totalDecayRate / userLocks.length : 0;

      // Calculate risk score based on lock durations and amounts
      const riskScore =
        userLocks.reduce((acc, lock) => {
          const timeToExpiry = lock.expiresAt.getTime() - Date.now();
          const riskFactor = timeToExpiry < 30 * 24 * 60 * 60 * 1000 ? 80 : 20; // High risk if expiring in 30 days
          return acc + riskFactor;
        }, 0) / userLocks.length;

      setAnalytics({
        totalValue,
        averageEfficiency,
        totalDecayRate: averageDecayRate,
        riskScore,
        optimizationPotential: optimizationData.efficiency,
      });
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, userLocks]);

  useEffect(() => {
    if (isConnected && address) {
      fetchUserLocks(address);
    }
  }, [isConnected, address]);

  useEffect(() => {
    analyzePortfolio();
  }, [analyzePortfolio]);

  const handleRefresh = async () => {
    if (isConnected && address) {
      await fetchUserLocks(address);
      await analyzePortfolio();
    }
  };

  const handleLockCreated = () => {
    setIsLockingModalOpen(false);
    handleRefresh();
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-400';
    if (score < 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency > 0.8) return 'text-green-400';
    if (efficiency > 0.5) return 'text-yellow-400';
    return 'text-red-400';
  };

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
            <Lock className="w-8 h-8 text-patriotBlue" />
          </div>
          <h3 className="text-xl font-display font-bold text-patriotWhite mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-textSecondary mb-6">
            Connect your wallet to access advanced token locking features
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
            Advanced Token Locking
          </h2>
          <p className="text-textSecondary">
            Optimize your voting power with advanced lock management and
            analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || storeLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={cn(
                'w-4 h-4',
                (isLoading || storeLoading) && 'animate-spin'
              )}
            />
            Refresh
          </Button>
          <Button
            onClick={() => setIsLockingModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Lock
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex bg-backgroundAccent rounded-lg p-1">
        {[
          { key: 'overview' as const, label: 'Overview', icon: BarChart3 },
          { key: 'analytics' as const, label: 'Analytics', icon: TrendingUp },
          { key: 'optimization' as const, label: 'Optimization', icon: Zap },
        ].map(option => (
          <button
            key={option.key}
            onClick={() => setSelectedView(option.key)}
            className={cn(
              'flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2',
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

      {/* Content based on selected view */}
      <AnimatePresence mode="wait">
        {selectedView === 'overview' && (
          <motion.div
            key="overview"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Portfolio Summary */}
            <Card className="lg:col-span-2 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display font-bold text-patriotWhite">
                  Portfolio Summary
                </h3>
                <Badge variant={userLocks.length > 0 ? 'success' : 'secondary'}>
                  {userLocks.length} Locks
                </Badge>
              </div>

              {userLocks.length === 0 ? (
                <div className="text-center py-8">
                  <Lock className="w-12 h-12 text-textSecondary mx-auto mb-4" />
                  <p className="text-textSecondary mb-4">No locks found</p>
                  <Button onClick={() => setIsLockingModalOpen(true)}>
                    Create Your First Lock
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {userLocks.map((lock, index) => (
                    <motion.div
                      key={lock.id}
                      variants={slideInVariants}
                      custom={index}
                      className="p-4 bg-backgroundAccent rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-patriotBlue/20 rounded-full flex items-center justify-center">
                            <Lock className="w-5 h-5 text-patriotBlue" />
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
                        <div className="text-right">
                          <p className="font-semibold text-patriotWhite">
                            {formatTokenAmount(lock.votingPower)} VP
                          </p>
                          <p className="text-sm text-textSecondary">
                            Expires{' '}
                            {formatDuration(
                              lock.expiresAt.getTime() - Date.now()
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Lock Status */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          {lock.isWarmupComplete ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <Clock className="w-4 h-4 text-yellow-400" />
                          )}
                          <span
                            className={
                              lock.isWarmupComplete
                                ? 'text-green-400'
                                : 'text-yellow-400'
                            }
                          >
                            {lock.isWarmupComplete ? 'Active' : 'Warming Up'}
                          </span>
                        </div>

                        {powerProjections.has(lock.id) && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-textSecondary" />
                            <span className="text-textSecondary">
                              {powerProjections
                                .get(lock.id)!
                                .projections[0]?.percentageRemaining.toFixed(1)}
                              % in 6mo
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>

            {/* Quick Stats */}
            <div className="space-y-4">
              {analytics && (
                <>
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <DollarSign className="w-5 h-5 text-patriotBlue" />
                      <h4 className="font-semibold text-patriotWhite">
                        Total Value
                      </h4>
                    </div>
                    <p className="text-2xl font-bold text-patriotWhite">
                      {formatTokenAmount(analytics.totalValue)}
                    </p>
                    <p className="text-sm text-textSecondary">
                      VMF Tokens Locked
                    </p>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <BarChart3 className="w-5 h-5 text-patriotBlue" />
                      <h4 className="font-semibold text-patriotWhite">
                        Efficiency
                      </h4>
                    </div>
                    <p
                      className={cn(
                        'text-2xl font-bold',
                        getEfficiencyColor(analytics.averageEfficiency)
                      )}
                    >
                      {(analytics.averageEfficiency * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-textSecondary">
                      Average Lock Efficiency
                    </p>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <AlertTriangle className="w-5 h-5 text-patriotBlue" />
                      <h4 className="font-semibold text-patriotWhite">
                        Risk Score
                      </h4>
                    </div>
                    <p
                      className={cn(
                        'text-2xl font-bold',
                        getRiskColor(analytics.riskScore)
                      )}
                    >
                      {analytics.riskScore.toFixed(0)}
                    </p>
                    <p className="text-sm text-textSecondary">
                      Portfolio Risk Level
                    </p>
                  </Card>
                </>
              )}
            </div>
          </motion.div>
        )}

        {selectedView === 'analytics' && (
          <motion.div
            key="analytics"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Power Decay Chart */}
            <Card className="p-6">
              <h3 className="text-xl font-display font-bold text-patriotWhite mb-4">
                Voting Power Decay
              </h3>
              <div className="h-64 flex items-center justify-center text-textSecondary">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Power decay visualization</p>
                  <p className="text-sm">(Chart implementation pending)</p>
                </div>
              </div>
            </Card>

            {/* Lock Performance */}
            <Card className="p-6">
              <h3 className="text-xl font-display font-bold text-patriotWhite mb-4">
                Lock Performance
              </h3>
              <div className="space-y-4">
                {userLocks.map(lock => (
                  <div
                    key={lock.id}
                    className="p-3 bg-backgroundAccent rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-patriotWhite">
                        Lock #{lock.id}
                      </span>
                      <Badge variant="outline">
                        {(
                          (Number(lock.votingPower) / Number(lock.amount)) *
                          100
                        ).toFixed(1)}
                        % Efficiency
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-textSecondary">Amount</p>
                        <p className="text-patriotWhite">
                          {formatTokenAmount(lock.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-textSecondary">Voting Power</p>
                        <p className="text-patriotWhite">
                          {formatTokenAmount(lock.votingPower)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {selectedView === 'optimization' && (
          <motion.div
            key="optimization"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            className="space-y-6"
          >
            {optimization && (
              <>
                {/* Optimization Summary */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-display font-bold text-patriotWhite">
                      Portfolio Optimization
                    </h3>
                    <Badge
                      variant={
                        optimization.efficiency > 20 ? 'success' : 'secondary'
                      }
                    >
                      {optimization.efficiency.toFixed(1)}% Potential Gain
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-patriotWhite">
                        {formatTokenAmount(optimization.currentPower)}
                      </p>
                      <p className="text-sm text-textSecondary">
                        Current Power
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">
                        {formatTokenAmount(optimization.optimizedPower)}
                      </p>
                      <p className="text-sm text-textSecondary">
                        Optimized Power
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-patriotBlue">
                        +{formatTokenAmount(optimization.potentialGain)}
                      </p>
                      <p className="text-sm text-textSecondary">
                        Potential Gain
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Recommendations */}
                <Card className="p-6">
                  <h3 className="text-xl font-display font-bold text-patriotWhite mb-4">
                    Optimization Recommendations
                  </h3>
                  <div className="space-y-4">
                    {optimization.recommendations.map((rec, index) => (
                      <motion.div
                        key={index}
                        variants={slideInVariants}
                        custom={index}
                        className="p-4 bg-backgroundAccent rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-patriotBlue/20 rounded-full flex items-center justify-center">
                              <ArrowUpRight className="w-4 h-4 text-patriotBlue" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-patriotWhite capitalize">
                                {rec.type.replace('_', ' ')}
                              </h4>
                              <p className="text-sm text-textSecondary">
                                {rec.description}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">
                            {(rec.efficiency * 100).toFixed(0)}% Efficiency
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-textSecondary">Expected Gain</p>
                            <p className="text-green-400">
                              +{formatTokenAmount(rec.expectedPowerGain)}
                            </p>
                          </div>
                          <div>
                            <p className="text-textSecondary">Cost</p>
                            <p className="text-patriotWhite">
                              {rec.cost > 0
                                ? formatTokenAmount(rec.cost)
                                : 'Free'}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Token Locking Modal */}
      <TokenLockingModal
        isOpen={isLockingModalOpen}
        onClose={() => setIsLockingModalOpen(false)}
        onLockCreated={handleLockCreated}
      />
    </motion.div>
  );
};
