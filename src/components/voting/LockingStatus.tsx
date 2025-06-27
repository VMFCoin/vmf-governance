'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Lock,
  Clock,
  Zap,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Timer,
  Unlock,
} from 'lucide-react';
import { Card, Button } from '../ui';
import { useTokenLockStore } from '@/stores/useTokenLockStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { TokenLock } from '@/types';
import { cn } from '@/lib/utils';
import { fadeInVariants } from '@/lib/animations';
import { getAccount } from '@wagmi/core';
import { config } from '@/lib/wagmi';

interface LockingStatusProps {
  onCreateLock?: () => void;
  className?: string;
}

export const LockingStatus: React.FC<LockingStatusProps> = ({
  onCreateLock,
  className,
}) => {
  const { address } = useWalletStore();
  const {
    userLocks,
    votingPowerBreakdown,
    isLoading,
    fetchUserLocks,
    getAvailableVotingPower,
  } = useTokenLockStore();

  const account = getAccount(config);

  // Fetch user locks when component mounts or address changes
  useEffect(() => {
    if (account.address) {
      fetchUserLocks(account.address);
    }
  }, [account.address]);

  const formatTokenAmount = (amount: bigint): string => {
    return (Number(amount) / 1e18).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  };

  const formatDuration = (seconds: number): string => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    if (days >= 365) {
      const years = Math.floor(days / 365);
      const remainingDays = days % 365;
      return remainingDays > 0
        ? `${years}y ${remainingDays}d`
        : `${years} year${years > 1 ? 's' : ''}`;
    }
    return `${days} day${days > 1 ? 's' : ''}`;
  };

  const formatTimeRemaining = (endTime: Date): string => {
    const now = new Date();
    const remaining = endTime.getTime() - now.getTime();

    if (remaining <= 0) return 'Expired';

    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor(
      (remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
    );

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      return `${minutes}m`;
    }
  };

  const getLockStatus = (
    lock: TokenLock
  ): {
    status: 'warmup' | 'active' | 'expired';
    label: string;
    color: string;
    icon: React.ReactNode;
  } => {
    const now = new Date();

    if (lock.warmupEndsAt && now < lock.warmupEndsAt) {
      return {
        status: 'warmup',
        label: 'Warming Up',
        color: 'text-orange-400',
        icon: <Timer className="w-4 h-4" />,
      };
    } else if (now < lock.expiresAt) {
      return {
        status: 'active',
        label: 'Active',
        color: 'text-green-400',
        icon: <CheckCircle className="w-4 h-4" />,
      };
    } else {
      return {
        status: 'expired',
        label: 'Expired',
        color: 'text-red-400',
        icon: <AlertCircle className="w-4 h-4" />,
      };
    }
  };

  const [totalVotingPower, setTotalVotingPower] = React.useState<bigint>(
    BigInt(0)
  );

  // Fetch voting power when component mounts
  React.useEffect(() => {
    if (account.address) {
      useTokenLockStore
        .getState()
        .getAvailableVotingPower(account.address)
        .then(setTotalVotingPower);
    }
  }, [account.address, userLocks]);

  const hasLocks = userLocks.length > 0;

  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-backgroundAccent rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-backgroundAccent rounded w-full"></div>
            <div className="h-4 bg-backgroundAccent rounded w-2/3"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!hasLocks) {
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
            No Token Locks
          </h3>
          <p className="text-textSecondary mb-6">
            Lock your VMF tokens to gain voting power and participate in
            governance decisions.
          </p>
          {onCreateLock && (
            <Button onClick={onCreateLock} className="w-full sm:w-auto">
              Create Your First Lock
            </Button>
          )}
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={fadeInVariants}
      initial="initial"
      animate="enter"
      className={cn('space-y-6', className)}
    >
      {/* Summary Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display font-bold text-patriotWhite">
            Token Locks Overview
          </h3>
          {onCreateLock && (
            <Button onClick={onCreateLock} size="sm">
              Create New Lock
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Voting Power */}
          <div className="bg-gradient-to-r from-patriotBlue/10 to-patriotRed/10 rounded-lg p-4 border border-patriotBlue/30">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-semibold text-textSecondary">
                Total Voting Power
              </span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              {formatTokenAmount(totalVotingPower)} VMF
            </div>
          </div>

          {/* Active Locks */}
          <div className="bg-backgroundAccent rounded-lg p-4 border border-patriotBlue/20">
            <div className="flex items-center gap-3 mb-2">
              <Lock className="w-5 h-5 text-green-400" />
              <span className="text-sm font-semibold text-textSecondary">
                Active Locks
              </span>
            </div>
            <div className="text-2xl font-bold text-patriotWhite">
              {
                userLocks.filter(lock => {
                  const now = new Date();
                  return (
                    now < lock.expiresAt &&
                    (!lock.warmupEndsAt || now >= lock.warmupEndsAt)
                  );
                }).length
              }
            </div>
          </div>

          {/* Warming Up */}
          <div className="bg-backgroundAccent rounded-lg p-4 border border-patriotBlue/20">
            <div className="flex items-center gap-3 mb-2">
              <Timer className="w-5 h-5 text-orange-400" />
              <span className="text-sm font-semibold text-textSecondary">
                Warming Up
              </span>
            </div>
            <div className="text-2xl font-bold text-patriotWhite">
              {
                userLocks.filter(lock => {
                  const now = new Date();
                  return lock.warmupEndsAt && now < lock.warmupEndsAt;
                }).length
              }
            </div>
          </div>
        </div>
      </Card>

      {/* Individual Locks */}
      <div className="space-y-4">
        <h4 className="text-lg font-display font-bold text-patriotWhite">
          Your Token Locks
        </h4>

        {userLocks.map(lock => {
          const lockStatus = getLockStatus(lock);
          const now = new Date();
          const isWarmingUp = lock.warmupEndsAt && now < lock.warmupEndsAt;
          const timeRemaining = isWarmingUp
            ? formatTimeRemaining(lock.warmupEndsAt!)
            : formatTimeRemaining(lock.expiresAt);

          return (
            <motion.div
              key={lock.id}
              variants={fadeInVariants}
              initial="initial"
              animate="enter"
            >
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        lockStatus.status === 'active'
                          ? 'bg-green-500/20'
                          : lockStatus.status === 'warmup'
                            ? 'bg-orange-500/20'
                            : 'bg-red-500/20'
                      )}
                    >
                      {lockStatus.icon}
                    </div>
                    <div>
                      <h5 className="font-semibold text-patriotWhite">
                        Lock #{lock.id}
                      </h5>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'text-sm font-medium',
                            lockStatus.color
                          )}
                        >
                          {lockStatus.label}
                        </span>
                        {lockStatus.status !== 'expired' && (
                          <>
                            <span className="text-textSecondary">•</span>
                            <span className="text-sm text-textSecondary">
                              {isWarmingUp ? 'Warmup ends in' : 'Expires in'}{' '}
                              {timeRemaining}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {lockStatus.status === 'expired' && (
                    <Button variant="secondary" size="sm">
                      <Unlock className="w-4 h-4 mr-2" />
                      Withdraw
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-textSecondary mb-1">Locked Amount</div>
                    <div className="font-semibold text-patriotWhite">
                      {formatTokenAmount(lock.amount)} VMF
                    </div>
                  </div>

                  <div>
                    <div className="text-textSecondary mb-1">Voting Power</div>
                    <div className="font-semibold text-yellow-400">
                      {formatTokenAmount(lock.votingPower)} VMF
                    </div>
                  </div>

                  <div>
                    <div className="text-textSecondary mb-1">Duration</div>
                    <div className="font-semibold text-patriotWhite">
                      {formatDuration(lock.lockDuration)}
                    </div>
                  </div>

                  <div>
                    <div className="text-textSecondary mb-1">
                      {lockStatus.status === 'expired' ? 'Ended' : 'Ends'}
                    </div>
                    <div className="font-semibold text-patriotWhite">
                      {lock.expiresAt.toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Progress Bar for Active/Warmup Locks */}
                {lockStatus.status !== 'expired' && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-textSecondary mb-2">
                      <span>
                        {isWarmingUp ? 'Warmup Progress' : 'Lock Progress'}
                      </span>
                      <span>
                        {isWarmingUp
                          ? `${Math.max(0, Math.round(((now.getTime() - lock.createdAt.getTime()) / (lock.warmupEndsAt!.getTime() - lock.createdAt.getTime())) * 100))}%`
                          : `${Math.max(0, Math.round(((now.getTime() - lock.createdAt.getTime()) / (lock.expiresAt.getTime() - lock.createdAt.getTime())) * 100))}%`}
                      </span>
                    </div>
                    <div className="w-full bg-backgroundAccent rounded-full h-2">
                      <div
                        className={cn(
                          'h-2 rounded-full transition-all duration-300',
                          isWarmingUp ? 'bg-orange-400' : 'bg-patriotBlue'
                        )}
                        style={{
                          width: `${
                            isWarmingUp
                              ? Math.max(
                                  0,
                                  Math.min(
                                    100,
                                    ((now.getTime() -
                                      lock.createdAt.getTime()) /
                                      (lock.warmupEndsAt!.getTime() -
                                        lock.createdAt.getTime())) *
                                      100
                                  )
                                )
                              : Math.max(
                                  0,
                                  Math.min(
                                    100,
                                    ((now.getTime() -
                                      lock.createdAt.getTime()) /
                                      (lock.expiresAt.getTime() -
                                        lock.createdAt.getTime())) *
                                      100
                                  )
                                )
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
