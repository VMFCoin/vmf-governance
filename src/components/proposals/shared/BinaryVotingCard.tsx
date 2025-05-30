'use client';

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
        return 'bg-patriotRed text-patriotWhite shadow-patriot-glow';
      case 'passed':
        return 'bg-green-600 text-white shadow-lg';
      case 'failed':
        return 'bg-gray-600 text-white shadow-lg';
      case 'pending':
        return 'bg-yellow-600 text-white shadow-lg';
      default:
        return 'bg-gray-600 text-white shadow-lg';
    }
  };

  const getThemeColors = (type: BinaryVotingProposal['type']) => {
    switch (type) {
      case 'charity_directory':
        return {
          hover: 'hover:border-blue-500/70 hover:shadow-lg',
          gradient: 'from-blue-500/20 to-transparent',
          text: 'group-hover:text-blue-400',
          border: 'border-t border-blue-500/30',
          button:
            'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
          icon: '🏛️',
        };
      case 'platform_feature':
        return {
          hover: 'hover:border-purple-500/70 hover:shadow-lg',
          gradient: 'from-purple-500/20 to-transparent',
          text: 'group-hover:text-purple-400',
          border: 'border-t border-purple-500/30',
          button:
            'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800',
          icon: '⚙️',
        };
      default:
        return {
          hover: 'hover:border-patriotRed/70 hover:shadow-patriot-glow',
          gradient: 'from-patriotBlue/20 to-transparent',
          text: 'group-hover:text-patriotRed',
          border: 'border-t border-patriotBlue/40',
          button: 'bg-gradient-to-r from-patriotRed to-red-600',
          icon: '📄',
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
        <motion.div
          className="flex items-start justify-between mb-4"
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
        >
          <motion.span
            className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(proposal.status)}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
          </motion.span>
          <div className="text-right">
            <SimpleTooltip text="Time remaining to vote">
              <div className="flex items-center text-patriotRed text-sm font-medium">
                <Clock className="w-4 h-4 mr-1" />
                {proposal.timeLeft}
              </div>
            </SimpleTooltip>
          </div>
        </motion.div>

        <motion.h3
          className={cn(
            'text-xl font-semibold text-patriotWhite mb-3 transition-colors leading-tight',
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
          className="flex items-center mb-4"
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.2 }}
        >
          <Star className="w-4 h-4 text-starGold mr-2" />
          <span className="text-textSecondary text-sm font-medium">
            by <span className="text-textBase">{proposal.author}</span>
          </span>
        </motion.div>

        {/* Type-specific content injection point */}
        {typeSpecificContent && (
          <motion.div
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            transition={{ delay: 0.25 }}
          >
            {typeSpecificContent}
          </motion.div>
        )}

        <motion.p
          className="text-textBase mb-6 line-clamp-3 leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity"
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.3 }}
        >
          {proposal.description ||
            'No description available for this proposal.'}
        </motion.p>

        {/* Vote Results Section */}
        <motion.div
          className="grid md:grid-cols-2 gap-6 mb-6"
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.4 }}
        >
          {/* Chart Visualization */}
          <div className="flex justify-center">
            <VoteChart
              yesPercentage={proposal.yesPercentage}
              noPercentage={proposal.noPercentage}
              abstainPercentage={proposal.abstainPercentage}
              size="md"
            />
          </div>

          {/* Progress Bars */}
          <div className="space-y-4">
            {/* Yes Votes */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-green-400 font-semibold">Yes</span>
                <motion.span
                  className="text-patriotWhite font-bold"
                  variants={numberCountVariants}
                  key={`yes-${proposal.yesPercentage}`}
                  initial="initial"
                  animate="update"
                >
                  {proposal.yesPercentage}%
                </motion.span>
              </div>
              <div className="w-full bg-backgroundDark rounded-full h-2.5 shadow-inner">
                <motion.div
                  className="bg-gradient-to-r from-green-500 to-green-400 h-2.5 rounded-full shadow-sm"
                  initial={{ width: 0 }}
                  animate={{ width: `${proposal.yesPercentage}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                />
              </div>
            </div>

            {/* No Votes */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-red-400 font-semibold">No</span>
                <motion.span
                  className="text-patriotWhite font-bold"
                  variants={numberCountVariants}
                  key={`no-${proposal.noPercentage}`}
                  initial="initial"
                  animate="update"
                >
                  {proposal.noPercentage}%
                </motion.span>
              </div>
              <div className="w-full bg-backgroundDark rounded-full h-2.5 shadow-inner">
                <motion.div
                  className="bg-gradient-to-r from-red-500 to-red-400 h-2.5 rounded-full shadow-sm"
                  initial={{ width: 0 }}
                  animate={{ width: `${proposal.noPercentage}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.6 }}
                />
              </div>
            </div>

            {/* Abstain Votes */}
            {proposal.abstainPercentage > 0 && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400 font-semibold">Abstain</span>
                  <motion.span
                    className="text-patriotWhite font-bold"
                    variants={numberCountVariants}
                    key={`abstain-${proposal.abstainPercentage}`}
                    initial="initial"
                    animate="update"
                  >
                    {proposal.abstainPercentage}%
                  </motion.span>
                </div>
                <div className="w-full bg-backgroundDark rounded-full h-2.5 shadow-inner">
                  <motion.div
                    className="bg-gradient-to-r from-gray-500 to-gray-400 h-2.5 rounded-full shadow-sm"
                    initial={{ width: 0 }}
                    animate={{ width: `${proposal.abstainPercentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.7 }}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          className={cn(
            'flex items-center justify-between pt-4',
            themeColors.border
          )}
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.8 }}
        >
          <SimpleTooltip text="Percentage of eligible voters who have participated">
            <div className="flex items-center text-textSecondary text-sm">
              <Users className="w-4 h-4 mr-1" />
              <span className="font-medium">{totalVotes}% participation</span>
            </div>
          </SimpleTooltip>

          <SimpleTooltip text="Current leading vote option">
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 mr-1 text-patriotRed" />
              <span className="text-patriotWhite font-semibold">
                {leadingVote} leading ({leadingPercentage}%)
              </span>
            </div>
          </SimpleTooltip>
        </motion.div>
      </Link>

      {proposal.status === 'active' && (
        <motion.div
          className={cn('mt-4 pt-4 relative z-10', themeColors.border)}
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
              'w-full font-semibold group-hover:shadow-xl',
              themeColors.button
            )}
          >
            <Link href={`/proposal/${proposal.id}`}>
              {themeColors.icon} View & Vote
            </Link>
          </Button>
        </motion.div>
      )}
    </AnimatedCard>
  );
}
