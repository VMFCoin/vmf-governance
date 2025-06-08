'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile } from '@/lib/supabase';
import { profileService } from '@/services/profileService';

interface UserProfileState {
  // Data
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  lastFetchedAddress: string | null;

  // Actions
  fetchProfile: (walletAddress: string) => Promise<void>;
  fetchProfileIfNeeded: (walletAddress: string) => Promise<void>;
  createProfile: (data: {
    walletAddress: string;
    name?: string;
    avatarUrl?: string;
  }) => Promise<void>;
  updateProfile: (updates: {
    name?: string;
    avatarUrl?: string;
  }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  checkProfileExists: (walletAddress: string) => Promise<boolean>;
  clearProfile: () => void;
  clearError: () => void;

  // Getters
  hasProfile: () => boolean;
  getProfileName: () => string | null;
  getAvatarUrl: () => string | null;
}

export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set, get) => ({
      // Initial state
      profile: null,
      isLoading: false,
      error: null,
      lastFetchedAddress: null,

      // Actions
      fetchProfile: async (walletAddress: string) => {
        const { profile, isLoading, lastFetchedAddress } = get();
        // Prevent redundant fetches
        if (isLoading) return;
        if (profile && lastFetchedAddress === walletAddress.toLowerCase())
          return;

        set({ isLoading: true, error: null });
        try {
          const profile = await profileService.getProfile(walletAddress);
          set({
            profile,
            isLoading: false,
            lastFetchedAddress: walletAddress.toLowerCase(),
          });
        } catch (error) {
          console.error('Error in store fetchProfile:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch profile',
            isLoading: false,
          });
        }
      },

      fetchProfileIfNeeded: async (walletAddress: string) => {
        const { profile, isLoading, lastFetchedAddress } = get();

        // Prevent redundant fetches
        if (isLoading) return;
        if (profile && lastFetchedAddress === walletAddress.toLowerCase())
          return;

        set({ isLoading: true, error: null });
        try {
          const profile = await profileService.getProfile(walletAddress);
          set({
            profile,
            isLoading: false,
            lastFetchedAddress: walletAddress.toLowerCase(),
          });
        } catch (error) {
          console.error('Error in store fetchProfileIfNeeded:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch profile',
            isLoading: false,
          });
        }
      },

      createProfile: async data => {
        set({ isLoading: true, error: null });
        try {
          const profile = await profileService.createProfile(data);
          set({ profile, isLoading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to create profile',
            isLoading: false,
          });
          throw error;
        }
      },

      updateProfile: async updates => {
        const { profile } = get();
        if (!profile) {
          throw new Error('No profile to update');
        }

        set({ isLoading: true, error: null });
        try {
          const updatedProfile = await profileService.updateProfile(
            profile.wallet_address,
            updates
          );
          set({ profile: updatedProfile, isLoading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to update profile',
            isLoading: false,
          });
          throw error;
        }
      },

      uploadAvatar: async (file: File) => {
        try {
          return await profileService.uploadAvatar(file);
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to upload avatar',
          });
          throw error;
        }
      },

      checkProfileExists: async (walletAddress: string) => {
        try {
          return await profileService.checkProfileExists(walletAddress);
        } catch (error) {
          console.error('Error checking profile existence:', error);
          return false;
        }
      },

      clearProfile: () => {
        set({ profile: null, error: null, lastFetchedAddress: null });
      },

      clearError: () => {
        set({ error: null });
      },

      // Getters
      hasProfile: () => {
        return !!get().profile;
      },

      getProfileName: () => {
        return get().profile?.name || null;
      },

      getAvatarUrl: () => {
        return get().profile?.avatar_url || null;
      },
    }),
    {
      name: 'vmf-user-profile-store',
      partialize: state => ({
        profile: state.profile,
        lastFetchedAddress: state.lastFetchedAddress,
      }),
    }
  )
);
