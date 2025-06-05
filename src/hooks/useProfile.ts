'use client';

import { useAccount } from 'wagmi';
import { useUserProfileStore } from '@/stores/useUserProfileStore';
import { useEffect, useState } from 'react';
import { UserProfile } from '@/lib/supabase';

export interface UseProfileReturn {
  // Profile data
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;

  // Profile status
  hasProfile: boolean;
  isConnected: boolean;
  walletAddress: string | undefined;

  // Actions
  createProfile: (data: { name?: string; avatarUrl?: string }) => Promise<void>;
  updateProfile: (updates: {
    name?: string;
    avatarUrl?: string;
  }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;

  // Validation
  validateProfileData: (data: { name?: string }) => {
    isValid: boolean;
    errors: string[];
  };
}

export const useProfile = (): UseProfileReturn => {
  const { address, isConnected } = useAccount();
  const [hasCheckedProfile, setHasCheckedProfile] = useState(false);

  const {
    profile,
    isLoading,
    error,
    fetchProfile,
    createProfile: storeCreateProfile,
    updateProfile: storeUpdateProfile,
    uploadAvatar: storeUploadAvatar,
    clearError,
    hasProfile: storeHasProfile,
  } = useUserProfileStore();

  // Auto-fetch profile when wallet connects
  useEffect(() => {
    console.log('useProfile useEffect triggered:', {
      address,
      isConnected,
      hasCheckedProfile,
      shouldFetch: address && !hasCheckedProfile,
    });

    // Use address presence for reliable connection detection (same as ProfileButton)
    if (address && !hasCheckedProfile) {
      console.log('Fetching profile for address:', address);
      fetchProfile(address).finally(() => setHasCheckedProfile(true));
    } else if (!address) {
      setHasCheckedProfile(false);
    }
  }, [address, hasCheckedProfile, fetchProfile]);

  const createProfile = async (data: { name?: string; avatarUrl?: string }) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    const validation = validateProfileData(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    await storeCreateProfile({
      walletAddress: address,
      ...data,
    });
  };

  const updateProfile = async (updates: {
    name?: string;
    avatarUrl?: string;
  }) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    if (updates.name !== undefined) {
      const validation = validateProfileData({ name: updates.name });
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
    }

    await storeUpdateProfile(updates);
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('File must be JPEG, PNG, or WebP');
    }

    return await storeUploadAvatar(file);
  };

  const refreshProfile = async () => {
    if (address) {
      await fetchProfile(address);
    }
  };

  const validateProfileData = (data: {
    name?: string;
  }): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (data.name !== undefined) {
      if (data.name.trim().length === 0) {
        errors.push('Name cannot be empty');
      } else if (data.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters');
      } else if (data.name.trim().length > 50) {
        errors.push('Name must be less than 50 characters');
      } else if (!/^[a-zA-Z0-9\s\-_.]+$/.test(data.name.trim())) {
        errors.push(
          'Name can only contain letters, numbers, spaces, hyphens, underscores, and periods'
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  return {
    // Profile data
    profile,
    isLoading,
    error,

    // Profile status
    hasProfile: storeHasProfile(),
    isConnected: !!address,
    walletAddress: address,

    // Actions
    createProfile,
    updateProfile,
    uploadAvatar,
    refreshProfile,
    clearError,

    // Validation
    validateProfileData,
  };
};
