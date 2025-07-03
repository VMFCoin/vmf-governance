'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  Timer,
  Flag,
  Heart,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Button, AnimatedCard } from '@/components/ui';
import { SimpleTooltip } from '@/components/ui/AnimatedTooltip';
import { VotingStatusIndicator } from '../shared/VotingStatusIndicator';
import { useCharityStore } from '@/stores/useCharityStore';
import { fadeInVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { HolidayCharityProposal, MilitaryHoliday, Charity } from '@/types';
import { HolidayProposalStatus } from '@/services/holidayProposalLogic';

// Updated interface to support dual modes
interface HolidayCharityCardProps {
  // For active voting mode
  proposal?: HolidayCharityProposal;

  // For upcoming holiday mode
  nextHoliday?: {
    holiday: MilitaryHoliday;
    daysUntil: number;
    status: HolidayProposalStatus;
  };

  className?: string;
  mode: 'active' | 'upcoming';
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export const HolidayCharityCard: React.FC<HolidayCharityCardProps> = ({
  proposal,
  nextHoliday,
  className,
  mode,
}) => {
  const { getCharityById } = useCharityStore();
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });

  // Get charities for active proposals
  const charities = useMemo(() => {
    if (mode === 'active' && proposal?.availableCharities) {
      return proposal.availableCharities
        .map(id => getCharityById(id))
        .filter((charity): charity is Charity => charity !== undefined);
    }
    return [];
  }, [proposal?.availableCharities, getCharityById, mode]);

  // Countdown calculation for upcoming holidays
  const calculateTimeRemaining = (): TimeRemaining => {
    if (mode !== 'upcoming' || !nextHoliday?.status.votingStartDate) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    const now = new Date().getTime();
    const targetTime = nextHoliday.status.votingStartDate.getTime();
    const total = Math.max(0, targetTime - now);

    if (total <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((total % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, total };
  };

  // Real-time countdown timer
  useEffect(() => {
    if (mode !== 'upcoming') return;

    const updateTimer = () => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
    };

    // Update immediately
    updateTimer();

    // Set up interval to update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [mode, nextHoliday]);

  const getStatusColor = (status: HolidayCharityProposal['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'passed':
        return 'text-blue-400';
      case 'failed':
        return 'text-red-400';
      case 'pending':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalVotes = useMemo(() => {
    if (mode === 'active' && proposal) {
      return Math.round(
        proposal.yesPercentage +
          proposal.noPercentage +
          proposal.abstainPercentage
      );
    }
    return 0;
  }, [proposal, mode]);

  // UPCOMING HOLIDAY MODE - Enhanced Mobile Responsiveness
  if (mode === 'upcoming' && nextHoliday) {
    const { holiday, status } = nextHoliday;

    return (
      <AnimatedCard
        className={cn(
          'group relative overflow-hidden border-patriotBlue/40 bg-gradient-to-br from-backgroundCard via-backgroundCard/95 to-patriotBlue/10 hover:border-patriotBlue/60 transition-all duration-300',
          className
        )}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[url('/patterns/stars.svg')] opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-br from-patriotRed/20 via-transparent to-patriotBlue/20" />
        </div>

        <div className="relative p-3 xs:p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10">
          {/* Header - Enhanced Mobile Layout with comprehensive responsive */}
          <motion.div
            className="flex flex-col xs:flex-row sm:flex-row items-start xs:items-center sm:items-center justify-between mb-3 xs:mb-4 sm:mb-5 md:mb-6 lg:mb-8 gap-2 xs:gap-3 sm:gap-4 md:gap-5"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center space-x-2 xs:space-x-3 sm:space-x-4 md:space-x-5 w-full xs:w-auto">
              <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-18 xl:h-18 bg-gradient-to-br from-patriotRed to-red-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-sm xs:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl">
                  {holiday.flagIcon}
                </span>
              </div>
              <div className="flex-1 xs:flex-initial min-w-0">
                <h3 className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-display font-bold text-patriotWhite group-hover:text-starGold transition-colors truncate">
                  {holiday.name}
                </h3>
                <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl text-textSecondary">
                  {new Intl.DateTimeFormat('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }).format(holiday.date)}
                </p>
              </div>
            </div>
            <div className="text-left xs:text-right sm:text-right w-full xs:w-auto flex-shrink-0">
              <div className="text-xs xs:text-sm sm:text-base md:text-lg text-textSecondary">
                Fund Allocation
              </div>
              <div className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-starGold">
                {formatCurrency(holiday.fundAllocation)}
              </div>
            </div>
          </motion.div>

          {/* Holiday Description - Mobile Optimized with enhanced responsive */}
          <motion.p
            className="text-textSecondary text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl mb-3 xs:mb-4 sm:mb-5 md:mb-6 lg:mb-8 leading-relaxed"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            transition={{ delay: 0.2 }}
          >
            {holiday.description}
          </motion.p>

          {/* Countdown Timer - Enhanced Mobile Layout with comprehensive responsive */}
          <motion.div
            className="mb-3 xs:mb-4 sm:mb-5 md:mb-6 lg:mb-8"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-1 xs:gap-2 sm:gap-3 md:gap-4 mb-2 xs:mb-3 sm:mb-4 md:mb-5">
              <Timer className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 text-patriotRed flex-shrink-0" />
              <span className="font-semibold text-patriotWhite text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">
                Voting Starts In
              </span>
            </div>

            {/* Enhanced Mobile-First Countdown Grid with comprehensive breakpoints */}
            <div className="grid grid-cols-2 xs:grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8">
              {[
                { label: 'Days', value: timeRemaining.days },
                { label: 'Hours', value: timeRemaining.hours },
                { label: 'Minutes', value: timeRemaining.minutes },
                { label: 'Seconds', value: timeRemaining.seconds },
              ].map((unit, index) => (
                <div
                  key={unit.label}
                  className="text-center p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 bg-gradient-to-b from-patriotBlue/20 to-patriotRed/20 rounded-lg sm:rounded-xl md:rounded-2xl border border-patriotBlue/30 hover:border-patriotBlue/50 transition-colors duration-300"
                >
                  <motion.div
                    key={unit.value}
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.1 }}
                    className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-patriotWhite mb-1 sm:mb-2 md:mb-3"
                  >
                    {unit.value.toString().padStart(2, '0')}
                  </motion.div>
                  <div className="text-xs xs:text-sm sm:text-base md:text-lg text-textSecondary uppercase tracking-wide">
                    {unit.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Status Information - Enhanced Mobile Responsive */}
          <motion.div
            className="flex flex-col xs:flex-row sm:flex-row items-start xs:items-center sm:items-center justify-between pt-3 xs:pt-4 sm:pt-5 md:pt-6 lg:pt-8 border-t border-patriotRed/30 gap-2 xs:gap-3 sm:gap-4 md:gap-0"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            transition={{ delay: 0.4 }}
          >
            <SimpleTooltip text="Current voting phase status">
              <div className="flex items-center text-textSecondary text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl">
                <Calendar className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 mr-1 sm:mr-2 md:mr-3" />
                <span className="font-medium capitalize">
                  {status.phase.replace('_', ' ')}
                </span>
              </div>
            </SimpleTooltip>

            <SimpleTooltip text="Get notified when voting opens">
              <div className="flex items-center text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl">
                <Sparkles className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 mr-1 sm:mr-2 md:mr-3 text-starGold" />
                <span className="text-patriotWhite font-semibold">
                  Upcoming Vote
                </span>
              </div>
            </SimpleTooltip>
          </motion.div>

          {/* Action Button - Enhanced Mobile Optimized */}
          <motion.div
            className="mt-3 xs:mt-4 sm:mt-5 md:mt-6 lg:mt-8 pt-3 xs:pt-4 sm:pt-5 md:pt-6 lg:pt-8 border-t border-patriotRed/30"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            transition={{ delay: 0.5 }}
          >
            <Button
              asChild
              variant="outline"
              size="md"
              className="w-full font-semibold group-hover:shadow-xl border-patriotBlue/50 hover:border-patriotBlue hover:bg-patriotBlue/10 min-h-[44px] sm:min-h-[48px] md:min-h-[52px] lg:min-h-[56px] xl:min-h-[60px] text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl touch-manipulation"
            >
              <Link href="/calendar">
                <Flag className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 mr-2 sm:mr-3 md:mr-4" />
                <span className="xs:hidden sm:hidden md:inline">
                  View Calendar
                </span>
                <span className="hidden xs:inline sm:inline md:hidden">
                  View Calendar
                </span>
                <span className="hidden md:inline">View Holiday Calendar</span>
                <ChevronRight className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 ml-2 sm:ml-3 md:ml-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </AnimatedCard>
    );
  }

  // ACTIVE PROPOSAL MODE - Enhanced Mobile Responsiveness
  if (mode === 'active' && proposal) {
    return (
      <AnimatedCard
        className={cn(
          'group relative overflow-hidden border-patriotBlue/40 bg-gradient-to-br from-backgroundCard via-backgroundCard/95 to-patriotBlue/10 hover:border-patriotBlue/60 transition-all duration-300',
          className
        )}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[url('/patterns/stars.svg')] opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-br from-patriotRed/20 via-transparent to-patriotBlue/20" />
        </div>

        <Link href={`/proposal/${proposal.id}`} className="block relative">
          <div className="p-3 xs:p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10">
            {/* Header with Status - Enhanced Mobile Layout with comprehensive responsive */}
            <motion.div
              className="flex flex-col xs:flex-row sm:flex-row items-start xs:items-center sm:items-center justify-between mb-3 xs:mb-4 sm:mb-5 md:mb-6 lg:mb-8 gap-2 xs:gap-3 sm:gap-4 md:gap-5"
              variants={fadeInVariants}
              initial="initial"
              animate="enter"
              transition={{ delay: 0.1 }}
            >
              <div className="flex-1 w-full xs:w-auto min-w-0">
                <div className="flex items-center space-x-2 xs:space-x-3 sm:space-x-4 mb-1 xs:mb-2 sm:mb-3">
                  <h3 className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-display font-bold text-patriotWhite group-hover:text-starGold transition-colors truncate">
                    {proposal.title}
                  </h3>
                  <VotingStatusIndicator
                    holidayId={proposal.holidayId}
                    className="ml-1 xs:ml-2 sm:ml-3 flex-shrink-0"
                    size="sm"
                  />
                </div>
                <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl text-textSecondary">
                  by {proposal.author}
                </p>
              </div>
              <div className="text-left xs:text-right sm:text-right w-full xs:w-auto flex-shrink-0">
                <div className="text-xs xs:text-sm sm:text-base md:text-lg text-textSecondary">
                  Status
                </div>
                <div
                  className={cn(
                    'text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl font-semibold',
                    getStatusColor(proposal.status)
                  )}
                >
                  {proposal.status.charAt(0).toUpperCase() +
                    proposal.status.slice(1)}
                </div>
              </div>
            </motion.div>

            {/* Fund Allocation & Time Left - Enhanced Mobile Grid */}
            <motion.div
              className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 gap-3 xs:gap-4 sm:gap-5 md:gap-6 lg:gap-8 mb-3 xs:mb-4 sm:mb-5 md:mb-6 lg:mb-8"
              variants={fadeInVariants}
              initial="initial"
              animate="enter"
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center space-x-2 xs:space-x-3 sm:space-x-4 md:space-x-5 p-2 xs:p-3 sm:p-4 md:p-5 bg-backgroundDark/30 rounded-lg sm:rounded-xl md:rounded-2xl border border-patriotBlue/20 hover:border-patriotBlue/40 transition-colors duration-300">
                <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-starGold/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-starGold" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs xs:text-sm sm:text-base md:text-lg text-textSecondary">
                    Fund Allocation
                  </div>
                  <div className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-semibold text-patriotWhite truncate">
                    {formatCurrency(proposal.fundAmount)}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 xs:space-x-3 sm:space-x-4 md:space-x-5 p-2 xs:p-3 sm:p-4 md:p-5 bg-backgroundDark/30 rounded-lg sm:rounded-xl md:rounded-2xl border border-patriotBlue/20 hover:border-patriotBlue/40 transition-colors duration-300">
                <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-patriotRed/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-patriotRed" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs xs:text-sm sm:text-base md:text-lg text-textSecondary">
                    Time Left
                  </div>
                  <div className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-semibold text-patriotWhite truncate">
                    {proposal.timeLeft}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Available Charities - Mobile Responsive */}
            <motion.div
              className="mb-4 xs:mb-6"
              variants={fadeInVariants}
              initial="initial"
              animate="enter"
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-2 xs:mb-3">
                <span className="text-sm xs:text-base font-medium text-patriotWhite">
                  Available Charities
                </span>
                <span className="text-xs text-textSecondary">
                  {charities.length} options
                </span>
              </div>
              <div className="flex flex-wrap gap-1 xs:gap-2">
                {charities
                  .slice(0, 3)
                  .map((charity: Charity, index: number) => (
                    <motion.div
                      key={charity.id}
                      className="flex items-center space-x-1 xs:space-x-2 bg-backgroundAccent rounded-lg px-2 xs:px-3 py-1 xs:py-2 border border-patriotBlue/30"
                      variants={fadeInVariants}
                      initial="initial"
                      animate="enter"
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      <Heart className="w-2 h-2 xs:w-3 xs:h-3 text-patriotRed flex-shrink-0" />
                      <span className="text-xs font-medium text-patriotWhite truncate">
                        {charity.name}
                      </span>
                    </motion.div>
                  ))}
                {charities.length > 3 && (
                  <div className="flex items-center justify-center bg-backgroundAccent rounded-lg px-2 xs:px-3 py-1 xs:py-2 border border-patriotBlue/30">
                    <span className="text-xs text-textSecondary">
                      +{charities.length - 3} more
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Voting Progress - Mobile Optimized */}
            <motion.div
              className="mb-3 xs:mb-4"
              variants={fadeInVariants}
              initial="initial"
              animate="enter"
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center justify-between text-xs xs:text-sm mb-2">
                <span className="text-textSecondary">Voting Progress</span>
                <span className="text-patriotWhite font-medium">
                  {totalVotes}% participation
                </span>
              </div>
              <div className="w-full bg-backgroundDark rounded-full h-1.5 xs:h-2 shadow-inner">
                <motion.div
                  className="bg-gradient-to-r from-patriotRed to-red-400 h-1.5 xs:h-2 rounded-full shadow-sm"
                  initial={{ width: 0 }}
                  animate={{ width: `${totalVotes}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.7 }}
                />
              </div>
            </motion.div>

            <motion.div
              className="flex flex-col xs:flex-row items-start xs:items-center justify-between pt-3 xs:pt-4 border-t border-patriotRed/30 gap-2 xs:gap-0"
              variants={fadeInVariants}
              initial="initial"
              animate="enter"
              transition={{ delay: 0.8 }}
            >
              <SimpleTooltip text="Number of eligible voters who have participated">
                <div className="flex items-center text-textSecondary text-xs xs:text-sm">
                  <Users className="w-3 h-3 xs:w-4 xs:h-4 mr-1" />
                  <span className="font-medium">{totalVotes}% voted</span>
                </div>
              </SimpleTooltip>

              <SimpleTooltip text="Charity selection voting">
                <div className="flex items-center text-xs xs:text-sm">
                  <TrendingUp className="w-3 h-3 xs:w-4 xs:h-4 mr-1 text-patriotRed" />
                  <span className="text-patriotWhite font-semibold">
                    Select Charity
                  </span>
                </div>
              </SimpleTooltip>
            </motion.div>
          </div>
        </Link>

        {proposal.status === 'active' && (
          <motion.div
            className="mt-3 xs:mt-4 pt-3 xs:pt-4 border-t border-patriotRed/30 relative z-10 px-3 xs:px-4 sm:px-6 pb-3 xs:pb-4 sm:pb-6"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            transition={{ delay: 0.9 }}
          >
            <Button
              asChild
              variant="primary"
              size="md"
              className="w-full font-semibold group-hover:shadow-xl bg-gradient-to-r from-patriotRed to-red-600 hover:from-red-600 hover:to-red-700 min-h-[44px] text-sm xs:text-base"
            >
              <Link href={`/proposal/${proposal.id}`}>
                <span className="xs:hidden">🎖️ Vote</span>
                <span className="hidden xs:inline">🎖️ Vote for Charity</span>
              </Link>
            </Button>
          </motion.div>
        )}
      </AnimatedCard>
    );
  }

  // Fallback for invalid mode/props
  return null;
};
