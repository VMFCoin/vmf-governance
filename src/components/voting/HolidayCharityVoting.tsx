'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { SimpleTooltip } from '@/components/ui/AnimatedTooltip';
import { ProfileGuard } from '@/components/auth';
import { VotingPrerequisites } from './VotingPrerequisites';
import { useToast } from '@/components/ui/Toast';
import { useCharityStore } from '@/stores/useCharityStore';
import { useProposalStore } from '@/stores/useProposalStore';
import { useTokenLockStore } from '@/stores/useTokenLockStore';
import { useWalletSync } from '@/hooks/useWalletSync';
import { HolidayCharityProposal, Charity } from '@/types';
import { cn } from '@/lib/utils';
import { fadeInVariants } from '@/lib/animations';

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
  const [showVotingInterface, setShowVotingInterface] = useState(false);

  const { getCharityById } = useCharityStore();
  const { submitVote, getUserVote } = useProposalStore();
  const { address, isConnected } = useWalletSync();
  const { showSuccess, showError } = useToast();
  const {
    votingPowerBreakdown,
    isLoading: isLoadingVotingPower,
    fetchUserLocks,
    getTotalVotingPower,
  } = useTokenLockStore();

  // Check if user has already voted
  const userVote = getUserVote(proposal.id);
  const hasVoted = !!userVote;

  // Fetch charity data and voting power when component loads
  useEffect(() => {
    const { charities, fetchCharities } = useCharityStore.getState();

    // Fetch charities if not already loaded
    if (charities.length === 0) {
      fetchCharities();
    }

    // Fetch voting power if wallet is connected
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
  console.log('charities', proposal.availableCharities);

  // Get available charities with their data
  const availableCharities = proposal.availableCharities
    .map(id => getCharityById(id))
    .filter(
      (charity): charity is NonNullable<typeof charity> => charity !== undefined
    );

  console.log('availableCharities', availableCharities);

  // Handle direct charity vote submission
  const handleCharityVote = async (charityId: string) => {
    if (hasVoted) {
      showError('Already Voted', 'You have already voted on this proposal.');
      return;
    }

    setIsSubmitting(true);
    try {
      const votingPowerToUse = Number(totalVotingPower) / 1e18;

      if (votingPowerToUse === 0) {
        showError('No Voting Power', 'You need to lock tokens to vote.');
        return;
      }

      // Submit vote with charity ID as the vote value
      await submitVote(proposal.id, charityId, votingPowerToUse);

      showSuccess(
        'Vote Submitted!',
        `Your vote for ${getCharityById(charityId)?.name} has been recorded.`
      );

      onVoteSubmitted?.();
    } catch (error) {
      console.error('Failed to submit vote:', error);
      showError('Vote Failed', 'There was an error submitting your vote.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get charity vote data for results display
  const getCharityVoteData = (charityId: string) => {
    return proposal.charityVotes[charityId] || { votes: 0, percentage: 0 };
  };

  // Sort charities by vote percentage for results display
  const sortedCharities = [...availableCharities].sort((a, b) => {
    const aVotes = getCharityVoteData(a.id);
    const bVotes = getCharityVoteData(b.id);
    return bVotes.percentage - aVotes.percentage;
  });

  return (
    <ProfileGuard fallbackMessage="You need a profile to vote on holiday charity proposals.">
      <div className="space-y-8">
        {/* Fluid Hero Section */}
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
              {/* Flowing Icon Section */}
              <motion.div
                className="relative inline-flex items-center justify-center mb-6"
                whileHover={{ rotate: [0, -2, 2, 0] }}
                transition={{ duration: 0.6 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-patriotRed/30 via-starGold/30 to-patriotBlue/30 rounded-3xl blur-2xl animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-patriotBlue/40 to-patriotRed/40 backdrop-blur-lg border border-white/30 rounded-3xl p-6 shadow-xl">
                  <div className="flex items-center space-x-4">
                    <motion.div
                      className="w-14 h-14 bg-gradient-to-br from-starGold/40 to-yellow-500/40 rounded-2xl flex items-center justify-center border border-starGold/50 shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <Vote className="w-7 h-7 text-starGold" />
                    </motion.div>
                    <div className="text-left">
                      <div className="text-xl font-bold text-white">
                        Holiday Charity
                      </div>
                      <div className="text-sm text-starGold font-medium">
                        Community Selection
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.h1
                className="text-4xl font-bold text-white mb-3 tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Veterans Day 2025 Fund Distribution
              </motion.h1>
              <motion.p
                className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Vote for which charity should receive the $
                {proposal.fundAmount.toLocaleString()} Veterans Day fund
              </motion.p>
            </div>

            {/* Flowing Key Metrics */}
            <div className="grid grid-cols-3 gap-6">
              {[
                {
                  icon: DollarSign,
                  value: `$${proposal.fundAmount.toLocaleString()}`,
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

        {/* Fluid Voting Power Section */}
        <motion.div
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
        >
          <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.div
                  className="flex items-center justify-center w-12 h-12 bg-yellow-500/30 rounded-xl shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Zap className="w-6 h-6 text-yellow-400" />
                </motion.div>
                <div>
                  <div className="text-base font-medium text-gray-300 mb-1">
                    Your Voting Power
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {isLoadingVotingPower ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
                        <span className="text-base">Loading...</span>
                      </div>
                    ) : (
                      `${formatVotingPower(totalVotingPower)} VMF`
                    )}
                  </div>
                </div>
              </div>

              <motion.div
                className={cn(
                  'inline-flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-medium border shadow-lg',
                  hasVoted
                    ? 'bg-green-500/15 text-green-400 border-green-500/30'
                    : totalVotingPower > 0
                      ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                      : 'bg-red-500/15 text-red-400 border-red-500/30'
                )}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                {hasVoted ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Vote Submitted</span>
                  </>
                ) : totalVotingPower > 0 ? (
                  <>
                    <Target className="w-4 h-4" />
                    <span>Ready to Vote</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    <span>Lock tokens to vote</span>
                  </>
                )}
              </motion.div>
            </div>
          </Card>
        </motion.div>

        {/* Fluid Results Toggle */}
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
              className="group relative overflow-hidden bg-gradient-to-r from-patriotBlue/15 to-patriotRed/15 border-white/30 hover:border-white/50 hover:from-patriotBlue/25 hover:to-patriotRed/25 text-white font-medium px-8 py-4 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl backdrop-blur-md"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-patriotBlue/10 to-patriotRed/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center space-x-4">
                <motion.div
                  className="flex items-center justify-center w-6 h-6 bg-starGold/30 rounded-lg"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <TrendingUp className="w-4 h-4 text-starGold" />
                </motion.div>
                <span className="text-base font-semibold">
                  {showResults
                    ? 'Hide Current Results'
                    : 'Show Current Results'}
                </span>
                <motion.div
                  className="flex items-center justify-center w-6 h-6 bg-white/15 rounded-lg transition-transform duration-200"
                  animate={{ rotate: showResults ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <ChevronDown className="w-4 h-4 text-gray-300" />
                </motion.div>
              </div>
            </Button>
          </motion.div>
        </motion.div>

        {/* Fluid Results Section */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
              className="overflow-hidden"
            >
              <Card className="p-8 rounded-3xl bg-gradient-to-br from-white/5 to-black/5 border-white/15 shadow-2xl backdrop-blur-md">
                <motion.div
                  className="flex items-center space-x-4 mb-8"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <motion.div
                    className="flex items-center justify-center w-12 h-12 bg-starGold/30 rounded-xl shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <Trophy className="w-6 h-6 text-starGold" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white">
                    Current Vote Distribution
                  </h3>
                </motion.div>

                <div className="space-y-6">
                  {sortedCharities.map((charity, index) => {
                    const voteData = getCharityVoteData(charity.id);
                    const isLeading = index === 0;

                    return (
                      <motion.div
                        key={charity.id}
                        initial={{ opacity: 0, x: -30, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{
                          delay: index * 0.1,
                          type: 'spring',
                          stiffness: 200,
                          damping: 20,
                        }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className={cn(
                          'border rounded-2xl p-6 transition-all duration-300 shadow-lg backdrop-blur-sm',
                          isLeading
                            ? 'border-starGold/40 bg-gradient-to-r from-starGold/15 to-yellow-500/15 shadow-starGold/20'
                            : 'border-white/15 bg-gradient-to-r from-white/5 to-black/5'
                        )}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            {isLeading && (
                              <motion.div
                                className="flex items-center justify-center w-10 h-10 bg-starGold/30 rounded-xl shadow-lg"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ type: 'spring', stiffness: 400 }}
                              >
                                <Star className="w-5 h-5 text-starGold" />
                              </motion.div>
                            )}
                            <div>
                              <div className="text-xl font-bold text-white">
                                {charity.name}
                              </div>
                              {isLeading && (
                                <motion.div
                                  className="inline-flex items-center space-x-1 mt-2 px-3 py-1 bg-starGold/30 text-starGold text-sm rounded-full font-medium border border-starGold/40"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{
                                    delay: 0.3,
                                    type: 'spring',
                                    stiffness: 300,
                                  }}
                                >
                                  <Trophy className="w-3 h-3" />
                                  <span>Leading</span>
                                </motion.div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <motion.div
                              className="text-3xl font-bold text-white"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{
                                delay: index * 0.1 + 0.2,
                                type: 'spring',
                                stiffness: 300,
                              }}
                            >
                              {voteData.percentage.toFixed(1)}%
                            </motion.div>
                            <div className="text-sm text-gray-400">
                              {voteData.votes} votes
                            </div>
                          </div>
                        </div>

                        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden shadow-inner">
                          <motion.div
                            className={cn(
                              'h-3 rounded-full shadow-lg',
                              isLeading
                                ? 'bg-gradient-to-r from-starGold to-yellow-500'
                                : 'bg-gradient-to-r from-patriotBlue to-blue-500'
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${voteData.percentage}%` }}
                            transition={{
                              duration: 1.2,
                              delay: index * 0.1 + 0.3,
                              type: 'spring',
                              stiffness: 100,
                            }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Improved Charity Selection - Better Visibility */}
        {!showVotingInterface && !hasVoted && (
          <VotingPrerequisites
            onAllRequirementsMet={() => setShowVotingInterface(true)}
            minimumPower={BigInt(1)}
            requireWarmupComplete={true}
            className="mb-8"
          />
        )}

        {(showVotingInterface || hasVoted) && (
          <motion.div
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.005 }}
          >
            <Card className="p-8 rounded-3xl bg-gradient-to-br from-patriotBlue/8 to-patriotRed/8 border-white/15 shadow-2xl backdrop-blur-md">
              <motion.div
                className="flex items-center space-x-4 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <motion.div
                  className="flex items-center justify-center w-12 h-12 bg-patriotBlue/30 rounded-xl shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Users className="w-6 h-6 text-patriotBlue" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white">
                  {hasVoted
                    ? 'Available Charities'
                    : 'Vote for Your Preferred Charity'}
                </h3>
              </motion.div>

              {/* Grid Layout with Better Visibility */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {availableCharities.map((charity, index) => {
                  const voteData = getCharityVoteData(charity.id);
                  const isUserVote = userVote?.vote === charity.id;

                  return (
                    <motion.div
                      key={charity.id}
                      className={cn(
                        'group border rounded-2xl p-6 transition-all duration-300 shadow-lg backdrop-blur-sm',
                        hasVoted
                          ? isUserVote
                            ? 'border-green-500/40 bg-gradient-to-br from-green-500/15 to-emerald-500/15 shadow-green-500/20'
                            : 'border-white/20 bg-gradient-to-br from-gray-800/30 to-gray-900/30 opacity-80'
                          : 'border-white/20 bg-gradient-to-br from-gray-800/20 to-gray-900/20 hover:border-white/40 hover:bg-gradient-to-br hover:from-gray-700/30 hover:to-gray-800/30 cursor-pointer hover:shadow-xl hover:shadow-white/10'
                      )}
                      onClick={() => !hasVoted && handleCharityVote(charity.id)}
                      whileHover={!hasVoted ? { scale: 1.02, y: -3 } : {}}
                      whileTap={!hasVoted ? { scale: 0.98 } : {}}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: index * 0.05,
                        type: 'spring',
                        stiffness: 200,
                        damping: 20,
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1 min-w-0">
                          {/* Enhanced Charity Logo */}
                          <motion.div
                            className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-patriotBlue/30 to-patriotRed/30 rounded-xl border border-white/20 flex-shrink-0 shadow-lg"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ type: 'spring', stiffness: 400 }}
                          >
                            {charity.logo ? (
                              <img
                                src={charity.logo}
                                alt={charity.name}
                                className="w-9 h-9 rounded-lg object-cover"
                              />
                            ) : (
                              <Heart className="w-7 h-7 text-patriotRed" />
                            )}
                          </motion.div>

                          {/* Enhanced Charity Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-3">
                              <h4 className="text-xl font-bold text-white truncate">
                                {charity.name}
                              </h4>
                              {charity.verification.is501c3 && (
                                <SimpleTooltip text="Verified 501(c)(3) charity">
                                  <motion.div
                                    className="flex items-center justify-center w-7 h-7 bg-green-500/30 rounded-full border border-green-500/40 shadow-lg"
                                    whileHover={{ scale: 1.1 }}
                                    transition={{
                                      type: 'spring',
                                      stiffness: 400,
                                    }}
                                  >
                                    <Shield className="w-4 h-4 text-green-400" />
                                  </motion.div>
                                </SimpleTooltip>
                              )}
                              {isUserVote && (
                                <motion.div
                                  className="inline-flex items-center space-x-1 px-3 py-1 bg-green-500/30 text-green-300 text-sm rounded-full font-medium border border-green-500/40 shadow-lg"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{
                                    delay: 0.2,
                                    type: 'spring',
                                    stiffness: 300,
                                  }}
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Your Vote</span>
                                </motion.div>
                              )}
                            </div>

                            <p className="text-gray-200 text-base mb-4 leading-relaxed line-clamp-2">
                              {charity.description}
                            </p>

                            <div className="flex items-center flex-wrap gap-3 text-sm">
                              <motion.div
                                className="inline-flex items-center space-x-1 px-3 py-2 bg-starGold/20 text-starGold rounded-full border border-starGold/30 shadow-lg"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: 'spring', stiffness: 400 }}
                              >
                                <Award className="w-3 h-3" />
                                <span className="capitalize font-medium">
                                  {charity.category.replace('_', ' ')}
                                </span>
                              </motion.div>
                              <motion.div
                                className="inline-flex items-center space-x-1 px-3 py-2 bg-green-400/20 text-green-300 rounded-full border border-green-400/30 shadow-lg"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: 'spring', stiffness: 400 }}
                              >
                                <TrendingUp className="w-3 h-3" />
                                <span className="font-medium">
                                  {charity.impactMetrics.veteransServed.toLocaleString()}{' '}
                                  Served
                                </span>
                              </motion.div>
                              {charity.website && (
                                <motion.a
                                  href={charity.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-1 px-3 py-2 bg-patriotBlue/20 text-white hover:text-gray-200 rounded-full border border-patriotBlue/30 transition-colors shadow-lg"
                                  onClick={e => e.stopPropagation()}
                                  whileHover={{ scale: 1.05 }}
                                  transition={{
                                    type: 'spring',
                                    stiffness: 400,
                                  }}
                                >
                                  <Globe className="w-3 h-3" />
                                  <span className="font-medium">Website</span>
                                  <ExternalLink className="w-2 h-2" />
                                </motion.a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Vote Button or Status */}
                        <div className="ml-4 flex-shrink-0">
                          {hasVoted ? (
                            isUserVote ? (
                              <motion.div
                                className="flex items-center justify-center w-12 h-12 bg-green-500/30 rounded-xl border border-green-500/40 shadow-lg"
                                whileHover={{ scale: 1.1 }}
                                transition={{ type: 'spring', stiffness: 400 }}
                              >
                                <Check className="w-6 h-6 text-green-300" />
                              </motion.div>
                            ) : (
                              <motion.div
                                className="flex items-center justify-center w-12 h-12 bg-gray-500/30 rounded-xl border border-gray-500/40 shadow-lg opacity-60"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: 'spring', stiffness: 400 }}
                              >
                                <X className="w-6 h-6 text-gray-400" />
                              </motion.div>
                            )
                          ) : (
                            <motion.div
                              className="flex items-center justify-center w-12 h-12 bg-patriotBlue/30 rounded-xl border border-patriotBlue/40 shadow-lg group-hover:bg-patriotBlue/40 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              transition={{ type: 'spring', stiffness: 400 }}
                            >
                              <ArrowRight className="w-6 h-6 text-patriotBlue group-hover:text-white transition-colors" />
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Fluid Status Messages */}
        {!hasVoted && totalVotingPower === BigInt(0) && (
          <motion.div
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="bg-gradient-to-r from-yellow-500/15 to-orange-500/15 border-yellow-500/30 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
              <div className="flex items-center space-x-4">
                <motion.div
                  className="flex items-center justify-center w-12 h-12 bg-yellow-500/30 rounded-xl shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Info className="w-6 h-6 text-yellow-400" />
                </motion.div>
                <div>
                  <div className="text-base font-semibold text-yellow-400 mb-1">
                    Lock VMF Tokens to Vote
                  </div>
                  <div className="text-base text-gray-300">
                    You need to lock VMF tokens to participate in charity voting
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {hasVoted && (
          <motion.div
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="bg-gradient-to-r from-green-500/15 to-emerald-500/15 border-green-500/30 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
              <div className="flex items-center space-x-4">
                <motion.div
                  className="flex items-center justify-center w-12 h-12 bg-green-500/30 rounded-xl shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </motion.div>
                <div>
                  <div className="text-base font-semibold text-green-400 mb-1">
                    Vote Successfully Submitted!
                  </div>
                  <div className="text-base text-gray-300">
                    Thank you for participating in the holiday charity selection
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </ProfileGuard>
  );
}
