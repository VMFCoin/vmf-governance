'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Timer,
  DollarSign,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { Address } from 'viem';
import { formatEther } from 'viem';
import { Button, Card } from '@/components/ui';
import { useTokenLockStore } from '@/stores/useTokenLockStore';
import { useWalletStore } from '@/stores/useWalletStore';
import {
  exitQueueService,
  type ExitQueueEntry,
  type QueueStats,
} from '@/services/exitQueueService';
import { cn } from '@/lib/utils';
import {
  fadeInVariants,
  slideInVariants,
  staggerContainer,
} from '@/lib/animations';

interface ExitQueueInterfaceProps {
  tokenId?: number;
  onQueueEntered?: (tokenId: number) => void;
  onExitCompleted?: (tokenId: number) => void;
}

export function ExitQueueInterface({
  tokenId,
  onQueueEntered,
  onExitCompleted,
}: ExitQueueInterfaceProps) {
  const [queueEntry, setQueueEntry] = useState<ExitQueueEntry | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnteringQueue, setIsEnteringQueue] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eligibilityCheck, setEligibilityCheck] = useState<{
    canEnter: boolean;
    reason?: string;
  } | null>(null);

  const { isConnected, address } = useWalletStore();
  const { userLocks, fetchUserLocks } = useTokenLockStore();

  // Get the current token lock info
  const currentLock = tokenId
    ? userLocks.find(lock => lock.id === tokenId)
    : null;

  const loadQueueData = useCallback(async () => {
    if (!tokenId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [queueInfo, stats, eligibility] = await Promise.all([
        exitQueueService.getQueueInfo(tokenId),
        exitQueueService.getQueueStats(),
        exitQueueService.canEnterQueue(tokenId),
      ]);

      setQueueEntry(queueInfo);
      setQueueStats(stats);
      setEligibilityCheck(eligibility);
    } catch (err) {
      console.error('Error loading queue data:', err);
      setError('Failed to load queue information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [tokenId]);

  const handleEnterQueue = async () => {
    if (!tokenId || !isConnected) return;

    setIsEnteringQueue(true);
    setError(null);

    try {
      const txHash = await exitQueueService.enterExitQueue(tokenId);
      console.log('Enter queue transaction:', txHash);

      // Wait a moment then refresh data
      setTimeout(() => {
        loadQueueData();
        if (address) {
          fetchUserLocks(address);
        }
        onQueueEntered?.(tokenId);
      }, 2000);
    } catch (err) {
      console.error('Error entering queue:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to enter queue. Please try again.'
      );
    } finally {
      setIsEnteringQueue(false);
    }
  };

  const handleExitFromQueue = async () => {
    if (!tokenId || !isConnected) return;

    setIsExiting(true);
    setError(null);

    try {
      const txHash = await exitQueueService.exitFromQueue(tokenId);
      console.log('Exit from queue transaction:', txHash);

      // Wait a moment then refresh data
      setTimeout(() => {
        loadQueueData();
        if (address) {
          fetchUserLocks(address);
        }
        onExitCompleted?.(tokenId);
      }, 2000);
    } catch (err) {
      console.error('Error exiting from queue:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to exit from queue. Please try again.'
      );
    } finally {
      setIsExiting(false);
    }
  };

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'Ready to exit';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  useEffect(() => {
    loadQueueData();
  }, [loadQueueData]);

  // Subscribe to queue events
  useEffect(() => {
    if (!tokenId) return;

    const unsubscribeQueued = exitQueueService.subscribeToExitQueuedEvents(
      event => {
        if (Number(event.tokenId) === tokenId) {
          loadQueueData();
        }
      }
    );

    const unsubscribeExit = exitQueueService.subscribeToExitEvents(event => {
      if (Number(event.tokenId) === tokenId) {
        loadQueueData();
      }
    });

    return () => {
      unsubscribeQueued();
      unsubscribeExit();
    };
  }, [tokenId, loadQueueData]);

  if (!tokenId) {
    return (
      <Card className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-patriotWhite mb-2">
          No Token Selected
        </h3>
        <p className="text-textSecondary">
          Select a token lock to manage its exit queue status.
        </p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-patriotBlue mr-3" />
          <span className="text-patriotWhite">
            Loading queue information...
          </span>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="enter"
      className="space-y-6"
    >
      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            className="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Token Information */}
      <motion.div variants={slideInVariants}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-patriotWhite">
              Token Lock #{tokenId}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={loadQueueData}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')}
              />
              Refresh
            </Button>
          </div>

          {currentLock && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-sm text-textSecondary">Locked Amount</p>
                <p className="text-lg font-semibold text-patriotWhite">
                  {formatEther(currentLock.amount)} VMF
                </p>
              </div>
              <div>
                <p className="text-sm text-textSecondary">Voting Power</p>
                <p className="text-lg font-semibold text-green-400">
                  {formatEther(currentLock.votingPower)}
                </p>
              </div>
              <div>
                <p className="text-sm text-textSecondary">Lock Expires</p>
                <p className="text-lg font-semibold text-patriotWhite">
                  {currentLock.expiresAt.toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-textSecondary">Status</p>
                <p className="text-lg font-semibold text-yellow-400">
                  {currentLock.isWarmupComplete ? 'Active' : 'Warming Up'}
                </p>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Queue Status */}
      <motion.div variants={slideInVariants}>
        <Card className="p-6">
          {queueEntry ? (
            // Token is in queue
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-yellow-400/20 rounded-full flex items-center justify-center">
                  <Timer className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-patriotWhite">
                    In Exit Queue
                  </h3>
                  <p className="text-textSecondary">
                    Your token is queued for exit
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-backgroundAccent/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-patriotBlue" />
                    <span className="text-sm font-medium text-patriotWhite">
                      Exit Date
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-patriotWhite">
                    {queueEntry.exitDate.toLocaleDateString()}
                  </p>
                  <p className="text-sm text-textSecondary">
                    {queueEntry.exitDate.toLocaleTimeString()}
                  </p>
                </div>

                <div className="bg-backgroundAccent/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-medium text-patriotWhite">
                      Exit Fee
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-green-400">
                    {formatEther(queueEntry.estimatedExitFee)} VMF
                  </p>
                  <p className="text-sm text-textSecondary">
                    {queueStats &&
                      `${(Number(queueStats.feePercent) / 100).toFixed(2)}%`}
                  </p>
                </div>

                <div className="bg-backgroundAccent/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-5 h-5 text-yellow-400" />
                    <span className="text-sm font-medium text-patriotWhite">
                      Time to Min Lock
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-yellow-400">
                    {formatTimeRemaining(queueEntry.timeToMinLock)}
                  </p>
                </div>
              </div>

              {/* Exit Action */}
              <div className="flex items-center justify-between bg-backgroundAccent/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  {queueEntry.canExit ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <Clock className="w-6 h-6 text-yellow-400" />
                  )}
                  <div>
                    <p className="font-medium text-patriotWhite">
                      {queueEntry.canExit
                        ? 'Ready to Exit'
                        : 'Waiting in Queue'}
                    </p>
                    <p className="text-sm text-textSecondary">
                      {queueEntry.canExit
                        ? 'You can now claim your tokens'
                        : 'Wait for your turn to exit'}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleExitFromQueue}
                  disabled={!queueEntry.canExit || isExiting}
                  className="min-w-[120px]"
                >
                  {isExiting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Exit Queue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            // Token is not in queue
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-patriotBlue/20 rounded-full flex items-center justify-center">
                  <ExternalLink className="w-6 h-6 text-patriotBlue" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-patriotWhite">
                    Exit Queue Management
                  </h3>
                  <p className="text-textSecondary">
                    Enter the queue to unlock your tokens
                  </p>
                </div>
              </div>

              {/* Queue Statistics */}
              {queueStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-backgroundAccent/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-patriotBlue" />
                      <span className="text-sm font-medium text-patriotWhite">
                        Next Exit Date
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-patriotWhite">
                      {queueStats.nextExitDate.toLocaleDateString()}
                    </p>
                  </div>

                  <div className="bg-backgroundAccent/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Timer className="w-5 h-5 text-yellow-400" />
                      <span className="text-sm font-medium text-patriotWhite">
                        Cooldown Period
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-yellow-400">
                      {Math.floor(queueStats.cooldownPeriod / 86400)} days
                    </p>
                  </div>
                </div>
              )}

              {/* Eligibility Check */}
              {eligibilityCheck && (
                <div
                  className={cn(
                    'rounded-lg p-4 mb-6',
                    eligibilityCheck.canEnter
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-yellow-500/10 border border-yellow-500/20'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {eligibilityCheck.canEnter ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    )}
                    <div>
                      <p
                        className={cn(
                          'font-medium',
                          eligibilityCheck.canEnter
                            ? 'text-green-400'
                            : 'text-yellow-400'
                        )}
                      >
                        {eligibilityCheck.canEnter
                          ? 'Eligible to Enter Queue'
                          : 'Not Eligible'}
                      </p>
                      {eligibilityCheck.reason && (
                        <p className="text-sm text-textSecondary mt-1">
                          {eligibilityCheck.reason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Enter Queue Action */}
              <div className="flex items-center justify-between bg-backgroundAccent/20 rounded-lg p-4">
                <div>
                  <p className="font-medium text-patriotWhite mb-1">
                    Enter Exit Queue
                  </p>
                  <p className="text-sm text-textSecondary">
                    Queue your token for unlocking after the minimum lock period
                  </p>
                </div>

                <Button
                  onClick={handleEnterQueue}
                  disabled={
                    !eligibilityCheck?.canEnter ||
                    isEnteringQueue ||
                    !isConnected
                  }
                  className="min-w-[120px]"
                >
                  {isEnteringQueue ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Enter Queue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
