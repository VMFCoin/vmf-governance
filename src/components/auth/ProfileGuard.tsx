'use client';

import React, { useState, useEffect } from 'react';
import { User, UserPlus, Wallet } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { CreateProfileModal } from '@/components/profile/CreateProfileModal';
import { useProfile } from '@/hooks/useProfile';
import { useWalletStore } from '@/stores/useWalletStore';
import { useUserProfileStore } from '@/stores/useUserProfileStore';
import { getAccount } from '@wagmi/core';
import { config } from '@/lib/wagmi';

interface ProfileGuardProps {
  children: React.ReactNode;
  requireProfile?: boolean;
  fallbackMessage?: string;
}

export function ProfileGuard({
  children,
  requireProfile = true,
  fallbackMessage = 'You need a profile to participate in governance activities.',
}: ProfileGuardProps) {
  const { isConnected, address } = useWalletStore();
  const { profile, isLoading, hasProfile, createProfile } = useProfile();
  const { fetchProfileIfNeeded } = useUserProfileStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch profile when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      fetchProfileIfNeeded(address);
    }
  }, [isConnected, address, fetchProfileIfNeeded]);

  const handleCreateProfile = async (data: {
    displayName: string;
    avatarUrl?: string;
  }) => {
    try {
      console.log('Creating profile with data:', data);
      await createProfile({
        name: data.displayName,
        avatarUrl: data.avatarUrl,
      });
      console.log('Profile created successfully');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create profile in ProfileGuard:', error);
      // Re-throw the error so the modal can handle it
      throw error;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </Card>
    );
  }

  // Check wallet connection
  if (!hasProfile) {
    console.log('address:', address);
    return (
      <Card className="p-8 text-center border-amber-200 bg-amber-50">
        <Wallet className="w-16 h-16 text-amber-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Wallet Connection Required
        </h3>
        <p className="text-gray-600 mb-6">
          Please connect your wallet to access governance features.
        </p>
        <Button
          variant="outline"
          className="border-amber-600 text-amber-600 hover:bg-amber-50"
        >
          Connect Wallet
        </Button>
      </Card>
    );
  }

  // Check profile requirement
  if (requireProfile && !hasProfile) {
    return (
      <>
        <Card className="p-8 text-center border-blue-200 bg-blue-50">
          <UserPlus className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Profile Required
          </h3>
          <p className="text-gray-600 mb-6">{fallbackMessage}</p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <User className="w-4 h-4 mr-2" />
            Create Profile
          </Button>
        </Card>

        <CreateProfileModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateProfile={handleCreateProfile}
        />
      </>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
}
