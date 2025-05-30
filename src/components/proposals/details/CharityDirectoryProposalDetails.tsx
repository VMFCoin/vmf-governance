'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Users,
  Clock,
  FileText,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Award,
  Phone,
  Mail,
  Globe,
  Building,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { SimpleTooltip } from '@/components/ui/AnimatedTooltip';
import { ProposalTypeIndicator } from '@/components/proposals/shared';
import { CharityDirectoryProposal } from '@/types';
import { fadeInVariants, slideUpVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface CharityDirectoryProposalDetailsProps {
  proposal: CharityDirectoryProposal;
  className?: string;
}

export const CharityDirectoryProposalDetails: React.FC<
  CharityDirectoryProposalDetailsProps
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'veterans':
        return '🎖️';
      case 'military_families':
        return '👨‍👩‍👧‍👦';
      case 'disabled_veterans':
        return '♿';
      case 'mental_health':
        return '🧠';
      case 'general_support':
        return '🤝';
      default:
        return '❤️';
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <motion.div variants={fadeInVariants} initial="initial" animate="enter">
        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start">
              <div className="text-4xl mr-4">
                {getCategoryIcon(proposal.charityData.category)}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <ProposalTypeIndicator type="charity_directory" size="sm" />
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
              <div className="text-lg font-bold text-starGold">
                Directory Addition
              </div>
              <p className="text-sm text-textSecondary">Proposal Type</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-backgroundLight/50 border border-patriotBlue/30 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Heart className="w-4 h-4 mr-2 text-patriotRed" />
                <span className="font-semibold text-patriotWhite">
                  Charity Name
                </span>
              </div>
              <p className="text-textSecondary">{proposal.charityData.name}</p>
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

      {/* Charity Information */}
      <motion.div
        variants={slideUpVariants}
        initial="initial"
        animate="enter"
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6">
          <div className="flex items-center mb-6">
            <Heart className="w-6 h-6 text-patriotRed mr-3" />
            <h2 className="text-xl font-bold text-patriotWhite">
              Charity Information
            </h2>
          </div>

          <div className="bg-patriotBlue/10 border border-patriotBlue/30 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-patriotWhite mb-2">
              Mission Statement
            </h3>
            <p className="text-patriotWhite leading-relaxed">
              {proposal.charityData.missionStatement}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-patriotWhite mb-3">
                Basic Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Building className="w-4 h-4 mr-2 text-patriotBlue" />
                  <span className="text-textSecondary mr-2">Name:</span>
                  <span className="text-patriotWhite">
                    {proposal.charityData.name}
                  </span>
                </div>
                <div className="flex items-center">
                  <Award className="w-4 h-4 mr-2 text-starGold" />
                  <span className="text-textSecondary mr-2">Category:</span>
                  <span className="text-patriotWhite">
                    {getCategoryLabel(proposal.charityData.category)}
                  </span>
                </div>
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-green-400" />
                  <span className="text-textSecondary mr-2">EIN:</span>
                  <span className="text-patriotWhite">
                    {proposal.charityData.ein}
                  </span>
                </div>
                <div className="flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-patriotBlue" />
                  <span className="text-textSecondary mr-2">Website:</span>
                  <a
                    href={proposal.charityData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-patriotBlue hover:text-starGold transition-colors"
                  >
                    {proposal.charityData.website}
                  </a>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-patriotWhite mb-3">
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-patriotRed" />
                  <span className="text-textSecondary mr-2">Email:</span>
                  <a
                    href={`mailto:${proposal.charityData.contactEmail}`}
                    className="text-patriotBlue hover:text-starGold transition-colors"
                  >
                    {proposal.charityData.contactEmail}
                  </a>
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-starGold" />
                  <span className="text-textSecondary mr-2">Phone:</span>
                  <span className="text-patriotWhite">
                    {proposal.charityData.contactPhone}
                  </span>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-4 h-4 mr-2 text-green-400 mt-1" />
                  <div>
                    <span className="text-textSecondary">Address:</span>
                    <div className="text-patriotWhite">
                      <div>{proposal.charityData.address.street}</div>
                      <div>
                        {proposal.charityData.address.city},{' '}
                        {proposal.charityData.address.state}{' '}
                        {proposal.charityData.address.zipCode}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Veteran Focus & Impact */}
      <motion.div
        variants={slideUpVariants}
        initial="initial"
        animate="enter"
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6">
          <div className="flex items-center mb-6">
            <Award className="w-6 h-6 text-starGold mr-3" />
            <h2 className="text-xl font-bold text-patriotWhite">
              Veteran Focus & Impact
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-patriotWhite mb-3">
                Veteran Focus
              </h3>
              <div className="bg-patriotBlue/10 border border-patriotBlue/30 rounded-lg p-4">
                <p className="text-patriotWhite leading-relaxed">
                  {proposal.charityData.veteranFocus}
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-patriotWhite mb-3">
                Impact Description
              </h3>
              <div className="bg-starGold/10 border border-starGold/30 rounded-lg p-4">
                <p className="text-patriotWhite leading-relaxed">
                  {proposal.charityData.impactDescription}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Verification Documents */}
      <motion.div
        variants={slideUpVariants}
        initial="initial"
        animate="enter"
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <div className="flex items-center mb-6">
            <FileText className="w-6 h-6 text-green-400 mr-3" />
            <h2 className="text-xl font-bold text-patriotWhite">
              Verification Documents
            </h2>
          </div>

          {proposal.verificationDocuments.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4 opacity-50" />
              <p className="text-textSecondary">
                No verification documents provided
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {proposal.verificationDocuments.map((docUrl, index) => (
                <motion.div
                  key={index}
                  className="border border-patriotBlue/30 bg-patriotBlue/5 rounded-lg p-4"
                  variants={fadeInVariants}
                  initial="initial"
                  animate="enter"
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-green-400 mr-3" />
                      <div>
                        <h4 className="font-semibold text-patriotWhite">
                          Document {index + 1}
                        </h4>
                        <p className="text-textSecondary text-sm">
                          Verification document
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(docUrl, '_blank')}
                    >
                      View Document
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Voting Section */}
      <motion.div
        variants={slideUpVariants}
        initial="initial"
        animate="enter"
        transition={{ delay: 0.4 }}
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
