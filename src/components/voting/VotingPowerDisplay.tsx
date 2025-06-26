'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  TrendingUp,
  Clock,
  Lock,
  Info,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Target,
  Calendar,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Card, Button } from '../ui';
import { VotingPowerBreakdown, TokenLock } from '@/types';
import { cn } from '@/lib/utils';
import { fadeInVariants, slideUpVariants } from '@/lib/animations';

interface VotingPowerDisplayProps {
  breakdown: VotingPowerBreakdown;
  userLocks: TokenLock[];
  className?: string;
  showDetails?: boolean;
  onRefresh?: () => void;
}

interface PowerSource {
  id: string;
  label: string;
  amount: bigint;
  percentage: number;
  color: string;
  icon: React.ReactNode;
  description: string;
}

export const VotingPowerDisplay: React.FC<VotingPowerDisplayProps> = ({
  breakdown,
  userLocks,
  className,
  showDetails = true,
  onRefresh,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    'current' | 'projected'
  >('current');

  const formatTokenAmount = (amount: bigint): string => {
    return (Number(amount) / 1e18).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  // Calculate warmup completion times
  const getWarmupCompletionTime = (lock: TokenLock): Date => {
    return new Date(lock.createdAt.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
  };

  const getTimeUntilWarmup = (lock: TokenLock): string => {
    if (lock.isWarmupComplete) return 'Complete';

    const completionTime = getWarmupCompletionTime(lock);
    const now = new Date();
    const timeLeft = completionTime.getTime() - now.getTime();

    if (timeLeft <= 0) return 'Complete';

    const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
    const hours = Math.floor(
      (timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
    );
    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const calculatePowerSources = (): PowerSource[] => {
    const activeLocks = userLocks.filter(lock => lock.isWarmupComplete);
    const warmingUpLocks = userLocks.filter(lock => !lock.isWarmupComplete);

    const activeVotingPower = activeLocks.reduce(
      (sum, lock) => sum + lock.votingPower,
      BigInt(0)
    );

    const warmingUpPower = warmingUpLocks.reduce(
      (sum, lock) => sum + lock.votingPower,
      BigInt(0)
    );

    const totalProjectedPower = activeVotingPower + warmingUpPower;
    const totalNum = Number(totalProjectedPower);

    if (totalNum === 0) {
      return [];
    }

    const sources: PowerSource[] = [];

    // Active voting power
    if (activeVotingPower > BigInt(0)) {
      const percentage = (Number(activeVotingPower) / totalNum) * 100;
      sources.push({
        id: 'active',
        label: 'Active Voting Power',
        amount: activeVotingPower,
        percentage,
        color: 'text-green-400',
        icon: <CheckCircle className="w-4 h-4" />,
        description: 'Available for voting now',
      });
    }

    // Warming up power
    if (warmingUpPower > BigInt(0)) {
      const percentage = (Number(warmingUpPower) / totalNum) * 100;
      sources.push({
        id: 'warming',
        label: 'Pending Voting Power',
        amount: warmingUpPower,
        percentage,
        color: 'text-orange-400',
        icon: <Clock className="w-4 h-4" />,
        description: 'Completing warmup period',
      });
    }

    return sources;
  };

  const getActiveLocks = () => {
    return userLocks.filter(lock => lock.isWarmupComplete);
  };

  const getWarmingUpLocks = () => {
    return userLocks.filter(lock => !lock.isWarmupComplete);
  };

  const calculateProjectedPower = (): bigint => {
    return userLocks.reduce((sum, lock) => sum + lock.votingPower, BigInt(0));
  };

  const powerSources = calculatePowerSources();
  const activeLocks = getActiveLocks();
  const warmingUpLocks = getWarmingUpLocks();
  const projectedPower = calculateProjectedPower();
  const currentPower = breakdown.powerAvailable;

  const displayPower =
    selectedTimeframe === 'current' ? currentPower : projectedPower;
  const displayLabel =
    selectedTimeframe === 'current'
      ? 'Current Voting Power'
      : 'Projected Voting Power';

  return (
    <motion.div
      variants={fadeInVariants}
      initial="initial"
      animate="enter"
      className={className}
    >
      <Card className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-patriotBlue/20 to-patriotRed/20 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-patriotWhite">
                Voting Power
              </h3>
              <p className="text-textSecondary text-sm">
                Your governance influence
              </p>
            </div>
          </div>

          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="text-xs"
            >
              Refresh
            </Button>
          )}
        </div>

        {/* Warmup Notice */}
        {warmingUpLocks.length > 0 && (
          <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-orange-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-orange-400 mb-2">
                  Warmup Period Active
                </h4>
                <p className="text-sm text-orange-300/80 mb-3">
                  {warmingUpLocks.length} lock
                  {warmingUpLocks.length > 1 ? 's' : ''} completing warmup
                  period. Voting power will be available after 3 days from lock
                  creation.
                </p>
                <div className="space-y-2">
                  {warmingUpLocks.slice(0, 3).map(lock => (
                    <div
                      key={lock.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-orange-200">
                        Lock #{lock.id} ({formatTokenAmount(lock.amount)} VMF)
                      </span>
                      <span className="text-orange-400 font-medium">
                        {getTimeUntilWarmup(lock)} remaining
                      </span>
                    </div>
                  ))}
                  {warmingUpLocks.length > 3 && (
                    <div className="text-sm text-orange-300/60">
                      +{warmingUpLocks.length - 3} more locks warming up
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeframe Toggle */}
        <div className="flex bg-backgroundAccent rounded-lg p-1 mb-6">
          {[
            { key: 'current' as const, label: 'Current' },
            { key: 'projected' as const, label: 'Projected' },
          ].map(option => (
            <button
              key={option.key}
              onClick={() => setSelectedTimeframe(option.key)}
              className={cn(
                'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                selectedTimeframe === option.key
                  ? 'bg-patriotBlue text-patriotWhite shadow-sm'
                  : 'text-textSecondary hover:text-patriotWhite'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Main Power Display */}
        <div className="text-center mb-6 p-6 bg-gradient-to-br from-patriotBlue/10 to-patriotRed/10 rounded-lg border border-patriotBlue/30">
          <div className="text-sm text-textSecondary mb-2">{displayLabel}</div>
          <motion.div
            key={selectedTimeframe}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-4xl font-bold text-patriotWhite mb-2"
          >
            {formatTokenAmount(displayPower)}
          </motion.div>
          <div className="text-patriotBlue font-medium">VMF Voting Power</div>

          {selectedTimeframe === 'current' && warmingUpLocks.length > 0 && (
            <div className="mt-3 text-sm text-orange-400">
              +
              {formatTokenAmount(
                warmingUpLocks.reduce(
                  (sum, lock) => sum + lock.votingPower,
                  BigInt(0)
                )
              )}{' '}
              pending (warmup completing)
            </div>
          )}

          {selectedTimeframe === 'projected' &&
            currentPower === BigInt(0) &&
            projectedPower > BigInt(0) && (
              <div className="mt-3 text-sm text-orange-400">
                All voting power currently in warmup period
              </div>
            )}
        </div>

        {/* Power Sources Breakdown */}
        {powerSources.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-patriotBlue" />
              <span className="font-semibold text-patriotWhite">
                Power Breakdown
              </span>
            </div>

            <div className="space-y-3">
              {powerSources.map(source => (
                <motion.div
                  key={source.id}
                  variants={slideUpVariants}
                  className="flex items-center justify-between p-3 bg-backgroundAccent rounded-lg border border-patriotBlue/20"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center bg-opacity-20',
                        source.color
                          .replace('text-', 'bg-')
                          .replace('-400', '-500/20')
                      )}
                    >
                      <span className={source.color}>{source.icon}</span>
                    </div>
                    <div>
                      <div className="font-medium text-patriotWhite text-sm">
                        {source.label}
                      </div>
                      <div className="text-xs text-textSecondary">
                        {source.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn('font-semibold', source.color)}>
                      {formatTokenAmount(source.amount)}
                    </div>
                    <div className="text-xs text-textSecondary">
                      {formatPercentage(source.percentage)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed View Toggle */}
        {showDetails &&
          (activeLocks.length > 0 || warmingUpLocks.length > 0) && (
            <div>
              <Button
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full justify-between text-patriotWhite hover:bg-patriotBlue/20"
              >
                <span className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Lock Details ({activeLocks.length +
                    warmingUpLocks.length}{' '}
                  total)
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>

              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 space-y-4"
                >
                  {/* Active Locks */}
                  {activeLocks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Active Locks ({activeLocks.length})
                      </h4>
                      <div className="space-y-2">
                        {activeLocks.map(lock => (
                          <div
                            key={lock.id}
                            className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-sm font-semibold">
                                #{lock.id}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-patriotWhite">
                                  {formatTokenAmount(lock.amount)} VMF
                                </div>
                                <div className="text-xs text-textSecondary">
                                  Expires: {lock.expiresAt.toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-green-400">
                                {formatTokenAmount(lock.votingPower)}
                              </div>
                              <div className="text-xs text-textSecondary">
                                Voting Power
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warming Up Locks */}
                  {warmingUpLocks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Warming Up Locks ({warmingUpLocks.length})
                      </h4>
                      <div className="space-y-2">
                        {warmingUpLocks.map(lock => (
                          <div
                            key={lock.id}
                            className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center text-sm font-semibold">
                                #{lock.id}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-patriotWhite">
                                  {formatTokenAmount(lock.amount)} VMF
                                </div>
                                <div className="text-xs text-orange-300">
                                  Warmup: {getTimeUntilWarmup(lock)} remaining
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-orange-400">
                                {formatTokenAmount(lock.votingPower)}
                              </div>
                              <div className="text-xs text-textSecondary">
                                Pending Power
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}

        {/* No Voting Power State */}
        {userLocks.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-patriotBlue/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="w-8 h-8 text-patriotBlue" />
            </div>
            <h4 className="font-semibold text-patriotWhite mb-2">
              No Voting Power
            </h4>
            <p className="text-textSecondary text-sm mb-4">
              Lock VMF tokens to gain voting power and participate in governance
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );
};
