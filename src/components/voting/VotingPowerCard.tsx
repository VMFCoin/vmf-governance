'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Award,
  Lock,
  Unlock,
  Clock,
  TrendingUp,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SimpleTooltip } from '@/components/ui/AnimatedTooltip';
import { useTokenLockStore } from '@/stores/useTokenLockStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { cn } from '@/lib/utils';
import { fadeInVariants } from '@/lib/animations';

interface VotingPowerCardProps {
  className?: string;
  showDetails?: boolean;
  onLockTokens?: () => void;
}

export const VotingPowerCard: React.FC<VotingPowerCardProps> = ({
  className,
  showDetails = true,
  onLockTokens,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [totalVotingPower, setTotalVotingPower] = useState<bigint>(BigInt(0));

  const { address, isConnected } = useWalletStore();
  const {
    votingPowerBreakdown,
    userLocks,
    isLoading: isLoadingLocks,
    fetchUserLocks,
    getTotalVotingPower,
  } = useTokenLockStore();

  // Fetch voting power data when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      fetchUserLocks(address);
      getTotalVotingPower(address).then(setTotalVotingPower);
    }
  }, [isConnected, address, fetchUserLocks, getTotalVotingPower]);

  // Update total voting power when breakdown changes
  useEffect(() => {
    if (votingPowerBreakdown) {
      setTotalVotingPower(votingPowerBreakdown.totalVotingPower);
    }
  }, [votingPowerBreakdown]);

  // Format voting power for display
  const formatVotingPower = (power: bigint): string => {
    const powerNumber = Number(power) / 1e18;
    if (powerNumber === 0) return '0';
    if (powerNumber < 1) return powerNumber.toFixed(4);
    return powerNumber.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  // Calculate lock status
  const activeLocks = userLocks.filter(lock => lock.isWarmupComplete);
  const warmingUpLocks = userLocks.filter(lock => !lock.isWarmupComplete);
  const hasActiveLocks = activeLocks.length > 0;
  const hasWarmingUpLocks = warmingUpLocks.length > 0;

  // Calculate total locked amount
  const totalLockedAmount = userLocks.reduce(
    (sum, lock) => sum + lock.amount,
    BigInt(0)
  );

  const getStatusInfo = () => {
    if (hasActiveLocks) {
      return {
        icon: <Lock className="w-5 h-5 text-green-400" />,
        text: 'Active Locks',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20 border-green-500/30',
      };
    } else if (hasWarmingUpLocks) {
      return {
        icon: <Clock className="w-5 h-5 text-yellow-400" />,
        text: 'Warming Up',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20 border-yellow-500/30',
      };
    } else {
      return {
        icon: <Unlock className="w-5 h-5 text-gray-400" />,
        text: 'No Locks',
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/20 border-gray-500/30',
      };
    }
  };

  const statusInfo = getStatusInfo();

  if (!isConnected) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center">
          <Unlock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-patriotWhite mb-2">
            Connect Wallet
          </h3>
          <p className="text-textSecondary text-sm">
            Connect your wallet to view your voting power
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6 space-y-6', className)}>
      <motion.div variants={fadeInVariants} initial="initial" animate="enter">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-patriotWhite flex items-center gap-3">
            <Zap className="w-6 h-6 text-yellow-400" />
            Voting Power
          </h3>
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold',
              statusInfo.bgColor
            )}
          >
            {statusInfo.icon}
            <span className={statusInfo.color}>{statusInfo.text}</span>
          </div>
        </div>

        {/* Main Power Display */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-xl">
            <Award className="w-8 h-8 text-yellow-400" />
            <div>
              <div className="text-3xl font-bold text-yellow-400">
                {isLoadingLocks ? (
                  <div className="animate-pulse">Loading...</div>
                ) : (
                  `${formatVotingPower(totalVotingPower)} VMF`
                )}
              </div>
              <div className="text-yellow-300/80 text-sm">
                Current Voting Power
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {(hasActiveLocks || hasWarmingUpLocks) && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-patriotBlue/10 border border-patriotBlue/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-patriotWhite">
                {formatVotingPower(totalLockedAmount)}
              </div>
              <div className="text-sm text-patriotWhite/70">VMF Locked</div>
            </div>
            <div className="bg-patriotBlue/10 border border-patriotBlue/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-patriotWhite">
                {userLocks.length}
              </div>
              <div className="text-sm text-patriotWhite/70">Active Locks</div>
            </div>
          </div>
        )}

        {/* Detailed Breakdown */}
        {showDetails && (hasActiveLocks || hasWarmingUpLocks) && (
          <div className="space-y-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-between w-full p-3 bg-patriotBlue/10 border border-patriotBlue/20 rounded-lg hover:bg-patriotBlue/20 transition-colors"
            >
              <span className="font-medium text-patriotWhite">
                Lock Details
              </span>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-patriotBlue" />
              ) : (
                <ChevronDown className="w-5 h-5 text-patriotBlue" />
              )}
            </button>

            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                {activeLocks.map((lock, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <span className="text-patriotWhite font-medium">
                          {formatVotingPower(lock.amount)} VMF
                        </span>
                        <div className="text-xs text-patriotWhite/70">
                          Lock #{index + 1}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-patriotWhite/70 text-right">
                      <div>Active</div>
                      <div>{lock.lockDuration} days</div>
                    </div>
                  </div>
                ))}
                {warmingUpLocks.map((lock, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <div>
                        <span className="text-patriotWhite font-medium">
                          {formatVotingPower(lock.amount)} VMF
                        </span>
                        <div className="text-xs text-patriotWhite/70">
                          Lock #{activeLocks.length + index + 1}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-patriotWhite/70 text-right">
                      <div>Warming Up</div>
                      <div>{lock.lockDuration} days</div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* Call to Action */}
        <div className="bg-patriotBlue/10 border border-patriotBlue/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-patriotBlue/20 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-patriotBlue" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-patriotWhite mb-2">
                {hasActiveLocks
                  ? 'Maximize Your Voting Power'
                  : 'Unlock Voting Power'}
              </h4>
              <p className="text-patriotWhite/80 text-sm leading-relaxed mb-4">
                {hasActiveLocks
                  ? 'You have active token locks! Lock more tokens or extend your lock duration to increase your voting power further.'
                  : 'Lock your VMF tokens to gain voting power and participate in governance decisions. Your voting power increases with the amount and duration of locked tokens.'}
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-patriotWhite">
                  <div className="w-1.5 h-1.5 bg-patriotBlue rounded-full"></div>
                  Higher lock duration = More voting power
                </div>
                <div className="flex items-center gap-2 text-sm text-patriotWhite">
                  <div className="w-1.5 h-1.5 bg-patriotBlue rounded-full"></div>
                  Participate in all governance proposals
                </div>
                <div className="flex items-center gap-2 text-sm text-patriotWhite">
                  <div className="w-1.5 h-1.5 bg-patriotBlue rounded-full"></div>
                  Earn rewards for active participation
                </div>
              </div>
              <Button
                onClick={onLockTokens}
                className="flex items-center gap-2 bg-patriotBlue text-white hover:bg-patriotBlue/80 transition-all duration-200 font-medium transform hover:scale-105"
              >
                <Lock className="w-4 h-4" />
                {hasActiveLocks ? 'Lock More Tokens' : 'Lock Tokens'}
              </Button>
            </div>
          </div>
        </div>

        {/* Info Tooltip */}
        <div className="flex items-center justify-center">
          <SimpleTooltip text="Voting power is calculated based on the amount and duration of your locked VMF tokens. Longer locks provide more voting power per token.">
            <div className="flex items-center gap-2 text-sm text-textSecondary cursor-help">
              <Info className="w-4 h-4" />
              <span>How is voting power calculated?</span>
            </div>
          </SimpleTooltip>
        </div>
      </motion.div>
    </Card>
  );
};
