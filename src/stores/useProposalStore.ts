'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Proposal,
  VoteRecord,
  ProposalType,
  HolidayCharityProposal,
  CharityDirectoryProposal,
  PlatformFeatureProposal,
  CharitySubmission,
  FeatureSpec,
} from '@/types';
import { mockProposals } from '@/data/mockData';
import { notificationService } from '@/services/notificationService';
import { useHolidayStore } from '@/stores/useHolidayStore';
import { holidayProposalLogic } from '@/services/holidayProposalLogic';

export interface ProposalState {
  // Data
  proposals: Proposal[];
  userVotes: VoteRecord[];

  // UI State
  selectedProposal: Proposal | null;
  isVoting: boolean;

  // Filters
  statusFilter: 'all' | 'active' | 'passed' | 'failed' | 'pending';
  typeFilter: 'all' | ProposalType;
  searchQuery: string;
  sortBy: 'newest' | 'oldest' | 'most_votes' | 'time_remaining';

  // Actions
  setProposals: (proposals: Proposal[]) => void;
  addProposal: (proposal: Proposal) => void;
  updateProposal: (id: string, updates: Partial<Proposal>) => void;
  setSelectedProposal: (proposal: Proposal | null) => void;

  // Type-specific creation actions
  createHolidayCharityProposal: (
    holidayId: string,
    availableCharities: string[],
    fundAmount: number
  ) => Promise<void>;
  createCharityDirectoryProposal: (
    charityData: CharitySubmission
  ) => Promise<void>;
  createPlatformFeatureProposal: (featureSpec: FeatureSpec) => Promise<void>;

  // Automated proposal generation
  checkAndGenerateHolidayProposals: () => Promise<void>;

  // Voting actions (enhanced for different voting types)
  submitVote: (
    proposalId: string,
    vote: 'yes' | 'no' | 'abstain' | string, // string for charity selection
    votingPower: number
  ) => Promise<void>;
  getUserVote: (proposalId: string) => VoteRecord | null;

  // Filter actions
  setStatusFilter: (
    filter: 'all' | 'active' | 'passed' | 'failed' | 'pending'
  ) => void;
  setTypeFilter: (filter: 'all' | ProposalType) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (
    sort: 'newest' | 'oldest' | 'most_votes' | 'time_remaining'
  ) => void;

  // Computed getters
  getFilteredProposals: () => Proposal[];
  getProposalById: (id: string) => Proposal | undefined;
  getProposalsByType: (type: ProposalType) => Proposal[];
  getActiveHolidayProposals: () => HolidayCharityProposal[];
  getActiveCharityDirectoryProposals: () => CharityDirectoryProposal[];
  getActivePlatformFeatureProposals: () => PlatformFeatureProposal[];

  // Enhanced type handling methods (Phase 23.2)
  isHolidayCharityProposal: (
    proposal: Proposal
  ) => proposal is HolidayCharityProposal;
  isCharityDirectoryProposal: (
    proposal: Proposal
  ) => proposal is CharityDirectoryProposal;
  isPlatformFeatureProposal: (
    proposal: Proposal
  ) => proposal is PlatformFeatureProposal;

  // Type-safe utilities
  getTypedProposal: <T extends Proposal>(
    id: string,
    type: ProposalType
  ) => T | null;
  getProposalVotingResults: (proposalId: string) => {
    votingType: 'approval' | 'charity_selection';
    results: any;
    totalParticipants: number;
    isLeading?: string;
  } | null;

  // Enhanced voting result aggregation
  getCharityVotingResults: (proposalId: string) =>
    | {
        charityId: string;
        votes: number;
        percentage: number;
        isLeading: boolean;
      }[]
    | null;

  getApprovalVotingResults: (proposalId: string) => {
    yes: { votes: number; percentage: number };
    no: { votes: number; percentage: number };
    abstain: { votes: number; percentage: number };
    totalVotes: number;
    isApproved: boolean;
  } | null;

  // New method to sync proposals with dynamic holiday logic
  syncWithHolidayLogic: () => Promise<void>;
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
      typeFilter: 'all',
      searchQuery: '',
      sortBy: 'newest',

      // Actions
      setProposals: proposals => set({ proposals }),

      addProposal: proposal => {
        set(state => ({
          proposals: [proposal, ...state.proposals] as Proposal[],
        }));
      },

      updateProposal: (id, updates) => {
        set(state => ({
          proposals: state.proposals.map(p =>
            p.id === id ? ({ ...p, ...updates } as Proposal) : p
          ),
        }));
      },

      setSelectedProposal: proposal => set({ selectedProposal: proposal }),

      // Type-specific creation actions
      createHolidayCharityProposal: async (
        holidayId,
        availableCharities,
        fundAmount
      ) => {
        try {
          const proposalId = `hcp-${holidayId}-${Date.now()}`;
          const now = new Date();

          // Find the holiday to get the date
          const holidayStore = useHolidayStore.getState();
          const holiday = holidayStore.getHolidayById(holidayId);

          if (!holiday) {
            throw new Error(`Holiday not found: ${holidayId}`);
          }

          const holidayDate = new Date(holiday.date);
          const votingEndsAt = new Date(
            holidayDate.getTime() - 24 * 60 * 60 * 1000
          ); // 1 day before holiday

          // Create the standardized holiday charity proposal
          const proposal: HolidayCharityProposal = {
            id: proposalId,
            type: 'holiday_charity',
            title: `${holiday.name} ${holidayDate.getFullYear()} - Charity Selection`,
            author: 'system',
            status: 'active',
            timeLeft: `${Math.ceil((votingEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 1000))} days left`,
            yesPercentage: 0,
            noPercentage: 0,
            abstainPercentage: 0,
            description: `Vote for your preferred charity to receive funding for ${holiday.name} ${holidayDate.getFullYear()}. Total fund allocation: $${fundAmount.toLocaleString()}. Select one charity from the available options.`,
            createdAt: now,
            votingEndsAt,
            holidayId,
            availableCharities,
            isAutoGenerated: true,
            fundAmount,
            votingType: 'charity_selection',
            charityVotes: {},
            totalVotes: 0,
            leadingCharity: '',
          };

          get().addProposal(proposal);

          // Send notification
          const daysLeft = Math.ceil(
            (votingEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          notificationService.notifyHolidayProposal(
            holiday.name,
            fundAmount,
            daysLeft
          );
        } catch (error) {
          console.error('Error creating holiday charity proposal:', error);
          throw error;
        }
      },

      createCharityDirectoryProposal: async charityData => {
        try {
          const proposalId = `cdp-${Date.now()}`;
          const now = new Date();
          const votingEndsAt = new Date(
            now.getTime() + 14 * 24 * 60 * 60 * 1000
          ); // 14 days from now

          const proposal: CharityDirectoryProposal = {
            id: proposalId,
            type: 'charity_directory',
            title: `Add "${charityData.name}" to VMF Charity Directory`,
            author: 'current-user', // In real app, get from wallet
            status: 'active',
            timeLeft: '14 days left',
            yesPercentage: 0,
            noPercentage: 0,
            abstainPercentage: 0,
            description: `Proposal to add ${charityData.name} to our approved charity directory. ${charityData.description}`,
            createdAt: now,
            votingEndsAt,
            charityData,
            verificationDocuments: [], // Would be populated with uploaded documents
            isAutoGenerated: false,
            votingType: 'approval',
          };

          get().addProposal(proposal);
        } catch (error) {
          console.error('Error creating charity directory proposal:', error);
          throw error;
        }
      },

      createPlatformFeatureProposal: async featureSpec => {
        try {
          const proposalId = `pfp-${Date.now()}`;
          const now = new Date();
          const votingEndsAt = new Date(
            now.getTime() + 14 * 24 * 60 * 60 * 1000
          ); // 14 days from now

          const proposal: PlatformFeatureProposal = {
            id: proposalId,
            type: 'platform_feature',
            title: featureSpec.title,
            author: 'current-user', // In real app, get from wallet
            status: 'active',
            timeLeft: '14 days left',
            yesPercentage: 0,
            noPercentage: 0,
            abstainPercentage: 0,
            description: featureSpec.description,
            createdAt: now,
            votingEndsAt,
            featureSpecification: featureSpec,
            implementationComplexity:
              featureSpec.priority === 'critical'
                ? 'high'
                : featureSpec.priority === 'high'
                  ? 'medium'
                  : 'low',
            estimatedDevelopmentTime: featureSpec.estimatedEffort,
            isAutoGenerated: false,
            votingType: 'approval',
          };

          get().addProposal(proposal);
        } catch (error) {
          console.error('Error creating platform feature proposal:', error);
          throw error;
        }
      },

      // Automated proposal generation
      checkAndGenerateHolidayProposals: async () => {
        try {
          const { useCharityStore } = await import('./useCharityStore');
          const charityStore = useCharityStore.getState();

          // Ensure we have charity data
          if (charityStore.charities.length === 0) {
            await charityStore.fetchCharities();
          }

          // Get available charity IDs
          const availableCharityIds = charityStore.charities
            .filter(charity => charity.verification.is501c3)
            .map(charity => charity.id);

          if (availableCharityIds.length < 2) {
            console.warn(
              `Not enough verified charities (${availableCharityIds.length}) for holiday proposals`
            );
            return;
          }

          // Check for holiday transitions and new proposals needed
          const currentHolidayProposals = get().proposals.filter(
            p => p.type === 'holiday_charity'
          ) as HolidayCharityProposal[];

          const transitionCheck =
            holidayProposalLogic.checkForHolidayTransition(
              currentHolidayProposals
            );

          // Remove expired proposals
          if (transitionCheck.expiredProposals.length > 0) {
            set(state => ({
              proposals: state.proposals.filter(
                p => !transitionCheck.expiredProposals.includes(p.id)
              ),
            }));
            console.log(
              `Removed ${transitionCheck.expiredProposals.length} expired holiday proposals`
            );
          }

          // Generate new proposals for holidays that need them
          if (transitionCheck.newHolidaysNeeded.length > 0) {
            for (const holiday of transitionCheck.newHolidaysNeeded) {
              const newProposal = holidayProposalLogic.generateHolidayProposal(
                holiday,
                availableCharityIds
              );
              get().addProposal(newProposal);

              console.log(`Generated new holiday proposal for ${holiday.name}`);

              // Send notification
              const status =
                holidayProposalLogic.getHolidayProposalStatus(holiday);
              notificationService.notifyHolidayProposal(
                holiday.name,
                holiday.fundAllocation,
                status.daysUntilVotingEnds
              );
            }
          }

          console.log('Holiday proposal check completed successfully');
        } catch (error) {
          console.error(
            'Error checking and generating holiday proposals:',
            error
          );
        }
      },

      // New method to sync proposals with dynamic holiday logic
      syncWithHolidayLogic: async () => {
        try {
          const { useCharityStore } = await import('./useCharityStore');
          const charityStore = useCharityStore.getState();

          // Ensure we have charity data
          if (charityStore.charities.length === 0) {
            await charityStore.fetchCharities();
          }

          const availableCharityIds = charityStore.charities
            .filter(charity => charity.verification.is501c3)
            .map(charity => charity.id);

          // Get dynamic holiday proposals
          const dynamicHolidayProposals =
            holidayProposalLogic.getDynamicHolidayProposals(
              availableCharityIds
            );

          // Get existing non-holiday proposals
          const nonHolidayProposals = get().proposals.filter(
            p => p.type !== 'holiday_charity'
          );

          // Update proposals with dynamic holiday proposals + existing non-holiday proposals
          const updatedProposals = [
            ...dynamicHolidayProposals,
            ...nonHolidayProposals,
          ];

          set({ proposals: updatedProposals });

          console.log(
            `Synced ${dynamicHolidayProposals.length} dynamic holiday proposals`
          );
        } catch (error) {
          console.error('Error syncing with holiday logic:', error);
        }
      },

      // Enhanced voting actions
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
            // Handle different voting types
            if (
              proposal.votingType === 'charity_selection' &&
              proposal.type === 'holiday_charity'
            ) {
              // Handle charity selection voting for holiday charity proposals
              // Check if this is actually a holiday charity proposal with required properties
              if (
                'charityVotes' in proposal &&
                'totalVotes' in proposal &&
                'leadingCharity' in proposal
              ) {
                const holidayProposal = proposal as HolidayCharityProposal;
                const charityId = vote as string;

                // Update charity votes
                const updatedCharityVotes = { ...holidayProposal.charityVotes };

                // Add vote to selected charity
                if (updatedCharityVotes[charityId]) {
                  updatedCharityVotes[charityId].votes += 1;
                } else {
                  updatedCharityVotes[charityId] = { votes: 1, percentage: 0 };
                }

                // Calculate new total votes
                const newTotalVotes = holidayProposal.totalVotes + 1;

                // Recalculate percentages for all charities
                Object.keys(updatedCharityVotes).forEach(id => {
                  updatedCharityVotes[id].percentage =
                    (updatedCharityVotes[id].votes / newTotalVotes) * 100;
                });

                // Find leading charity
                let leadingCharity = '';
                let maxVotes = 0;
                Object.entries(updatedCharityVotes).forEach(([id, data]) => {
                  if (data.votes > maxVotes) {
                    maxVotes = data.votes;
                    leadingCharity = id;
                  }
                });

                // Update the proposal
                get().updateProposal(proposalId, {
                  charityVotes: updatedCharityVotes,
                  totalVotes: newTotalVotes,
                  leadingCharity,
                });

                console.log(
                  `Voted for charity: ${charityId} on proposal: ${proposalId}`
                );
              } else {
                console.error(
                  'Holiday charity proposal missing required voting properties'
                );
              }
            } else {
              // Standard Yes/No/Abstain voting for other proposal types
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
              } else if (vote === 'abstain') {
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
              } else if (vote === 'abstain') {
                updates.yesPercentage =
                  proposal.yesPercentage + Math.floor(remaining / 2);
                updates.noPercentage =
                  proposal.noPercentage + Math.ceil(remaining / 2);
              }

              get().updateProposal(proposalId, updates);
            }
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
      setTypeFilter: filter => set({ typeFilter: filter }),
      setSearchQuery: query => set({ searchQuery: query }),
      setSortBy: sort => set({ sortBy: sort }),

      // Computed getters
      getFilteredProposals: () => {
        const { proposals, statusFilter, typeFilter, searchQuery, sortBy } =
          get();

        let filtered = proposals;

        // Filter by status
        if (statusFilter !== 'all') {
          filtered = filtered.filter(p => p.status === statusFilter);
        }

        // Filter by type
        if (typeFilter !== 'all') {
          filtered = filtered.filter(p => p.type === typeFilter);
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
              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
            case 'oldest':
              return (
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
              );
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
              return (
                new Date(a.votingEndsAt).getTime() -
                new Date(b.votingEndsAt).getTime()
              );
            default:
              return 0;
          }
        });

        return filtered;
      },

      getProposalById: id => {
        return get().proposals.find(p => p.id === id);
      },

      getProposalsByType: type => {
        return get().proposals.filter(p => p.type === type);
      },

      getActiveHolidayProposals: () => {
        return get().proposals.filter(
          p => p.type === 'holiday_charity' && p.status === 'active'
        ) as HolidayCharityProposal[];
      },

      getActiveCharityDirectoryProposals: () => {
        return get().proposals.filter(
          p => p.type === 'charity_directory' && p.status === 'active'
        ) as CharityDirectoryProposal[];
      },

      getActivePlatformFeatureProposals: () => {
        return get().proposals.filter(
          p => p.type === 'platform_feature' && p.status === 'active'
        ) as PlatformFeatureProposal[];
      },

      // Enhanced type handling methods (Phase 23.2)
      isHolidayCharityProposal: proposal => proposal.type === 'holiday_charity',
      isCharityDirectoryProposal: proposal =>
        proposal.type === 'charity_directory',
      isPlatformFeatureProposal: proposal =>
        proposal.type === 'platform_feature',

      // Type-safe utilities
      getTypedProposal: <T extends Proposal>(
        id: string,
        type: ProposalType
      ): T | null => {
        const proposal = get().getProposalById(id);
        return proposal && proposal.type === type ? (proposal as T) : null;
      },
      getProposalVotingResults: proposalId => {
        const proposal = get().getProposalById(proposalId);
        if (!proposal) return null;

        if (
          proposal.votingType === 'charity_selection' &&
          get().isHolidayCharityProposal(proposal)
        ) {
          return {
            votingType: proposal.votingType,
            results: proposal.charityVotes,
            totalParticipants: proposal.totalVotes,
            isLeading: proposal.leadingCharity,
          };
        } else if (proposal.votingType === 'approval') {
          return {
            votingType: proposal.votingType,
            results: {
              yes: proposal.yesPercentage,
              no: proposal.noPercentage,
              abstain: proposal.abstainPercentage,
            },
            totalParticipants:
              proposal.yesPercentage +
              proposal.noPercentage +
              proposal.abstainPercentage,
          };
        }

        return null;
      },

      // Enhanced voting result aggregation
      getCharityVotingResults: proposalId => {
        const proposal = get().getProposalById(proposalId);
        if (!proposal || !get().isHolidayCharityProposal(proposal)) {
          return null;
        }

        const holidayProposal = proposal as HolidayCharityProposal;
        return Object.entries(holidayProposal.charityVotes).map(
          ([charityId, data]) => ({
            charityId,
            votes: data.votes,
            percentage: data.percentage,
            isLeading: charityId === holidayProposal.leadingCharity,
          })
        );
      },

      getApprovalVotingResults: proposalId => {
        const proposal = get().getProposalById(proposalId);
        if (!proposal || proposal.votingType !== 'approval') {
          return null;
        }

        const yesPercentage = proposal.yesPercentage;
        const noPercentage = proposal.noPercentage;
        const abstainPercentage = proposal.abstainPercentage;
        const totalVotes = yesPercentage + noPercentage + abstainPercentage;
        const isApproved = totalVotes >= 50;

        return {
          yes: {
            votes: Math.round((yesPercentage * totalVotes) / 100),
            percentage: yesPercentage,
          },
          no: {
            votes: Math.round((noPercentage * totalVotes) / 100),
            percentage: noPercentage,
          },
          abstain: {
            votes: Math.round((abstainPercentage * totalVotes) / 100),
            percentage: abstainPercentage,
          },
          totalVotes,
          isApproved,
        };
      },
    }),
    {
      name: 'vmf-proposal-storage',
      partialize: state => ({
        userVotes: state.userVotes,
        statusFilter: state.statusFilter,
        typeFilter: state.typeFilter,
        sortBy: state.sortBy,
      }),
    }
  )
);
