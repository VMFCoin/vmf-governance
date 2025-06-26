'use client';

import React, { useState, useEffect } from 'react';
import {
  Edit,
  Save,
  X,
  User,
  Calendar,
  Clock,
  Shield,
  Award,
  Zap,
  TrendingUp,
  Lock,
  Unlock,
  Wallet,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AvatarUpload } from './AvatarUpload';
import { useProfile } from '@/hooks/useProfile';
import { useUserProfileStore } from '@/stores/useUserProfileStore';
import { useTokenLockStore } from '@/stores/useTokenLockStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { cn } from '@/lib/utils';
import { useVMFBalance } from '@/hooks/useVMFBalance';

interface ProfileCardProps {
  className?: string;
  showVotingPower?: boolean;
  onEditComplete?: () => void;
  onLockTokens?: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  className,
  showVotingPower = true,
  onEditComplete,
  onLockTokens,
}) => {
  const { profile, isLoading } = useProfile();
  const { updateProfile, uploadAvatar, error } = useUserProfileStore();
  const { address, isConnected } = useWalletStore();
  const {
    votingPowerBreakdown,
    userLocks,
    isLoading: isLoadingLocks,
    fetchUserLocks,
    getTotalVotingPower,
  } = useTokenLockStore();

  // Add VMF balance hook
  const {
    walletBalance,
    isLoading: isLoadingBalance,
    formatBalance,
    refreshBalance,
  } = useVMFBalance();

  console.log('userBalance:', walletBalance);

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(profile?.name || '');
  const [editedAvatarUrl, setEditedAvatarUrl] = useState(
    profile?.avatar_url || ''
  );
  const [validationError, setValidationError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [totalVotingPower, setTotalVotingPower] = useState<bigint>(BigInt(0));

  // Fetch voting power data when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      fetchUserLocks(address);
      getTotalVotingPower(address).then(setTotalVotingPower);
    }
  }, [isConnected, address, fetchUserLocks, getTotalVotingPower]);

  // Update total voting power when breakdown changes
  useEffect(() => {
    if (votingPowerBreakdown) {
      setTotalVotingPower(votingPowerBreakdown.totalVotingPower);
    }
  }, [votingPowerBreakdown]);

  // Refresh wallet balance when voting power changes (tokens locked/unlocked)
  useEffect(() => {
    if (isConnected && address) {
      refreshBalance();
    }
  }, [totalVotingPower, isConnected, address, refreshBalance]);

  // Calculate lock status from breakdown
  const hasActiveLocks = (votingPowerBreakdown?.activeCount ?? 0) > 0;
  const hasWarmingUpLocks = (votingPowerBreakdown?.warmingUpCount ?? 0) > 0;
  const activeLocks =
    votingPowerBreakdown?.locks?.filter(lock => lock.isWarmupComplete) || [];
  const warmingUpLocks =
    votingPowerBreakdown?.locks?.filter(lock => !lock.isWarmupComplete) || [];

  // Format VMF amounts for display
  const formatVMFAmount = (amount: bigint): string => {
    const amountNumber = Number(amount) / 1e18;
    if (amountNumber === 0) return '0';
    if (amountNumber < 1) return amountNumber.toFixed(4);
    return amountNumber.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  // Format voting power for display
  const formatVotingPower = (power: bigint): string => {
    const powerNumber = Number(power) / 1e18;
    if (powerNumber === 0) return '0';
    if (powerNumber < 1) return powerNumber.toFixed(4);
    return powerNumber.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          'bg-gradient-to-br from-backgroundLight to-backgroundAccent border border-patriotBlue/30 rounded-xl shadow-xl',
          // Responsive padding
          'p-4 sm:p-6 md:p-8',
          className
        )}
      >
        <div className="animate-pulse">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
            {/* Responsive avatar skeleton */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 bg-patriotBlue/20 rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-3 sm:space-y-4 text-center sm:text-left w-full">
              <div className="h-6 sm:h-7 md:h-8 bg-patriotBlue/20 rounded-lg w-32 sm:w-48 mx-auto sm:mx-0"></div>
              <div className="h-3 sm:h-4 bg-patriotBlue/10 rounded w-24 sm:w-32 mx-auto sm:mx-0"></div>
              <div className="h-3 sm:h-4 bg-patriotBlue/10 rounded w-20 sm:w-28 mx-auto sm:mx-0"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        className={cn(
          'bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/30 rounded-xl shadow-xl text-center',
          // Responsive padding
          'p-6 sm:p-8',
          className
        )}
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <User className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-red-400 mb-2 sm:mb-3">
          No Profile Found
        </h3>
        <p className="text-textSecondary text-sm sm:text-base">
          There was an issue loading your profile. Please try refreshing the
          page.
        </p>
      </div>
    );
  }

  const handleEdit = () => {
    setEditedName(profile.name || '');
    setEditedAvatarUrl(profile.avatar_url || '');
    setValidationError('');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedName(profile.name || '');
    setEditedAvatarUrl(profile.avatar_url || '');
    setValidationError('');
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editedName.trim()) {
      setValidationError('Name is required');
      return;
    }

    if (editedName.trim().length < 2) {
      setValidationError('Name must be at least 2 characters');
      return;
    }

    if (editedName.trim().length > 50) {
      setValidationError('Name must be less than 50 characters');
      return;
    }

    setIsUpdating(true);
    try {
      await updateProfile({
        name: editedName.trim(),
        avatarUrl: editedAvatarUrl,
      });
      setIsEditing(false);
      setValidationError('');
      onEditComplete?.();
    } catch (err) {
      console.error('Failed to update profile:', err);
      setValidationError('Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarUpload = async (file: File): Promise<string> => {
    try {
      const url = await uploadAvatar(file);
      setEditedAvatarUrl(url);
      return url;
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      throw err;
    }
  };

  return (
    <div
      className={cn(
        'group bg-gradient-to-br from-backgroundLight via-backgroundAccent to-backgroundLight border border-patriotBlue/30 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:border-patriotBlue/50 overflow-hidden',
        className
      )}
    >
      {/* Enhanced Header with Background Pattern */}
      <div className="relative bg-gradient-to-r from-patriotBlue/20 via-patriotRed/10 to-patriotBlue/20 border-b border-patriotBlue/20 p-4 sm:p-6 md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_transparent_0%,_rgba(0,0,0,0.1)_100%)]"></div>
        <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
          {/* Enhanced Avatar Section */}
          <div className="relative group/avatar flex-shrink-0">
            {isEditing ? (
              <AvatarUpload
                currentAvatarUrl={editedAvatarUrl}
                onUpload={handleAvatarUpload}
                className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32"
                size="lg"
              />
            ) : (
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-patriotBlue to-patriotRed p-1 shadow-xl group-hover:shadow-2xl transition-all duration-300">
                  <div className="w-full h-full rounded-full bg-backgroundBase flex items-center justify-center overflow-hidden">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.name || 'Profile'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <User className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 text-patriotBlue" />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Profile Info */}
          <div className="flex-1 text-center sm:text-left w-full min-w-0">
            {isEditing ? (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <input
                    type="text"
                    value={editedName}
                    onChange={e => setEditedName(e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-backgroundBase border border-patriotBlue/30 rounded-lg text-patriotWhite text-lg sm:text-xl font-bold focus:outline-none focus:ring-2 focus:ring-patriotBlue focus:border-patriotBlue transition-all duration-200"
                    placeholder="Enter your name"
                    maxLength={50}
                  />
                  {validationError && (
                    <p className="text-red-400 text-xs sm:text-sm mt-2 flex items-center justify-center sm:justify-start gap-2">
                      <X className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      {validationError}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                  <button
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:bg-green-600/50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
                  >
                    {isUpdating ? (
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white/20 border-t-white"></div>
                    ) : (
                      <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isUpdating}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 disabled:bg-gray-600/50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm sm:text-base"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-patriotWhite flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                    <span className="truncate">{profile.name}</span>
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-patriotBlue flex-shrink-0" />
                  </h2>
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-patriotBlue/20 text-patriotWhite hover:bg-patriotBlue hover:text-white transition-all duration-200 rounded-lg border border-patriotBlue/30 hover:border-patriotBlue font-medium shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Edit Profile</span>
                    <span className="xs:hidden">Edit</span>
                  </button>
                </div>

                {/* VMF Wallet Balance Display */}
                <div className="flex justify-center sm:justify-start">
                  <div className="inline-flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-green-500/20 to-green-600/10 border border-green-500/30 rounded-lg">
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                    <div className="text-center sm:text-left">
                      <div className="text-sm sm:text-lg font-bold text-green-400">
                        {isLoadingBalance ? (
                          <div className="animate-pulse">Loading...</div>
                        ) : (
                          `${formatBalance(walletBalance)} VMF`
                        )}
                      </div>
                      <div className="text-green-300/80 text-xs">
                        Available Balance
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Metadata */}
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-textSecondary">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-patriotBlue flex-shrink-0" />
                    <span>
                      Joined{' '}
                      {new Date(profile.created_at).toLocaleDateString(
                        'en-US',
                        {
                          month: 'long',
                          year: 'numeric',
                        }
                      )}
                    </span>
                  </div>
                  {profile.updated_at &&
                    profile.updated_at !== profile.created_at && (
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-textSecondary">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-patriotBlue flex-shrink-0" />
                        <span>
                          Updated{' '}
                          {new Date(profile.updated_at).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                            }
                          )}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 sm:p-4 bg-red-500/10 border-b border-red-500/20">
          <p className="text-red-400 text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-2">
            <X className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            {error}
          </p>
        </div>
      )}

      {/* Enhanced Voting Power Section */}
      {showVotingPower && (
        <div className="p-4 sm:p-6 md:p-8 border-b border-patriotBlue/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-patriotWhite flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
              Voting Power
            </h3>
            <div
              className={cn(
                'flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border text-xs sm:text-sm font-semibold',
                hasActiveLocks
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : hasWarmingUpLocks
                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
              )}
            >
              {hasActiveLocks ? (
                <>
                  <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Active Locks</span>
                </>
              ) : hasWarmingUpLocks ? (
                <>
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Warming Up</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>No Locks</span>
                </>
              )}
            </div>
          </div>

          {/* Voting Power Display */}
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/5 border border-yellow-500/30 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-yellow-400 mb-2">
                {isLoadingLocks ? (
                  <div className="animate-pulse">Loading...</div>
                ) : (
                  formatVotingPower(totalVotingPower)
                )}
              </div>
              <div className="text-yellow-300/80 text-sm sm:text-base">
                Total Voting Power
              </div>
            </div>
          </div>

          {/* Lock Summary */}
          {(hasActiveLocks || hasWarmingUpLocks) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {hasActiveLocks && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-semibold text-sm sm:text-base">
                      Active Locks
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-green-400">
                    {activeLocks.length}
                  </div>
                  <div className="text-green-300/80 text-xs sm:text-sm">
                    Currently earning voting power
                  </div>
                </div>
              )}
              {hasWarmingUpLocks && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold text-sm sm:text-base">
                      Warming Up
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-yellow-400">
                    {warmingUpLocks.length}
                  </div>
                  <div className="text-yellow-300/80 text-xs sm:text-sm">
                    Locks in warmup period
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Call to Action */}
          <div className="bg-patriotBlue/10 border border-patriotBlue/20 rounded-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-patriotBlue/20 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-patriotBlue" />
              </div>
              <div className="flex-1">
                <h4 className="text-base sm:text-lg font-semibold text-patriotWhite mb-2">
                  {hasActiveLocks
                    ? 'Maximize Your Voting Power'
                    : 'Unlock Voting Power'}
                </h4>
                <p className="text-patriotWhite/80 text-sm leading-relaxed mb-4">
                  {hasActiveLocks
                    ? 'You have active token locks! Lock more tokens or extend your lock duration to increase your voting power further.'
                    : 'Lock your VMF tokens to gain voting power and participate in governance decisions. Your voting power increases with the amount and duration of locked tokens.'}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-patriotWhite">
                    <div className="w-1.5 h-1.5 bg-patriotBlue rounded-full"></div>
                    Higher lock duration = More voting power
                  </div>
                  <div className="flex items-center gap-2 text-sm text-patriotWhite">
                    <div className="w-1.5 h-1.5 bg-patriotBlue rounded-full"></div>
                    Participate in all governance proposals
                  </div>
                  <div className="flex items-center gap-2 text-sm text-patriotWhite">
                    <div className="w-1.5 h-1.5 bg-patriotBlue rounded-full"></div>
                    Earn rewards for active participation
                  </div>
                </div>
                <button
                  onClick={onLockTokens}
                  className="mt-4 w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 bg-patriotBlue text-patriotWhite rounded-lg hover:bg-patriotBlue/80 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
                >
                  {hasActiveLocks ? 'Lock More Tokens' : 'Start Locking Tokens'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Footer */}
      <div className="p-4 sm:p-6 md:p-8">
        <div className="pt-4 sm:pt-6 border-t border-patriotBlue/20">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-textSecondary">Profile Created:</span>
              <span className="text-patriotWhite font-medium">
                {new Date(profile.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            {profile.updated_at &&
              profile.updated_at !== profile.created_at && (
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-textSecondary">Last Updated:</span>
                  <span className="text-patriotWhite font-medium">
                    {new Date(profile.updated_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
