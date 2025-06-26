'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Settings,
  Trophy,
  Vote,
  Calendar,
  ArrowLeft,
  Menu,
  X,
  ChevronRight,
  Activity,
  Shield,
  Target,
  Edit,
  MapPin,
  Mail,
  Globe,
  Github,
  Twitter,
  Linkedin,
  ExternalLink,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { CreateProfileModal } from '@/components/profile/CreateProfileModal';
import { TokenLockingModal } from '@/components/voting/TokenLockingModal';
import { useProfile } from '@/hooks/useProfile';
import { useUserProfileStore } from '@/stores/useUserProfileStore';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLockingModal, setShowLockingModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, hasProfile, isConnected, isLoading, walletAddress } =
    useProfile();
  const { fetchProfileIfNeeded } = useUserProfileStore();

  // Fetch profile when connected
  useEffect(() => {
    if (isConnected && walletAddress) {
      fetchProfileIfNeeded(walletAddress);
    }
  }, [isConnected, walletAddress, fetchProfileIfNeeded]);

  // Close sidebar on route change or escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll on mobile
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  // Handle create profile completion
  const handleCreateProfile = async (data: {
    displayName: string;
    avatarUrl?: string;
  }) => {
    // This would typically call your profile creation API
    console.log('Creating profile with:', data);
    // For now, just close the modal
    setShowCreateModal(false);
  };

  // Redirect if not connected
  if (!isConnected && !isLoading) {
    return (
      <div className="min-h-screen bg-backgroundBase flex items-center justify-center p-4 sm:p-6">
        <div className="text-center max-w-sm sm:max-w-md">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-patriotBlue/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <User className="w-8 h-8 sm:w-10 sm:h-10 text-patriotBlue" />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-patriotWhite mb-2 sm:mb-3">
            Wallet Not Connected
          </h1>
          <p className="text-textSecondary mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base">
            Please connect your wallet to view your profile and participate in
            VMF governance.
          </p>
          <button
            onClick={() => router.push('/')}
            className={cn(
              'px-6 py-3 sm:px-8 sm:py-4 bg-patriotBlue text-patriotWhite',
              'rounded-lg sm:rounded-xl hover:bg-patriotBlue/80',
              'transition-all duration-300 transform hover:scale-105 active:scale-95',
              'shadow-lg hover:shadow-xl font-medium text-sm sm:text-base',
              'focus:outline-none focus:ring-2 focus:ring-patriotBlue/50'
            )}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!hasProfile && isLoading) {
    return (
      <div className="min-h-screen bg-backgroundBase flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-patriotBlue/20 border-t-patriotBlue"></div>
            <div
              className="absolute inset-0 animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-transparent border-r-patriotRed border-l-patriotRed"
              style={{
                animationDirection: 'reverse',
                animationDuration: '1.5s',
              }}
            ></div>
          </div>
          <p className="text-textSecondary text-base sm:text-lg">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <>
      {/* Enhanced Profile Stats */}
      <div className="bg-gradient-to-br from-backgroundLight to-backgroundAccent border border-patriotBlue/30 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg">
        <h3 className="text-base sm:text-lg font-bold text-patriotWhite mb-4 sm:mb-6 flex items-center gap-2">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-patriotBlue" />
          Profile Overview
        </h3>
        <div className="space-y-3 sm:space-y-4">
          <div className="flex justify-between items-center py-2">
            <span className="text-patriotWhite flex items-center gap-2 text-sm sm:text-base">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
              Status
            </span>
            <span
              className={cn(
                'px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold transition-all duration-200',
                hasProfile
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              )}
            >
              {hasProfile ? '✓ Active' : '⚠ Incomplete'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-patriotWhite flex items-center gap-2 text-sm sm:text-base">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              Member Since
            </span>
            <span className="text-patriotWhite font-medium text-sm sm:text-base">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Recently'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-patriotWhite flex items-center gap-2 text-sm sm:text-base">
              <Vote className="w-3 h-3 sm:w-4 sm:h-4" />
              Votes Cast
            </span>
            <span className="text-patriotWhite font-medium text-sm sm:text-base">
              0
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-patriotWhite flex items-center gap-2 text-sm sm:text-base">
              <Target className="w-3 h-3 sm:w-4 sm:h-4" />
              Proposals
            </span>
            <span className="text-patriotWhite font-medium text-sm sm:text-base">
              0
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Actions */}
      <div className="bg-gradient-to-br from-backgroundLight to-backgroundAccent border border-patriotBlue/30 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg">
        <h3 className="text-base sm:text-lg font-bold text-patriotWhite mb-4 sm:mb-6 flex items-center gap-2">
          <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-patriotBlue" />
          Quick Actions
        </h3>
        <div className="space-y-2 sm:space-y-3">
          <button
            onClick={() => {
              router.push('/proposals');
              setSidebarOpen(false); // Close sidebar on mobile
            }}
            className={cn(
              'w-full group px-3 py-2.5 sm:px-4 sm:py-3 text-left text-sm sm:text-base',
              'text-textBase hover:bg-patriotBlue/10 hover:text-patriotWhite',
              'transition-all duration-200 rounded-lg border border-transparent hover:border-patriotBlue/30',
              'flex items-center justify-between',
              'active:bg-patriotBlue/20 focus:outline-none focus:bg-patriotBlue/10'
            )}
          >
            <span className="flex items-center gap-2 sm:gap-3">
              <Vote className="w-4 h-4" />
              View Proposals
            </span>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
          <button
            onClick={() => {
              router.push('/charities');
              setSidebarOpen(false);
            }}
            className={cn(
              'w-full group px-3 py-2.5 sm:px-4 sm:py-3 text-left text-sm sm:text-base',
              'text-textBase hover:bg-patriotBlue/10 hover:text-patriotWhite',
              'transition-all duration-200 rounded-lg border border-transparent hover:border-patriotBlue/30',
              'flex items-center justify-between',
              'active:bg-patriotBlue/20 focus:outline-none focus:bg-patriotBlue/10'
            )}
          >
            <span className="flex items-center gap-2 sm:gap-3">
              <Trophy className="w-4 h-4" />
              Browse Charities
            </span>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
          <button
            onClick={() => {
              router.push('/submit');
              setSidebarOpen(false);
            }}
            className={cn(
              'w-full group px-3 py-2.5 sm:px-4 sm:py-3 text-left text-sm sm:text-base',
              'text-textBase hover:bg-patriotRed/10 hover:text-patriotWhite',
              'transition-all duration-200 rounded-lg border border-transparent hover:border-patriotRed/30',
              'flex items-center justify-between',
              'active:bg-patriotRed/20 focus:outline-none focus:bg-patriotRed/10'
            )}
          >
            <span className="flex items-center gap-2 sm:gap-3">
              <Target className="w-4 h-4" />
              Submit Proposal
            </span>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </div>
      </div>

      {/* Enhanced Profile Completion */}
      {!hasProfile && (
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/30 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg">
          <h3 className="text-base sm:text-lg font-bold text-yellow-400 mb-2 sm:mb-3 flex items-center gap-2">
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
            Complete Your Profile
          </h3>
          <p className="text-patriotWhite/80 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
            Create your profile to unlock full governance participation and
            voting rights in the VMF ecosystem.
          </p>
          <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-patriotWhite">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full"></div>
              Enhanced voting power
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-patriotWhite">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full"></div>
              Proposal submission rights
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-patriotWhite">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full"></div>
              Community recognition
            </div>
          </div>
          <button
            onClick={() => {
              setShowCreateModal(true);
              setSidebarOpen(false);
            }}
            className={cn(
              'w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-yellow-500 text-black',
              'rounded-lg hover:bg-yellow-400 transition-all duration-200',
              'font-semibold transform hover:scale-105 active:scale-95',
              'shadow-lg hover:shadow-xl text-sm sm:text-base',
              'focus:outline-none focus:ring-2 focus:ring-yellow-400/50'
            )}
          >
            Create Profile Now
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-backgroundBase">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-backgroundLight via-backgroundAccent to-backgroundLight border-b border-patriotBlue/30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <button
                onClick={() => router.back()}
                className={cn(
                  'p-1.5 sm:p-2 text-textSecondary hover:text-patriotWhite',
                  'hover:bg-patriotBlue/10 transition-all duration-200 rounded-lg',
                  'active:scale-95 focus:outline-none focus:ring-2 focus:ring-patriotBlue/50'
                )}
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-patriotWhite truncate">
                  Profile Dashboard
                </h1>
                <p className="text-textSecondary mt-0.5 sm:mt-1 text-xs sm:text-sm lg:text-base truncate">
                  Manage your VMF governance profile and voting power
                </p>
              </div>
            </div>

            {/* Enhanced Mobile Sidebar Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={cn(
                'lg:hidden p-2 text-textSecondary hover:text-patriotWhite',
                'hover:bg-patriotBlue/10 transition-all duration-200 rounded-lg',
                'active:scale-95 focus:outline-none focus:ring-2 focus:ring-patriotBlue/50',
                sidebarOpen && 'bg-patriotBlue/10 text-patriotWhite'
              )}
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Main Content with Responsive Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Profile Section */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-6 lg:space-y-8">
            {hasProfile ? (
              <ProfileCard
                showVotingPower={true}
                onEditComplete={() => {
                  // Profile updated, no additional action needed
                }}
                onLockTokens={() => setShowLockingModal(true)}
                className="shadow-xl"
              />
            ) : (
              <div className="bg-gradient-to-br from-backgroundLight to-backgroundAccent border border-patriotBlue/30 rounded-lg sm:rounded-xl p-6 sm:p-8 text-center shadow-xl">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-patriotBlue/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <User className="w-8 h-8 sm:w-10 sm:h-10 text-patriotBlue" />
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-patriotWhite mb-2 sm:mb-3">
                  Welcome to VMF Governance
                </h2>
                <p className="text-textSecondary mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed text-sm sm:text-base">
                  Create your profile to start participating in decentralized
                  governance and help shape the future of VMF.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className={cn(
                    'px-6 py-3 sm:px-8 sm:py-4 bg-patriotBlue text-patriotWhite',
                    'rounded-lg sm:rounded-xl hover:bg-patriotBlue/80',
                    'transition-all duration-300 transform hover:scale-105 active:scale-95',
                    'shadow-lg hover:shadow-xl font-semibold',
                    'flex items-center gap-2 sm:gap-3 mx-auto text-sm sm:text-base',
                    'focus:outline-none focus:ring-2 focus:ring-patriotBlue/50'
                  )}
                >
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  Create Your Profile
                </button>
              </div>
            )}

            {/* Enhanced Activity Section */}
            {hasProfile && (
              <div className="bg-gradient-to-br from-backgroundLight to-backgroundAccent border border-patriotBlue/30 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-xl">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-patriotWhite mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-patriotBlue" />
                  Recent Activity
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between py-3 sm:py-4 border-b border-patriotBlue/20 last:border-b-0">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-patriotBlue/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <Vote className="w-4 h-4 sm:w-5 sm:h-5 text-patriotBlue" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-patriotWhite font-semibold text-sm sm:text-base truncate">
                          Profile Created
                        </p>
                        <p className="text-textSecondary text-xs sm:text-sm truncate">
                          {profile?.created_at
                            ? new Date(profile.created_at).toLocaleDateString(
                                'en-US',
                                {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                                }
                              )
                            : 'Recently'}
                        </p>
                      </div>
                    </div>
                    <div className="text-green-500 text-xs sm:text-sm font-medium flex-shrink-0">
                      Completed
                    </div>
                  </div>
                  <div className="text-center py-8 sm:py-12 text-textSecondary bg-patriotBlue/5 rounded-lg border border-patriotBlue/10">
                    <Activity className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                    <p className="text-base sm:text-lg font-medium mb-1 sm:mb-2">
                      More activity coming soon
                    </p>
                    <p className="text-xs sm:text-sm px-4">
                      Start voting on proposals to see your governance activity
                      here
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Sidebar - Desktop */}
          <div className="hidden lg:block lg:col-span-4 space-y-6">
            {sidebarContent}
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div
            className={cn(
              'absolute right-0 top-0 h-full bg-backgroundBase border-l border-patriotBlue/30',
              'overflow-y-auto transform transition-transform duration-300',
              'w-80 max-w-[85vw] sm:max-w-[75vw]',
              sidebarOpen ? 'translate-x-0' : 'translate-x-full'
            )}
          >
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-patriotWhite">
                  Profile Menu
                </h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'p-1.5 sm:p-2 text-textSecondary hover:text-patriotWhite',
                    'hover:bg-patriotBlue/10 transition-all duration-200 rounded-lg',
                    'active:scale-95 focus:outline-none focus:ring-2 focus:ring-patriotBlue/50'
                  )}
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              {sidebarContent}
            </div>
          </div>
        </div>
      )}

      {/* Create Profile Modal */}
      {showCreateModal && (
        <CreateProfileModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateProfile={handleCreateProfile}
        />
      )}

      {/* Token Locking Modal */}
      {showLockingModal && (
        <TokenLockingModal
          isOpen={showLockingModal}
          onClose={() => setShowLockingModal(false)}
          onLockCreated={() => {
            setShowLockingModal(false);
            // The ProfileCard will automatically refresh its data via useEffect
          }}
        />
      )}
    </div>
  );
}
