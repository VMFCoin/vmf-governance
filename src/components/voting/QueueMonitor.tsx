'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Filter,
  Download,
  AlertCircle,
  CheckCircle,
  Timer,
  DollarSign,
  BarChart3,
  Activity,
} from 'lucide-react';
import { formatEther } from 'viem';
import { Button, Card, Badge } from '@/components/ui';
import { useWalletStore } from '@/stores/useWalletStore';
import { useTokenLockStore } from '@/stores/useTokenLockStore';
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

interface QueueMonitorProps {
  onTokenSelect?: (tokenId: number) => void;
  className?: string;
}

type FilterType = 'all' | 'ready' | 'waiting' | 'mine';

export function QueueMonitor({ onTokenSelect, className }: QueueMonitorProps) {
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [queueEntries, setQueueEntries] = useState<ExitQueueEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { isConnected, address } = useWalletStore();
  const { userLocks } = useTokenLockStore();

  const loadQueueData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [stats, userTokenIds] = await Promise.all([
        exitQueueService.getQueueStats(),
        // Get user's token IDs from their locks
        Promise.resolve(userLocks.map(lock => lock.id)),
      ]);

      setQueueStats(stats);

      // Get queue info for user's tokens if they have any
      if (userTokenIds.length > 0) {
        const entries = await exitQueueService.getBatchQueueInfo(userTokenIds);
        setQueueEntries(
          entries.filter(entry => entry !== null) as ExitQueueEntry[]
        );
      } else {
        setQueueEntries([]);
      }
    } catch (err) {
      console.error('Error loading queue data:', err);
      setError('Failed to load queue information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userLocks]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadQueueData();
    setIsRefreshing(false);
  };

  const filteredEntries = queueEntries.filter(entry => {
    switch (filter) {
      case 'ready':
        return entry.canExit;
      case 'waiting':
        return !entry.canExit;
      case 'mine':
        return userLocks.some(lock => lock.id === entry.tokenId);
      default:
        return true;
    }
  });

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'Ready';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const exportQueueData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      queueStats,
      entries: filteredEntries,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exit-queue-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadQueueData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, loadQueueData]);

  useEffect(() => {
    loadQueueData();
  }, [loadQueueData]);

  // Subscribe to queue events for real-time updates
  useEffect(() => {
    const unsubscribeQueued = exitQueueService.subscribeToExitQueuedEvents(
      () => {
        loadQueueData();
      }
    );

    const unsubscribeExit = exitQueueService.subscribeToExitEvents(() => {
      loadQueueData();
    });

    return () => {
      unsubscribeQueued();
      unsubscribeExit();
    };
  }, [loadQueueData]);

  if (isLoading && !queueStats) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-patriotBlue mr-3" />
          <span className="text-patriotWhite">Loading queue monitor...</span>
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
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        variants={slideInVariants}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-patriotWhite mb-2">
            Exit Queue Monitor
          </h2>
          <p className="text-textSecondary">
            Real-time monitoring of exit queue activity and statistics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              'transition-colors',
              autoRefresh && 'bg-green-500/20 border-green-500/40'
            )}
          >
            <Activity
              className={cn('w-4 h-4 mr-2', autoRefresh && 'text-green-400')}
            />
            Auto-refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')}
            />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportQueueData}
            disabled={filteredEntries.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Queue Statistics */}
      {queueStats && (
        <motion.div variants={slideInVariants}>
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-patriotBlue/20 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-patriotBlue" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-patriotWhite">
                  Queue Statistics
                </h3>
                <p className="text-textSecondary">
                  Current exit queue configuration and metrics
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
                <p className="text-xs text-textSecondary">
                  {queueStats.nextExitDate.toLocaleTimeString()}
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
                <p className="text-xs text-textSecondary">
                  {Math.floor((queueStats.cooldownPeriod % 86400) / 3600)} hours
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
                  {(Number(queueStats.feePercent) / 100).toFixed(2)}%
                </p>
                <p className="text-xs text-textSecondary">Current fee rate</p>
              </div>

              <div className="bg-backgroundAccent/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-medium text-patriotWhite">
                    Queue Length
                  </span>
                </div>
                <p className="text-lg font-semibold text-purple-400">
                  {queueEntries.length}
                </p>
                <p className="text-xs text-textSecondary">Total entries</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Filter Controls */}
      <motion.div variants={slideInVariants}>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-patriotBlue" />
              <span className="text-sm font-medium text-patriotWhite">
                Filter:
              </span>
            </div>

            <div className="flex gap-2">
              {[
                {
                  key: 'all',
                  label: 'All Entries',
                  count: queueEntries.length,
                },
                {
                  key: 'ready',
                  label: 'Ready to Exit',
                  count: queueEntries.filter(e => e.canExit).length,
                },
                {
                  key: 'waiting',
                  label: 'Waiting',
                  count: queueEntries.filter(e => !e.canExit).length,
                },
                {
                  key: 'mine',
                  label: 'My Tokens',
                  count: queueEntries.filter(e =>
                    userLocks.some(l => l.id === e.tokenId)
                  ).length,
                },
              ].map(filterOption => (
                <Button
                  key={filterOption.key}
                  variant={filter === filterOption.key ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(filterOption.key as FilterType)}
                  className="text-xs"
                >
                  {filterOption.label}
                  <Badge variant="secondary" className="ml-2">
                    {filterOption.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Queue Entries */}
      <motion.div variants={slideInVariants}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-patriotWhite">
              Queue Entries ({filteredEntries.length})
            </h3>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-textSecondary mx-auto mb-4" />
              <h4 className="text-lg font-medium text-patriotWhite mb-2">
                No Queue Entries
              </h4>
              <p className="text-textSecondary">
                {filter === 'mine'
                  ? "You don't have any tokens in the exit queue."
                  : 'No entries match the current filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredEntries.map((entry, index) => (
                  <motion.div
                    key={entry.tokenId}
                    variants={fadeInVariants}
                    initial="initial"
                    animate="enter"
                    exit="exit"
                    transition={{ delay: index * 0.1 }}
                    className="bg-backgroundAccent/20 rounded-lg p-4 hover:bg-backgroundAccent/30 transition-colors cursor-pointer"
                    onClick={() => onTokenSelect?.(entry.tokenId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            entry.canExit
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          )}
                        >
                          {entry.canExit ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <Clock className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-medium text-patriotWhite">
                              Token #{entry.tokenId}
                            </h4>
                            <Badge
                              variant={entry.canExit ? 'success' : 'warning'}
                            >
                              {entry.canExit ? 'Ready' : 'Waiting'}
                            </Badge>
                            {userLocks.some(
                              lock => lock.id === entry.tokenId
                            ) && <Badge variant="secondary">Mine</Badge>}
                          </div>
                          <p className="text-sm text-textSecondary">
                            Exit Date: {entry.exitDate.toLocaleDateString()} at{' '}
                            {entry.exitDate.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-sm text-textSecondary">
                              Exit Fee
                            </p>
                            <p className="font-medium text-green-400">
                              {formatEther(entry.estimatedExitFee)} VMF
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-textSecondary">
                              Time to Min Lock
                            </p>
                            <p
                              className={cn(
                                'font-medium',
                                entry.timeToMinLock <= 0
                                  ? 'text-green-400'
                                  : 'text-yellow-400'
                              )}
                            >
                              {formatTimeRemaining(entry.timeToMinLock)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
