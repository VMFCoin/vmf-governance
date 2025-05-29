'use client';

import { useState } from 'react';
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
import { mockProposals } from '@/data/mockData';
import { Proposal } from '@/types';

export default function ProposalDetailPage() {
  const params = useParams();
  const proposalId = params.id as string;
  const { showSuccess, showError, ToastContainer } = useToast();

  // Find the proposal
  const proposal = mockProposals.find(p => p.id === proposalId);

  // State for voting
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState<'yes' | 'no' | 'abstain' | null>(
    null
  );
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [selectedVote, setSelectedVote] = useState<
    'yes' | 'no' | 'abstain' | null
  >(null);

  if (!proposal) {
    return (
      <main className="min-h-screen bg-backgroundDark">
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

  const handleVote = async (vote: 'yes' | 'no' | 'abstain') => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setUserVote(vote);
      setHasVoted(true);

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

  const totalVotes =
    proposal.yesPercentage + proposal.noPercentage + proposal.abstainPercentage;
  const leadingVote =
    proposal.yesPercentage > proposal.noPercentage ? 'Yes' : 'No';
  const leadingPercentage = Math.max(
    proposal.yesPercentage,
    proposal.noPercentage
  );

  return (
    <main className="min-h-screen bg-backgroundDark">
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
                <p className="text-textBase leading-relaxed mb-4">
                  This proposal aims to support our veteran community through
                  targeted initiatives and funding allocation. The proposed
                  measures will directly impact veteran welfare and community
                  support systems.
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
                  families directly and create lasting positive change in the
                  veteran community through sustainable support systems.
                </p>
              </div>
            </Card>

            {/* Vote Results Visualization */}
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
            {/* Voting Section */}
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
                    <span className="capitalize font-medium">{userVote}</span>
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

            {/* Vote Results */}
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
                  <span className="text-textSecondary">Status</span>
                  <span className="text-patriotWhite capitalize">
                    {proposal.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textSecondary">Time Remaining</span>
                  <span className="text-patriotWhite">{proposal.timeLeft}</span>
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
      </div>

      {/* Vote Modal */}
      <VoteModal
        isOpen={showVoteModal}
        onClose={() => {
          setShowVoteModal(false);
          setSelectedVote(null);
        }}
        onVote={handleVote}
        proposalTitle={proposal.title}
        selectedVote={selectedVote}
      />

      <Footer />
    </main>
  );
}
