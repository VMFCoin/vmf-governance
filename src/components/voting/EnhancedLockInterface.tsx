'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Unlock,
  Merge,
  Clock,
  TrendingUp,
  Settings,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Plus,
  Minus,
  RefreshCw,
} from 'lucide-react';
import { Button, Card, Input, Badge } from '../ui';
import { useTokenLockStore } from '@/stores/useTokenLockStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { votingPowerCalculator } from '@/lib/votingPowerCalculations';
import { cn, formatTokenAmount, formatDuration } from '@/lib/utils';
import {
  fadeInVariants,
  staggerContainer,
  slideInVariants,
} from '@/lib/animations';

interface EnhancedLockInterfaceProps {
  className?: string;
}

interface LockAction {
  type: 'extend' | 'merge' | 'withdraw' | 'increase';
  lockId: number;
  targetLockId?: number;
  amount?: bigint;
  duration?: number;
  estimatedGas?: bigint;
  expectedPowerChange?: bigint;
}

export const EnhancedLockInterface: React.FC<EnhancedLockInterfaceProps> = ({
  className,
}) => {
  const [selectedLocks, setSelectedLocks] = useState<Set<number>>(new Set());
  const [pendingAction, setPendingAction] = useState<LockAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extendDuration, setExtendDuration] = useState(90);
  const [increaseAmount, setIncreaseAmount] = useState('');

  const { isConnected, address } = useWalletStore();
  const {
    userLocks,
    isLoading,
    error,
    fetchUserLocks,
    extendLock,
    increaseLockAmount,
    mergeLocks,
    withdrawLock,
  } = useTokenLockStore();

  // Filter locks by status
  const activeLocks = userLocks.filter(
    lock => lock.isWarmupComplete && lock.expiresAt > new Date()
  );
  const expiredLocks = userLocks.filter(lock => lock.expiresAt <= new Date());
  const warmupLocks = userLocks.filter(lock => !lock.isWarmupComplete);

  // Calculate potential power changes for actions
  const calculatePowerChange = useCallback(
    async (action: LockAction): Promise<bigint> => {
      try {
        switch (action.type) {
          case 'extend':
            return await votingPowerCalculator.calculateExtensionPowerGain(
              action.lockId,
              action.duration || 0
            );
          case 'increase':
            return await votingPowerCalculator.calculateIncreasePowerGain(
              action.lockId,
              action.amount || BigInt(0)
            );
          case 'merge':
            if (action.targetLockId) {
              return await votingPowerCalculator.calculateMergePowerGain(
                action.lockId,
                action.targetLockId
              );
            }
            return BigInt(0);
          default:
            return BigInt(0);
        }
      } catch (error) {
        console.error('Error calculating power change:', error);
        return BigInt(0);
      }
    },
    []
  );

  // Handle lock selection
  const toggleLockSelection = (lockId: number) => {
    const newSelection = new Set(selectedLocks);
    if (newSelection.has(lockId)) {
      newSelection.delete(lockId);
    } else {
      newSelection.add(lockId);
    }
    setSelectedLocks(newSelection);
  };

  // Handle lock extension
  const handleExtendLock = async (lockId: number) => {
    if (!address) return;

    const action: LockAction = {
      type: 'extend',
      lockId,
      duration: extendDuration,
    };

    const powerChange = await calculatePowerChange(action);
    setPendingAction({ ...action, expectedPowerChange: powerChange });
  };

  // Handle lock amount increase
  const handleIncreaseLock = async (lockId: number) => {
    if (!address || !increaseAmount) return;

    const amount = BigInt(Math.floor(parseFloat(increaseAmount) * 1e18));
    const action: LockAction = {
      type: 'increase',
      lockId,
      amount,
    };

    const powerChange = await calculatePowerChange(action);
    setPendingAction({ ...action, expectedPowerChange: powerChange });
  };

  // Handle lock merging
  const handleMergeLocks = async () => {
    if (selectedLocks.size !== 2) return;

    const lockIds = Array.from(selectedLocks);
    const action: LockAction = {
      type: 'merge',
      lockId: lockIds[0],
      targetLockId: lockIds[1],
    };

    const powerChange = await calculatePowerChange(action);
    setPendingAction({ ...action, expectedPowerChange: powerChange });
  };

  // Handle lock withdrawal
  const handleWithdrawLock = async (lockId: number) => {
    if (!address) return;

    const action: LockAction = {
      type: 'withdraw',
      lockId,
    };

    setPendingAction(action);
  };

  // Execute pending action
  const executePendingAction = async () => {
    if (!pendingAction || !address) return;

    setIsProcessing(true);
    try {
      switch (pendingAction.type) {
        case 'extend':
          await extendLock(pendingAction.lockId, pendingAction.duration!);
          break;
        case 'increase':
          await increaseLockAmount(pendingAction.lockId, pendingAction.amount!);
          break;
        case 'merge':
          await mergeLocks(pendingAction.lockId, pendingAction.targetLockId!);
          break;
        case 'withdraw':
          await withdrawLock(pendingAction.lockId);
          break;
      }

      // Refresh data
      await fetchUserLocks(address);
      setPendingAction(null);
      setSelectedLocks(new Set());
    } catch (error) {
      console.error('Error executing action:', error);
    } finally {
      setIsProcessing(false);
    }
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
          <p className="text-textSecondary">
            Connect your wallet to manage your token locks
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
            Enhanced Lock Management
          </h2>
          <p className="text-textSecondary">
            Advanced tools for managing your token locks and optimizing voting
            power
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => address && fetchUserLocks(address)}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-xl font-display font-bold text-patriotWhite mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Extend Duration */}
          <div className="p-4 bg-backgroundAccent rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-patriotBlue" />
              <h4 className="font-semibold text-patriotWhite">
                Extend Duration
              </h4>
            </div>
            <div className="space-y-3">
              <Input
                type="number"
                value={extendDuration}
                onChange={e =>
                  setExtendDuration(parseInt(e.target.value) || 90)
                }
                placeholder="Days to extend"
                className="text-sm"
              />
              <p className="text-xs text-textSecondary">
                Extend lock duration to maintain voting power
              </p>
            </div>
          </div>

          {/* Increase Amount */}
          <div className="p-4 bg-backgroundAccent rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Plus className="w-5 h-5 text-patriotBlue" />
              <h4 className="font-semibold text-patriotWhite">
                Increase Amount
              </h4>
            </div>
            <div className="space-y-3">
              <Input
                type="number"
                value={increaseAmount}
                onChange={e => setIncreaseAmount(e.target.value)}
                placeholder="VMF amount"
                className="text-sm"
              />
              <p className="text-xs text-textSecondary">
                Add more tokens to existing locks
              </p>
            </div>
          </div>

          {/* Merge Locks */}
          <div className="p-4 bg-backgroundAccent rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Merge className="w-5 h-5 text-patriotBlue" />
              <h4 className="font-semibold text-patriotWhite">Merge Locks</h4>
            </div>
            <div className="space-y-3">
              <Button
                size="sm"
                onClick={handleMergeLocks}
                disabled={selectedLocks.size !== 2}
                className="w-full"
              >
                Merge Selected ({selectedLocks.size}/2)
              </Button>
              <p className="text-xs text-textSecondary">
                Select exactly 2 locks to merge
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Active Locks */}
      {activeLocks.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-display font-bold text-patriotWhite mb-4">
            Active Locks ({activeLocks.length})
          </h3>
          <div className="space-y-4">
            {activeLocks.map((lock, index) => (
              <motion.div
                key={lock.id}
                variants={slideInVariants}
                custom={index}
                className={cn(
                  'p-4 bg-backgroundAccent rounded-lg border-2 transition-colors cursor-pointer',
                  selectedLocks.has(lock.id)
                    ? 'border-patriotBlue bg-patriotBlue/10'
                    : 'border-transparent hover:border-white/20'
                )}
                onClick={() => toggleLockSelection(lock.id)}
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
                      {formatDuration(lock.expiresAt.getTime() - Date.now())}
                    </p>
                  </div>
                </div>

                {/* Lock Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={e => {
                      e.stopPropagation();
                      handleExtendLock(lock.id);
                    }}
                    className="flex items-center gap-1"
                  >
                    <Clock className="w-3 h-3" />
                    Extend
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={e => {
                      e.stopPropagation();
                      handleIncreaseLock(lock.id);
                    }}
                    className="flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Increase
                  </Button>
                  {selectedLocks.has(lock.id) && (
                    <Badge variant="success" size="sm">
                      Selected
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Expired Locks */}
      {expiredLocks.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-display font-bold text-patriotWhite mb-4">
            Expired Locks ({expiredLocks.length})
          </h3>
          <div className="space-y-4">
            {expiredLocks.map((lock, index) => (
              <motion.div
                key={lock.id}
                variants={slideInVariants}
                custom={index}
                className="p-4 bg-backgroundAccent rounded-lg border border-red-500/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                      <Unlock className="w-5 h-5 text-red-400" />
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
                  <Button
                    size="sm"
                    onClick={() => handleWithdrawLock(lock.id)}
                    className="flex items-center gap-1"
                  >
                    <Unlock className="w-3 h-3" />
                    Withdraw
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>Expired - Ready for withdrawal</span>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Warmup Locks */}
      {warmupLocks.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-display font-bold text-patriotWhite mb-4">
            Warming Up ({warmupLocks.length})
          </h3>
          <div className="space-y-4">
            {warmupLocks.map((lock, index) => (
              <motion.div
                key={lock.id}
                variants={slideInVariants}
                custom={index}
                className="p-4 bg-backgroundAccent rounded-lg border border-yellow-500/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-yellow-400" />
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
                    <p className="text-sm text-yellow-400">Warming Up</p>
                    <p className="text-xs text-textSecondary">
                      ~{formatDuration(3 * 24 * 60 * 60 * 1000)} remaining
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Action Confirmation Modal */}
      <AnimatePresence>
        {pendingAction && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setPendingAction(null)}
            />
            <motion.div
              className="relative bg-backgroundPrimary border border-white/20 rounded-2xl p-6 max-w-md w-full"
              variants={fadeInVariants}
              initial="initial"
              animate="enter"
              exit="exit"
            >
              <h3 className="text-xl font-display font-bold text-patriotWhite mb-4">
                Confirm Action
              </h3>
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-backgroundAccent rounded-lg">
                  <p className="text-sm text-textSecondary mb-2">Action Type</p>
                  <p className="font-semibold text-patriotWhite capitalize">
                    {pendingAction.type.replace('_', ' ')}
                  </p>
                </div>
                {pendingAction.expectedPowerChange && (
                  <div className="p-4 bg-backgroundAccent rounded-lg">
                    <p className="text-sm text-textSecondary mb-2">
                      Expected Power Change
                    </p>
                    <p className="font-semibold text-green-400">
                      +{formatTokenAmount(pendingAction.expectedPowerChange)} VP
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setPendingAction(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={executePendingAction}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? 'Processing...' : 'Confirm'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
