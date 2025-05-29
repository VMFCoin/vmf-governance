'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CommunityPost, Reaction } from '@/types';
import { mockCommunityPosts } from '@/data/mockData';

export interface CommunityState {
  // Data
  posts: CommunityPost[];
  userReactions: Reaction[];

  // UI State
  selectedPost: CommunityPost | null;
  isCreatingPost: boolean;
  isSubmittingReaction: boolean;

  // Filters
  categoryFilter: 'all' | 'idea' | 'discussion' | 'feedback' | 'announcement';
  searchQuery: string;
  sortBy: 'newest' | 'oldest' | 'most_upvoted' | 'most_discussed';
  showPromotedOnly: boolean;

  // Actions
  setPosts: (posts: CommunityPost[]) => void;
  addPost: (post: CommunityPost) => void;
  updatePost: (id: string, updates: Partial<CommunityPost>) => void;
  deletePost: (id: string) => void;
  setSelectedPost: (post: CommunityPost | null) => void;

  // Reaction actions
  submitReaction: (postId: string, type: 'up' | 'down') => Promise<void>;
  removeReaction: (postId: string) => Promise<void>;
  getUserReaction: (postId: string) => Reaction | null;

  // Filter actions
  setCategoryFilter: (
    filter: 'all' | 'idea' | 'discussion' | 'feedback' | 'announcement'
  ) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (
    sort: 'newest' | 'oldest' | 'most_upvoted' | 'most_discussed'
  ) => void;
  setShowPromotedOnly: (show: boolean) => void;

  // Computed getters
  getFilteredPosts: () => CommunityPost[];
  getPostById: (id: string) => CommunityPost | undefined;
  getPostStats: (postId: string) => {
    upvotes: number;
    downvotes: number;
    score: number;
  };
}

export const useCommunityStore = create<CommunityState>()(
  persist(
    (set, get) => ({
      // Initial state
      posts: mockCommunityPosts,
      userReactions: [],
      selectedPost: null,
      isCreatingPost: false,
      isSubmittingReaction: false,
      categoryFilter: 'all',
      searchQuery: '',
      sortBy: 'newest',
      showPromotedOnly: false,

      // Actions
      setPosts: posts => set({ posts }),

      addPost: post => {
        set(state => ({
          posts: [post, ...state.posts],
        }));
      },

      updatePost: (id, updates) => {
        set(state => ({
          posts: state.posts.map(p => (p.id === id ? { ...p, ...updates } : p)),
        }));
      },

      deletePost: id => {
        set(state => ({
          posts: state.posts.filter(p => p.id !== id),
          userReactions: state.userReactions.filter(r => r.postId !== id),
        }));
      },

      setSelectedPost: post => set({ selectedPost: post }),

      // Reaction actions
      submitReaction: async (postId, type) => {
        set({ isSubmittingReaction: true });

        try {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 300));

          const existingReaction = get().getUserReaction(postId);

          // Remove existing reaction if it's the same type
          if (existingReaction?.type === type) {
            await get().removeReaction(postId);
            return;
          }

          const reaction: Reaction = {
            id: `reaction-${Date.now()}`,
            postId,
            userId: 'current-user', // In real app, get from wallet
            type,
            timestamp: new Date(),
          };

          // Update user reactions
          set(state => ({
            userReactions: [
              ...state.userReactions.filter(r => r.postId !== postId),
              reaction,
            ],
          }));

          // Update post vote counts
          const post = get().getPostById(postId);
          if (post) {
            let updates: Partial<CommunityPost> = {};

            if (existingReaction) {
              // Switching vote type
              if (existingReaction.type === 'up' && type === 'down') {
                updates = {
                  upvotes: post.upvotes - 1,
                  downvotes: post.downvotes + 1,
                };
              } else if (existingReaction.type === 'down' && type === 'up') {
                updates = {
                  upvotes: post.upvotes + 1,
                  downvotes: post.downvotes - 1,
                };
              }
            } else {
              // New vote
              if (type === 'up') {
                updates = { upvotes: post.upvotes + 1 };
              } else {
                updates = { downvotes: post.downvotes + 1 };
              }
            }

            // Update user vote status
            updates.userVote = type;

            get().updatePost(postId, updates);
          }
        } finally {
          set({ isSubmittingReaction: false });
        }
      },

      removeReaction: async postId => {
        const existingReaction = get().getUserReaction(postId);
        if (!existingReaction) return;

        try {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 300));

          // Remove reaction
          set(state => ({
            userReactions: state.userReactions.filter(r => r.postId !== postId),
          }));

          // Update post vote counts
          const post = get().getPostById(postId);
          if (post) {
            let updates: Partial<CommunityPost> = { userVote: null };

            if (existingReaction.type === 'up') {
              updates.upvotes = post.upvotes - 1;
            } else {
              updates.downvotes = post.downvotes - 1;
            }

            get().updatePost(postId, updates);
          }
        } catch (error) {
          console.error('Failed to remove reaction:', error);
        }
      },

      getUserReaction: postId => {
        return get().userReactions.find(r => r.postId === postId) || null;
      },

      // Filter actions
      setCategoryFilter: filter => set({ categoryFilter: filter }),
      setSearchQuery: query => set({ searchQuery: query }),
      setSortBy: sort => set({ sortBy: sort }),
      setShowPromotedOnly: show => set({ showPromotedOnly: show }),

      // Computed getters
      getFilteredPosts: () => {
        const { posts, categoryFilter, searchQuery, sortBy, showPromotedOnly } =
          get();

        let filtered = posts;

        // Filter by promoted only
        if (showPromotedOnly) {
          filtered = filtered.filter(p => p.isPromoted);
        }

        // Filter by category
        if (categoryFilter !== 'all') {
          filtered = filtered.filter(p => p.category === categoryFilter);
        }

        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(
            p =>
              p.title.toLowerCase().includes(query) ||
              p.content.toLowerCase().includes(query) ||
              p.author.toLowerCase().includes(query) ||
              p.tags.some(tag => tag.toLowerCase().includes(query))
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
            case 'most_upvoted':
              return b.upvotes - b.downvotes - (a.upvotes - a.downvotes);
            case 'most_discussed':
              return b.upvotes + b.downvotes - (a.upvotes + a.downvotes);
            default:
              return 0;
          }
        });

        return filtered;
      },

      getPostById: id => {
        return get().posts.find(p => p.id === id);
      },

      getPostStats: postId => {
        const post = get().getPostById(postId);
        if (!post) return { upvotes: 0, downvotes: 0, score: 0 };

        return {
          upvotes: post.upvotes,
          downvotes: post.downvotes,
          score: post.upvotes - post.downvotes,
        };
      },
    }),
    {
      name: 'vmf-community-storage',
      partialize: state => ({
        userReactions: state.userReactions,
        categoryFilter: state.categoryFilter,
        sortBy: state.sortBy,
        showPromotedOnly: state.showPromotedOnly,
      }),
    }
  )
);
