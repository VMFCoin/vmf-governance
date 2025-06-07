'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Wallet,
  User,
  Lock,
  Zap,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Info,
  Timer,
  Shield,
  Target,
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { SimpleTooltip } from '@/components/ui/AnimatedTooltip';
import { CreateProfileModal } from '@/components/profile/CreateProfileModal';
import { TokenLockingModal } from './TokenLockingModal';
import { WarmupTimer } from './WarmupTimer';
import { useVotingPrerequisites } from '@/hooks/useVotingPrerequisites';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { cn } from '@/lib/utils';
import { fadeInVariants, slideUpVariants } from '@/lib/animations';

export interface VotingPrerequisitesProps {
  onAllRequirementsMet?: () => void;
  onRequirementFailed?: (requirement: string) => void;
  showActions?: boolean;
  compact?: boolean;
  minimumPower?: bigint;
  requireWarmupComplete?: boolean;
  className?: string;
}

export function VotingPrerequisites({
  onAllRequirementsMet,
  onRequirementFailed,
  showActions = true,
  compact = false,
  minimumPower = BigInt(0),
  requireWarmupComplete = true,
  className,
}: VotingPrerequisitesProps) {
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [showTokenLocking, setShowTokenLocking] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const { openConnectModal } = useConnectModal();

  const prerequisites = useVotingPrerequisites({
    minimumPower,
    requireWarmupComplete,
    autoRefresh: true,
  });

  const {
    status,
    isAllRequirementsMet,
    totalVotingPower,
    availableVotingPower,
    warmupTimeRemaining,
    activeLocksCount,
    pendingLocksCount,
    isLoading,
    error,
  } = prerequisites;

  // Notify parent when requirements change
  React.useEffect(() => {
    if (isAllRequirementsMet && onAllRequirementsMet) {
      onAllRequirementsMet();
    }
  }, [isAllRequirementsMet, onAllRequirementsMet]);

  // Format voting power for display
  const formatVotingPower = (power: bigint): string => {
    const powerNumber = Number(power) / 1e18;
    if (powerNumber === 0) return '0';
    if (powerNumber < 1) return powerNumber.toFixed(4);
    return powerNumber.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  // Format time remaining
  const formatTimeRemaining = (ms: number): string => {
    if (ms <= 0) return 'Complete';

    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Get status icon and color
  const getStatusIcon = (
    status: string,
    isLoading: boolean = false
  ): { icon: React.ReactNode; color: string; bgColor: string } => {
    if (isLoading) {
      return {
        icon: <RefreshCw className="w-5 h-5 animate-spin" />,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/15 border-blue-500/30',
      };
    }

    switch (status) {
      case 'connected':
      case 'exists':
      case 'sufficient':
      case 'complete':
      case 'available':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          color: 'text-green-400',
          bgColor: 'bg-green-500/15 border-green-500/30',
        };
      case 'pending':
        return {
          icon: <Clock className="w-5 h-5" />,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/15 border-yellow-500/30',
        };
      case 'disconnected':
      case 'missing':
      case 'none':
      case 'insufficient':
      case 'used':
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          color: 'text-red-400',
          bgColor: 'bg-red-500/15 border-red-500/30',
        };
      default:
        return {
          icon: <Info className="w-5 h-5" />,
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/15 border-gray-500/30',
        };
    }
  };

  // Requirement definitions
  const requirements = [
    {
      id: 'wallet',
      title: 'Wallet Connection',
      description: 'Connect your Web3 wallet to participate',
      icon: Wallet,
      status: status.wallet,
      isLoading: false,
      action:
        status.wallet === 'disconnected' && showActions ? (
          <Button
            onClick={openConnectModal}
            size="sm"
            className="bg-patriotBlue hover:bg-patriotBlue/80"
          >
            Connect Wallet
          </Button>
        ) : null,
      details:
        status.wallet === 'connected'
          ? 'Wallet successfully connected'
          : 'Please connect your wallet to continue',
    },
    {
      id: 'profile',
      title: 'User Profile',
      description: 'Create your VMF governance profile',
      icon: User,
      status: status.profile,
      isLoading: status.profile === 'loading',
      action:
        status.profile === 'missing' && showActions ? (
          <Button
            onClick={() => setShowCreateProfile(true)}
            size="sm"
            className="bg-patriotBlue hover:bg-patriotBlue/80"
          >
            Create Profile
          </Button>
        ) : null,
      details:
        status.profile === 'exists'
          ? 'Profile created and verified'
          : status.profile === 'missing'
            ? 'Profile required for governance participation'
            : 'Checking profile status...',
    },
    {
      id: 'tokenLock',
      title: 'Token Lock',
      description: 'Lock VMF tokens to gain voting power',
      icon: Lock,
      status: status.tokenLock,
      isLoading: status.tokenLock === 'loading',
      action:
        (status.tokenLock === 'none' || status.tokenLock === 'insufficient') &&
        showActions ? (
          <Button
            onClick={() => setShowTokenLocking(true)}
            size="sm"
            className="bg-starGold hover:bg-starGold/80 text-black"
          >
            Lock Tokens
          </Button>
        ) : null,
      details:
        status.tokenLock === 'sufficient'
          ? `${formatVotingPower(totalVotingPower)} VMF locked`
          : status.tokenLock === 'insufficient'
            ? `Insufficient power: ${formatVotingPower(totalVotingPower)} VMF`
            : status.tokenLock === 'none'
              ? 'No tokens locked yet'
              : 'Checking token locks...',
    },
    {
      id: 'warmup',
      title: 'Warmup Period',
      description: '3-day warmup period for new locks',
      icon: Timer,
      status: status.warmup,
      isLoading: status.warmup === 'loading',
      action: null,
      details:
        status.warmup === 'complete'
          ? `${activeLocksCount} active locks ready`
          : status.warmup === 'pending'
            ? `${pendingLocksCount} locks warming up: ${formatTimeRemaining(warmupTimeRemaining)}`
            : status.warmup === 'not_applicable'
              ? 'No warmup required'
              : 'Checking warmup status...',
      expandable: status.warmup === 'pending',
      expandedContent:
        status.warmup === 'pending' && pendingLocksCount > 0 ? (
          <div className="mt-4 space-y-2">
            <div className="text-sm text-gray-400 mb-2">Warmup Progress:</div>
            <div className="text-sm text-gray-500">
              Warmup timer would be displayed here for active locks
            </div>
          </div>
        ) : null,
    },
    {
      id: 'votingPower',
      title: 'Voting Power',
      description: 'Available power for casting votes',
      icon: Zap,
      status: status.votingPower,
      isLoading: status.votingPower === 'loading',
      action: null,
      details:
        status.votingPower === 'available'
          ? `${formatVotingPower(availableVotingPower)} VMF available`
          : status.votingPower === 'used'
            ? 'All voting power currently allocated'
            : status.votingPower === 'insufficient'
              ? 'Insufficient voting power'
              : 'Calculating voting power...',
    },
  ];

  if (compact) {
    return (
      <Card
        className={cn(
          'p-4 bg-gradient-to-r from-patriotBlue/5 to-patriotRed/5 border-white/10',
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-patriotBlue" />
            <div>
              <div className="text-sm font-medium text-white">
                Voting Requirements
              </div>
              <div className="text-xs text-gray-400">
                {isAllRequirementsMet
                  ? 'All requirements met'
                  : 'Requirements pending'}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {requirements.map(req => {
              const { icon, color } = getStatusIcon(req.status, req.isLoading);
              return (
                <SimpleTooltip key={req.id} text={req.title}>
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center',
                      color
                    )}
                  >
                    {React.cloneElement(icon as React.ReactElement, {
                      className: 'w-3 h-3',
                    })}
                  </div>
                </SimpleTooltip>
              );
            })}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <motion.div
        className={cn('space-y-6', className)}
        variants={fadeInVariants}
        initial="initial"
        animate="enter"
      >
        {/* Header */}
        <Card className="bg-gradient-to-br from-patriotBlue/10 via-patriotRed/5 to-starGold/10 border-white/10 p-6 rounded-2xl shadow-xl backdrop-blur-md">
          <div className="text-center">
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-patriotBlue/40 to-patriotRed/40 rounded-2xl mb-4 shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Voting Prerequisites
            </h2>
            <p className="text-gray-300">
              Complete these requirements to participate in governance voting
            </p>
          </div>

          {/* Progress indicator */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Progress</span>
              <span>
                {
                  requirements.filter(req =>
                    [
                      'connected',
                      'exists',
                      'sufficient',
                      'complete',
                      'available',
                    ].includes(req.status)
                  ).length
                }{' '}
                / {requirements.length}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-patriotBlue to-starGold h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${
                    (requirements.filter(req =>
                      [
                        'connected',
                        'exists',
                        'sufficient',
                        'complete',
                        'available',
                      ].includes(req.status)
                    ).length /
                      requirements.length) *
                    100
                  }%`,
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </Card>

        {/* Requirements List */}
        <div className="space-y-4">
          {requirements.map((requirement, index) => {
            const {
              icon: statusIcon,
              color,
              bgColor,
            } = getStatusIcon(requirement.status, requirement.isLoading);
            const IconComponent = requirement.icon;
            const isExpanded = expandedSection === requirement.id;

            return (
              <motion.div
                key={requirement.id}
                variants={slideUpVariants}
                initial="initial"
                animate="enter"
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={cn(
                    'p-4 border transition-all duration-200',
                    bgColor
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center',
                            bgColor
                          )}
                        >
                          {statusIcon}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-white">
                            {requirement.title}
                          </h3>
                          {requirement.expandable && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setExpandedSection(
                                  isExpanded ? null : requirement.id
                                )
                              }
                              className="p-1 h-auto"
                            >
                              <ArrowRight
                                className={cn(
                                  'w-4 h-4 transition-transform',
                                  isExpanded && 'rotate-90'
                                )}
                              />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          {requirement.description}
                        </p>
                        <p className="text-sm text-gray-300 mt-1">
                          {requirement.details}
                        </p>
                      </div>
                    </div>
                    {requirement.action && (
                      <div className="ml-4">{requirement.action}</div>
                    )}
                  </div>

                  {/* Expandable content */}
                  <AnimatePresence>
                    {isExpanded && requirement.expandedContent && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        {requirement.expandedContent}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Action Button */}
        {isAllRequirementsMet && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <Button
              onClick={onAllRequirementsMet}
              size="lg"
              className="bg-gradient-to-r from-patriotBlue to-patriotRed hover:from-patriotBlue/80 hover:to-patriotRed/80 text-white font-semibold px-8 py-4 rounded-xl shadow-xl"
            >
              <Target className="w-5 h-5 mr-2" />
              Continue to Vote
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <Card className="p-4 bg-red-500/15 border-red-500/30">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <div className="text-sm font-medium text-red-400">Error</div>
                <div className="text-sm text-red-300">{error}</div>
              </div>
            </div>
          </Card>
        )}
      </motion.div>

      {/* Modals */}
      <CreateProfileModal
        isOpen={showCreateProfile}
        onClose={() => setShowCreateProfile(false)}
      />

      <TokenLockingModal
        isOpen={showTokenLocking}
        onClose={() => setShowTokenLocking(false)}
      />
    </>
  );
}
