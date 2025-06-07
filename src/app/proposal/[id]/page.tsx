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
      <main className="min-h-screen landing-page-flag">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center py-12">
            <h1 className="text-2xl font-bold text-patriotWhite mb-4">
              Proposal Not Found
            </h1>
            <p className="text-textSecondary mb-6">
              The proposal you're looking for doesn't exist.
            </p>
            <Button asChild>
              <Link href="/vote">Back to Proposals</Link>
            </Button>
          </Card>
        </div>
        <Footer />
      </main>
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
    <main className="min-h-screen landing-page-flag">
      <Header />
      <ToastContainer />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Link
          href="/vote"
          className="inline-flex items-center text-patriotRed hover:text-red-400 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Proposals
        </Link>

        {/* Holiday Charity Proposal Layout */}
        {isHolidayCharityProposal ? (
          <div className="space-y-6">
            {/* Compact Hero Section for Holiday Charity */}
            <div className="relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-patriotRed/5 via-patriotBlue/5 to-starGold/5" />

              <Card className="relative bg-white/5 backdrop-blur-sm border-white/10 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(proposal.status)}
                    <span
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(proposal.status)}`}
                    >
                      {proposal.status.charAt(0).toUpperCase() +
                        proposal.status.slice(1)}
                    </span>
                    <div className="px-3 py-1 bg-starGold/20 text-starGold rounded-lg text-sm font-medium border border-starGold/30">
                      Holiday Charity
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400 mb-1">
                      Proposal #{proposal.id}
                    </p>
                    <div className="flex items-center space-x-2 text-patriotRed font-medium">
                      <Clock className="w-4 h-4" />
                      <span>{proposal.timeLeft}</span>
                    </div>
                  </div>
                </div>

                <h1 className="text-3xl font-display font-bold text-white mb-3 tracking-tight">
                  {proposal.title}
                </h1>

                <div className="flex items-center space-x-6 mb-4">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-starGold" />
                    <span className="text-gray-300 text-sm">
                      Proposed by {proposal.author}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-starGold">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold text-sm">
                      $
                      {(
                        proposal as HolidayCharityProposal
                      ).fundAmount.toLocaleString()}{' '}
                      Fund
                    </span>
                  </div>
                </div>

                <p className="text-gray-300 leading-relaxed text-sm max-w-4xl">
                  {proposal.description ||
                    'Vote for which charity should receive funding for this holiday celebration. Your vote helps determine how community funds are allocated to support veteran-focused organizations.'}
                </p>
              </Card>
            </div>

            {/* Holiday Charity Voting Component */}
            <HolidayCharityVoting
              proposal={proposal as HolidayCharityProposal}
              onVoteSubmitted={() => {
                console.log('Holiday charity vote submitted');
              }}
            />

            {/* Compact Additional Information */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Proposal Details */}
              <Card className="p-6 rounded-xl bg-white/5 border-white/10">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <div className="w-8 h-8 bg-patriotBlue/20 rounded-lg flex items-center justify-center mr-3">
                    <AlertCircle className="w-4 h-4 text-patriotBlue" />
                  </div>
                  How It Works
                </h2>
                <div className="space-y-3 text-gray-300 text-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-starGold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-starGold text-xs font-bold">1</span>
                    </div>
                    <p>
                      Community members vote for their preferred charity from
                      verified organizations
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-starGold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-starGold text-xs font-bold">2</span>
                    </div>
                    <p>Voting power is determined by locked VMF tokens</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-starGold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-starGold text-xs font-bold">3</span>
                    </div>
                    <p>
                      The charity with the most votes receives the full fund
                      allocation
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-starGold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-starGold text-xs font-bold">4</span>
                    </div>
                    <p>
                      Funds are distributed transparently with full community
                      oversight
                    </p>
                  </div>
                </div>
              </Card>

              {/* Proposal Stats */}
              <Card className="p-6 rounded-xl bg-white/5 border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                    <Users className="w-4 h-4 text-green-400" />
                  </div>
                  Proposal Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-400 text-sm">Type</span>
                    <span className="text-white font-medium text-sm">
                      Holiday Charity
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-400 text-sm">Status</span>
                    <span className="text-white font-medium text-sm capitalize">
                      {proposal.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-400 text-sm">
                      Time Remaining
                    </span>
                    <span className="text-white font-medium text-sm">
                      {proposal.timeLeft}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-400 text-sm">Fund Amount</span>
                    <span className="text-starGold font-bold text-sm">
                      $
                      {(
                        proposal as HolidayCharityProposal
                      ).fundAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-400 text-sm">
                      Available Charities
                    </span>
                    <span className="text-white font-medium text-sm">
                      {
                        (proposal as HolidayCharityProposal).availableCharities
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400 text-sm">Total Votes</span>
                    <span className="text-white font-medium text-sm">
                      {(proposal as HolidayCharityProposal).totalVotes}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          // Standard proposal layout for non-holiday charity proposals
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Proposal Header */}
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(proposal.status)}
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(proposal.status)}`}
                    >
                      {proposal.status.charAt(0).toUpperCase() +
                        proposal.status.slice(1)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-textSecondary">
                      Proposal #{proposal.id}
                    </p>
                    <p className="text-sm text-patriotRed font-medium">
                      {proposal.timeLeft}
                    </p>
                  </div>
                </div>

                <h1 className="text-3xl font-display font-bold text-patriotWhite mb-4">
                  {proposal.title}
                </h1>

                <div className="flex items-center mb-6">
                  <Star className="w-4 h-4 text-starGold mr-2" />
                  <span className="text-textSecondary">
                    Proposed by {proposal.author}
                  </span>
                </div>

                <p className="text-textBase leading-relaxed">
                  {proposal.description ||
                    'No description provided for this proposal.'}
                </p>
              </Card>

              {/* Detailed Description */}
              <Card>
                <h2 className="text-xl font-semibold text-patriotWhite mb-4">
                  Proposal Details
                </h2>
                <div className="prose prose-invert max-w-none">
                  {/* Standard proposal details */}
                  <div>
                    <p className="text-textBase leading-relaxed mb-4">
                      This proposal aims to support our veteran community
                      through targeted initiatives and funding allocation. The
                      proposed measures will directly impact veteran welfare and
                      community support systems.
                    </p>
                    <h3 className="text-lg font-semibold text-patriotWhite mb-2">
                      Key Points:
                    </h3>
                    <ul className="text-textBase space-y-2">
                      <li>• Direct financial support for veteran families</li>
                      <li>• Community outreach and engagement programs</li>
                      <li>• Long-term sustainability and impact measurement</li>
                      <li>• Transparent fund allocation and reporting</li>
                    </ul>
                    <h3 className="text-lg font-semibold text-patriotWhite mb-2 mt-6">
                      Expected Impact:
                    </h3>
                    <p className="text-textBase">
                      This initiative is expected to benefit over 1,000 veteran
                      families directly and create lasting positive change in
                      the veteran community through sustainable support systems.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Vote Results Visualization - Only for binary voting */}
              <Card>
                <h2 className="text-xl font-semibold text-patriotWhite mb-6">
                  Vote Results Visualization
                </h2>
                <div className="flex justify-center">
                  <VoteChart
                    yesPercentage={proposal.yesPercentage}
                    noPercentage={proposal.noPercentage}
                    abstainPercentage={proposal.abstainPercentage}
                    size="lg"
                  />
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Binary voting for other proposal types */}
              <Card>
                <h3 className="text-xl font-semibold text-patriotWhite mb-4">
                  Cast Your Vote
                </h3>

                {hasVoted ? (
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-patriotWhite font-medium mb-2">
                      Vote Submitted!
                    </p>
                    <p className="text-textSecondary text-sm mb-4">
                      You voted:{' '}
                      <span className="capitalize font-medium">
                        {userVote?.vote}
                      </span>
                    </p>
                    <p className="text-xs text-textSecondary">
                      Your vote has been recorded and cannot be changed.
                    </p>
                  </div>
                ) : proposal.status === 'active' ? (
                  <div className="space-y-3">
                    <Button
                      onClick={() => openVoteModal('yes')}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Vote Yes
                    </Button>
                    <Button
                      onClick={() => openVoteModal('no')}
                      variant="secondary"
                      className="w-full"
                    >
                      Vote No
                    </Button>
                    <Button
                      onClick={() => openVoteModal('abstain')}
                      variant="secondary"
                      className="w-full bg-gray-600 hover:bg-gray-700"
                    >
                      Abstain
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-textSecondary">
                      Voting is not available for this proposal
                    </p>
                  </div>
                )}
              </Card>

              {/* Vote Results - Only for binary voting */}
              <Card>
                <h3 className="text-xl font-semibold text-patriotWhite mb-4">
                  Current Results
                </h3>

                <div className="text-center mb-6">
                  <VotingPower
                    percentage={leadingPercentage}
                    size="md"
                    label={`${leadingVote} Leading`}
                  />
                </div>

                <div className="space-y-4">
                  {/* Yes Votes */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-green-400">Yes</span>
                      <span className="text-patriotWhite">
                        {proposal.yesPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-backgroundDark rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${proposal.yesPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* No Votes */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-red-400">No</span>
                      <span className="text-patriotWhite">
                        {proposal.noPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-backgroundDark rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${proposal.noPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Abstain Votes */}
                  {proposal.abstainPercentage > 0 && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Abstain</span>
                        <span className="text-patriotWhite">
                          {proposal.abstainPercentage}%
                        </span>
                      </div>
                      <div className="w-full bg-backgroundDark rounded-full h-2">
                        <div
                          className="bg-gray-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${proposal.abstainPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-patriotBlue/30">
                  <div className="flex items-center justify-between text-sm text-textSecondary">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      <span>Total Participation</span>
                    </div>
                    <span>{totalVotes}%</span>
                  </div>
                </div>
              </Card>

              {/* Proposal Stats */}
              <Card>
                <h3 className="text-xl font-semibold text-patriotWhite mb-4">
                  Proposal Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-textSecondary">Type</span>
                    <span className="text-patriotWhite capitalize">
                      {proposal.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textSecondary">Status</span>
                    <span className="text-patriotWhite capitalize">
                      {proposal.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textSecondary">Time Remaining</span>
                    <span className="text-patriotWhite">
                      {proposal.timeLeft}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textSecondary">Proposed By</span>
                    <span className="text-patriotWhite">{proposal.author}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textSecondary">Proposal ID</span>
                    <span className="text-patriotWhite">#{proposal.id}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Vote Modal - Only for binary voting */}
      {!isHolidayCharityProposal && (
        <VoteModal
          isOpen={showVoteModal}
          onClose={() => {
            setShowVoteModal(false);
            setSelectedVote(null);
          }}
          onVote={handleBinaryVote}
          proposalTitle={proposal.title}
          selectedVote={selectedVote}
        />
      )}

      <Footer />
    </main>
  );
}
