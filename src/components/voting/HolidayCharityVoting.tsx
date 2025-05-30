'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, DollarSign, Calendar, Users, CheckCircle } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { SimpleTooltip } from '@/components/ui/AnimatedTooltip';
import { useCharityStore } from '@/stores/useCharityStore';
import { useProposalStore } from '@/stores/useProposalStore';
import { HolidayCharityProposal } from '@/types';
import { cn } from '@/lib/utils';
import { fadeInVariants } from '@/lib/animations';

interface HolidayCharityVotingProps {
  proposal: HolidayCharityProposal;
  onVoteSubmitted?: () => void;
}

export const HolidayCharityVoting: React.FC<HolidayCharityVotingProps> = ({
  proposal,
  onVoteSubmitted,
}) => {
  const [selectedCharity, setSelectedCharity] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getCharityById } = useCharityStore();
  const { submitVote } = useProposalStore();

  const availableCharities = proposal.availableCharities
    .map(id => getCharityById(id))
    .filter(
      (charity): charity is NonNullable<typeof charity> => charity !== undefined
    );

  const handleVote = async (voteType: 'yes' | 'no' | 'abstain') => {
    if (voteType === 'yes' && !selectedCharity) {
      return; // Require charity selection for yes votes
    }

    setIsSubmitting(true);
    try {
      await submitVote(proposal.id, voteType, 1); // Assuming voting power of 1
      onVoteSubmitted?.();
    } catch (error) {
      console.error('Failed to submit vote:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <motion.div
        className="text-center"
        variants={fadeInVariants}
        initial="initial"
        animate="enter"
      >
        <div className="flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-patriotRed mr-3" />
          <h3 className="text-2xl font-bold text-patriotWhite">
            Holiday Charity Selection
          </h3>
        </div>
        <p className="text-textSecondary">
          Choose a charity to receive the holiday fund allocation
        </p>
      </motion.div>

      {/* Fund Information */}
      <motion.div
        className="bg-patriotRed/10 border border-patriotRed/30 rounded-lg p-4"
        variants={fadeInVariants}
        initial="initial"
        animate="enter"
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DollarSign className="w-5 h-5 text-starGold mr-2" />
            <span className="font-semibold text-patriotWhite">
              Fund Amount: ${proposal.fundAmount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center text-sm text-textSecondary">
            <Calendar className="w-4 h-4 mr-1" />
            Holiday Fund
          </div>
        </div>
      </motion.div>

      {/* Charity Selection */}
      <motion.div
        variants={fadeInVariants}
        initial="initial"
        animate="enter"
        transition={{ delay: 0.2 }}
      >
        <h4 className="text-lg font-semibold text-patriotWhite mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Select a Charity
        </h4>
        <div className="grid gap-3">
          {availableCharities.map(charity => (
            <motion.div
              key={charity.id}
              className={cn(
                'border rounded-lg p-4 cursor-pointer transition-all duration-200',
                selectedCharity === charity.id
                  ? 'border-patriotRed bg-patriotRed/10 shadow-lg'
                  : 'border-patriotBlue/30 hover:border-patriotBlue/50 hover:bg-patriotBlue/5'
              )}
              onClick={() => setSelectedCharity(charity.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h5 className="font-semibold text-patriotWhite">
                      {charity.name}
                    </h5>
                    {selectedCharity === charity.id && (
                      <CheckCircle className="w-5 h-5 text-patriotRed ml-2" />
                    )}
                  </div>
                  <p className="text-sm text-textSecondary mb-2 line-clamp-2">
                    {charity.description}
                  </p>
                  <div className="flex items-center text-xs text-textSecondary">
                    <span className="capitalize">
                      {charity.category.replace('_', ' ')}
                    </span>
                    {charity.verificationStatus === 'verified' && (
                      <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Voting Actions */}
      <motion.div
        className="space-y-3"
        variants={fadeInVariants}
        initial="initial"
        animate="enter"
        transition={{ delay: 0.3 }}
      >
        <SimpleTooltip text="Vote to approve the selected charity for funding">
          <Button
            onClick={() => handleVote('yes')}
            disabled={!selectedCharity || isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
            size="lg"
          >
            {isSubmitting
              ? 'Submitting...'
              : '✅ Vote Yes - Fund Selected Charity'}
          </Button>
        </SimpleTooltip>

        <SimpleTooltip text="Vote against this holiday charity proposal">
          <Button
            onClick={() => handleVote('no')}
            disabled={isSubmitting}
            variant="secondary"
            className="w-full"
            size="lg"
          >
            {isSubmitting ? 'Submitting...' : '❌ Vote No'}
          </Button>
        </SimpleTooltip>

        <SimpleTooltip text="Abstain from voting on this proposal">
          <Button
            onClick={() => handleVote('abstain')}
            disabled={isSubmitting}
            variant="secondary"
            className="w-full bg-gray-600 hover:bg-gray-700"
            size="lg"
          >
            {isSubmitting ? 'Submitting...' : '⚪ Abstain'}
          </Button>
        </SimpleTooltip>
      </motion.div>

      {!selectedCharity && (
        <motion.div
          className="text-center text-sm text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-3"
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.4 }}
        >
          Please select a charity before voting "Yes"
        </motion.div>
      )}
    </Card>
  );
};
