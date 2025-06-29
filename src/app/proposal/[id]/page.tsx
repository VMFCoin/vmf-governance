'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Star,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import {
  Header,
  Footer,
  Button,
  Card,
  VotingPower,
  VoteModal,
  VoteChart,
  useToast,
} from '@/components';
import { HolidayCharityVoting } from '@/components/voting/HolidayCharityVoting';
import { useProposalStore } from '@/stores/useProposalStore';
import { Proposal, HolidayCharityProposal } from '@/types';
import { cn } from '@/lib/utils';

export default function ProposalDetailPage() {
  const params = useParams();
  const proposalId = params.id as string;
  const { showSuccess, showError, ToastContainer } = useToast();

  // Use proposal store instead of mock data
  const { getProposalById, submitVote, getUserVote } = useProposalStore();
  const proposal = getProposalById(proposalId);
  const userVote = getUserVote(proposalId);

  // State for voting (only for binary voting)
  const [hasVoted, setHasVoted] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [selectedVote, setSelectedVote] = useState<
    'yes' | 'no' | 'abstain' | null
  >(null);

  // Update hasVoted state when userVote changes
  useEffect(() => {
    setHasVoted(!!userVote);
  }, [userVote]);

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center py-12 sm:py-16">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-4">
              Proposal Not Found
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mb-6 sm:mb-8">
              The proposal you're looking for doesn't exist or has been removed.
            </p>
            <Link
              href="/vote"
              className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-medium rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Proposals
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Handle binary voting (for non-holiday charity proposals)
  const handleBinaryVote = async (vote: 'yes' | 'no' | 'abstain') => {
    try {
      // Use the proposal store's submitVote method
      await submitVote(proposalId, vote, 100); // Using 100 as default voting power

      showSuccess(
        'Vote Submitted Successfully!',
        `Your ${vote} vote has been recorded for "${proposal.title}"`
      );
    } catch (error) {
      showError(
        'Voting Failed',
        'There was an error submitting your vote. Please try again.'
      );
      throw error;
    }
  };

  const openVoteModal = (vote: 'yes' | 'no' | 'abstain') => {
    setSelectedVote(vote);
    setShowVoteModal(true);
  };

  const getStatusIcon = (status: Proposal['status']) => {
    switch (status) {
      case 'active':
        return <Clock className="w-5 h-5 text-patriotRed" />;
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: Proposal['status']) => {
    switch (status) {
      case 'active':
        return 'bg-patriotRed text-patriotWhite';
      case 'passed':
        return 'bg-green-600 text-white';
      case 'failed':
        return 'bg-gray-600 text-white';
      case 'pending':
        return 'bg-yellow-600 text-white';
    }
  };

  // Check if this is a holiday charity proposal
  const isHolidayCharityProposal = proposal.type === 'holiday_charity';

  // For binary voting proposals, calculate totals
  const totalVotes = !isHolidayCharityProposal
    ? proposal.yesPercentage +
      proposal.noPercentage +
      proposal.abstainPercentage
    : 0;
  const leadingVote =
    !isHolidayCharityProposal && proposal.yesPercentage > proposal.noPercentage
      ? 'Yes'
      : 'No';
  const leadingPercentage = !isHolidayCharityProposal
    ? Math.max(proposal.yesPercentage, proposal.noPercentage)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Breadcrumb - Responsive */}
        <div className="mb-6 sm:mb-8">
          <Link
            href="/vote"
            className="inline-flex items-center text-sm sm:text-base text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Proposals
          </Link>
        </div>

        {/* Holiday Charity Proposals - Fully Responsive */}
        {isHolidayCharityProposal ? (
          <div className="space-y-6 sm:space-y-8">
            {/* Main Proposal Card - Responsive */}
            <Card className="p-4 sm:p-6 lg:p-8 bg-slate-800/50 border-slate-700">
              <div className="space-y-4 sm:space-y-6">
                {/* Status Badge - Responsive */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div
                    className={cn(
                      'inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium',
                      proposal.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : proposal.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-slate-100 text-slate-800'
                    )}
                  >
                    {proposal.status}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400">
                    Proposal ID: {proposal.id}
                  </div>
                </div>

                {/* Title and Author - Responsive */}
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3">
                    {proposal.title}
                  </h1>
                  <p className="text-sm sm:text-base text-slate-400">
                    Proposed by{' '}
                    <span className="text-white font-medium">
                      {proposal.author}
                    </span>
                  </p>
                </div>

                {/* Fund Amount - Responsive */}
                <div className="bg-slate-700/30 rounded-lg p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-slate-400 mb-1">
                    Total Fund Amount
                  </div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-400">
                    $
                    {(
                      proposal as HolidayCharityProposal
                    ).fundAmount.toLocaleString()}
                  </div>
                </div>

                {/* Description - Responsive */}
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">
                    Description
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    {proposal.description ||
                      'Vote for which charity should receive funding for this holiday celebration. Your vote helps determine how community funds are allocated to support veteran-focused organizations.'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Holiday Charity Voting Component - Already responsive */}
            <HolidayCharityVoting
              proposal={proposal as HolidayCharityProposal}
            />

            {/* How It Works Section - Responsive */}
            <Card className="p-4 sm:p-6 lg:p-8 bg-slate-800/50 border-slate-700">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
                How Holiday Charity Voting Works
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm sm:text-base mb-1">
                      Community Voting
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-400">
                      Community members vote for their preferred charity from
                      the curated list of veteran-focused organizations.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm sm:text-base mb-1">
                      Voting Power
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-400">
                      Your voting power is determined by the amount of VMF
                      tokens you have locked in the governance system.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm sm:text-base mb-1">
                      Fund Distribution
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-400">
                      The charity with the most votes receives the allocated
                      funds to support veterans in need.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Proposal Stats - Responsive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
              <Card className="p-3 sm:p-4 bg-slate-800/50 border-slate-700">
                <div className="text-xs sm:text-sm text-slate-400 mb-1">
                  Type
                </div>
                <div className="text-sm sm:text-base font-semibold text-white">
                  Holiday Charity
                </div>
              </Card>
              <Card className="p-3 sm:p-4 bg-slate-800/50 border-slate-700">
                <div className="text-xs sm:text-sm text-slate-400 mb-1">
                  Status
                </div>
                <div className="text-sm sm:text-base font-semibold text-white">
                  {proposal.status}
                </div>
              </Card>
              <Card className="p-3 sm:p-4 bg-slate-800/50 border-slate-700">
                <div className="text-xs sm:text-sm text-slate-400 mb-1">
                  Time Remaining
                </div>
                <div className="text-sm sm:text-base font-semibold text-white">
                  {proposal.timeLeft}
                </div>
              </Card>
              <Card className="p-3 sm:p-4 bg-slate-800/50 border-slate-700">
                <div className="text-xs sm:text-sm text-slate-400 mb-1">
                  Fund Amount
                </div>
                <div className="text-sm sm:text-base font-semibold text-green-400">
                  $
                  {(
                    proposal as HolidayCharityProposal
                  ).fundAmount.toLocaleString()}
                </div>
              </Card>
              <Card className="p-3 sm:p-4 bg-slate-800/50 border-slate-700">
                <div className="text-xs sm:text-sm text-slate-400 mb-1">
                  Available Charities
                </div>
                <div className="text-sm sm:text-base font-semibold text-white">
                  {
                    (proposal as HolidayCharityProposal).availableCharities
                      .length
                  }
                </div>
              </Card>
              <Card className="p-3 sm:p-4 bg-slate-800/50 border-slate-700">
                <div className="text-xs sm:text-sm text-slate-400 mb-1">
                  Total Votes
                </div>
                <div className="text-sm sm:text-base font-semibold text-white">
                  {(proposal as HolidayCharityProposal).totalVotes}
                </div>
              </Card>
            </div>
          </div>
        ) : (
          /* Standard Proposals - Responsive */
          <div className="space-y-6 sm:space-y-8">
            <Card className="p-4 sm:p-6 lg:p-8 bg-slate-800/50 border-slate-700">
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div
                    className={cn(
                      'inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium',
                      proposal.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : proposal.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-slate-100 text-slate-800'
                    )}
                  >
                    {proposal.status}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400">
                    Proposal ID: {proposal.id}
                  </div>
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3">
                    {proposal.title}
                  </h1>
                  <p className="text-sm sm:text-base text-slate-400">
                    Proposed by{' '}
                    <span className="text-white font-medium">
                      {proposal.author}
                    </span>
                  </p>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">
                    Description
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    {proposal.description ||
                      'No description provided for this proposal.'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Standard Proposal Stats - Responsive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <Card className="p-3 sm:p-4 bg-slate-800/50 border-slate-700">
                <div className="text-xs sm:text-sm text-slate-400 mb-1">
                  Type
                </div>
                <div className="text-sm sm:text-base font-semibold text-white">
                  {proposal.type}
                </div>
              </Card>
              <Card className="p-3 sm:p-4 bg-slate-800/50 border-slate-700">
                <div className="text-xs sm:text-sm text-slate-400 mb-1">
                  Status
                </div>
                <div className="text-sm sm:text-base font-semibold text-white">
                  {proposal.status}
                </div>
              </Card>
              <Card className="p-3 sm:p-4 bg-slate-800/50 border-slate-700">
                <div className="text-xs sm:text-sm text-slate-400 mb-1">
                  Votes For
                </div>
                <div className="text-sm sm:text-base font-semibold text-green-400">
                  {proposal.yesPercentage}%
                </div>
              </Card>
              <Card className="p-3 sm:p-4 bg-slate-800/50 border-slate-700">
                <div className="text-xs sm:text-sm text-slate-400 mb-1">
                  Votes Against
                </div>
                <div className="text-sm sm:text-base font-semibold text-red-400">
                  {proposal.noPercentage}%
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
