'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Star, Users, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import AnimatedCard from '@/components/ui/AnimatedCard';
import { SimpleTooltip } from '@/components/ui/AnimatedTooltip';
import { ProposalTypeIndicator } from '../shared/ProposalTypeIndicator';
import { fadeInVariants } from '@/lib/animations';
import { LegacyProposal } from '@/types';
import { cn } from '@/lib/utils';

interface LegacyProposalCardProps {
  proposal: LegacyProposal;
  className?: string;
}

export const LegacyProposalCard: React.FC<LegacyProposalCardProps> = ({
  proposal,
  className,
}) => {
  const getStatusColor = (status: LegacyProposal['status']) => {
    switch (status) {
      case 'active':
        return 'bg-patriotBlue/20 text-patriotWhite border-patriotBlue/40';
      case 'passed':
        return 'bg-green-500/20 text-green-400 border-green-500/40';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
    }
  };

  const totalVotes =
    proposal.yesPercentage + proposal.noPercentage + proposal.abstainPercentage;

  return (
    <AnimatedCard
      className={cn(
        'hover:border-patriotBlue/70 hover:shadow-lg transition-all duration-300 group cursor-pointer relative overflow-hidden',
        'bg-gradient-to-br from-patriotBlue/10 to-patriotRed/5 border-patriotBlue/30',
        className
      )}
    >
      {/* Classic background pattern */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-patriotBlue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(30, 58, 138, 0.03) 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
        }}
      />

      <Link href={`/proposal/${proposal.id}`} className="block relative z-10">
        <div className="p-3 xs:p-4 sm:p-6">
          {/* Enhanced Mobile Header */}
          <motion.div
            className="flex flex-col xs:flex-row items-start xs:items-center justify-between mb-3 xs:mb-4 gap-2 xs:gap-4"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
          >
            <div className="flex items-center gap-2 xs:gap-3 order-1">
              <ProposalTypeIndicator type="legacy" size="sm" />
            </div>
            <motion.span
              className={`px-2 xs:px-3 py-1 xs:py-1.5 rounded-full text-xs xs:text-sm font-semibold border ${getStatusColor(proposal.status)} order-2 self-start xs:self-auto`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {proposal.status.charAt(0).toUpperCase() +
                proposal.status.slice(1)}
            </motion.span>
          </motion.div>

          <motion.h3
            className="text-lg xs:text-xl font-semibold text-patriotWhite mb-2 xs:mb-3 group-hover:text-patriotBlue transition-colors leading-tight"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            transition={{ delay: 0.1 }}
          >
            {proposal.title}
          </motion.h3>

          <motion.div
            className="flex flex-col xs:flex-row items-start xs:items-center justify-between mb-3 xs:mb-4 gap-2 xs:gap-0"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center">
              <Star className="w-3 h-3 xs:w-4 xs:h-4 text-starGold mr-2 flex-shrink-0" />
              <span className="text-textSecondary text-xs xs:text-sm font-medium truncate">
                by <span className="text-textBase">{proposal.author}</span>
              </span>
            </div>
            <SimpleTooltip text="Time remaining to vote">
              <div className="flex items-center text-patriotBlue text-xs xs:text-sm font-medium">
                <Clock className="w-3 h-3 xs:w-4 xs:h-4 mr-1" />
                {proposal.timeLeft}
              </div>
            </SimpleTooltip>
          </motion.div>

          {proposal.description && (
            <motion.p
              className="text-textBase mb-4 xs:mb-6 line-clamp-3 leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity text-sm xs:text-base"
              variants={fadeInVariants}
              initial="initial"
              animate="enter"
              transition={{ delay: 0.3 }}
            >
              {proposal.description}
            </motion.p>
          )}

          {/* Voting Progress - Mobile Optimized */}
          <motion.div
            className="mb-4 xs:mb-6"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between text-xs xs:text-sm mb-2">
              <span className="text-textSecondary">Voting Progress</span>
              <span className="text-patriotWhite font-medium">
                {totalVotes}% participation
              </span>
            </div>
            <div className="w-full bg-backgroundDark rounded-full h-1.5 xs:h-2 shadow-inner">
              <motion.div
                className="bg-gradient-to-r from-patriotBlue to-blue-400 h-1.5 xs:h-2 rounded-full shadow-sm"
                initial={{ width: 0 }}
                animate={{ width: `${totalVotes}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
              />
            </div>
          </motion.div>

          {/* Footer Stats - Mobile Responsive */}
          <motion.div
            className="flex flex-col xs:flex-row items-start xs:items-center justify-between pt-3 xs:pt-4 border-t border-patriotBlue/30 gap-2 xs:gap-0"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            transition={{ delay: 0.6 }}
          >
            <SimpleTooltip text="Number of eligible voters who have participated">
              <div className="flex items-center text-textSecondary text-xs xs:text-sm">
                <Users className="w-3 h-3 xs:w-4 xs:h-4 mr-1" />
                <span className="font-medium">{totalVotes}% voted</span>
              </div>
            </SimpleTooltip>

            <SimpleTooltip text="Standard proposal voting">
              <div className="flex items-center text-xs xs:text-sm">
                <TrendingUp className="w-3 h-3 xs:w-4 xs:h-4 mr-1 text-patriotBlue" />
                <span className="text-patriotWhite font-semibold">
                  Vote Now
                </span>
              </div>
            </SimpleTooltip>
          </motion.div>
        </div>
      </Link>

      {proposal.status === 'active' && (
        <motion.div
          className="mt-3 xs:mt-4 pt-3 xs:pt-4 border-t border-patriotBlue/30 relative z-10 px-3 xs:px-4 sm:px-6 pb-3 xs:pb-4 sm:pb-6"
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.7 }}
        >
          <Button
            asChild
            variant="primary"
            size="md"
            className="w-full font-semibold group-hover:shadow-xl bg-gradient-to-r from-patriotBlue to-blue-700 hover:from-blue-700 hover:to-blue-800 min-h-[44px] text-sm xs:text-base"
          >
            <Link href={`/proposal/${proposal.id}`}>
              <span className="xs:hidden">📊 Vote</span>
              <span className="hidden xs:inline">📊 Cast Your Vote</span>
            </Link>
          </Button>
        </motion.div>
      )}
    </AnimatedCard>
  );
};
