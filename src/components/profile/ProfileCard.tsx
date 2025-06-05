'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AvatarUpload } from './AvatarUpload';
import { useProfile } from '@/hooks/useProfile';
import { useUserProfileStore } from '@/stores/useUserProfileStore';
import { cn } from '@/lib/utils';

interface ProfileCardProps {
  className?: string;
  showVotingPower?: boolean;
  onEditComplete?: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  className,
  showVotingPower = true,
  onEditComplete,
}) => {
  const { profile, isLoading } = useProfile();
  const { updateProfile, uploadAvatar, error } = useUserProfileStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(profile?.name || '');
  const [editedAvatarUrl, setEditedAvatarUrl] = useState(
    profile?.avatar_url || ''
  );
  const [validationError, setValidationError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  if (isLoading) {
    return (
      <div
        className={cn(
          'bg-gradient-to-br from-backgroundLight to-backgroundAccent border border-patriotBlue/30 rounded-xl p-8 shadow-xl',
          className
        )}
      >
        <div className="animate-pulse">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-patriotBlue/20 rounded-full"></div>
            <div className="flex-1 space-y-4 text-center sm:text-left">
              <div className="h-8 bg-patriotBlue/20 rounded-lg w-48 mx-auto sm:mx-0"></div>
              <div className="h-4 bg-patriotBlue/10 rounded w-32 mx-auto sm:mx-0"></div>
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
          'bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/30 rounded-xl p-8 text-center shadow-xl',
          className
        )}
      >
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <User className="w-10 h-10 text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-red-400 mb-3">
          No Profile Found
        </h3>
        <p className="text-textSecondary">
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
      <div className="relative bg-gradient-to-r from-patriotBlue/20 via-patriotRed/10 to-patriotBlue/20 p-8 border-b border-patriotBlue/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_transparent_0%,_rgba(0,0,0,0.1)_100%)]"></div>
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Enhanced Avatar Section */}
          <div className="relative group/avatar">
            {isEditing ? (
              <AvatarUpload
                currentAvatarUrl={editedAvatarUrl}
                onUpload={handleAvatarUpload}
                className="w-24 h-24 sm:w-32 sm:h-32"
              />
            ) : (
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-patriotBlue to-patriotRed p-1 shadow-xl group-hover:shadow-2xl transition-all duration-300">
                  <div className="w-full h-full rounded-full bg-backgroundBase flex items-center justify-center overflow-hidden">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.name || 'Profile'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <User className="w-12 h-12 sm:w-16 sm:h-16 text-patriotBlue" />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Profile Info */}
          <div className="flex-1 text-center sm:text-left">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={editedName}
                    onChange={e => setEditedName(e.target.value)}
                    className="w-full px-4 py-3 bg-backgroundBase border border-patriotBlue/30 rounded-lg text-patriotWhite text-xl font-bold focus:outline-none focus:ring-2 focus:ring-patriotBlue focus:border-patriotBlue transition-all duration-200"
                    placeholder="Enter your name"
                    maxLength={50}
                  />
                  {validationError && (
                    <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                      <X className="w-4 h-4" />
                      {validationError}
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:bg-green-600/50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {isUpdating ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isUpdating}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 disabled:bg-gray-600/50 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h2 className="text-2xl sm:text-3xl font-bold text-patriotWhite flex items-center gap-3">
                    {profile.name}
                    <Shield className="w-6 h-6 text-patriotBlue" />
                  </h2>
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-patriotBlue/20 text-patriotWhite hover:bg-patriotBlue hover:text-white transition-all duration-200 rounded-lg border border-patriotBlue/30 hover:border-patriotBlue font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </button>
                </div>

                {/* Enhanced Metadata */}
                <div className="flex flex-col sm:flex-row gap-4 text-sm">
                  <div className="flex items-center gap-2 text-textSecondary">
                    <Calendar className="w-4 h-4 text-patriotBlue" />
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
                      <div className="flex items-center gap-2 text-textSecondary">
                        <Clock className="w-4 h-4 text-patriotBlue" />
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
        <div className="p-4 bg-red-500/10 border-b border-red-500/20">
          <p className="text-red-400 text-sm flex items-center gap-2">
            <X className="w-4 h-4" />
            {error}
          </p>
        </div>
      )}

      {/* Enhanced Voting Power Section */}
      {showVotingPower && (
        <div className="p-8 border-b border-patriotBlue/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-patriotWhite flex items-center gap-3">
              <Zap className="w-6 h-6 text-yellow-400" />
              Voting Power
            </h3>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-semibold">Locked</span>
            </div>
          </div>

          <div className="space-y-6">
            {/* Power Display */}
            <div className="text-center">
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-xl">
                <Award className="w-8 h-8 text-yellow-400" />
                <div>
                  <div className="text-3xl font-bold text-yellow-400">
                    0 VMF
                  </div>
                  <div className="text-yellow-300/80 text-sm">
                    Current Voting Power
                  </div>
                </div>
              </div>
            </div>

            {/* Power Description */}
            <div className="bg-patriotBlue/10 border border-patriotBlue/20 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-patriotBlue/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-patriotBlue" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-patriotWhite mb-2">
                    Unlock Voting Power
                  </h4>
                  <p className="text-patriotWhite/80 text-sm leading-relaxed mb-4">
                    Lock your VMF tokens to gain voting power and participate in
                    governance decisions. Your voting power increases with the
                    amount and duration of locked tokens.
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
                  <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-patriotBlue text-white rounded-lg hover:bg-patriotBlue/80 transition-all duration-200 font-medium transform hover:scale-105">
                    <Unlock className="w-4 h-4" />
                    Lock Tokens
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Profile Stats */}
      <div className="p-8">
        <h3 className="text-xl font-bold text-patriotWhite mb-6 flex items-center gap-3">
          <Award className="w-6 h-6 text-patriotBlue" />
          Governance Activity
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="group/stat bg-gradient-to-br from-patriotBlue/10 to-patriotBlue/5 border border-patriotBlue/20 rounded-xl p-6 hover:border-patriotBlue/40 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <span className="text-patriotWhite font-medium">Votes Cast</span>
              <div className="w-10 h-10 bg-patriotBlue/20 rounded-full flex items-center justify-center group-hover/stat:bg-patriotBlue/30 transition-all duration-300">
                <Shield className="w-5 h-5 text-patriotBlue" />
              </div>
            </div>
            <div className="text-3xl font-bold text-patriotWhite mb-2">0</div>
            <div className="text-sm text-patriotWhite/70">
              Start voting to increase this metric
            </div>
          </div>

          <div className="group/stat bg-gradient-to-br from-patriotRed/10 to-patriotRed/5 border border-patriotRed/20 rounded-xl p-6 hover:border-patriotRed/40 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <span className="text-patriotWhite font-medium">
                Proposals Created
              </span>
              <div className="w-10 h-10 bg-patriotRed/20 rounded-full flex items-center justify-center group-hover/stat:bg-patriotRed/30 transition-all duration-300">
                <Award className="w-5 h-5 text-patriotRed" />
              </div>
            </div>
            <div className="text-3xl font-bold text-patriotWhite mb-2">0</div>
            <div className="text-sm text-patriotWhite/70">
              Submit your first proposal
            </div>
          </div>
        </div>

        {/* Enhanced Timestamps */}
        <div className="mt-8 pt-6 border-t border-patriotBlue/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3">
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
                <div className="flex items-center gap-3">
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
