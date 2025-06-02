import { useMemo } from 'react';
import { useProposalStore } from '@/stores/useProposalStore';
import { proposalSelectors } from '@/stores/selectors';

// Custom hook for optimized proposal store access
export const useProposalSelectors = () => {
  // Get the store instance
  const store = useProposalStore;

  // Memoized selectors to prevent unnecessary re-renders
  const selectors = useMemo(
    () => ({
      // Basic data selectors
      useProposals: () => store(proposalSelectors.proposals),
      useSelectedProposal: () => store(proposalSelectors.selectedProposal),
      useIsVoting: () => store(proposalSelectors.isVoting),
      useUserVotes: () => store(proposalSelectors.userVotes),

      // Filter selectors
      useFilters: () => store(proposalSelectors.filters),

      // Computed selectors
      useFilteredProposals: () => store(proposalSelectors.filteredProposals),
      useActiveProposals: () => store(proposalSelectors.activeProposals),

      // Type-specific selectors
      useHolidayProposals: () => store(proposalSelectors.holidayProposals),
      useCharityProposals: () => store(proposalSelectors.charityProposals),
      useFeatureProposals: () => store(proposalSelectors.featureProposals),

      // Action selectors
      useActions: () => store(proposalSelectors.actions),

      // Factory selectors
      useProposalById: (id: string) =>
        store(proposalSelectors.proposalById(id)),
      useUserVoteForProposal: (proposalId: string) =>
        store(proposalSelectors.userVoteForProposal(proposalId)),
    }),
    [store]
  );

  return selectors;
};

// Individual selector hooks for more granular usage
export const useProposals = () => useProposalStore(proposalSelectors.proposals);
export const useSelectedProposal = () =>
  useProposalStore(proposalSelectors.selectedProposal);
export const useIsVoting = () => useProposalStore(proposalSelectors.isVoting);
export const useUserVotes = () => useProposalStore(proposalSelectors.userVotes);
export const useFilters = () => useProposalStore(proposalSelectors.filters);
export const useFilteredProposals = () =>
  useProposalStore(proposalSelectors.filteredProposals);
export const useActiveProposals = () =>
  useProposalStore(proposalSelectors.activeProposals);
export const useHolidayProposals = () =>
  useProposalStore(proposalSelectors.holidayProposals);
export const useCharityProposals = () =>
  useProposalStore(proposalSelectors.charityProposals);
export const useFeatureProposals = () =>
  useProposalStore(proposalSelectors.featureProposals);
export const useProposalActions = () =>
  useProposalStore(proposalSelectors.actions);

// Factory hooks
export const useProposalById = (id: string) =>
  useProposalStore(proposalSelectors.proposalById(id));
export const useUserVoteForProposal = (proposalId: string) =>
  useProposalStore(proposalSelectors.userVoteForProposal(proposalId));
