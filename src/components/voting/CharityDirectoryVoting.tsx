'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  FileText,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Building,
  Globe,
  Users,
  Zap,
  Award,
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { SimpleTooltip } from '@/components/ui/AnimatedTooltip';
import { ProfileGuard } from '@/components/auth';
import { useProposalStore } from '@/stores/useProposalStore';
import { useTokenLockStore } from '@/stores/useTokenLockStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { CharityDirectoryProposal } from '@/types';
import { cn } from '@/lib/utils';
import { fadeInVariants } from '@/lib/animations';

interface CharityDirectoryVotingProps {
  proposal: CharityDirectoryProposal;
  onVoteSubmitted?: () => void;
}

export function CharityDirectoryVoting({
  proposal,
  onVoteSubmitted,
}: CharityDirectoryVotingProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalVotingPower, setTotalVotingPower] = useState<bigint>(BigInt(0));

  const { submitVote } = useProposalStore();
  const { address, isConnected } = useWalletStore();
  const {
    votingPowerBreakdown,
    isLoading: isLoadingVotingPower,
    fetchUserLocks,
    getTotalVotingPower,
  } = useTokenLockStore();

  // Fetch voting power data when wallet is connected
  useEffect(() => {
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

  const handleVote = async (voteType: 'yes' | 'no' | 'abstain') => {
    setIsSubmitting(true);
    try {
      // Use actual voting power instead of hardcoded 1
      const votingPowerToUse = Number(totalVotingPower) / 1e18;
      await submitVote(proposal.id, voteType, votingPowerToUse);
      onVoteSubmitted?.();
    } catch (error) {
      console.error('Failed to submit vote:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVerificationStatus = () => {
    if (
      proposal.verificationDocuments &&
      proposal.verificationDocuments.length > 0
    ) {
      return {
        icon: <CheckCircle className="w-5 h-5 text-green-500" />,
        text: 'Documents Provided',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10 border-green-500/30',
      };
    }
    return {
      icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
      text: 'Pending Documentation',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10 border-yellow-500/30',
    };
  };

  const verificationStatus = getVerificationStatus();

  return (
    <ProfileGuard fallbackMessage="You need a profile to vote on charity directory proposals.">
      <Card className="p-6 space-y-6">
        <motion.div
          className="text-center"
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
        >
          <div className="flex items-center justify-center mb-4">
            <Building className="w-8 h-8 text-blue-500 mr-3" />
            <h3 className="text-2xl font-bold text-patriotWhite">
              Charity Directory Addition
            </h3>
          </div>
          <p className="text-textSecondary">
            Review the charity details and vote on directory inclusion
          </p>
        </motion.div>

        {/* Voting Power Display */}
        <motion.div
          className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4"
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.05 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Zap className="w-5 h-5 text-yellow-400 mr-2" />
              <span className="font-semibold text-patriotWhite">
                Your Voting Power:{' '}
                {isLoadingVotingPower ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  `${formatVotingPower(totalVotingPower)} VMF`
                )}
              </span>
            </div>
            <div className="flex items-center text-sm text-textSecondary">
              <Award className="w-4 h-4 mr-1" />
              {totalVotingPower > 0 ? 'Ready to Vote' : 'Lock tokens to vote'}
            </div>
          </div>
        </motion.div>

        {/* Charity Details */}
        <motion.div
          className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6"
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-2xl font-bold text-patriotWhite mb-2">
                {proposal.charityData.name}
              </h4>
              <div className="flex items-center gap-4 text-sm text-textSecondary">
                <span className="capitalize">
                  {proposal.charityData.category.replace('_', ' ')}
                </span>
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-1" />
                  EIN: {proposal.charityData.ein}
                </div>
              </div>
            </div>
            <div
              className={cn(
                'px-3 py-2 rounded-lg border',
                verificationStatus.bgColor
              )}
            >
              <div className="flex items-center gap-2">
                {verificationStatus.icon}
                <span
                  className={cn(
                    'text-sm font-medium',
                    verificationStatus.color
                  )}
                >
                  {verificationStatus.text}
                </span>
              </div>
            </div>
          </div>

          <p className="text-textBase mb-4 leading-relaxed">
            {proposal.charityData.description}
          </p>

          {proposal.charityData.website && (
            <div className="flex items-center text-blue-400 mb-4">
              <Globe className="w-4 h-4 mr-2" />
              <a
                href={proposal.charityData.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {proposal.charityData.website}
              </a>
              <ExternalLink className="w-3 h-3 ml-1" />
            </div>
          )}

          {proposal.charityData.address && (
            <div className="text-sm text-textSecondary">
              <strong>Address:</strong>{' '}
              {`${proposal.charityData.address.street}, ${proposal.charityData.address.city}, ${proposal.charityData.address.state} ${proposal.charityData.address.zipCode}`}
            </div>
          )}
        </motion.div>

        {/* Verification Documents */}
        {proposal.verificationDocuments &&
          proposal.verificationDocuments.length > 0 && (
            <motion.div
              variants={fadeInVariants}
              initial="initial"
              animate="enter"
              transition={{ delay: 0.2 }}
            >
              <h4 className="text-lg font-semibold text-patriotWhite mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Verification Documents ({proposal.verificationDocuments.length})
              </h4>
              <div className="grid gap-3">
                {proposal.verificationDocuments.map((docUrl, index) => (
                  <div
                    key={index}
                    className="bg-backgroundLight/50 border border-blue-500/30 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 mr-3 text-blue-400" />
                      <div>
                        <span className="font-medium text-patriotWhite">
                          Document {index + 1}
                        </span>
                        <p className="text-xs text-textSecondary">
                          Verification document for charity registration
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                      onClick={() => window.open(docUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        {/* Voting Rationale */}
        <motion.div
          className="bg-patriotBlue/10 border border-patriotBlue/30 rounded-lg p-4"
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.3 }}
        >
          <h4 className="font-semibold text-patriotWhite mb-3 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Voting Considerations
          </h4>
          <ul className="text-sm text-textSecondary space-y-2">
            <li>
              • Is this charity aligned with VMF's mission to support veterans?
            </li>
            <li>• Are the provided verification documents sufficient?</li>
            <li>• Does the charity have a good reputation and track record?</li>
            <li>• Will adding this charity benefit the VMF community?</li>
          </ul>
        </motion.div>

        {/* Voting Actions */}
        <motion.div
          className="space-y-3"
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.4 }}
        >
          <SimpleTooltip text="Vote to add this charity to the VMF directory">
            <Button
              onClick={() => handleVote('yes')}
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {isSubmitting
                ? 'Submitting...'
                : '✅ Vote Yes - Add to Directory'}
            </Button>
          </SimpleTooltip>

          <SimpleTooltip text="Vote against adding this charity to the directory">
            <Button
              onClick={() => handleVote('no')}
              disabled={isSubmitting}
              variant="secondary"
              className="w-full"
              size="lg"
            >
              {isSubmitting ? 'Submitting...' : '❌ Vote No - Reject Addition'}
            </Button>
          </SimpleTooltip>

          <SimpleTooltip text="Abstain from voting on this charity addition">
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
      </Card>
    </ProfileGuard>
  );
}
