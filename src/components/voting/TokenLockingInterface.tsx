'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Plus, RefreshCw } from 'lucide-react';
import { Button, Card } from '../ui';
import {
  TokenLockingModal,
  LockingStatus,
  WarmupTimer,
  VotingPowerDisplay,
} from './';
import { useTokenLockStore } from '@/stores/useTokenLockStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { cn } from '@/lib/utils';
import { fadeInVariants, staggerContainer } from '@/lib/animations';

interface TokenLockingInterfaceProps {
  className?: string;
}

export const TokenLockingInterface: React.FC<TokenLockingInterfaceProps> = ({
  className,
}) => {
  const [isLockingModalOpen, setIsLockingModalOpen] = useState(false);
  const [selectedView, setSelectedView] = useState<
    'overview' | 'locks' | 'warmup'
  >('overview');

  const { isConnected, address } = useWalletStore();
  const {
    userLocks,
    votingPowerBreakdown,
    isLoading,
    error,
    fetchUserLocks,
    getAvailableVotingPower,
  } = useTokenLockStore();

  useEffect(() => {
    if (isConnected && address) {
      fetchUserLocks(address);
    }
  }, [isConnected, address, fetchUserLocks]);

  const handleRefresh = async () => {
    if (isConnected && address) {
      await fetchUserLocks(address);
    }
  };

  const handleLockCreated = () => {
    setIsLockingModalOpen(false);
    handleRefresh();
  };

  const handleWarmupComplete = (lockId: number) => {
    console.log(`Warmup completed for lock ${lockId}`);
    handleRefresh();
  };

  const activeLocks = userLocks.filter(lock => lock.isWarmupComplete);
  const warmingUpLocks = userLocks.filter(lock => !lock.isWarmupComplete);

  // Handle async voting power calculation
  const [availableVotingPower, setAvailableVotingPower] = useState<bigint>(
    BigInt(0)
  );

  useEffect(() => {
    const fetchVotingPower = async () => {
      if (isConnected && address) {
        const power = await getAvailableVotingPower(address);
        setAvailableVotingPower(power);
      }
    };
    fetchVotingPower();
  }, [isConnected, address, getAvailableVotingPower, userLocks]);

  // Create default breakdown if null
  const defaultBreakdown = {
    totalLocked: BigInt(0),
    totalVotingPower: BigInt(0),
    activeVotingPower: BigInt(0),
    warmingUpLocked: BigInt(0),
    warmingUpCount: 0,
    activeLocked: BigInt(0),
    activeCount: 0,
    locks: [],
    powerUsed: BigInt(0),
    powerAvailable: BigInt(0),
  };

  const breakdown = votingPowerBreakdown || defaultBreakdown;

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
            Connect your wallet to start locking VMF tokens and gain voting
            power
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
          <h2 className="text-2xl font-display font-bold text-patriotWhite mb-2">
            Token Locking & Voting Power
          </h2>
          <p className="text-textSecondary">
            Lock VMF tokens to gain voting power and participate in governance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
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
          { key: 'overview' as const, label: 'Overview' },
          { key: 'locks' as const, label: `Locks (${userLocks.length})` },
          {
            key: 'warmup' as const,
            label: `Warming Up (${warmingUpLocks.length})`,
          },
        ].map(option => (
          <button
            key={option.key}
            onClick={() => setSelectedView(option.key)}
            className={cn(
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
              selectedView === option.key
                ? 'bg-patriotBlue text-patriotWhite shadow-sm'
                : 'text-textSecondary hover:text-patriotWhite'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Content based on selected view */}
      {selectedView === 'overview' && (
        <motion.div
          key="overview"
          variants={fadeInVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Voting Power Display */}
          <VotingPowerDisplay
            breakdown={breakdown}
            userLocks={userLocks}
            onRefresh={handleRefresh}
            showDetails={false}
          />

          {/* Quick Stats */}
          <Card className="p-6">
            <h3 className="text-lg font-display font-bold text-patriotWhite mb-4">
              Lock Summary
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-backgroundAccent rounded-lg">
                <span className="text-textSecondary">Total Locks</span>
                <span className="font-semibold text-patriotWhite">
                  {userLocks.length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-backgroundAccent rounded-lg">
                <span className="text-textSecondary">Active Locks</span>
                <span className="font-semibold text-green-400">
                  {activeLocks.length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-backgroundAccent rounded-lg">
                <span className="text-textSecondary">Warming Up</span>
                <span className="font-semibold text-orange-400">
                  {warmingUpLocks.length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-backgroundAccent rounded-lg">
                <span className="text-textSecondary">
                  Available Voting Power
                </span>
                <span className="font-semibold text-yellow-400">
                  {(Number(availableVotingPower) / 1e18).toLocaleString(
                    undefined,
                    {
                      maximumFractionDigits: 2,
                    }
                  )}{' '}
                  VMF
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {selectedView === 'locks' && (
        <motion.div key="locks" variants={fadeInVariants} className="space-y-6">
          <LockingStatus />
          <VotingPowerDisplay
            breakdown={breakdown}
            userLocks={userLocks}
            onRefresh={handleRefresh}
            showDetails={true}
          />
        </motion.div>
      )}

      {selectedView === 'warmup' && (
        <motion.div
          key="warmup"
          variants={fadeInVariants}
          className="space-y-4"
        >
          {warmingUpLocks.length > 0 ? (
            warmingUpLocks.map(lock => (
              <WarmupTimer
                key={lock.id}
                lock={lock}
                onWarmupComplete={handleWarmupComplete}
              />
            ))
          ) : (
            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-xl font-display font-bold text-patriotWhite mb-2">
                No Locks Warming Up
              </h3>
              <p className="text-textSecondary mb-6">
                All your locks have completed their warmup period and are
                actively earning voting power
              </p>
              <Button
                onClick={() => setIsLockingModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create New Lock
              </Button>
            </Card>
          )}
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-4 bg-red-500/10 border-red-500/20">
          <div className="text-red-400 text-sm">Error: {error}</div>
        </Card>
      )}

      {/* Token Locking Modal */}
      <TokenLockingModal
        isOpen={isLockingModalOpen}
        onClose={() => setIsLockingModalOpen(false)}
        onLockCreated={handleLockCreated}
      />
    </motion.div>
  );
};
