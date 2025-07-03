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
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui';
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

  // Fix: Add state for controlling refresh behavior
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [isManualRefresh, setIsManualRefresh] = useState(false);

  // Real-time updates
  const [isSubscribed, setIsSubscribed] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Fix: Add ref to track if initialization is in progress to prevent multiple calls
  const isInitializingRef = useRef(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Fix: Stable initialize function with proper dependency management
  const initializeGaugeData = useCallback(
    async (isManualRefresh = false) => {
      // Prevent multiple concurrent calls
      if (isInitializingRef.current) {
        console.log('Gauge initialization already in progress, skipping...');
        return;
      }

      if (!proposal?.availableCharities?.length) {
        console.log(
          'No proposal or charities available, skipping initialization'
        );
        return;
      }

      isInitializingRef.current = true;
      setIsLoadingGauges(true);
      if (isManualRefresh) {
        setIsManualRefresh(true);
      }
      setGaugeError(null);

      try {
        console.log('Initializing gauge data for proposal:', proposal.id);

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

        // Only get voting results if mappings exist
        if (mappings.length > 0) {
          const results =
            await holidayCharityGaugeService.getHolidayVotingResults(
              proposal.id,
              holidayCharities
            );
          setHolidayVotingResults(results);
        } else {
          // Set empty results for demo mode
          setHolidayVotingResults({
            holidayId: proposal.id,
            totalVotes: BigInt(0),
            charityMappings: [],
            leadingCharity: undefined,
            votingComplete: false,
          });
          console.warn(
            `No deployed gauges found for holiday ${proposal.id}. This may be expected for mock/demo proposals.`
          );
        }

        // Check voting period status
        const periodInfo =
          await holidayCharityGaugeService.getVotingPeriodInfo();
        setVotingPeriodInfo(periodInfo);
        setIsVotingActive(periodInfo.isActive);

        // Update last refresh time
        setLastRefreshTime(new Date());

        console.log('Gauge data initialized successfully:', {
          mappings: mappings.length,
          periodInfo: periodInfo.isActive,
        });
      } catch (error) {
        console.error('Failed to initialize gauge data:', error);
        setGaugeError(
          error instanceof Error ? error.message : 'Failed to load voting data'
        );

        // Set empty state to prevent retry loops
        setCharityGaugeMappings([]);
        setHolidayVotingResults(null);
      } finally {
        setIsLoadingGauges(false);
        setIsManualRefresh(false);
        isInitializingRef.current = false;
      }
    },
    [proposal?.availableCharities, proposal?.id, getCharityById]
  ); // Fix: Remove isLoadingGauges from dependencies to prevent infinite loop

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

  // Fix: Manual refresh handler
  const handleManualRefresh = useCallback(async () => {
    console.log('Manual refresh triggered');
    await initializeGaugeData(true);
  }, [initializeGaugeData]);

  // CONSOLIDATED useEffect - fetch all required data
  useEffect(() => {
    // Fetch charities if not loaded
    handleFetchCharities();

    // Fetch voting power if wallet is connected
    if (isConnected && address) {
      handleFetchVotingPower(address);
    }
  }, [isConnected, address, handleFetchCharities, handleFetchVotingPower]);

  // Fix: Initialize gauge data only once when charities are loaded
  useEffect(() => {
    if (charities.length > 0 && !isInitializingRef.current && !gaugeError) {
      console.log('Charities loaded, initializing gauge data...');
      initializeGaugeData();
    }
  }, [charities.length]); // Fix: Remove initializeGaugeData from dependencies

  // Fix: Setup 15-minute auto-refresh interval
  useEffect(() => {
    if (!autoRefreshEnabled || !charityGaugeMappings.length) return;

    console.log('Setting up 15-minute auto-refresh interval');

    refreshIntervalRef.current = setInterval(
      () => {
        console.log('Auto-refresh triggered (15 minutes)');
        initializeGaugeData();
      },
      15 * 60 * 1000
    ); // 15 minutes

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [autoRefreshEnabled, charityGaugeMappings.length]); // Fix: Remove initializeGaugeData from dependencies

  // Load user voted gauges when token IDs are available
  useEffect(() => {
    if (userTokenIds.length > 0) {
      loadUserVotedGauges();
    }
  }, [userTokenIds, loadUserVotedGauges]);

  // Fix: Subscribe to real-time voting events (remove from auto-refresh cycle)
  useEffect(() => {
    if (!isSubscribed && charityGaugeMappings.length > 0) {
      const unsubscribe = holidayCharityGaugeService.subscribeToVotingEvents(
        event => {
          console.log('Vote event received:', event);

          // Only refresh for relevant gauges and limit frequency
          if (
            charityGaugeMappings.some(
              mapping => mapping.gaugeAddress === event.gauge
            )
          ) {
            // Debounce refresh calls to prevent spam
            setTimeout(() => {
              if (!isInitializingRef.current) {
                initializeGaugeData();
              }
            }, 1000);

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
  }, [isSubscribed, charityGaugeMappings, address, loadUserVotedGauges]); // Fix: Remove initializeGaugeData from dependencies

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
    if (!proposal?.availableCharities || charitiesLoading) return [];

    // Handle case when no gauge mappings exist (demo mode)
    if (charityGaugeMappings.length === 0) {
      // Fallback to basic charity data without gauge integration
      return proposal.availableCharities
        .map(charityId => {
          const charity = getCharityById(charityId);
          if (!charity) return null;

          return {
            ...charity,
            votes: 0,
            percentage: 0,
            totalVotingPower: BigInt(0),
            rank: 0,
            gaugeAddress:
              '0x0000000000000000000000000000000000000000' as Address,
            gaugeMapping: null as CharityGaugeMapping | null,
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
            gaugeMapping: CharityGaugeMapping | null;
          } => charity !== null
        );
    }

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

    const charity = availableCharities.find(c => c?.id === charityId);
    if (!charity) {
      showError('Invalid Charity', 'Selected charity not found.');
      return;
    }

    // Check if this is demo mode (no gauge mapping)
    if (!charity.gaugeMapping) {
      showError(
        'Demo Mode',
        'Real voting is not available for this proposal. This is a demonstration.'
      );
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

  // Check if user has voted for a specific charity
  const hasUserVotedForCharity = useCallback(
    (charityId: string) => {
      const charity = availableCharities.find(c => c?.id === charityId);
      if (!charity || !charity.gaugeMapping) return false;

      return userVotedGauges.includes(charity.gaugeAddress);
    },
    [availableCharities, userVotedGauges]
  );

  // Sort charities by vote percentage for results display
  const sortedCharities = useMemo(() => {
    return [...availableCharities]
      .filter(charity => charity !== null)
      .sort((a, b) => {
        if (!a || !b) return 0;
        return b.percentage - a.percentage;
      });
  }, [availableCharities]);

  // Get charity vote data for results display
  const getCharityVoteData = useCallback(
    (charityId: string) => {
      const charity = availableCharities.find(c => c?.id === charityId);
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

  // Early return if no proposal
  if (!proposal) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Proposal Data</h3>
          <p className="text-gray-600">Unable to load proposal information.</p>
        </div>
      </Card>
    );
  }

  return (
    <ProfileGuard fallbackMessage="You need a profile to vote on holiday charity proposals.">
      <div className="space-y-4 xs:space-y-5 sm:space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12 p-3 xs:p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10">
        {/* Header Section - Enhanced Mobile Layout */}
        <motion.div
          className="flex flex-col xs:flex-row sm:flex-row items-start xs:items-center sm:items-center justify-between gap-3 xs:gap-4 sm:gap-5 md:gap-6 lg:gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex-1 w-full xs:w-auto min-w-0">
            <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-patriotWhite mb-1 xs:mb-2 sm:mb-3">
              Holiday Charity Voting
            </h2>
            <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl text-textSecondary">
              Vote for your favorite charity to receive holiday donations
            </p>
          </div>

          {/* Voting Power Display - Enhanced Mobile Layout */}
          <div className="flex flex-col xs:flex-row sm:flex-row gap-2 xs:gap-3 sm:gap-4 w-full xs:w-auto">
            <div className="bg-gradient-to-r from-patriotBlue/20 to-patriotBlue/10 border border-patriotBlue/30 rounded-lg xs:rounded-xl sm:rounded-2xl p-3 xs:p-4 sm:p-5 md:p-6 backdrop-blur-sm">
              <div className="text-center xs:text-left sm:text-center">
                <p className="text-xs xs:text-sm sm:text-base md:text-lg text-textSecondary mb-1 xs:mb-2">
                  Your Voting Power
                </p>
                <p className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-patriotWhite">
                  {formatVotingPower(totalVotingPower)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Voting Interface - Enhanced responsive */}
        <motion.div
          className="space-y-4 xs:space-y-5 sm:space-y-6 md:space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Voting Controls - Enhanced Mobile Layout */}
          <Card className="bg-gradient-to-br from-backgroundLight/80 to-backgroundLight/60 backdrop-blur-sm border-patriotBlue/20 hover:border-patriotBlue/40 transition-all duration-300">
            <CardHeader className="p-3 xs:p-4 sm:p-5 md:p-6 lg:p-8">
              <CardTitle className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-patriotWhite">
                Cast Your Vote
              </CardTitle>
              <p className="text-xs xs:text-sm sm:text-base md:text-lg text-textSecondary">
                Select charities and allocate your voting power
              </p>
            </CardHeader>
            <CardContent className="p-3 xs:p-4 sm:p-5 md:p-6 lg:p-8 pt-0">
              <div className="space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6">
                {/* Voting Method Toggle - Enhanced responsive */}
                <div className="flex flex-col xs:flex-row sm:flex-row gap-2 xs:gap-3 sm:gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowResults(!showResults)}
                    className="flex-1 min-h-[44px] sm:min-h-[48px] md:min-h-[52px] lg:min-h-[56px] xl:min-h-[60px] text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 touch-manipulation"
                  >
                    <span className="hidden sm:inline">
                      {showResults ? 'Hide Results' : 'Show Results'}
                    </span>
                    <span className="hidden xs:inline sm:hidden">
                      {showResults ? 'Hide' : 'Show'}
                    </span>
                    <span className="xs:hidden">
                      {showResults ? 'Hide' : 'Show'}
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => initializeGaugeData(true)}
                    disabled={isLoadingGauges}
                    className="flex-1 min-h-[44px] sm:min-h-[48px] md:min-h-[52px] lg:min-h-[56px] xl:min-h-[60px] text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 touch-manipulation"
                  >
                    <span className="hidden sm:inline">Refresh Data</span>
                    <span className="hidden xs:inline sm:hidden">Refresh</span>
                    <span className="xs:hidden">Refresh</span>
                  </Button>
                </div>

                {/* Vote Status Display - Enhanced responsive */}
                {hasVoted && (
                  <div className="bg-gradient-to-r from-green-500/20 to-green-500/10 border border-green-500/30 rounded-lg xs:rounded-xl sm:rounded-2xl p-3 xs:p-4 sm:p-5 md:p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-2 xs:gap-3 sm:gap-4">
                      <CheckCircle className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs xs:text-sm sm:text-base md:text-lg font-medium text-green-400">
                          <span className="hidden sm:inline">
                            You have already voted in this period
                          </span>
                          <span className="hidden xs:inline sm:hidden">
                            Already voted
                          </span>
                          <span className="xs:hidden">Voted</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button - Enhanced responsive */}
                <Button
                  onClick={() => {
                    if (selectedCharity) {
                      handleCharityVote(selectedCharity);
                    }
                  }}
                  disabled={
                    !selectedCharity ||
                    isSubmitting ||
                    hasVoted ||
                    totalVotingPower === BigInt(0) ||
                    !isVotingActive
                  }
                  className="w-full min-h-[44px] sm:min-h-[48px] md:min-h-[52px] lg:min-h-[56px] xl:min-h-[60px] text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 touch-manipulation bg-gradient-to-r from-patriotRed to-patriotRed/80 hover:from-patriotRed/90 hover:to-patriotRed/70 transition-all duration-300"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 animate-spin" />
                      <span className="hidden sm:inline">
                        Submitting Vote...
                      </span>
                      <span className="hidden xs:inline sm:hidden">
                        Submitting...
                      </span>
                      <span className="xs:hidden">Voting...</span>
                    </>
                  ) : (
                    <>
                      <Vote className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2" />
                      <span className="hidden sm:inline">Submit Vote</span>
                      <span className="hidden xs:inline sm:hidden">Vote</span>
                      <span className="xs:hidden">Vote</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          className="relative overflow-hidden"
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          whileHover={{ scale: 1.005 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <Card className="relative bg-gradient-to-br from-patriotBlue/10 via-patriotRed/5 to-starGold/10 border-white/10 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/20 backdrop-blur-md">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 rounded-2xl sm:rounded-3xl"></div>
            <div className="relative text-center mb-6 sm:mb-8">
              <motion.h1
                className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 tracking-tight leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Veterans Day 2025 Fund Distribution
              </motion.h1>
              <motion.p
                className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed px-2 sm:px-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Vote for which charity should receive the $
                {formatCurrencySafe(proposal.fundAmount)} Veterans Day fund
              </motion.p>
            </div>

            {/* Key Metrics - Responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
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
                  } border rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center shadow-lg backdrop-blur-sm`}
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
                      className={`w-6 h-6 sm:w-8 sm:h-8 ${
                        metric.color === 'starGold'
                          ? 'text-starGold'
                          : metric.color === 'patriotBlue'
                            ? 'text-patriotBlue'
                            : 'text-green-400'
                      } mx-auto mb-2 sm:mb-3`}
                    />
                  </motion.div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">
                    {metric.value}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-400">
                    {metric.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Fix: Enhanced Error Display for Missing Gauges */}
        {gaugeError && (
          <motion.div
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4 sm:p-6">
              <div className="text-center">
                <AlertCircle className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-yellow-500 mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">
                  Voting Data Unavailable
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed">
                  {gaugeError.includes('No deployed gauges') ||
                  gaugeError.includes('Failed to map charities to gauges')
                    ? 'This proposal is in demo mode. Real blockchain voting is not yet available for this holiday.'
                    : gaugeError}
                </p>
                {(gaugeError.includes('No deployed gauges') ||
                  gaugeError.includes('Failed to map charities to gauges')) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mt-4 max-w-2xl mx-auto">
                    <p className="text-xs sm:text-sm text-blue-800">
                      <strong>Demo Mode:</strong> This proposal uses mock data
                      for demonstration purposes. To enable real voting, gauges
                      need to be deployed for this holiday on the blockchain.
                    </p>
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={handleManualRefresh}
                  disabled={isLoadingGauges || isManualRefresh}
                  className="mt-4 text-sm sm:text-base"
                  size="sm"
                >
                  <RefreshCw
                    className={cn(
                      'w-3 h-3 sm:w-4 sm:h-4 mr-2',
                      (isLoadingGauges || isManualRefresh) && 'animate-spin'
                    )}
                  />
                  {isLoadingGauges || isManualRefresh ? 'Retrying...' : 'Retry'}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Voting Status */}
        {!gaugeError && (
          <motion.div
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-slate-700/50 p-4 sm:p-6 rounded-xl">
              {/* Fix: Improved gauge loading state */}
              {isLoadingGauges && (
                <div className="mb-4 p-3 rounded-lg border border-blue-400/30 bg-blue-400/10">
                  <div className="flex items-center space-x-3 text-blue-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">
                      {isManualRefresh
                        ? 'Refreshing gauge data...'
                        : 'Loading gauge data...'}
                    </span>
                  </div>
                </div>
              )}

              {/* Fix: Add refresh controls - Responsive layout */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center space-x-2">
                    <Vote className="w-4 h-4 sm:w-5 sm:h-5 text-patriotBlue" />
                    <h2 className="text-lg sm:text-xl font-bold text-patriotWhite">
                      Holiday Charity Voting
                    </h2>
                  </div>
                  {lastRefreshTime && (
                    <div className="text-xs text-slate-400">
                      Last updated: {lastRefreshTime.toLocaleTimeString()}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleManualRefresh}
                    disabled={isLoadingGauges || isManualRefresh}
                    className="text-slate-400 hover:text-slate-300 text-xs sm:text-sm"
                  >
                    <RefreshCw
                      className={cn(
                        'w-3 h-3 mr-1',
                        (isLoadingGauges || isManualRefresh) && 'animate-spin'
                      )}
                    />
                    Refresh
                  </Button>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-slate-700/50 rounded-lg">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-300 mb-1">
                      Your Voting Power
                    </div>
                    <div className="text-base sm:text-lg font-bold text-white">
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

                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  {/* Voting status */}
                  <div
                    className={cn(
                      'inline-flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium',
                      hasVoted
                        ? 'bg-green-500/20 text-green-400'
                        : totalVotingPower > 0 && isVotingActive
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-red-500/20 text-red-400'
                    )}
                  >
                    {hasVoted ? (
                      <>
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">
                          Vote Submitted
                        </span>
                      </>
                    ) : totalVotingPower > 0 && isVotingActive ? (
                      <>
                        <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">
                          Ready to Vote
                        </span>
                      </>
                    ) : !isVotingActive ? (
                      <>
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">
                          Voting Inactive
                        </span>
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">
                          Lock tokens to vote
                        </span>
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

              {/* Voting period info - Responsive grid */}
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
        )}

        {/* Results Toggle - Responsive button */}
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
                'relative overflow-hidden bg-gradient-to-r from-slate-800/60 to-slate-900/60 border-slate-600/50 hover:border-slate-500/60 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl shadow-lg backdrop-blur-sm transition-all duration-300',
                'hover:shadow-xl hover:shadow-slate-500/20 hover:from-slate-700/60 hover:to-slate-800/60',
                'text-sm sm:text-base touch-manipulation',
                showResults &&
                  'border-blue-400/50 bg-gradient-to-r from-blue-900/30 to-slate-900/60'
              )}
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <motion.div
                  animate={{ rotate: showResults ? 360 : 0 }}
                  transition={{ duration: 0.5, type: 'spring' }}
                >
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                </motion.div>
                <span className="font-semibold text-base sm:text-lg">
                  {showResults ? 'Hide Results' : 'Show Results'}
                </span>
                <motion.div
                  animate={{ rotate: showResults ? 180 : 0 }}
                  transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
                >
                  <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
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
                {/* Header with enhanced styling - Responsive */}
                <div className="relative p-4 sm:p-6 pb-3 sm:pb-4 border-b border-slate-700/50">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-blue-500/5" />
                  <div className="relative flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.6 }}
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-xl flex items-center justify-center border border-yellow-500/30 shadow-lg">
                          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                        </div>
                        <div className="absolute inset-0 bg-yellow-400/20 rounded-xl animate-pulse opacity-50" />
                      </motion.div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
                          Live Results
                        </h3>
                        <p className="text-slate-400 text-sm">
                          Real-time voting standings
                        </p>
                      </div>
                    </div>

                    {/* Total votes indicator - Responsive */}
                    <div className="text-center sm:text-right">
                      <div className="text-xl sm:text-2xl font-bold text-white">
                        {proposal.totalVotes}
                      </div>
                      <div className="text-xs text-slate-400 uppercase tracking-wide">
                        Total Votes
                      </div>
                    </div>
                  </div>
                </div>

                {/* Results list with enhanced styling - Responsive */}
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  {sortedCharities.map((charity, index) => {
                    const voteData = getCharityVoteData(charity.id);
                    const isLeading = index === 0;
                    const isUserVote = hasUserVotedForCharity(charity.id);

                    return (
                      <motion.div
                        key={charity.id}
                        className={cn(
                          'relative overflow-hidden rounded-xl p-4 sm:p-5 transition-all duration-300',
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
                        {/* Ranking badge - Responsive */}
                        <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                          <div
                            className={cn(
                              'w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-lg',
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

                        {/* Content - Responsive layout */}
                        <div className="ml-8 sm:ml-12">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                              {/* Charity logo - Responsive */}
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-700/50 rounded-lg flex items-center justify-center border border-slate-600/30 flex-shrink-0">
                                {charity.logo ? (
                                  <img
                                    src={charity.logo}
                                    alt={charity.name}
                                    className="w-4 h-4 sm:w-6 sm:h-6 rounded object-cover"
                                  />
                                ) : (
                                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                                  <span className="font-bold text-white text-base sm:text-lg truncate">
                                    {charity.name}
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    {isLeading && (
                                      <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{
                                          duration: 2,
                                          repeat: Infinity,
                                        }}
                                      >
                                        <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current" />
                                      </motion.div>
                                    )}
                                    {isUserVote && (
                                      <div className="px-2 py-1 bg-green-500/30 text-green-300 text-xs rounded-full border border-green-400/50">
                                        Your Vote
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-xs sm:text-sm text-slate-400 truncate">
                                  {charity.category.replace('_', ' ')} •{' '}
                                  {charity.impactMetrics.veteransServed.toLocaleString()}{' '}
                                  veterans served
                                </div>
                              </div>
                            </div>

                            {/* Vote stats - Responsive */}
                            <div className="text-left sm:text-right flex-shrink-0">
                              <div className="text-lg sm:text-2xl font-bold text-white">
                                {voteData.percentage.toFixed(1)}%
                              </div>
                              <div className="text-xs sm:text-sm text-slate-400">
                                {voteData.votes.toLocaleString()} votes
                              </div>
                            </div>
                          </div>

                          {/* Progress bar - Responsive */}
                          <div className="relative">
                            <div className="w-full bg-slate-700/50 rounded-full h-2 sm:h-3 overflow-hidden">
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

                            {/* Percentage label on bar - Responsive */}
                            {voteData.percentage > 15 && (
                              <div className="absolute inset-y-0 left-2 sm:left-3 flex items-center">
                                <span className="text-xs font-bold text-white/90">
                                  {voteData.percentage.toFixed(1)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Leading indicator */}
                        {isLeading && (
                          <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-500/20 to-transparent w-16 sm:w-20 h-full" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Footer with summary - Responsive */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-700/50 bg-slate-900/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm space-y-2 sm:space-y-0">
                    <div className="flex items-center space-x-3 sm:space-x-4 text-slate-400">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                        <span className="text-xs sm:text-sm">Leading</span>
                      </div>
                      {hasVoted && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full" />
                          <span className="text-xs sm:text-sm">Your Vote</span>
                        </div>
                      )}
                    </div>
                    <div className="text-slate-400 text-xs sm:text-sm">
                      Last updated: {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Charity Selection - Fully responsive */}
        <motion.div
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 sm:p-6 rounded-xl bg-slate-800/50 border-slate-700/50">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {hasVoted ? 'Available Charities' : 'Choose Your Charity'}
              </h3>
            </div>

            {/* Loading State - Responsive */}
            {charitiesLoading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="border border-slate-700/50 rounded-lg p-3 sm:p-4 bg-slate-800/30"
                  >
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-700/50 rounded-lg animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 sm:h-4 bg-slate-700/50 rounded animate-pulse" />
                        <div className="h-2 sm:h-3 bg-slate-700/50 rounded w-3/4 animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Charities - Enhanced responsive */}
            {!charitiesLoading && availableCharities.length === 0 && (
              <div className="text-center py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 text-slate-400 mx-auto mb-4 sm:mb-6 md:mb-8 lg:mb-10" />
                <h4 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold text-white mb-3 sm:mb-4 md:mb-5 lg:mb-6">
                  No Charities Available
                </h4>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-slate-400 leading-relaxed max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto">
                  Charity data is currently unavailable. Please check back later
                  or contact support if this issue persists.
                </p>
              </div>
            )}

            {/* Charity Grid - Fully responsive with enhanced breakpoints */}
            {!charitiesLoading && availableCharities.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8">
                {availableCharities.map((charity, index) => {
                  if (!charity) return null;

                  const isUserVote = hasUserVotedForCharity(charity.id);
                  const canVote =
                    !hasVoted &&
                    totalVotingPower > 0 &&
                    isVotingActive &&
                    !isLoadingGauges &&
                    !gaugeError &&
                    charity.gaugeMapping !== null; // Only allow voting if gauge mapping exists
                  const isSubmittingThisCharity =
                    isSubmitting && selectedCharity === charity.id;

                  return (
                    <motion.div
                      key={charity.id}
                      className={cn(
                        'group relative border rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 transition-all duration-300 overflow-hidden',
                        'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:translate-x-[-100%] before:transition-transform before:duration-700',
                        'touch-manipulation min-h-[120px] sm:min-h-[140px] md:min-h-[160px] lg:min-h-[180px] xl:min-h-[200px]',
                        isUserVote
                          ? 'border-green-500/60 bg-gradient-to-br from-green-500/20 to-emerald-500/10 shadow-lg shadow-green-500/20'
                          : canVote
                            ? 'border-slate-600/50 bg-gradient-to-br from-slate-800/40 to-slate-900/60 hover:border-blue-400/60 hover:shadow-xl hover:shadow-blue-500/20 hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-slate-800/40 cursor-pointer active:scale-98'
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
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl flex items-center justify-center z-20">
                          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 text-white">
                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 animate-spin" />
                            <span className="font-medium text-xs sm:text-sm md:text-base lg:text-lg">
                              Submitting Vote...
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Animated background glow */}
                      <div
                        className={cn(
                          'absolute inset-0 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl opacity-0 transition-opacity duration-500',
                          canVote &&
                            !isSubmittingThisCharity &&
                            'group-hover:opacity-100',
                          isUserVote
                            ? 'bg-gradient-to-r from-green-500/20 via-emerald-400/20 to-green-500/20'
                            : 'bg-gradient-to-r from-blue-500/20 via-cyan-400/20 to-blue-500/20'
                        )}
                      />

                      {/* Content container with 3D transform - Enhanced responsive */}
                      <div className="relative z-10 transform transition-transform duration-300 group-hover:translate-z-4 pb-2 sm:pb-3 md:pb-4 lg:pb-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2 sm:space-x-3 md:space-x-4 lg:space-x-5 xl:space-x-6 flex-1 min-w-0">
                            {/* Enhanced charity logo with hover effects - Comprehensive responsive */}
                            <motion.div
                              className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-18 xl:h-18 bg-gradient-to-br from-slate-700/60 to-slate-800/80 rounded-lg sm:rounded-xl md:rounded-2xl flex-shrink-0 shadow-lg border border-slate-600/30"
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
                                  'absolute inset-0 rounded-lg sm:rounded-xl md:rounded-2xl border-2 opacity-0 transition-all duration-300',
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
                                  className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 rounded-md sm:rounded-lg md:rounded-xl object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                              ) : (
                                <Heart className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 text-red-400 transition-all duration-300 group-hover:scale-110 group-hover:text-red-300" />
                              )}

                              {/* Pulse effect for user vote */}
                              {isUserVote && (
                                <div className="absolute inset-0 rounded-lg sm:rounded-xl md:rounded-2xl bg-green-400/20 animate-pulse" />
                              )}
                            </motion.div>

                            <div className="flex-1 min-w-0">
                              {/* Enhanced header with better animations - Comprehensive responsive */}
                              <div className="flex items-start flex-col space-y-1 sm:space-y-2 md:space-y-3 mb-2 sm:mb-3 md:mb-4">
                                <motion.h4
                                  className="font-bold text-white text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl leading-tight transition-colors duration-300 group-hover:text-blue-100 line-clamp-2"
                                  whileHover={{ scale: 1.02 }}
                                >
                                  {charity.name}
                                </motion.h4>

                                <div className="flex items-center flex-wrap gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5">
                                  {charity.verification.is501c3 && (
                                    <motion.div
                                      whileHover={{ scale: 1.2, rotate: 360 }}
                                      transition={{ duration: 0.6 }}
                                    >
                                      <Shield className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-green-400 flex-shrink-0 drop-shadow-lg" />
                                    </motion.div>
                                  )}

                                  {isUserVote && (
                                    <motion.div
                                      className="inline-flex items-center space-x-1 px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1 lg:px-4 lg:py-2 bg-green-500/30 text-green-300 text-xs sm:text-sm md:text-base rounded-full border border-green-400/50 shadow-lg"
                                      initial={{ scale: 0, rotate: -180 }}
                                      animate={{ scale: 1, rotate: 0 }}
                                      transition={{
                                        type: 'spring',
                                        stiffness: 300,
                                        delay: 0.2,
                                      }}
                                      whileHover={{ scale: 1.05 }}
                                    >
                                      <Check className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                                      <span className="font-medium">
                                        Your Vote
                                      </span>
                                    </motion.div>
                                  )}

                                  {/* Voting status indicator */}
                                  {canVote && (
                                    <motion.div
                                      className="inline-flex items-center space-x-1 px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1 lg:px-4 lg:py-2 bg-blue-500/30 text-blue-300 text-xs sm:text-sm md:text-base rounded-full border border-blue-400/50 shadow-lg"
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{
                                        type: 'spring',
                                        stiffness: 300,
                                        delay: 0.3,
                                      }}
                                      whileHover={{ scale: 1.05 }}
                                    >
                                      <Vote className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                                      <span className="font-medium">
                                        Available
                                      </span>
                                    </motion.div>
                                  )}
                                </div>
                              </div>

                              {/* Enhanced description with responsive typography */}
                              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-300 leading-relaxed mb-2 sm:mb-3 md:mb-4 lg:mb-5 line-clamp-2 sm:line-clamp-3 md:line-clamp-4 transition-colors duration-300 group-hover:text-slate-200">
                                {charity.description}
                              </p>

                              {/* Enhanced location with responsive icons */}
                              {charity.location && (
                                <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 text-xs sm:text-sm md:text-base lg:text-lg text-slate-400 mb-2 sm:mb-3 md:mb-4">
                                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 flex-shrink-0" />
                                  <span className="truncate">
                                    {typeof charity.location === 'string'
                                      ? charity.location
                                      : `${charity.location.city}, ${charity.location.state}`}
                                  </span>
                                </div>
                              )}

                              {/* Enhanced voting results section - Responsive */}
                              {showResults && holidayVotingResults && (
                                <div className="mt-2 sm:mt-3 md:mt-4 lg:mt-5 p-2 sm:p-3 md:p-4 bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-700/50">
                                  <div className="flex items-center justify-between mb-1 sm:mb-2 md:mb-3">
                                    <span className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-300 font-medium">
                                      Current Votes
                                    </span>
                                    <span className="text-xs sm:text-sm md:text-base lg:text-lg text-white font-bold">
                                      {formatVMFSafe(
                                        BigInt(charity.votes || 0)
                                      )}
                                    </span>
                                  </div>

                                  {/* Vote percentage bar - Responsive */}
                                  <div className="w-full bg-slate-700/50 rounded-full h-1.5 sm:h-2 md:h-3 lg:h-4 overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
                                      style={{
                                        width: `${charity.percentage || 0}%`,
                                      }}
                                    />
                                  </div>

                                  <div className="flex items-center justify-between mt-1 sm:mt-2 md:mt-3">
                                    <span className="text-xs sm:text-sm md:text-base text-slate-400">
                                      {charity.percentage?.toFixed(1) || '0.0'}%
                                    </span>
                                    <span className="text-xs sm:text-sm md:text-base text-slate-400">
                                      of total votes
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Enhanced action button - Responsive */}
                          <div className="flex flex-col items-end space-y-1 sm:space-y-2 md:space-y-3 ml-2 sm:ml-3 md:ml-4">
                            {canVote && !isSubmittingThisCharity && (
                              <motion.button
                                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 touch-manipulation"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedCharity(charity.id);
                                  handleCharityVote(charity.id);
                                }}
                              >
                                <Vote className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
                              </motion.button>
                            )}

                            {isUserVote && (
                              <motion.div
                                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                  type: 'spring',
                                  stiffness: 300,
                                  delay: 0.4,
                                }}
                              >
                                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Status Messages - Responsive */}
        {totalVotingPower === BigInt(0) && !hasVoted && (
          <Card className="bg-yellow-500/10 border-yellow-500/30 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
              <div>
                <div className="font-medium text-yellow-400 text-sm sm:text-base">
                  Lock VMF Tokens to Vote
                </div>
                <div className="text-xs sm:text-sm text-slate-300">
                  You need to lock VMF tokens to participate in charity voting
                </div>
              </div>
            </div>
          </Card>
        )}

        {hasVoted && (
          <Card className="bg-green-500/10 border-green-500/30 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
              <div>
                <div className="font-medium text-green-400 text-sm sm:text-base">
                  Vote Successfully Submitted!
                </div>
                <div className="text-xs sm:text-sm text-slate-300">
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
