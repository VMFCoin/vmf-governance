'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Zap,
  ArrowRight,
  RefreshCw,
  Calculator,
  Shield,
  Maximize,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { Button, Card, Badge } from '../ui';
import { useTokenLockStore } from '@/stores/useTokenLockStore';
import { useWalletStore } from '@/stores/useWalletStore';
import {
  votingPowerCalculator,
  type OptimizationRecommendation,
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

interface LockOptimizationRecommendationsProps {
  className?: string;
  onOptimizationSelect?: (recommendation: OptimizationRecommendation) => void;
}

interface RecommendationCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  recommendations: OptimizationRecommendation[];
}

interface OptimizationMetrics {
  totalPotentialGain: bigint;
  riskReduction: number;
  efficiencyImprovement: number;
  gasOptimization: bigint;
  timeToImplement: number;
}

export const LockOptimizationRecommendations: React.FC<
  LockOptimizationRecommendationsProps
> = ({ className, onOptimizationSelect }) => {
  const [recommendations, setRecommendations] = useState<
    OptimizationRecommendation[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [optimizationMetrics, setOptimizationMetrics] =
    useState<OptimizationMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { isConnected, address } = useWalletStore();
  const { userLocks, fetchUserLocks } = useTokenLockStore();

  // Generate optimization recommendations
  const generateRecommendations = async () => {
    if (!userLocks.length) return;

    setIsLoading(true);
    try {
      const allRecommendations: OptimizationRecommendation[] = [];
      let totalPotentialGain = BigInt(0);
      let totalRiskReduction = 0;
      let totalEfficiencyImprovement = 0;
      let totalGasOptimization = BigInt(0);
      let totalTimeToImplement = 0;

      // Generate recommendations for each lock
      for (const lock of userLocks) {
        const lockRecommendations =
          await votingPowerCalculator.generateOptimizationRecommendations(
            lock.id
          );
        allRecommendations.push(...lockRecommendations);

        // Aggregate metrics
        lockRecommendations.forEach(rec => {
          totalPotentialGain += rec.potentialGain;
          totalRiskReduction += rec.riskReduction || 0;
          totalEfficiencyImprovement += rec.efficiencyImprovement || 0;
          totalGasOptimization += rec.gasOptimization || BigInt(0);
          totalTimeToImplement += rec.timeToImplement || 0;
        });
      }

      // Generate portfolio-level recommendations
      const portfolioRecommendations =
        await votingPowerCalculator.generatePortfolioOptimizations(
          userLocks.map(lock => lock.id)
        );
      allRecommendations.push(...portfolioRecommendations);

      // Sort by priority and potential impact
      const sortedRecommendations = allRecommendations.sort((a, b) => {
        const scoreA =
          Number(a.potentialGain) +
          (a.priority === 'high' ? 1000 : a.priority === 'medium' ? 500 : 0);
        const scoreB =
          Number(b.potentialGain) +
          (b.priority === 'high' ? 1000 : b.priority === 'medium' ? 500 : 0);
        return scoreB - scoreA;
      });

      setRecommendations(sortedRecommendations);
      setOptimizationMetrics({
        totalPotentialGain,
        riskReduction:
          allRecommendations.length > 0
            ? totalRiskReduction / allRecommendations.length
            : 0,
        efficiencyImprovement:
          allRecommendations.length > 0
            ? totalEfficiencyImprovement / allRecommendations.length
            : 0,
        gasOptimization: totalGasOptimization,
        timeToImplement: totalTimeToImplement,
      });
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Categorize recommendations
  const categorizedRecommendations = useMemo(() => {
    const categories: RecommendationCategory[] = [
      {
        id: 'power',
        title: 'Power Optimization',
        description: 'Maximize your voting power potential',
        icon: Zap,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        recommendations: recommendations.filter(r => r.category === 'power'),
      },
      {
        id: 'risk',
        title: 'Risk Management',
        description: 'Reduce portfolio risk and exposure',
        icon: Shield,
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        recommendations: recommendations.filter(r => r.category === 'risk'),
      },
      {
        id: 'efficiency',
        title: 'Efficiency Gains',
        description: 'Improve lock efficiency and returns',
        icon: Target,
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        recommendations: recommendations.filter(
          r => r.category === 'efficiency'
        ),
      },
      {
        id: 'timing',
        title: 'Timing Optimization',
        description: 'Optimize lock timing and duration',
        icon: Clock,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        recommendations: recommendations.filter(r => r.category === 'timing'),
      },
      {
        id: 'gas',
        title: 'Gas Optimization',
        description: 'Reduce transaction costs',
        icon: Calculator,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/20',
        recommendations: recommendations.filter(r => r.category === 'gas'),
      },
    ];

    return categories.filter(cat => cat.recommendations.length > 0);
  }, [recommendations]);

  const filteredRecommendations = useMemo(() => {
    if (selectedCategory === 'all') return recommendations;
    return recommendations.filter(r => r.category === selectedCategory);
  }, [recommendations, selectedCategory]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-400 bg-red-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'low':
        return 'text-green-400 bg-green-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return AlertTriangle;
      case 'medium':
        return Clock;
      case 'low':
        return CheckCircle;
      default:
        return Lightbulb;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'extend':
        return Calendar;
      case 'merge':
        return Maximize;
      case 'rebalance':
        return RefreshCw;
      case 'split':
        return TrendingUp;
      default:
        return ArrowRight;
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchUserLocks(address);
    }
  }, [isConnected, address, fetchUserLocks]);

  useEffect(() => {
    if (userLocks.length > 0) {
      generateRecommendations();
    }
  }, [userLocks]);

  // Auto-refresh recommendations
  useEffect(() => {
    if (autoRefresh && userLocks.length > 0) {
      const interval = setInterval(generateRecommendations, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [autoRefresh, userLocks]);

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
            <Lightbulb className="w-8 h-8 text-patriotBlue" />
          </div>
          <h3 className="text-xl font-display font-bold text-patriotWhite mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-textSecondary">
            Connect your wallet to receive personalized optimization
            recommendations
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
            <Target className="w-8 h-8 text-patriotBlue" />
          </div>
          <h3 className="text-xl font-display font-bold text-patriotWhite mb-2">
            No Locks to Optimize
          </h3>
          <p className="text-textSecondary mb-4">
            Create your first token lock to receive optimization recommendations
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
            Optimization Recommendations
          </h2>
          <p className="text-textSecondary">
            AI-powered insights to maximize your lock portfolio performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              'transition-colors',
              autoRefresh
                ? 'text-green-400 border-green-400'
                : 'text-textSecondary'
            )}
          >
            <RefreshCw
              className={cn('w-4 h-4 mr-2', autoRefresh && 'animate-spin')}
            />
            Auto-refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={generateRecommendations}
            disabled={isLoading}
          >
            <Calculator className="w-4 h-4 mr-2" />
            Recalculate
          </Button>
        </div>
      </div>

      {/* Optimization Metrics Overview */}
      {optimizationMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-patriotBlue" />
              <span className="text-sm font-medium text-textSecondary">
                Potential Gain
              </span>
            </div>
            <p className="text-lg font-bold text-green-400">
              +{formatTokenAmount(optimizationMetrics.totalPotentialGain)} VP
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-patriotBlue" />
              <span className="text-sm font-medium text-textSecondary">
                Risk Reduction
              </span>
            </div>
            <p className="text-lg font-bold text-blue-400">
              -{optimizationMetrics.riskReduction.toFixed(1)}%
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-patriotBlue" />
              <span className="text-sm font-medium text-textSecondary">
                Efficiency Gain
              </span>
            </div>
            <p className="text-lg font-bold text-yellow-400">
              +{optimizationMetrics.efficiencyImprovement.toFixed(1)}%
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-patriotBlue" />
              <span className="text-sm font-medium text-textSecondary">
                Gas Savings
              </span>
            </div>
            <p className="text-lg font-bold text-purple-400">
              {formatTokenAmount(optimizationMetrics.gasOptimization)} ETH
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-patriotBlue" />
              <span className="text-sm font-medium text-textSecondary">
                Time to Implement
              </span>
            </div>
            <p className="text-lg font-bold text-patriotWhite">
              {formatDuration(optimizationMetrics.timeToImplement)}
            </p>
          </Card>
        </div>
      )}

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            selectedCategory === 'all'
              ? 'bg-patriotBlue text-patriotWhite'
              : 'bg-backgroundAccent text-textSecondary hover:text-patriotWhite'
          )}
        >
          All ({recommendations.length})
        </button>

        {categorizedRecommendations.map(category => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                selectedCategory === category.id
                  ? 'bg-patriotBlue text-patriotWhite'
                  : 'bg-backgroundAccent text-textSecondary hover:text-patriotWhite'
              )}
            >
              <Icon className="w-4 h-4" />
              {category.title} ({category.recommendations.length})
            </button>
          );
        })}
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {filteredRecommendations.map((recommendation, index) => {
            const PriorityIcon = getPriorityIcon(recommendation.priority);
            const ActionIcon = getActionIcon(recommendation.action);

            return (
              <motion.div
                key={`${recommendation.lockId}-${recommendation.action}-${index}`}
                variants={slideInVariants}
                custom={index}
                initial="initial"
                animate="enter"
                exit="exit"
                layout
              >
                <Card className="p-6 hover:bg-backgroundAccent/50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-patriotBlue/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <ActionIcon className="w-6 h-6 text-patriotBlue" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-patriotWhite">
                            {recommendation.title}
                          </h3>
                          <Badge
                            className={getPriorityColor(
                              recommendation.priority
                            )}
                          >
                            <PriorityIcon className="w-3 h-3 mr-1" />
                            {recommendation.priority.toUpperCase()}
                          </Badge>
                        </div>

                        <p className="text-textSecondary mb-3">
                          {recommendation.description}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-textSecondary">
                              Potential Gain
                            </span>
                            <p className="font-semibold text-green-400">
                              +{formatTokenAmount(recommendation.potentialGain)}{' '}
                              VP
                            </p>
                          </div>

                          {recommendation.riskReduction && (
                            <div>
                              <span className="text-textSecondary">
                                Risk Reduction
                              </span>
                              <p className="font-semibold text-blue-400">
                                -{recommendation.riskReduction.toFixed(1)}%
                              </p>
                            </div>
                          )}

                          {recommendation.gasOptimization && (
                            <div>
                              <span className="text-textSecondary">
                                Gas Savings
                              </span>
                              <p className="font-semibold text-purple-400">
                                {formatTokenAmount(
                                  recommendation.gasOptimization
                                )}{' '}
                                ETH
                              </p>
                            </div>
                          )}

                          {recommendation.timeToImplement && (
                            <div>
                              <span className="text-textSecondary">
                                Time Required
                              </span>
                              <p className="font-semibold text-patriotWhite">
                                {formatDuration(recommendation.timeToImplement)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => onOptimizationSelect?.(recommendation)}
                      className="flex-shrink-0"
                    >
                      Apply
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>

                  {recommendation.steps && recommendation.steps.length > 0 && (
                    <div className="border-t border-backgroundAccent pt-4">
                      <h4 className="text-sm font-semibold text-patriotWhite mb-2">
                        Implementation Steps:
                      </h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-textSecondary">
                        {recommendation.steps.map((step, stepIndex) => (
                          <li key={stepIndex}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredRecommendations.length === 0 && !isLoading && (
        <Card className="p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-display font-bold text-patriotWhite mb-2">
            Portfolio Optimized
          </h3>
          <p className="text-textSecondary">
            Your lock portfolio is already well-optimized. Check back later for
            new recommendations.
          </p>
        </Card>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-patriotBlue"></div>
        </div>
      )}
    </motion.div>
  );
};
