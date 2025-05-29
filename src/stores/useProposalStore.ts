'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Proposal, VoteRecord } from '@/types';
import { mockProposals } from '@/data/mockData';

export interface ProposalState {
  // Data
  proposals: Proposal[];
  userVotes: VoteRecord[];

  // UI State
  selectedProposal: Proposal | null;
  isVoting: boolean;

  // Filters
  statusFilter: 'all' | 'active' | 'passed' | 'failed' | 'pending';
  searchQuery: string;
  sortBy: 'newest' | 'oldest' | 'most_votes' | 'time_remaining';

  // Actions
  setProposals: (proposals: Proposal[]) => void;
  addProposal: (proposal: Proposal) => void;
  updateProposal: (id: string, updates: Partial<Proposal>) => void;
  setSelectedProposal: (proposal: Proposal | null) => void;

  // Voting actions
  submitVote: (
    proposalId: string,
    vote: 'yes' | 'no' | 'abstain',
    votingPower: number
  ) => Promise<void>;
  getUserVote: (proposalId: string) => VoteRecord | null;

  // Filter actions
  setStatusFilter: (
    filter: 'all' | 'active' | 'passed' | 'failed' | 'pending'
  ) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (
    sort: 'newest' | 'oldest' | 'most_votes' | 'time_remaining'
  ) => void;

  // Computed getters
  getFilteredProposals: () => Proposal[];
  getProposalById: (id: string) => Proposal | undefined;
}

export const useProposalStore = create<ProposalState>()(
  persist(
    (set, get) => ({
      // Initial state
      proposals: mockProposals,
      userVotes: [],
      selectedProposal: null,
      isVoting: false,
      statusFilter: 'all',
      searchQuery: '',
      sortBy: 'newest',

      // Actions
      setProposals: proposals => set({ proposals }),

      addProposal: proposal => {
        set(state => ({
          proposals: [proposal, ...state.proposals],
        }));
      },

      updateProposal: (id, updates) => {
        set(state => ({
          proposals: state.proposals.map(p =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      setSelectedProposal: proposal => set({ selectedProposal: proposal }),

      // Voting actions
      submitVote: async (proposalId, vote, votingPower) => {
        set({ isVoting: true });

        try {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 1000));

          const voteRecord: VoteRecord = {
            proposalId,
            userId: 'current-user', // In real app, get from wallet
            vote,
            timestamp: new Date(),
            votingPower,
          };

          // Add vote record
          set(state => ({
            userVotes: [
              ...state.userVotes.filter(v => v.proposalId !== proposalId),
              voteRecord,
            ],
          }));

          // Update proposal vote percentages (optimistic update)
          const proposal = get().getProposalById(proposalId);
          if (proposal) {
            const totalVotes =
              proposal.yesPercentage +
              proposal.noPercentage +
              proposal.abstainPercentage;
            const newTotal = totalVotes + votingPower;

            let updates: Partial<Proposal> = {};

            if (vote === 'yes') {
              updates.yesPercentage = Math.round(
                (((proposal.yesPercentage * totalVotes) / 100 + votingPower) /
                  newTotal) *
                  100
              );
            } else if (vote === 'no') {
              updates.noPercentage = Math.round(
                (((proposal.noPercentage * totalVotes) / 100 + votingPower) /
                  newTotal) *
                  100
              );
            } else {
              updates.abstainPercentage = Math.round(
                (((proposal.abstainPercentage * totalVotes) / 100 +
                  votingPower) /
                  newTotal) *
                  100
              );
            }

            // Normalize percentages to 100%
            const remaining =
              100 -
              (updates.yesPercentage || proposal.yesPercentage) -
              (updates.noPercentage || proposal.noPercentage) -
              (updates.abstainPercentage || proposal.abstainPercentage);

            if (vote === 'yes') {
              updates.noPercentage =
                proposal.noPercentage + Math.floor(remaining / 2);
              updates.abstainPercentage =
                proposal.abstainPercentage + Math.ceil(remaining / 2);
            } else if (vote === 'no') {
              updates.yesPercentage =
                proposal.yesPercentage + Math.floor(remaining / 2);
              updates.abstainPercentage =
                proposal.abstainPercentage + Math.ceil(remaining / 2);
            } else {
              updates.yesPercentage =
                proposal.yesPercentage + Math.floor(remaining / 2);
              updates.noPercentage =
                proposal.noPercentage + Math.ceil(remaining / 2);
            }

            get().updateProposal(proposalId, updates);
          }
        } finally {
          set({ isVoting: false });
        }
      },

      getUserVote: proposalId => {
        return get().userVotes.find(v => v.proposalId === proposalId) || null;
      },

      // Filter actions
      setStatusFilter: filter => set({ statusFilter: filter }),
      setSearchQuery: query => set({ searchQuery: query }),
      setSortBy: sort => set({ sortBy: sort }),

      // Computed getters
      getFilteredProposals: () => {
        const { proposals, statusFilter, searchQuery, sortBy } = get();

        let filtered = proposals;

        // Filter by status
        if (statusFilter !== 'all') {
          filtered = filtered.filter(p => p.status === statusFilter);
        }

        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(
            p =>
              p.title.toLowerCase().includes(query) ||
              p.author.toLowerCase().includes(query) ||
              (p.description && p.description.toLowerCase().includes(query))
          );
        }

        // Sort
        filtered.sort((a, b) => {
          switch (sortBy) {
            case 'newest':
              return parseInt(b.id) - parseInt(a.id); // Assuming ID is chronological
            case 'oldest':
              return parseInt(a.id) - parseInt(b.id);
            case 'most_votes':
              return (
                b.yesPercentage +
                b.noPercentage +
                b.abstainPercentage -
                (a.yesPercentage + a.noPercentage + a.abstainPercentage)
              );
            case 'time_remaining':
              // Sort by active status first, then by time
              if (a.status === 'active' && b.status !== 'active') return -1;
              if (b.status === 'active' && a.status !== 'active') return 1;
              return a.timeLeft.localeCompare(b.timeLeft);
            default:
              return 0;
          }
        });

        return filtered;
      },

      getProposalById: id => {
        return get().proposals.find(p => p.id === id);
      },
    }),
    {
      name: 'vmf-proposal-storage',
      partialize: state => ({
        userVotes: state.userVotes,
        statusFilter: state.statusFilter,
        sortBy: state.sortBy,
      }),
    }
  )
);
