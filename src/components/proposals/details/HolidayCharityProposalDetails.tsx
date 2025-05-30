'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  DollarSign,
  Users,
  Clock,
  Flag,
  Heart,
  TrendingUp,
  MapPin,
  Award,
  CheckCircle,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { SimpleTooltip } from '@/components/ui/AnimatedTooltip';
import { HolidayCharityVoting } from '@/components/proposals/voting';
import { ProposalTypeIndicator } from '@/components/proposals/shared';
import { HolidayCharityProposal, MilitaryHoliday, Charity } from '@/types';
import { fadeInVariants, slideUpVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface HolidayCharityProposalDetailsProps {
  proposal: HolidayCharityProposal;
  holiday: MilitaryHoliday;
  availableCharities: Charity[];
  className?: string;
}

export const HolidayCharityProposalDetails: React.FC<
  HolidayCharityProposalDetailsProps
> = ({ proposal, holiday, availableCharities, className }) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const endDate = new Date(proposal.votingEndsAt);
    const diff = endDate.getTime() - now.getTime();

    if (diff <= 0) return 'Voting ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
    return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  };

  const getTotalVotes = () => {
    // For holiday charity proposals, we'll calculate based on percentages
    // This is a simplified calculation - in real implementation, you'd have actual vote counts
    const baseVotes = 1000; // Mock base for calculation
    return Math.floor(
      (baseVotes *
        (proposal.yesPercentage +
          proposal.noPercentage +
          proposal.abstainPercentage)) /
        100
    );
  };

  const selectedCharity = availableCharities.find(
    c => c.id === proposal.selectedCharity
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <motion.div variants={fadeInVariants} initial="initial" animate="enter">
        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start">
              <div className="text-4xl mr-4">{holiday.flagIcon}</div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <ProposalTypeIndicator type="holiday_charity" size="sm" />
                  <div
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium border',
                      proposal.status === 'active' &&
                        'bg-green-500/10 border-green-500/30 text-green-400',
                      proposal.status === 'passed' &&
                        'bg-blue-500/10 border-blue-500/30 text-blue-400',
                      proposal.status === 'failed' &&
                        'bg-red-500/10 border-red-500/30 text-red-400',
                      proposal.status === 'pending' &&
                        'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                    )}
                  >
                    {proposal.status.toUpperCase()}
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-patriotWhite mb-2">
                  {proposal.title}
                </h1>
                <p className="text-textSecondary max-w-2xl">
                  {proposal.description}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-starGold">
                {formatCurrency(proposal.fundAmount)}
              </div>
              <p className="text-sm text-textSecondary">Available Fund</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-backgroundLight/50 border border-patriotBlue/30 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Calendar className="w-4 h-4 mr-2 text-patriotBlue" />
                <span className="font-semibold text-patriotWhite">
                  Holiday Date
                </span>
              </div>
              <p className="text-textSecondary">{formatDate(holiday.date)}</p>
            </div>
            <div className="bg-backgroundLight/50 border border-patriotRed/30 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Clock className="w-4 h-4 mr-2 text-patriotRed" />
                <span className="font-semibold text-patriotWhite">
                  Voting Ends
                </span>
              </div>
              <p className="text-textSecondary">{getTimeRemaining()}</p>
            </div>
            <div className="bg-backgroundLight/50 border border-starGold/30 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Users className="w-4 h-4 mr-2 text-starGold" />
                <span className="font-semibold text-patriotWhite">
                  Total Votes
                </span>
              </div>
              <p className="text-textSecondary">
                {getTotalVotes().toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Holiday Information */}
      <motion.div
        variants={slideUpVariants}
        initial="initial"
        animate="enter"
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6">
          <div className="flex items-center mb-6">
            <Flag className="w-6 h-6 text-patriotRed mr-3" />
            <h2 className="text-xl font-bold text-patriotWhite">
              About {holiday.name}
            </h2>
          </div>

          <div className="bg-patriotBlue/10 border border-patriotBlue/30 rounded-lg p-4 mb-6">
            <p className="text-patriotWhite leading-relaxed">
              {holiday.description}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-patriotWhite mb-3">
                Holiday Details
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-textSecondary">Date:</span>
                  <span className="text-patriotWhite">
                    {formatDate(holiday.date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textSecondary">Fund Allocation:</span>
                  <span className="text-patriotWhite">
                    {formatCurrency(holiday.fundAllocation)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textSecondary">Voting Eligible:</span>
                  <span className="text-patriotWhite">
                    {holiday.isVotingEligible ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-patriotWhite mb-3">
                Proposal Timeline
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-textSecondary">Created:</span>
                  <span className="text-patriotWhite">
                    {formatDate(proposal.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textSecondary">Voting Ends:</span>
                  <span className="text-patriotWhite">
                    {formatDate(proposal.votingEndsAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textSecondary">Status:</span>
                  <span className="text-patriotWhite">{proposal.status}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Available Charities */}
      <motion.div
        variants={slideUpVariants}
        initial="initial"
        animate="enter"
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6">
          <div className="flex items-center mb-6">
            <Heart className="w-6 h-6 text-patriotRed mr-3" />
            <h2 className="text-xl font-bold text-patriotWhite">
              Available Charities
            </h2>
          </div>

          <div className="grid gap-4">
            {availableCharities.map((charity, index) => (
              <motion.div
                key={charity.id}
                className={cn(
                  'border rounded-lg p-4 transition-all duration-200',
                  proposal.selectedCharity === charity.id
                    ? 'border-starGold bg-starGold/10'
                    : 'border-patriotBlue/30 bg-patriotBlue/5'
                )}
                variants={fadeInVariants}
                initial="initial"
                animate="enter"
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-patriotBlue/20 rounded-lg flex items-center justify-center mr-4">
                      <Heart className="w-6 h-6 text-patriotRed" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-patriotWhite">
                          {charity.name}
                        </h3>
                        {charity.verificationStatus === 'verified' && (
                          <SimpleTooltip text="Verified charity">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          </SimpleTooltip>
                        )}
                        {proposal.selectedCharity === charity.id && (
                          <div className="px-2 py-1 bg-starGold text-backgroundDark text-xs rounded-full font-medium">
                            Selected
                          </div>
                        )}
                      </div>
                      <p className="text-textSecondary text-sm mb-3">
                        {charity.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center text-starGold">
                          <Award className="w-3 h-3 mr-1" />
                          {charity.category.replace('_', ' ')}
                        </div>
                        <div className="flex items-center text-green-400">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {charity.impactMetrics.veteransServed} Veterans Served
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Voting Section */}
      <motion.div
        variants={slideUpVariants}
        initial="initial"
        animate="enter"
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Users className="w-6 h-6 text-starGold mr-3" />
              <h2 className="text-xl font-bold text-patriotWhite">
                Voting Results
              </h2>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-starGold">
                {proposal.yesPercentage.toFixed(1)}% Support
              </div>
              <p className="text-sm text-textSecondary">Current approval</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-starGold h-3 rounded-full transition-all duration-500"
                style={{ width: `${proposal.yesPercentage}%` }}
              />
            </div>
          </div>

          <HolidayCharityVoting proposal={proposal} />
        </Card>
      </motion.div>
    </div>
  );
};
