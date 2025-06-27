'use client';

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  DollarSign,
  Calendar,
  Users,
  CheckCircle,
  Check,
  X,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  Award,
  TrendingUp,
  Star,
  Globe,
  Trophy,
  Target,
  Sparkles,
  Clock,
  Shield,
  ArrowRight,
  Info,
  Vote,
  RefreshCw,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { SimpleTooltip } from '@/components/ui/AnimatedTooltip';
import { ProfileGuard } from '@/components/auth';
import { useToast } from '@/components/ui/Toast';
import { useCharityStore } from '@/stores/useCharityStore';
import { useProposalStore } from '@/stores/useProposalStore';
import { useTokenLockStore } from '@/stores/useTokenLockStore';
import { useWalletSync } from '@/hooks/useWalletSync';
import { HolidayCharityProposal, Charity } from '@/types';
import {
  cn,
  formatCurrencySafe,
  formatVMFSafe,
  formatNumberSafe,
} from '@/lib/utils';
import { fadeInVariants } from '@/lib/animations';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { useWalletStore } from '@/stores/useWalletStore';
import {
  holidayCharityGaugeService,
  CharityVoteAllocation,
  HolidayGaugeVoteParams,
} from '@/services/holidayCharityGaugeService';
import {
  deployedGaugeService,
  CharityGaugeMapping,
  HolidayVotingResults,
} from '@/services/deployedGaugeService';
import { Address } from 'viem';

interface HolidayCharityVotingProps {
  proposal: HolidayCharityProposal;
  onVoteSubmitted?: () => void;
}

export function HolidayCharityVoting({
  proposal,
  onVoteSubmitted,
}: HolidayCharityVotingProps) {
  const [selectedCharity, setSelectedCharity] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalVotingPower, setTotalVotingPower] = useState<bigint>(BigInt(0));
  const [showResults, setShowResults] = useState(false);

  // New state for gauge integration
  const [charityGaugeMappings, setCharityGaugeMappings] = useState<
    CharityGaugeMapping[]
  >([]);
  const [holidayVotingResults, setHolidayVotingResults] =
    useState<HolidayVotingResults | null>(null);
  const [isLoadingGauges, setIsLoadingGauges] = useState(false);
  const [gaugeError, setGaugeError] = useState<string | null>(null);
  const [userVotedGauges, setUserVotedGauges] = useState<Address[]>([]);
  const [isVotingActive, setIsVotingActive] = useState(false);
  const [votingPeriodInfo, setVotingPeriodInfo] = useState<any>(null);

  // Real-time updates
  const [isSubscribed, setIsSubscribed] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Wallet connection
  const { address, isConnected } = useWalletConnection();

  // Store selectors with stable references
  const charities = useCharityStore(state => state.charities);
  const charitiesLoading = useCharityStore(state => state.isLoading);
  const fetchCharities = useCharityStore(state => state.fetchCharities);
  const getCharityById = useCharityStore(state => state.getCharityById);

  const { submitVote, getUserVote } = useProposalStore();
  const { showSuccess, showError, showInfo } = useToast();

  const votingPowerBreakdown = useTokenLockStore(
    state => state.votingPowerBreakdown
  );
  const isLoadingVotingPower = useTokenLockStore(state => state.isLoading);
  const fetchUserLocks = useTokenLockStore(state => state.fetchUserLocks);
  const getTotalVotingPower = useTokenLockStore(
    state => state.getTotalVotingPower
  );

  // Get user's locked NFT token IDs for voting
  const userTokenIds = useMemo(() => {
    if (!votingPowerBreakdown?.locks) return [];
    return votingPowerBreakdown.locks.map(lock => lock.tokenId);
  }, [votingPowerBreakdown?.locks]);

  // Check if user has already voted using gauge system
  const hasVotedOnGauge = useMemo(() => {
    if (!userVotedGauges.length || !charityGaugeMappings.length) return false;

    // Check if user has voted on any charity gauge for this holiday
    return charityGaugeMappings.some(mapping =>
      userVotedGauges.includes(mapping.gaugeAddress)
    );
  }, [userVotedGauges, charityGaugeMappings]);

  // Legacy vote check for backward compatibility
  const userVote = getUserVote(proposal.id);
  const hasVoted = hasVotedOnGauge || !!userVote;

  // Initialize gauge mappings and voting data
  const initializeGaugeData = useCallback(async () => {
    if (!proposal?.availableCharities?.length || isLoadingGauges) return;

    setIsLoadingGauges(true);
    setGaugeError(null);

    try {
      // Get charity objects
      const holidayCharities = proposal.availableCharities
        .map(charityId => getCharityById(charityId))
        .filter((charity): charity is Charity => charity !== null);

      if (holidayCharities.length === 0) {
        throw new Error('No valid charities found for this holiday');
      }

      // Create charity gauge mappings
      const mappings =
        await holidayCharityGaugeService.createCharityGaugeMappings(
          proposal.id,
          holidayCharities
        );
      setCharityGaugeMappings(mappings);

      // Get voting results
      const results = await holidayCharityGaugeService.getHolidayVotingResults(
        proposal.id,
        holidayCharities
      );
      setHolidayVotingResults(results);

      // Check voting period status
      const periodInfo = await holidayCharityGaugeService.getVotingPeriodInfo();
      setVotingPeriodInfo(periodInfo);
      setIsVotingActive(periodInfo.isActive);

      console.log('Gauge data initialized:', { mappings, results, periodInfo });
    } catch (error) {
      console.error('Failed to initialize gauge data:', error);
      setGaugeError(
        error instanceof Error ? error.message : 'Failed to load voting data'
      );
    } finally {
      setIsLoadingGauges(false);
    }
  }, [
    proposal?.availableCharities,
    proposal?.id,
    getCharityById,
    isLoadingGauges,
  ]);

  // Load user's voted gauges
  const loadUserVotedGauges = useCallback(async () => {
    if (!userTokenIds.length) return;

    try {
      // Get voted gauges for the first token ID (assuming single token voting for now)
      const votedGauges = await holidayCharityGaugeService.getTokenVotedGauges(
        userTokenIds[0]
      );
      setUserVotedGauges(votedGauges);
    } catch (error) {
      console.error('Failed to load user voted gauges:', error);
    }
  }, [userTokenIds]);

  // Stable function references
  const handleFetchCharities = useCallback(async () => {
    if (charities.length === 0 && !charitiesLoading) {
      try {
        await fetchCharities();
      } catch (error) {
        console.error('Failed to fetch charities:', error);
      }
    }
  }, [charities.length, charitiesLoading, fetchCharities]);

  const handleFetchVotingPower = useCallback(
    async (walletAddress: string) => {
      try {
        await fetchUserLocks(walletAddress);
        const power = await getTotalVotingPower(walletAddress);
        setTotalVotingPower(power);
      } catch (error) {
        console.error('Failed to fetch voting power:', error);
      }
    },
    [fetchUserLocks, getTotalVotingPower]
  );

  // CONSOLIDATED useEffect - fetch all required data
  useEffect(() => {
    // Fetch charities if not loaded
    handleFetchCharities();

    // Fetch voting power if wallet is connected
    if (isConnected && address) {
      handleFetchVotingPower(address);
    }
  }, [isConnected, address, handleFetchCharities, handleFetchVotingPower]);

  // Initialize gauge data when charities are loaded
  useEffect(() => {
    if (charities.length > 0 && !isLoadingGauges) {
      initializeGaugeData();
    }
  }, [charities.length, initializeGaugeData, isLoadingGauges]);

  // Load user voted gauges when token IDs are available
  useEffect(() => {
    if (userTokenIds.length > 0) {
      loadUserVotedGauges();
    }
  }, [userTokenIds, loadUserVotedGauges]);

  // Subscribe to real-time voting events
  useEffect(() => {
    if (!isSubscribed && charityGaugeMappings.length > 0) {
      const unsubscribe = holidayCharityGaugeService.subscribeToVotingEvents(
        event => {
          console.log('Vote event received:', event);

          // Refresh voting results when new votes come in
          if (
            charityGaugeMappings.some(
              mapping => mapping.gaugeAddress === event.gauge
            )
          ) {
            initializeGaugeData();

            // If it's the current user's vote, update their voted gauges
            if (
              address &&
              event.voter.toLowerCase() === address.toLowerCase()
            ) {
              loadUserVotedGauges();
            }
          }
        }
      );

      unsubscribeRef.current = unsubscribe;
      setIsSubscribed(true);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        setIsSubscribed(false);
      }
    };
  }, [
    isSubscribed,
    charityGaugeMappings,
    address,
    initializeGaugeData,
    loadUserVotedGauges,
  ]);

  // Update total voting power when breakdown changes
  useEffect(() => {
    if (votingPowerBreakdown) {
      setTotalVotingPower(votingPowerBreakdown.totalVotingPower);
    }
  }, [votingPowerBreakdown]);

  // Format voting power for display
  const formatVotingPower = useCallback((power: bigint): string => {
    const powerNumber = Number(power) / 1e18;
    if (powerNumber === 0) return '0';
    if (powerNumber < 1) return powerNumber.toFixed(4);
    return formatNumberSafe(powerNumber, { maximumFractionDigits: 2 });
  }, []);

  // Map charities with gauge voting data
  const availableCharities = useMemo(() => {
    if (
      !proposal?.availableCharities ||
      charitiesLoading ||
      !charityGaugeMappings.length
    )
      return [];

    return proposal.availableCharities
      .map(charityId => {
        const charity = getCharityById(charityId);
        if (!charity) return null;

        // Find the corresponding gauge mapping
        const gaugeMapping = charityGaugeMappings.find(
          mapping => mapping.charityId === charityId
        );
        if (!gaugeMapping) return null;

        // Get voting data from holiday voting results
        const voteData = holidayVotingResults?.charityMappings.find(
          (mapping: CharityGaugeMapping) => mapping.charityId === charityId
        ) || {
          votes: BigInt(0),
          percentage: 0,
          totalVotingPower: BigInt(0),
          rank: 0,
        };

        return {
          ...charity,
          votes: Number(voteData.votes),
          percentage: voteData.percentage,
          totalVotingPower: voteData.votes,
          rank: 0, // Will be calculated after sorting
          gaugeAddress: gaugeMapping.gaugeAddress,
          gaugeMapping,
        };
      })
      .filter(
        (
          charity
        ): charity is Charity & {
          votes: number;
          percentage: number;
          totalVotingPower: bigint;
          rank: number;
          gaugeAddress: Address;
          gaugeMapping: CharityGaugeMapping;
        } => charity !== null
      );
  }, [
    proposal?.availableCharities,
    charitiesLoading,
    charityGaugeMappings,
    holidayVotingResults,
    getCharityById,
  ]);

  // Handle gauge-based charity vote submission
  const handleCharityVote = async (charityId: string) => {
    if (hasVoted) {
      showError('Already Voted', 'You have already voted on this proposal.');
      return;
    }

    if (totalVotingPower === BigInt(0)) {
      showError('No Voting Power', 'You need to lock VMF tokens to vote.');
      return;
    }

    if (!isVotingActive) {
      showError(
        'Voting Inactive',
        'Voting is not currently active for this period.'
      );
      return;
    }

    if (userTokenIds.length === 0) {
      showError('No Tokens', 'You need locked NFT tokens to vote.');
      return;
    }

    const charity = availableCharities.find(c => c.id === charityId);
    if (!charity) {
      showError('Invalid Charity', 'Selected charity not found.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Use the first available token ID for voting
      const tokenId = userTokenIds[0];

      const result = await holidayCharityGaugeService.submitSingleCharityVote(
        tokenId,
        charityId,
        charity.gaugeAddress
      );

      if (result.success) {
        showSuccess(
          'Vote Submitted!',
          `Your vote for ${charity.name} has been recorded on-chain.`
        );

        // Refresh data after successful vote
        await Promise.all([initializeGaugeData(), loadUserVotedGauges()]);

        onVoteSubmitted?.();
      } else {
        throw new Error(result.error || 'Vote submission failed');
      }
    } catch (error) {
      console.error('Failed to submit vote:', error);
      showError(
        'Vote Failed',
        error instanceof Error
          ? error.message
          : 'There was an error submitting your vote.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset user votes
  const handleResetVotes = async () => {
    if (!hasVoted || userTokenIds.length === 0) return;

    setIsSubmitting(true);
    try {
      const tokenId = userTokenIds[0];
      const result = await holidayCharityGaugeService.resetVotes(tokenId);

      if (result.success) {
        showSuccess('Votes Reset', 'Your votes have been reset successfully.');

        // Refresh data after reset
        await Promise.all([initializeGaugeData(), loadUserVotedGauges()]);
      } else {
        throw new Error(result.error || 'Vote reset failed');
      }
    } catch (error) {
      console.error('Failed to reset votes:', error);
      showError(
        'Reset Failed',
        error instanceof Error ? error.message : 'Failed to reset votes.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get charity vote data for results display
  const getCharityVoteData = useCallback(
    (charityId: string) => {
      const charity = availableCharities.find(c => c.id === charityId);
      return charity
        ? {
            votes: charity.votes,
            percentage: charity.percentage,
            totalVotingPower: charity.totalVotingPower,
            rank: charity.rank,
          }
        : { votes: 0, percentage: 0, totalVotingPower: BigInt(0), rank: 0 };
    },
    [availableCharities]
  );

  // Sort charities by vote percentage for results display
  const sortedCharities = useMemo(() => {
    return [...availableCharities].sort((a, b) => {
      return b.percentage - a.percentage;
    });
  }, [availableCharities]);

  // Check if user has voted for a specific charity
  const hasUserVotedForCharity = useCallback(
    (charityId: string) => {
      const charity = availableCharities.find(c => c.id === charityId);
      if (!charity) return false;

      return userVotedGauges.includes(charity.gaugeAddress);
    },
    [availableCharities, userVotedGauges]
  );

  return (
    <ProfileGuard fallbackMessage="You need a profile to vote on holiday charity proposals.">
      <div className="space-y-8">
        {/* Hero Section */}
        <motion.div
          className="relative overflow-hidden"
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          whileHover={{ scale: 1.005 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <Card className="relative bg-gradient-to-br from-patriotBlue/10 via-patriotRed/5 to-starGold/10 border-white/10 p-8 rounded-3xl shadow-2xl shadow-black/20 backdrop-blur-md">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 rounded-3xl"></div>
            <div className="relative text-center mb-8">
              <motion.h1
                className="text-4xl font-bold text-white mb-4 tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Veterans Day 2025 Fund Distribution
              </motion.h1>
              <motion.p
                className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Vote for which charity should receive the $
                {formatCurrencySafe(proposal.fundAmount)} Veterans Day fund
              </motion.p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-6">
              {[
                {
                  icon: DollarSign,
                  value: `$${formatCurrencySafe(proposal.fundAmount)}`,
                  label: 'Total Fund',
                  color: 'starGold',
                  delay: 0.1,
                },
                {
                  icon: Users,
                  value: proposal.totalVotes,
                  label: 'Votes Cast',
                  color: 'patriotBlue',
                  delay: 0.2,
                },
                {
                  icon: Clock,
                  value: proposal.timeLeft.split(' ')[0],
                  label: 'Days Left',
                  color: 'green-400',
                  delay: 0.3,
                },
              ].map((metric, index) => (
                <motion.div
                  key={index}
                  className={`bg-gradient-to-br ${
                    metric.color === 'starGold'
                      ? 'from-starGold/15 to-yellow-500/15 border-starGold/30'
                      : metric.color === 'patriotBlue'
                        ? 'from-patriotBlue/15 to-blue-500/15 border-patriotBlue/30'
                        : 'from-green-500/15 to-emerald-500/15 border-green-500/30'
                  } border rounded-2xl p-6 text-center shadow-lg backdrop-blur-sm`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: metric.delay,
                    type: 'spring',
                    stiffness: 200,
                  }}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <metric.icon
                      className={`w-8 h-8 ${
                        metric.color === 'starGold'
                          ? 'text-starGold'
                          : metric.color === 'patriotBlue'
                            ? 'text-patriotBlue'
                            : 'text-green-400'
                      } mx-auto mb-3`}
                    />
                  </motion.div>
                  <div className="text-3xl font-bold text-white mb-2">
                    {metric.value}
                  </div>
                  <div className="text-sm text-gray-400">{metric.label}</div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Voting Status */}
        <motion.div
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-slate-700/50 p-6 rounded-xl">
            {/* Gauge loading or error state */}
            {(isLoadingGauges || gaugeError) && (
              <div className="mb-4 p-3 rounded-lg border">
                {isLoadingGauges ? (
                  <div className="flex items-center space-x-3 text-blue-400 border-blue-400/30 bg-blue-400/10">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading gauge data...</span>
                  </div>
                ) : gaugeError ? (
                  <div className="flex items-center justify-between text-red-400 border-red-400/30 bg-red-400/10">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{gaugeError}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={initializeGaugeData}
                      className="text-red-400 hover:text-red-300 h-auto p-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                ) : null}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-10 h-10 bg-slate-700/50 rounded-lg">
                  <Zap className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-300 mb-1">
                    Your Voting Power
                  </div>
                  <div className="text-lg font-bold text-white">
                    {isLoadingVotingPower ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    ) : (
                      <span className="font-semibold text-yellow-400">
                        {formatVMFSafe(totalVotingPower)} VMF
                      </span>
                    )}
                  </div>
                  {userTokenIds.length > 0 && (
                    <div className="text-xs text-slate-400 mt-1">
                      Token ID: {userTokenIds[0]}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end space-y-2">
                {/* Voting status */}
                <div
                  className={cn(
                    'inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium',
                    hasVoted
                      ? 'bg-green-500/20 text-green-400'
                      : totalVotingPower > 0 && isVotingActive
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-red-500/20 text-red-400'
                  )}
                >
                  {hasVoted ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Vote Submitted</span>
                    </>
                  ) : totalVotingPower > 0 && isVotingActive ? (
                    <>
                      <Target className="w-4 h-4" />
                      <span>Ready to Vote</span>
                    </>
                  ) : !isVotingActive ? (
                    <>
                      <Clock className="w-4 h-4" />
                      <span>Voting Inactive</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      <span>Lock tokens to vote</span>
                    </>
                  )}
                </div>

                {/* Reset votes button */}
                {hasVoted && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleResetVotes}
                    disabled={isSubmitting}
                    className="text-xs border-slate-600 text-slate-300 hover:text-white hover:border-slate-500"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="w-3 h-3 mr-1" />
                    )}
                    Reset Vote
                  </Button>
                )}
              </div>
            </div>

            {/* Voting period info */}
            {votingPeriodInfo && (
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-400">Epoch ID</div>
                    <div className="text-white font-medium">
                      {votingPeriodInfo.epochId.toString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Voting Active</div>
                    <div
                      className={cn(
                        'font-medium',
                        isVotingActive ? 'text-green-400' : 'text-red-400'
                      )}
                    >
                      {isVotingActive ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Results Toggle */}
        <motion.div
          className="flex justify-center"
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.2 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <Button
              variant="outline"
              onClick={() => setShowResults(!showResults)}
              className={cn(
                'relative overflow-hidden bg-gradient-to-r from-slate-800/60 to-slate-900/60 border-slate-600/50 hover:border-slate-500/60 text-white px-8 py-4 rounded-xl shadow-lg backdrop-blur-sm transition-all duration-300',
                'hover:shadow-xl hover:shadow-slate-500/20 hover:from-slate-700/60 hover:to-slate-800/60',
                showResults &&
                  'border-blue-400/50 bg-gradient-to-r from-blue-900/30 to-slate-900/60'
              )}
            >
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: showResults ? 360 : 0 }}
                  transition={{ duration: 0.5, type: 'spring' }}
                >
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </motion.div>
                <span className="font-semibold text-lg">
                  {showResults ? 'Hide Results' : 'Show Results'}
                </span>
                <motion.div
                  animate={{ rotate: showResults ? 180 : 0 }}
                  transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
                >
                  <ChevronDown className="w-5 h-5 text-slate-300" />
                </motion.div>
              </div>

              {/* Animated background shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] transition-transform duration-700 hover:translate-x-[100%]" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {showResults && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{
                duration: 0.4,
                type: 'spring',
                stiffness: 200,
                damping: 25,
              }}
            >
              <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/80 border-slate-600/50 rounded-2xl shadow-2xl backdrop-blur-sm">
                {/* Header with enhanced styling */}
                <div className="relative p-6 pb-4 border-b border-slate-700/50">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-blue-500/5" />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.6 }}
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-xl flex items-center justify-center border border-yellow-500/30 shadow-lg">
                          <Trophy className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div className="absolute inset-0 bg-yellow-400/20 rounded-xl animate-pulse opacity-50" />
                      </motion.div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-1">
                          Live Results
                        </h3>
                        <p className="text-slate-400 text-sm">
                          Real-time voting standings
                        </p>
                      </div>
                    </div>

                    {/* Total votes indicator */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {proposal.totalVotes}
                      </div>
                      <div className="text-xs text-slate-400 uppercase tracking-wide">
                        Total Votes
                      </div>
                    </div>
                  </div>
                </div>

                {/* Results list with enhanced styling */}
                <div className="p-6 space-y-4">
                  {sortedCharities.map((charity, index) => {
                    const voteData = getCharityVoteData(charity.id);
                    const isLeading = index === 0;
                    const isUserVote = hasUserVotedForCharity(charity.id);

                    return (
                      <motion.div
                        key={charity.id}
                        className={cn(
                          'relative overflow-hidden rounded-xl p-5 transition-all duration-300',
                          'border backdrop-blur-sm',
                          isLeading
                            ? 'border-yellow-500/50 bg-gradient-to-r from-yellow-500/15 to-amber-500/10 shadow-lg shadow-yellow-500/20'
                            : isUserVote
                              ? 'border-green-500/50 bg-gradient-to-r from-green-500/15 to-emerald-500/10 shadow-lg shadow-green-500/20'
                              : 'border-slate-600/40 bg-gradient-to-r from-slate-800/40 to-slate-900/60 hover:border-slate-500/50'
                        )}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: index * 0.1,
                          type: 'spring',
                          stiffness: 200,
                        }}
                        whileHover={{ scale: 1.02, y: -2 }}
                      >
                        {/* Ranking badge */}
                        <div className="absolute top-3 left-3">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg',
                              isLeading
                                ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-900'
                                : index === 1
                                  ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800'
                                  : index === 2
                                    ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-amber-100'
                                    : 'bg-gradient-to-br from-slate-600 to-slate-700 text-slate-200'
                            )}
                          >
                            {index + 1}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="ml-12">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              {/* Charity logo */}
                              <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center border border-slate-600/30">
                                {charity.logo ? (
                                  <img
                                    src={charity.logo}
                                    alt={charity.name}
                                    className="w-6 h-6 rounded object-cover"
                                  />
                                ) : (
                                  <Heart className="w-5 h-5 text-red-400" />
                                )}
                              </div>

                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-white text-lg">
                                    {charity.name}
                                  </span>
                                  {isLeading && (
                                    <motion.div
                                      animate={{ scale: [1, 1.2, 1] }}
                                      transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                      }}
                                    >
                                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                                    </motion.div>
                                  )}
                                  {isUserVote && (
                                    <div className="px-2 py-1 bg-green-500/30 text-green-300 text-xs rounded-full border border-green-400/50">
                                      Your Vote
                                    </div>
                                  )}
                                </div>
                                <div className="text-sm text-slate-400">
                                  {charity.category.replace('_', ' ')} •{' '}
                                  {charity.impactMetrics.veteransServed.toLocaleString()}{' '}
                                  veterans served
                                </div>
                              </div>
                            </div>

                            {/* Vote stats */}
                            <div className="text-right">
                              <div className="text-2xl font-bold text-white">
                                {voteData.percentage.toFixed(1)}%
                              </div>
                              <div className="text-sm text-slate-400">
                                {voteData.votes.toLocaleString()} votes
                              </div>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="relative">
                            <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                              <motion.div
                                className={cn(
                                  'h-full rounded-full relative overflow-hidden',
                                  isLeading
                                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                                    : isUserVote
                                      ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                                      : 'bg-gradient-to-r from-blue-400 to-cyan-500'
                                )}
                                initial={{ width: 0 }}
                                animate={{ width: `${voteData.percentage}%` }}
                                transition={{
                                  duration: 1.2,
                                  delay: index * 0.15,
                                  type: 'spring',
                                  stiffness: 100,
                                }}
                              >
                                {/* Animated shimmer effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] animate-pulse" />
                              </motion.div>
                            </div>

                            {/* Percentage label on bar */}
                            {voteData.percentage > 15 && (
                              <div className="absolute inset-y-0 left-3 flex items-center">
                                <span className="text-xs font-bold text-white/90">
                                  {voteData.percentage.toFixed(1)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Leading indicator */}
                        {isLeading && (
                          <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-500/20 to-transparent w-20 h-full" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Footer with summary */}
                <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-900/50">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4 text-slate-400">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                        <span>Leading</span>
                      </div>
                      {hasVoted && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full" />
                          <span>Your Vote</span>
                        </div>
                      )}
                    </div>
                    <div className="text-slate-400">
                      Last updated: {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Charity Selection */}
        <motion.div
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 rounded-xl bg-slate-800/50 border-slate-700/50">
            <div className="flex items-center space-x-3 mb-6">
              <Users className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-bold text-white">
                {hasVoted ? 'Available Charities' : 'Choose Your Charity'}
              </h3>
            </div>

            {/* Loading State */}
            {charitiesLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="border border-slate-700/50 rounded-lg p-4 bg-slate-800/30"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-slate-700/50 rounded-lg animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-700/50 rounded animate-pulse" />
                        <div className="h-3 bg-slate-700/50 rounded w-3/4 animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Charities */}
            {!charitiesLoading && availableCharities.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-white mb-2">
                  No Charities Available
                </h4>
                <p className="text-slate-400">
                  Charity data is currently unavailable.
                </p>
              </div>
            )}

            {/* Charity Grid */}
            {!charitiesLoading && availableCharities.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {availableCharities.map((charity, index) => {
                  const isUserVote = hasUserVotedForCharity(charity.id);
                  const canVote =
                    !hasVoted &&
                    totalVotingPower > 0 &&
                    isVotingActive &&
                    !isLoadingGauges &&
                    !gaugeError;
                  const isSubmittingThisCharity =
                    isSubmitting && selectedCharity === charity.id;

                  return (
                    <motion.div
                      key={charity.id}
                      className={cn(
                        'group relative border rounded-xl p-4 sm:p-6 transition-all duration-300 overflow-hidden',
                        'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:translate-x-[-100%] before:transition-transform before:duration-700',
                        isUserVote
                          ? 'border-green-500/60 bg-gradient-to-br from-green-500/20 to-emerald-500/10 shadow-lg shadow-green-500/20'
                          : canVote
                            ? 'border-slate-600/50 bg-gradient-to-br from-slate-800/40 to-slate-900/60 hover:border-blue-400/60 hover:shadow-xl hover:shadow-blue-500/20 hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-slate-800/40 cursor-pointer'
                            : 'border-slate-700/40 bg-gradient-to-br from-slate-800/20 to-slate-900/40 opacity-60'
                      )}
                      onClick={() => {
                        if (canVote && !isSubmittingThisCharity) {
                          setSelectedCharity(charity.id);
                          handleCharityVote(charity.id);
                        }
                      }}
                      whileHover={
                        canVote && !isSubmittingThisCharity
                          ? {
                              scale: 1.02,
                              y: -6,
                              rotateX: 1,
                              rotateY: 0.5,
                            }
                          : {}
                      }
                      whileTap={
                        canVote && !isSubmittingThisCharity
                          ? {
                              scale: 0.98,
                              y: -2,
                            }
                          : {}
                      }
                      initial={{ opacity: 0, y: 30, rotateX: 10 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      transition={{
                        delay: index * 0.1,
                        type: 'spring',
                        stiffness: 200,
                        damping: 20,
                      }}
                      style={{
                        transformStyle: 'preserve-3d',
                        perspective: '1000px',
                      }}
                      data-charity-id={charity.id}
                    >
                      {/* Loading overlay for this specific charity */}
                      {isSubmittingThisCharity && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center z-20">
                          <div className="flex items-center space-x-3 text-white">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="font-medium">
                              Submitting Vote...
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Animated background glow */}
                      <div
                        className={cn(
                          'absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500',
                          canVote &&
                            !isSubmittingThisCharity &&
                            'group-hover:opacity-100',
                          isUserVote
                            ? 'bg-gradient-to-r from-green-500/20 via-emerald-400/20 to-green-500/20'
                            : 'bg-gradient-to-r from-blue-500/20 via-cyan-400/20 to-blue-500/20'
                        )}
                      />

                      {/* Content container with 3D transform */}
                      <div className="relative z-10 transform transition-transform duration-300 group-hover:translate-z-4 pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                            {/* Enhanced charity logo with hover effects */}
                            <motion.div
                              className="relative flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-700/60 to-slate-800/80 rounded-xl flex-shrink-0 shadow-lg border border-slate-600/30"
                              whileHover={
                                canVote && !isSubmittingThisCharity
                                  ? {
                                      scale: 1.1,
                                      rotate: [0, -5, 5, 0],
                                      boxShadow:
                                        '0 10px 30px rgba(59, 130, 246, 0.3)',
                                    }
                                  : {}
                              }
                              transition={{
                                type: 'spring',
                                stiffness: 400,
                                damping: 10,
                              }}
                            >
                              {/* Animated ring around logo */}
                              <div
                                className={cn(
                                  'absolute inset-0 rounded-xl border-2 opacity-0 transition-all duration-300',
                                  canVote &&
                                    !isSubmittingThisCharity &&
                                    'group-hover:opacity-100 group-hover:scale-110',
                                  isUserVote
                                    ? 'border-green-400 shadow-lg shadow-green-400/50'
                                    : 'border-blue-400 shadow-lg shadow-blue-400/50'
                                )}
                              />

                              {charity.logo ? (
                                <img
                                  src={charity.logo}
                                  alt={charity.name}
                                  className="w-6 h-6 sm:w-10 sm:h-10 rounded-lg object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                              ) : (
                                <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-red-400 transition-all duration-300 group-hover:scale-110 group-hover:text-red-300" />
                              )}

                              {/* Pulse effect for user vote */}
                              {isUserVote && (
                                <div className="absolute inset-0 rounded-xl bg-green-400/20 animate-pulse" />
                              )}
                            </motion.div>

                            <div className="flex-1 min-w-0">
                              {/* Enhanced header with better animations */}
                              <div className="flex items-start sm:items-center flex-col sm:flex-row sm:space-x-3 mb-2 sm:mb-3">
                                <motion.h4
                                  className="font-bold text-white text-base sm:text-lg leading-tight transition-colors duration-300 group-hover:text-blue-100 mb-2 sm:mb-0"
                                  whileHover={{ scale: 1.02 }}
                                >
                                  {charity.name}
                                </motion.h4>

                                <div className="flex items-center space-x-2">
                                  {charity.verification.is501c3 && (
                                    <motion.div
                                      whileHover={{ scale: 1.2, rotate: 360 }}
                                      transition={{ duration: 0.6 }}
                                    >
                                      <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0 drop-shadow-lg" />
                                    </motion.div>
                                  )}

                                  {isUserVote && (
                                    <motion.div
                                      className="inline-flex items-center space-x-1 px-2 py-1 sm:px-3 sm:py-1 bg-green-500/30 text-green-300 text-xs sm:text-sm rounded-full border border-green-400/50 shadow-lg"
                                      initial={{ scale: 0, rotate: -180 }}
                                      animate={{ scale: 1, rotate: 0 }}
                                      transition={{
                                        type: 'spring',
                                        stiffness: 300,
                                        delay: 0.2,
                                      }}
                                      whileHover={{ scale: 1.05 }}
                                    >
                                      <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                                      <span className="font-medium">
                                        Your Vote
                                      </span>
                                    </motion.div>
                                  )}
                                </div>
                              </div>

                              {/* Enhanced description with better typography */}
                              <motion.p
                                className="text-slate-300 text-sm sm:text-base mb-3 sm:mb-4 line-clamp-2 leading-relaxed transition-colors duration-300 group-hover:text-slate-200"
                                whileHover={{ scale: 1.01 }}
                              >
                                {charity.description}
                              </motion.p>

                              {/* Enhanced tags with better hover effects */}
                              <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 text-xs sm:text-sm">
                                <motion.div
                                  className="px-2 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 rounded-lg border border-yellow-500/30 font-medium shadow-sm"
                                  whileHover={{
                                    scale: 1.05,
                                    boxShadow:
                                      '0 4px 15px rgba(245, 158, 11, 0.3)',
                                  }}
                                  transition={{
                                    type: 'spring',
                                    stiffness: 400,
                                  }}
                                >
                                  {charity.category.replace('_', ' ')}
                                </motion.div>

                                <motion.div
                                  className="px-2 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 rounded-lg border border-blue-500/30 font-medium shadow-sm"
                                  whileHover={{
                                    scale: 1.05,
                                    boxShadow:
                                      '0 4px 15px rgba(59, 130, 246, 0.3)',
                                  }}
                                  transition={{
                                    type: 'spring',
                                    stiffness: 400,
                                  }}
                                >
                                  <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 inline mr-1" />
                                  <span className="hidden sm:inline">
                                    {charity.impactMetrics.veteransServed.toLocaleString()}{' '}
                                    served
                                  </span>
                                  <span className="sm:hidden">
                                    {charity.impactMetrics.veteransServed > 1000
                                      ? `${Math.round(charity.impactMetrics.veteransServed / 1000)}k`
                                      : charity.impactMetrics.veteransServed}
                                  </span>
                                </motion.div>

                                {charity.website && (
                                  <motion.a
                                    href={charity.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center space-x-1 px-2 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:text-white rounded-lg transition-all duration-300 border border-slate-500/30 shadow-sm"
                                    onClick={e => e.stopPropagation()}
                                    whileHover={{
                                      scale: 1.05,
                                      boxShadow:
                                        '0 4px 15px rgba(71, 85, 105, 0.4)',
                                      backgroundColor: 'rgba(71, 85, 105, 0.8)',
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{
                                      type: 'spring',
                                      stiffness: 400,
                                    }}
                                  >
                                    <Globe className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                    <span className="text-xs font-medium hidden sm:inline">
                                      Visit
                                    </span>
                                    <ExternalLink className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                                  </motion.a>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Enhanced action button with better animations */}
                          <div className="ml-2 sm:ml-4 flex-shrink-0">
                            {isUserVote ? (
                              <motion.div
                                className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-xl border border-green-400/50 shadow-lg"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                  type: 'spring',
                                  stiffness: 300,
                                  delay: 0.3,
                                }}
                                whileHover={{
                                  scale: 1.1,
                                  boxShadow:
                                    '0 8px 25px rgba(34, 197, 94, 0.4)',
                                }}
                              >
                                <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-300" />
                              </motion.div>
                            ) : canVote ? (
                              <motion.div
                                className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-xl border border-blue-400/50 shadow-lg transition-all duration-300 group-hover:from-blue-400/40 group-hover:to-cyan-400/40 group-hover:border-blue-300/60"
                                whileHover={{
                                  scale: 1.15,
                                  rotate: [0, -10, 10, 0],
                                  boxShadow:
                                    '0 8px 25px rgba(59, 130, 246, 0.4)',
                                }}
                                whileTap={{ scale: 0.9 }}
                                transition={{
                                  type: 'spring',
                                  stiffness: 400,
                                  damping: 10,
                                }}
                              >
                                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300 transition-transform duration-300 group-hover:translate-x-1" />
                              </motion.div>
                            ) : (
                              <motion.div
                                className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-600/20 to-slate-700/20 rounded-xl border border-slate-500/30"
                                whileHover={{ scale: 1.05 }}
                              >
                                <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Enhanced bottom border with gradient animation - moved lower */}
                      <div
                        className={cn(
                          'absolute bottom-2 left-4 right-4 h-1 bg-gradient-to-r transition-all duration-500 rounded-full',
                          'transform scale-x-0 group-hover:scale-x-100 origin-left',
                          isUserVote
                            ? 'from-green-400 via-emerald-400 to-green-500 scale-x-100'
                            : canVote
                              ? 'from-blue-400 via-cyan-400 to-blue-500'
                              : 'from-slate-500 to-slate-600'
                        )}
                      />

                      {/* Floating particles effect on hover */}
                      {canVote && (
                        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          {[...Array(6)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-1 h-1 bg-blue-400 rounded-full"
                              style={{
                                left: `${20 + i * 15}%`,
                                top: `${30 + (i % 2) * 40}%`,
                              }}
                              animate={{
                                y: [-10, -20, -10],
                                opacity: [0, 1, 0],
                                scale: [0, 1, 0],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.2,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Status Messages */}
        {totalVotingPower === BigInt(0) && !hasVoted && (
          <Card className="bg-yellow-500/10 border-yellow-500/30 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <Info className="w-5 h-5 text-yellow-400" />
              <div>
                <div className="font-medium text-yellow-400">
                  Lock VMF Tokens to Vote
                </div>
                <div className="text-sm text-slate-300">
                  You need to lock VMF tokens to participate in charity voting
                </div>
              </div>
            </div>
          </Card>
        )}

        {hasVoted && (
          <Card className="bg-green-500/10 border-green-500/30 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <div className="font-medium text-green-400">
                  Vote Successfully Submitted!
                </div>
                <div className="text-sm text-slate-300">
                  Thank you for participating in the holiday charity selection
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </ProfileGuard>
  );
}
