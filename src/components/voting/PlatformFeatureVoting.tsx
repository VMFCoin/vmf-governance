'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Code,
  Zap,
  Target,
  Lightbulb,
  Users,
  Clock,
  CheckSquare,
  AlertCircle,
  TrendingUp,
  FileText,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { SimpleTooltip } from '@/components/ui/AnimatedTooltip';
import { ProfileGuard } from '@/components/auth';
import { useProposalStore } from '@/stores/useProposalStore';
import { PlatformFeatureProposal } from '@/types';
import { cn } from '@/lib/utils';
import { fadeInVariants } from '@/lib/animations';

interface PlatformFeatureVotingProps {
  proposal: PlatformFeatureProposal;
  onVoteSubmitted?: () => void;
}

export function PlatformFeatureVoting({
  proposal,
  onVoteSubmitted,
}: PlatformFeatureVotingProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { submitVote } = useProposalStore();

  const handleVote = async (voteType: 'yes' | 'no' | 'abstain') => {
    setIsSubmitting(true);
    try {
      await submitVote(proposal.id, voteType, 1);
      onVoteSubmitted?.();
    } catch (error) {
      console.error('Failed to submit vote:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Zap className="w-5 h-5 text-red-500" />;
      case 'high':
        return <Target className="w-5 h-5 text-orange-500" />;
      case 'medium':
        return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      case 'low':
        return <Code className="w-5 h-5 text-blue-500" />;
      default:
        return <Code className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'high':
        return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      case 'medium':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'low':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      default:
        return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'high':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'medium':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'low':
        return 'bg-green-500/10 border-green-500/30 text-green-400';
      default:
        return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
    }
  };

  return (
    <ProfileGuard fallbackMessage="You need a profile to vote on platform feature proposals.">
      <Card className="p-6 space-y-6">
        <motion.div
          className="text-center"
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
        >
          <div className="flex items-center justify-center mb-4">
            <Code className="w-8 h-8 text-purple-500 mr-3" />
            <h3 className="text-2xl font-bold text-patriotWhite">
              Platform Feature Proposal
            </h3>
          </div>
          <p className="text-textSecondary">
            Review the feature specification and vote on implementation
          </p>
        </motion.div>

        {/* Feature Overview */}
        <motion.div
          className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6"
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h4 className="text-2xl font-bold text-patriotWhite mb-2">
                {proposal.featureSpecification.title}
              </h4>
              <p className="text-textBase leading-relaxed">
                {proposal.featureSpecification.description}
              </p>
            </div>
            <div className="flex flex-col gap-2 ml-4">
              <div
                className={cn(
                  'px-3 py-2 rounded-lg border flex items-center gap-2',
                  getPriorityColor(proposal.featureSpecification.priority)
                )}
              >
                {getPriorityIcon(proposal.featureSpecification.priority)}
                <span className="text-sm font-medium capitalize">
                  {proposal.featureSpecification.priority} Priority
                </span>
              </div>
              <div
                className={cn(
                  'px-3 py-2 rounded-lg border flex items-center gap-2',
                  getComplexityColor(proposal.implementationComplexity)
                )}
              >
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium capitalize">
                  {proposal.implementationComplexity} Complexity
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* User Story */}
        <motion.div
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.2 }}
        >
          <h4 className="text-lg font-semibold text-patriotWhite mb-3 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            User Story
          </h4>
          <div className="bg-backgroundLight/50 border border-purple-500/30 rounded-lg p-4">
            <p className="text-textBase italic">
              "{proposal.featureSpecification.userStory}"
            </p>
          </div>
        </motion.div>

        {/* Acceptance Criteria */}
        <motion.div
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.3 }}
        >
          <h4 className="text-lg font-semibold text-patriotWhite mb-3 flex items-center">
            <CheckSquare className="w-5 h-5 mr-2" />
            Acceptance Criteria
          </h4>
          <div className="bg-backgroundLight/50 border border-purple-500/30 rounded-lg p-4">
            <ul className="space-y-2">
              {proposal.featureSpecification.acceptanceCriteria.map(
                (criteria, index) => (
                  <li key={index} className="flex items-start text-textBase">
                    <span className="text-purple-400 mr-2 mt-1">•</span>
                    {criteria}
                  </li>
                )
              )}
            </ul>
          </div>
        </motion.div>

        {/* Technical Requirements */}
        <motion.div
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.4 }}
        >
          <h4 className="text-lg font-semibold text-patriotWhite mb-3 flex items-center">
            <Code className="w-5 h-5 mr-2" />
            Technical Requirements
          </h4>
          <div className="bg-backgroundLight/50 border border-purple-500/30 rounded-lg p-4">
            <p className="text-textBase">
              {proposal.featureSpecification.technicalRequirements}
            </p>
          </div>
        </motion.div>

        {/* Implementation Details */}
        <motion.div
          className="grid md:grid-cols-2 gap-4"
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.5 }}
        >
          <div className="bg-backgroundLight/50 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Clock className="w-4 h-4 mr-2 text-purple-400" />
              <span className="font-semibold text-patriotWhite">
                Development Time
              </span>
            </div>
            <p className="text-textSecondary">
              {proposal.estimatedDevelopmentTime}
            </p>
          </div>
          <div className="bg-backgroundLight/50 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <TrendingUp className="w-4 h-4 mr-2 text-purple-400" />
              <span className="font-semibold text-patriotWhite">
                Business Value
              </span>
            </div>
            <p className="text-textSecondary">
              {proposal.featureSpecification.businessValue}
            </p>
          </div>
        </motion.div>

        {/* Target Users */}
        <motion.div
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.6 }}
        >
          <h4 className="text-lg font-semibold text-patriotWhite mb-3 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Target Users
          </h4>
          <div className="flex flex-wrap gap-2">
            {proposal.featureSpecification.targetUsers.map((user, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm border border-purple-500/30"
              >
                {user}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Voting Rationale */}
        <motion.div
          className="bg-patriotBlue/10 border border-patriotBlue/30 rounded-lg p-4"
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.7 }}
        >
          <h4 className="font-semibold text-patriotWhite mb-3 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Voting Considerations
          </h4>
          <ul className="text-sm text-textSecondary space-y-2">
            <li>• Does this feature align with VMF's mission and goals?</li>
            <li>• Will this feature provide value to the veteran community?</li>
            <li>• Are the technical requirements feasible and well-defined?</li>
            <li>
              • Is the estimated development time reasonable for the complexity?
            </li>
            <li>• Does the business value justify the development effort?</li>
          </ul>
        </motion.div>

        {/* Voting Actions */}
        <motion.div
          className="space-y-3"
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          transition={{ delay: 0.8 }}
        >
          <SimpleTooltip text="Vote to approve this feature for development">
            <Button
              onClick={() => handleVote('yes')}
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {isSubmitting ? 'Submitting...' : '✅ Vote Yes - Approve Feature'}
            </Button>
          </SimpleTooltip>

          <SimpleTooltip text="Vote against implementing this feature">
            <Button
              onClick={() => handleVote('no')}
              disabled={isSubmitting}
              variant="secondary"
              className="w-full"
              size="lg"
            >
              {isSubmitting ? 'Submitting...' : '❌ Vote No - Reject Feature'}
            </Button>
          </SimpleTooltip>

          <SimpleTooltip text="Abstain from voting on this feature proposal">
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
