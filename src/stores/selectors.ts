import { ProposalState } from './useProposalStore';

// Optimized selectors to prevent unnecessary re-renders
export const proposalSelectors = {
  // Basic data selectors
  proposals: (state: ProposalState) => state.proposals,
  selectedProposal: (state: ProposalState) => state.selectedProposal,
  isVoting: (state: ProposalState) => state.isVoting,
  userVotes: (state: ProposalState) => state.userVotes,

  // Filter selectors
  filters: (state: ProposalState) => ({
    statusFilter: state.statusFilter,
    typeFilter: state.typeFilter,
    searchQuery: state.searchQuery,
    sortBy: state.sortBy,
  }),

  // Computed selectors
  filteredProposals: (state: ProposalState) => state.getFilteredProposals(),
  activeProposals: (state: ProposalState) =>
    state.proposals.filter(p => p.status === 'active'),

  // Type-specific selectors
  holidayProposals: (state: ProposalState) => state.getActiveHolidayProposals(),
  charityProposals: (state: ProposalState) =>
    state.getActiveCharityDirectoryProposals(),
  featureProposals: (state: ProposalState) =>
    state.getActivePlatformFeatureProposals(),

  // Action selectors
  actions: (state: ProposalState) => ({
    setProposals: state.setProposals,
    addProposal: state.addProposal,
    updateProposal: state.updateProposal,
    setSelectedProposal: state.setSelectedProposal,
    submitVote: state.submitVote,
    getUserVote: state.getUserVote,
    setStatusFilter: state.setStatusFilter,
    setTypeFilter: state.setTypeFilter,
    setSearchQuery: state.setSearchQuery,
    setSortBy: state.setSortBy,
  }),

  // Specific proposal selector factory
  proposalById: (id: string) => (state: ProposalState) =>
    state.getProposalById(id),

  // User vote selector factory
  userVoteForProposal: (proposalId: string) => (state: ProposalState) =>
    state.getUserVote(proposalId),
};
