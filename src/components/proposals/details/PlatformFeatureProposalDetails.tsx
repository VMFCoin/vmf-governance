'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Users,
  Clock,
  FileText,
  CheckCircle,
  AlertTriangle,
  Code,
  Target,
  Lightbulb,
  Settings,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { SimpleTooltip } from '@/components/ui/AnimatedTooltip';
import { ProposalTypeIndicator } from '@/components/proposals/shared';
import { PlatformFeatureProposal } from '@/types';
import { fadeInVariants, slideUpVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface PlatformFeatureProposalDetailsProps {
  proposal: PlatformFeatureProposal;
  className?: string;
}

export const PlatformFeatureProposalDetails: React.FC<
  PlatformFeatureProposalDetailsProps
> = ({ proposal, className }) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
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
    const baseVotes = 1000;
    return Math.floor(
      (baseVotes *
        (proposal.yesPercentage +
          proposal.noPercentage +
          proposal.abstainPercentage)) /
        100
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'high':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'low':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'high':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'low':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <motion.div variants={fadeInVariants} initial="initial" animate="enter">
        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start">
              <div className="text-4xl mr-4">⚡</div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <ProposalTypeIndicator type="platform_feature" size="sm" />
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
                  <div
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium border',
                      getPriorityColor(proposal.featureSpecification.priority)
                    )}
                  >
                    {proposal.featureSpecification.priority.toUpperCase()}{' '}
                    PRIORITY
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
              <div className="text-lg font-bold text-starGold">
                Platform Feature
              </div>
              <p className="text-sm text-textSecondary">Proposal Type</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-backgroundLight/50 border border-patriotBlue/30 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Zap className="w-4 h-4 mr-2 text-patriotBlue" />
                <span className="font-semibold text-patriotWhite">
                  Feature Title
                </span>
              </div>
              <p className="text-textSecondary">
                {proposal.featureSpecification.title}
              </p>
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

      {/* Feature Specification */}
      <motion.div
        variants={slideUpVariants}
        initial="initial"
        animate="enter"
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6">
          <div className="flex items-center mb-6">
            <Lightbulb className="w-6 h-6 text-starGold mr-3" />
            <h2 className="text-xl font-bold text-patriotWhite">
              Feature Specification
            </h2>
          </div>

          <div className="bg-patriotBlue/10 border border-patriotBlue/30 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-patriotWhite mb-2">
              Description
            </h3>
            <p className="text-patriotWhite leading-relaxed">
              {proposal.featureSpecification.description}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-patriotWhite mb-3">
                User Story
              </h3>
              <div className="bg-starGold/10 border border-starGold/30 rounded-lg p-4">
                <p className="text-patriotWhite leading-relaxed">
                  {proposal.featureSpecification.userStory}
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-patriotWhite mb-3">
                Business Value
              </h3>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-patriotWhite leading-relaxed">
                  {proposal.featureSpecification.businessValue}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Technical Details */}
      <motion.div
        variants={slideUpVariants}
        initial="initial"
        animate="enter"
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6">
          <div className="flex items-center mb-6">
            <Code className="w-6 h-6 text-patriotBlue mr-3" />
            <h2 className="text-xl font-bold text-patriotWhite">
              Technical Details
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-patriotWhite mb-3">
                Implementation Complexity
              </h3>
              <div
                className={cn(
                  'px-4 py-3 rounded-lg border font-medium',
                  getComplexityColor(proposal.implementationComplexity)
                )}
              >
                {proposal.implementationComplexity.toUpperCase()} COMPLEXITY
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-patriotWhite mb-3">
                Estimated Development Time
              </h3>
              <div className="bg-backgroundLight/50 border border-patriotBlue/30 rounded-lg p-3">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-patriotBlue" />
                  <span className="text-patriotWhite font-medium">
                    {proposal.estimatedDevelopmentTime}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-patriotWhite mb-3">
              Technical Requirements
            </h3>
            <div className="bg-backgroundLight/50 border border-patriotBlue/30 rounded-lg p-4">
              <p className="text-patriotWhite leading-relaxed">
                {proposal.featureSpecification.technicalRequirements}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-patriotWhite mb-3">
                Estimated Effort
              </h3>
              <div className="bg-patriotRed/10 border border-patriotRed/30 rounded-lg p-4">
                <p className="text-patriotWhite">
                  {proposal.featureSpecification.estimatedEffort}
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-patriotWhite mb-3">
                Target Users
              </h3>
              <div className="space-y-2">
                {proposal.featureSpecification.targetUsers.map(
                  (user, index) => (
                    <div
                      key={index}
                      className="bg-starGold/10 border border-starGold/30 rounded-lg p-2"
                    >
                      <span className="text-patriotWhite text-sm">{user}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Acceptance Criteria */}
      <motion.div
        variants={slideUpVariants}
        initial="initial"
        animate="enter"
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <div className="flex items-center mb-6">
            <Target className="w-6 h-6 text-green-400 mr-3" />
            <h2 className="text-xl font-bold text-patriotWhite">
              Acceptance Criteria
            </h2>
          </div>

          <div className="space-y-3">
            {proposal.featureSpecification.acceptanceCriteria.map(
              (criteria, index) => (
                <motion.div
                  key={index}
                  className="flex items-start bg-green-500/10 border border-green-500/30 rounded-lg p-4"
                  variants={fadeInVariants}
                  initial="initial"
                  animate="enter"
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-patriotWhite leading-relaxed">
                    {criteria}
                  </p>
                </motion.div>
              )
            )}
          </div>
        </Card>
      </motion.div>

      {/* Design Mockups */}
      {proposal.featureSpecification.designMockups &&
        proposal.featureSpecification.designMockups.length > 0 && (
          <motion.div
            variants={slideUpVariants}
            initial="initial"
            animate="enter"
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <FileText className="w-6 h-6 text-patriotBlue mr-3" />
                <h2 className="text-xl font-bold text-patriotWhite">
                  Design Mockups
                </h2>
              </div>

              <div className="grid gap-4">
                {proposal.featureSpecification.designMockups.map(
                  (mockup, index) => (
                    <motion.div
                      key={index}
                      className="border border-patriotBlue/30 bg-patriotBlue/5 rounded-lg p-4"
                      variants={fadeInVariants}
                      initial="initial"
                      animate="enter"
                      transition={{ delay: 0.4 + index * 0.05 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-patriotBlue mr-3" />
                          <div>
                            <h4 className="font-semibold text-patriotWhite">
                              Design Mockup {index + 1}
                            </h4>
                            <p className="text-textSecondary text-sm">
                              {mockup.name || `mockup-${index + 1}.png`}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // In a real implementation, you'd handle file viewing
                            console.log('View mockup:', mockup);
                          }}
                        >
                          View Mockup
                        </Button>
                      </div>
                    </motion.div>
                  )
                )}
              </div>
            </Card>
          </motion.div>
        )}

      {/* Voting Section */}
      <motion.div
        variants={slideUpVariants}
        initial="initial"
        animate="enter"
        transition={{ delay: 0.5 }}
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

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {proposal.yesPercentage.toFixed(1)}%
              </div>
              <p className="text-textSecondary">Yes</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {proposal.noPercentage.toFixed(1)}%
              </div>
              <p className="text-textSecondary">No</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">
                {proposal.abstainPercentage.toFixed(1)}%
              </div>
              <p className="text-textSecondary">Abstain</p>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              variant="primary"
              className="bg-green-600 hover:bg-green-700"
            >
              Vote Yes
            </Button>
            <Button
              variant="secondary"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Vote No
            </Button>
            <Button variant="outline">Abstain</Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
