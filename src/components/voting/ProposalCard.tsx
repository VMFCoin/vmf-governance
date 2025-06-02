'use client';

import Link from 'next/link';
import { Clock, Star, Users, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import AnimatedCard from '@/components/ui/AnimatedCard';
import { SimpleTooltip } from '@/components/ui/AnimatedTooltip';
import { VotingPower, VoteChart } from '@/components/voting';
import {
  fadeInVariants,
  numberCountVariants,
  enhancedCardVariants,
  cardGradientOverlayVariants,
  getAnimationVariants,
} from '@/lib/animations';
import { Proposal } from '@/types';

interface ProposalCardProps {
  proposal: Proposal;
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const getStatusColor = (status: Proposal['status']) => {
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

  const totalVotes =
    proposal.yesPercentage + proposal.noPercentage + proposal.abstainPercentage;
  const leadingVote =
    proposal.yesPercentage > proposal.noPercentage ? 'Yes' : 'No';
  const leadingPercentage = Math.max(
    proposal.yesPercentage,
    proposal.noPercentage
  );

  return (
    <motion.div
      className="relative overflow-hidden"
      variants={getAnimationVariants(enhancedCardVariants)}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      animate="active"
    >
      <AnimatedCard className="hover:border-patriotRed/70 hover:shadow-patriot-glow transition-all duration-300 group cursor-pointer relative overflow-hidden">
        {/* Enhanced background gradient with patriotic theme */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-patriotBlue/20 via-patriotRed/5 to-transparent"
          variants={getAnimationVariants(cardGradientOverlayVariants)}
          initial="initial"
          whileHover="hover"
        />

        {/* Animated border glow effect */}
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-transparent"
          animate={{
            borderColor: [
              'rgba(178, 34, 52, 0)',
              'rgba(178, 34, 52, 0.3)',
              'rgba(178, 34, 52, 0)',
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Shimmer effect on hover */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-patriotWhite/10 to-transparent transform -skew-x-12"
            initial={{ x: '-100%' }}
            whileHover={{
              x: '100%',
              transition: { duration: 1, ease: 'easeOut' },
            }}
          />
        </motion.div>

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
              {proposal.status.charAt(0).toUpperCase() +
                proposal.status.slice(1)}
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
            className="text-xl font-semibold text-patriotWhite mb-3 group-hover:text-patriotRed transition-colors leading-tight"
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
            className="flex items-center justify-between pt-4 border-t border-patriotBlue/40"
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
            className="mt-4 pt-4 border-t border-patriotBlue/40 relative z-10"
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            transition={{ delay: 0.9 }}
          >
            <Button
              asChild
              variant="primary"
              size="md"
              className="w-full font-semibold group-hover:shadow-xl"
            >
              <Link href={`/proposal/${proposal.id}`}>View & Vote</Link>
            </Button>
          </motion.div>
        )}
      </AnimatedCard>
    </motion.div>
  );
}
