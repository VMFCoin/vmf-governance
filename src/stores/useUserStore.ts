'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Notification } from '@/types';

export interface UserPreferences {
  theme: 'patriotic' | 'dark' | 'light';
  notifications: {
    email: boolean;
    push: boolean;
    voteReminders: boolean;
    newProposals: boolean;
    communityUpdates: boolean;
  };
  privacy: {
    showVotingHistory: boolean;
    showProfile: boolean;
    allowDirectMessages: boolean;
  };
  display: {
    compactMode: boolean;
    showAnimations: boolean;
    autoPlayVideos: boolean;
  };
}

export interface UserState {
  // User data
  userId: string | null;
  preferences: UserPreferences;
  notifications: Notification[];

  // Voting history
  votingHistory: Array<{
    proposalId: string;
    proposalTitle: string;
    vote: 'yes' | 'no' | 'abstain';
    timestamp: Date;
    votingPower: number;
  }>;

  // Community activity
  communityActivity: Array<{
    type: 'post_created' | 'post_upvoted' | 'post_downvoted' | 'comment_added';
    postId: string;
    timestamp: Date;
  }>;

  // UI State
  hasSeenWelcome: boolean;
  lastActiveTab: string;

  // Actions
  setUserId: (id: string | null) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  addNotification: (notification: {
    type: Notification['type'];
    title: string;
    message: string;
    actionUrl?: string;
  }) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  addVotingRecord: (record: {
    proposalId: string;
    proposalTitle: string;
    vote: 'yes' | 'no' | 'abstain';
    votingPower: number;
  }) => void;
  addCommunityActivity: (activity: {
    type: 'post_created' | 'post_upvoted' | 'post_downvoted' | 'comment_added';
    postId: string;
  }) => void;
  setHasSeenWelcome: (seen: boolean) => void;
  setLastActiveTab: (tab: string) => void;

  // Computed getters
  getUnreadNotifications: () => Notification[];
  getRecentVotingHistory: (limit?: number) => UserState['votingHistory'];
  getVotingStats: () => {
    totalVotes: number;
    yesVotes: number;
    noVotes: number;
    abstainVotes: number;
    totalVotingPower: number;
  };
}

const defaultPreferences: UserPreferences = {
  theme: 'patriotic',
  notifications: {
    email: true,
    push: true,
    voteReminders: true,
    newProposals: true,
    communityUpdates: false,
  },
  privacy: {
    showVotingHistory: true,
    showProfile: true,
    allowDirectMessages: true,
  },
  display: {
    compactMode: false,
    showAnimations: true,
    autoPlayVideos: false,
  },
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      userId: null,
      preferences: defaultPreferences,
      notifications: [],
      votingHistory: [],
      communityActivity: [],
      hasSeenWelcome: false,
      lastActiveTab: 'vote',

      // Actions
      setUserId: id => set({ userId: id }),

      updatePreferences: updates => {
        set(state => ({
          preferences: { ...state.preferences, ...updates },
        }));
      },

      addNotification: notification => {
        const newNotification: Notification = {
          ...notification,
          id: `notification-${Date.now()}`,
          userId: get().userId || 'anonymous',
          isRead: false,
          createdAt: new Date(),
        };

        set(state => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep only 50 most recent
        }));
      },

      markNotificationRead: id => {
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }));
      },

      clearAllNotifications: () => {
        set({ notifications: [] });
      },

      addVotingRecord: record => {
        const votingRecord = {
          ...record,
          timestamp: new Date(),
        };

        set(state => ({
          votingHistory: [votingRecord, ...state.votingHistory].slice(0, 100), // Keep only 100 most recent
        }));

        // Add notification for successful vote
        get().addNotification({
          type: 'vote_reminder',
          title: 'Vote Recorded',
          message: `Your ${record.vote} vote on "${record.proposalTitle}" has been recorded.`,
          actionUrl: `/proposal/${record.proposalId}`,
        });
      },

      addCommunityActivity: activity => {
        const activityRecord = {
          ...activity,
          timestamp: new Date(),
        };

        set(state => ({
          communityActivity: [activityRecord, ...state.communityActivity].slice(
            0,
            100
          ),
        }));
      },

      setHasSeenWelcome: seen => set({ hasSeenWelcome: seen }),
      setLastActiveTab: tab => set({ lastActiveTab: tab }),

      // Computed getters
      getUnreadNotifications: () => {
        return get().notifications.filter(n => !n.isRead);
      },

      getRecentVotingHistory: (limit = 10) => {
        return get().votingHistory.slice(0, limit);
      },

      getVotingStats: () => {
        const history = get().votingHistory;

        const stats = history.reduce(
          (acc, record) => {
            acc.totalVotes++;
            acc.totalVotingPower += record.votingPower;

            switch (record.vote) {
              case 'yes':
                acc.yesVotes++;
                break;
              case 'no':
                acc.noVotes++;
                break;
              case 'abstain':
                acc.abstainVotes++;
                break;
            }

            return acc;
          },
          {
            totalVotes: 0,
            yesVotes: 0,
            noVotes: 0,
            abstainVotes: 0,
            totalVotingPower: 0,
          }
        );

        return stats;
      },
    }),
    {
      name: 'vmf-user-storage',
      partialize: state => ({
        userId: state.userId,
        preferences: state.preferences,
        notifications: state.notifications,
        votingHistory: state.votingHistory,
        communityActivity: state.communityActivity,
        hasSeenWelcome: state.hasSeenWelcome,
        lastActiveTab: state.lastActiveTab,
      }),
    }
  )
);
