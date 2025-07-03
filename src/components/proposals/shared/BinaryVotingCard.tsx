'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Star, Users, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import AnimatedCard from '@/components/ui/AnimatedCard';
import { SimpleTooltip } from '@/components/ui/AnimatedTooltip';
import { VotingPower, VoteChart } from '@/components/voting';
import { fadeInVariants, numberCountVariants } from '@/lib/animations';
import { CharityDirectoryProposal, PlatformFeatureProposal } from '@/types';
import { cn } from '@/lib/utils';

// Union type for binary voting proposals
type BinaryVotingProposal = CharityDirectoryProposal | PlatformFeatureProposal;

interface BinaryVotingCardProps {
  proposal: BinaryVotingProposal;
  typeSpecificContent?: React.ReactNode;
  className?: string;
}

export function BinaryVotingCard({
  proposal,
  typeSpecificContent,
  className,
}: BinaryVotingCardProps) {
  const getStatusColor = (status: BinaryVotingProposal['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'passed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getThemeColors = (type: string) => {
    switch (type) {
      case 'charity_directory':
        return {
          gradient: 'from-green-500/5 to-emerald-500/5',
          hover: 'hover:border-green-500/50',
          text: 'group-hover:text-green-400',
          border: 'border-t border-green-500/30',
          button:
            'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700',
          icon: '🏥',
        };
      case 'platform_feature':
        return {
          gradient: 'from-blue-500/5 to-indigo-500/5',
          hover: 'hover:border-blue-500/50',
          text: 'group-hover:text-blue-400',
          border: 'border-t border-blue-500/30',
          button:
            'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
          icon: '⚡',
        };
      default:
        return {
          gradient: 'from-patriotBlue/5 to-patriotRed/5',
          hover: 'hover:border-patriotBlue/50',
          text: 'group-hover:text-patriotBlue',
          border: 'border-t border-patriotBlue/30',
          button:
            'bg-gradient-to-r from-patriotBlue to-blue-700 hover:from-blue-700 hover:to-blue-800',
          icon: '📊',
        };
    }
  };

  const themeColors = getThemeColors(proposal.type);

  const totalVotes =
    proposal.yesPercentage + proposal.noPercentage + proposal.abstainPercentage;
  const leadingVote =
    proposal.yesPercentage > proposal.noPercentage ? 'Yes' : 'No';
  const leadingPercentage = Math.max(
    proposal.yesPercentage,
    proposal.noPercentage
  );

  return (
    <AnimatedCard
      className={cn(
        'transition-all duration-300 group cursor-pointer relative overflow-hidden',
        themeColors.hover,
        className
      )}
    >
      {/* Subtle background gradient for better depth */}
      <motion.div
        className={cn(
          'absolute inset-0 bg-gradient-to-br',
          themeColors.gradient
        )}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      <Link href={`/proposal/${proposal.id}`} className="block relative z-10">
        {/* Enhanced Mobile Header */}
        <div className="p-3 xs:p-4 sm:p-6">
          <motion.div
            className="flex flex-col xs:flex-row items-start xs:items-center justify-between mb-3 xs:mb-4 gap-2 xs:gap-4"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
          >
            <motion.span
              className={`px-2 xs:px-3 py-1 xs:py-1.5 rounded-full text-xs xs:text-sm font-semibold border ${getStatusColor(proposal.status)} order-2 xs:order-1 self-start xs:self-auto`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {proposal.status.charAt(0).toUpperCase() +
                proposal.status.slice(1)}
            </motion.span>
            <div className="text-left xs:text-right w-full xs:w-auto order-1 xs:order-2">
              <SimpleTooltip text="Time remaining to vote">
                <div className="flex items-center text-patriotRed text-xs xs:text-sm font-medium">
                  <Clock className="w-3 h-3 xs:w-4 xs:h-4 mr-1" />
                  {proposal.timeLeft}
                </div>
              </SimpleTooltip>
            </div>
          </motion.div>

          <motion.h3
            className={cn(
              'text-lg xs:text-xl font-semibold text-patriotWhite mb-2 xs:mb-3 transition-colors leading-tight',
              themeColors.text
            )}
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            transition={{ delay: 0.1 }}
          >
            {proposal.title}
          </motion.h3>

          <motion.div
            className="flex items-center mb-3 xs:mb-4"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            transition={{ delay: 0.2 }}
          >
            <Star className="w-3 h-3 xs:w-4 xs:h-4 text-starGold mr-2 flex-shrink-0" />
            <span className="text-textSecondary text-xs xs:text-sm font-medium truncate">
              by <span className="text-textBase">{proposal.author}</span>
            </span>
          </motion.div>

          {/* Type-specific content injection point */}
          {typeSpecificContent && (
            <motion.div
              className="mb-3 xs:mb-4"
              variants={fadeInVariants}
              initial="initial"
              animate="enter"
              transition={{ delay: 0.25 }}
            >
              {typeSpecificContent}
            </motion.div>
          )}

          <motion.p
            className="text-textBase mb-4 xs:mb-6 line-clamp-3 leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity text-sm xs:text-base"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            transition={{ delay: 0.3 }}
          >
            {proposal.description ||
              'No description available for this proposal.'}
          </motion.p>

          {/* Vote Results Section - Enhanced Mobile Layout */}
          <motion.div
            className="mb-4 xs:mb-6"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between text-xs xs:text-sm mb-2">
              <span className="text-textSecondary">Current Results</span>
              <span className="text-patriotWhite font-medium">
                {leadingVote} leading
              </span>
            </div>

            {/* Mobile-First Vote Bars */}
            <div className="space-y-2 xs:space-y-3">
              {/* Yes Vote */}
              <motion.div
                variants={fadeInVariants}
                initial="initial"
                animate="enter"
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs xs:text-sm text-green-400 font-medium">
                    Yes
                  </span>
                  <span className="text-xs xs:text-sm text-green-400 font-bold">
                    {proposal.yesPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-backgroundDark rounded-full h-1.5 xs:h-2 shadow-inner">
                  <motion.div
                    className="bg-gradient-to-r from-green-500 to-green-400 h-1.5 xs:h-2 rounded-full shadow-sm"
                    initial={{ width: 0 }}
                    animate={{ width: `${proposal.yesPercentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.6 }}
                  />
                </div>
              </motion.div>

              {/* No Vote */}
              <motion.div
                variants={fadeInVariants}
                initial="initial"
                animate="enter"
                transition={{ delay: 0.55 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs xs:text-sm text-red-400 font-medium">
                    No
                  </span>
                  <span className="text-xs xs:text-sm text-red-400 font-bold">
                    {proposal.noPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-backgroundDark rounded-full h-1.5 xs:h-2 shadow-inner">
                  <motion.div
                    className="bg-gradient-to-r from-red-500 to-red-400 h-1.5 xs:h-2 rounded-full shadow-sm"
                    initial={{ width: 0 }}
                    animate={{ width: `${proposal.noPercentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.65 }}
                  />
                </div>
              </motion.div>

              {/* Abstain Vote */}
              <motion.div
                variants={fadeInVariants}
                initial="initial"
                animate="enter"
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs xs:text-sm text-gray-400 font-medium">
                    Abstain
                  </span>
                  <span className="text-xs xs:text-sm text-gray-400 font-bold">
                    {proposal.abstainPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-backgroundDark rounded-full h-1.5 xs:h-2 shadow-inner">
                  <motion.div
                    className="bg-gradient-to-r from-gray-500 to-gray-400 h-1.5 xs:h-2 rounded-full shadow-sm"
                    initial={{ width: 0 }}
                    animate={{ width: `${proposal.abstainPercentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.7 }}
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Footer Stats - Mobile Responsive */}
          <motion.div
            className={cn(
              'flex flex-col xs:flex-row items-start xs:items-center justify-between pt-3 xs:pt-4 gap-2 xs:gap-0',
              themeColors.border
            )}
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            transition={{ delay: 0.8 }}
          >
            <SimpleTooltip text="Percentage of eligible voters who have participated">
              <div className="flex items-center text-textSecondary text-xs xs:text-sm">
                <Users className="w-3 h-3 xs:w-4 xs:h-4 mr-1" />
                <span className="font-medium">{totalVotes}% participation</span>
              </div>
            </SimpleTooltip>

            <SimpleTooltip text="Current leading vote option">
              <div className="flex items-center text-xs xs:text-sm">
                <TrendingUp className="w-3 h-3 xs:w-4 xs:h-4 mr-1 text-patriotRed" />
                <span className="text-patriotWhite font-semibold">
                  {leadingVote} leading ({leadingPercentage.toFixed(1)}%)
                </span>
              </div>
            </SimpleTooltip>
          </motion.div>
        </div>
      </Link>

      {proposal.status === 'active' && (
        <motion.div
          className={cn(
            'mt-3 xs:mt-4 pt-3 xs:pt-4 relative z-10 px-3 xs:px-4 sm:px-6 pb-3 xs:pb-4 sm:pb-6',
            themeColors.border
          )}
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.9 }}
        >
          <Button
            asChild
            variant="primary"
            size="md"
            className={cn(
              'w-full font-semibold group-hover:shadow-xl min-h-[44px] text-sm xs:text-base',
              themeColors.button
            )}
          >
            <Link href={`/proposal/${proposal.id}`}>
              <span className="xs:hidden">{themeColors.icon} Vote</span>
              <span className="hidden xs:inline">
                {themeColors.icon} View & Vote
              </span>
            </Link>
          </Button>
        </motion.div>
      )}
    </AnimatedCard>
  );
}
