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
        return 'bg-patriotBlue text-patriotWhite shadow-lg';
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
        <motion.div
          className="flex items-start justify-between mb-4"
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
        >
          <div className="flex items-center gap-3">
            <ProposalTypeIndicator type="legacy" size="sm" />
          </div>
          <motion.span
            className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(proposal.status)}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
          </motion.span>
        </motion.div>

        <motion.h3
          className="text-xl font-semibold text-patriotWhite mb-3 group-hover:text-patriotBlue transition-colors leading-tight"
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.1 }}
        >
          {proposal.title}
        </motion.h3>

        <motion.div
          className="flex items-center justify-between mb-4"
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center">
            <Star className="w-4 h-4 text-starGold mr-2" />
            <span className="text-textSecondary text-sm font-medium">
              by <span className="text-textBase">{proposal.author}</span>
            </span>
          </div>
          <SimpleTooltip text="Time remaining to vote">
            <div className="flex items-center text-patriotBlue text-sm font-medium">
              <Clock className="w-4 h-4 mr-1" />
              {proposal.timeLeft}
            </div>
          </SimpleTooltip>
        </motion.div>

        {proposal.description && (
          <motion.p
            className="text-textBase mb-6 line-clamp-3 leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            transition={{ delay: 0.3 }}
          >
            {proposal.description}
          </motion.p>
        )}

        {/* Voting Progress */}
        <motion.div
          className="mb-6"
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-textSecondary">Voting Progress</span>
            <span className="text-patriotWhite font-medium">
              {totalVotes}% participation
            </span>
          </div>
          <div className="w-full bg-backgroundDark rounded-full h-2 shadow-inner">
            <motion.div
              className="bg-gradient-to-r from-patriotBlue to-blue-400 h-2 rounded-full shadow-sm"
              initial={{ width: 0 }}
              animate={{ width: `${totalVotes}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
            />
          </div>
        </motion.div>

        <motion.div
          className="flex items-center justify-between pt-4 border-t border-patriotBlue/30"
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.6 }}
        >
          <SimpleTooltip text="Number of eligible voters who have participated">
            <div className="flex items-center text-textSecondary text-sm">
              <Users className="w-4 h-4 mr-1" />
              <span className="font-medium">{totalVotes}% voted</span>
            </div>
          </SimpleTooltip>

          <SimpleTooltip text="Standard proposal voting">
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 mr-1 text-patriotBlue" />
              <span className="text-patriotWhite font-semibold">Vote Now</span>
            </div>
          </SimpleTooltip>
        </motion.div>
      </Link>

      {proposal.status === 'active' && (
        <motion.div
          className="mt-4 pt-4 border-t border-patriotBlue/30 relative z-10"
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.7 }}
        >
          <Button
            asChild
            variant="primary"
            size="md"
            className="w-full font-semibold group-hover:shadow-xl bg-gradient-to-r from-patriotBlue to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Link href={`/proposal/${proposal.id}`}>📊 Cast Your Vote</Link>
          </Button>
        </motion.div>
      )}
    </AnimatedCard>
  );
};
