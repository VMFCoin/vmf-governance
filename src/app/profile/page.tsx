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
import { useProfile } from '@/hooks/useProfile';
import { useUserProfileStore } from '@/stores/useUserProfileStore';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  // Redirect if not connected
  if (!isConnected && !isLoading) {
    return (
      <div className="min-h-screen bg-backgroundBase flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-patriotBlue/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-patriotBlue" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-patriotWhite mb-3">
            Wallet Not Connected
          </h1>
          <p className="text-textSecondary mb-8 leading-relaxed">
            Please connect your wallet to view your profile and participate in
            VMF governance.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-4 bg-patriotBlue text-patriotWhite rounded-xl hover:bg-patriotBlue/80 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="min-h-screen bg-backgroundBase flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative flex items-center justify-center w-16 h-16 mx-auto mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-patriotBlue/20 border-t-patriotBlue"></div>
            <div
              className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-r-patriotRed border-l-patriotRed"
              style={{
                animationDirection: 'reverse',
                animationDuration: '1.5s',
              }}
            ></div>
          </div>
          <p className="text-textSecondary text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <>
      {/* Profile Stats */}
      <div className="bg-gradient-to-br from-backgroundLight to-backgroundAccent border border-patriotBlue/30 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-patriotWhite mb-6 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-patriotBlue" />
          Profile Overview
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2">
            <span className="text-patriotWhite flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Status
            </span>
            <span
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200',
                hasProfile
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              )}
            >
              {hasProfile ? '✓ Active' : '⚠ Incomplete'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-patriotWhite flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Member Since
            </span>
            <span className="text-patriotWhite font-medium">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Recently'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-patriotWhite flex items-center gap-2">
              <Vote className="w-4 h-4" />
              Votes Cast
            </span>
            <span className="text-patriotWhite font-medium">0</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-patriotWhite flex items-center gap-2">
              <Target className="w-4 h-4" />
              Proposals
            </span>
            <span className="text-patriotWhite font-medium">0</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-backgroundLight to-backgroundAccent border border-patriotBlue/30 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-patriotWhite mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5 text-patriotBlue" />
          Quick Actions
        </h3>
        <div className="space-y-3">
          <button
            onClick={() => router.push('/proposals')}
            className="w-full group px-4 py-3 text-left text-textBase hover:bg-patriotBlue/10 hover:text-patriotWhite transition-all duration-200 rounded-lg border border-transparent hover:border-patriotBlue/30 flex items-center justify-between"
          >
            <span className="flex items-center gap-3">
              <Vote className="w-4 h-4" />
              View Proposals
            </span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
          <button
            onClick={() => router.push('/charities')}
            className="w-full group px-4 py-3 text-left text-textBase hover:bg-patriotBlue/10 hover:text-patriotWhite transition-all duration-200 rounded-lg border border-transparent hover:border-patriotBlue/30 flex items-center justify-between"
          >
            <span className="flex items-center gap-3">
              <Trophy className="w-4 h-4" />
              Browse Charities
            </span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
          <button
            onClick={() => router.push('/submit')}
            className="w-full group px-4 py-3 text-left text-textBase hover:bg-patriotRed/10 hover:text-patriotWhite transition-all duration-200 rounded-lg border border-transparent hover:border-patriotRed/30 flex items-center justify-between"
          >
            <span className="flex items-center gap-3">
              <Target className="w-4 h-4" />
              Submit Proposal
            </span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </div>
      </div>

      {/* Profile Completion */}
      {!hasProfile && (
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/30 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
            <User className="w-5 h-5" />
            Complete Your Profile
          </h3>
          <p className="text-patriotWhite/80 text-sm mb-4 leading-relaxed">
            Create your profile to unlock full governance participation and
            voting rights in the VMF ecosystem.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-patriotWhite">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              Enhanced voting power
            </div>
            <div className="flex items-center gap-2 text-sm text-patriotWhite">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              Proposal submission rights
            </div>
            <div className="flex items-center gap-2 text-sm text-patriotWhite">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              Community recognition
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full mt-4 px-4 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-all duration-200 font-semibold transform hover:scale-105 shadow-lg hover:shadow-xl"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-textSecondary hover:text-patriotWhite hover:bg-patriotBlue/10 transition-all duration-200 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-patriotWhite">
                  Profile Dashboard
                </h1>
                <p className="text-textSecondary mt-1 text-sm sm:text-base">
                  Manage your VMF governance profile and voting power
                </p>
              </div>
            </div>

            {/* Mobile Sidebar Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-textSecondary hover:text-patriotWhite hover:bg-patriotBlue/10 transition-all duration-200 rounded-lg"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content with Enhanced Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Main Profile Section */}
          <div className="lg:col-span-8 space-y-6 sm:space-y-8">
            {hasProfile ? (
              <ProfileCard
                showVotingPower={true}
                onEditComplete={() => {
                  // Profile updated, no additional action needed
                }}
                className="shadow-xl"
              />
            ) : (
              <div className="bg-gradient-to-br from-backgroundLight to-backgroundAccent border border-patriotBlue/30 rounded-xl p-8 text-center shadow-xl">
                <div className="w-20 h-20 bg-patriotBlue/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="w-10 h-10 text-patriotBlue" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-patriotWhite mb-3">
                  Welcome to VMF Governance
                </h2>
                <p className="text-textSecondary mb-8 max-w-md mx-auto leading-relaxed">
                  Create your profile to start participating in decentralized
                  governance and help shape the future of VMF.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-8 py-4 bg-patriotBlue text-patriotWhite rounded-xl hover:bg-patriotBlue/80 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold flex items-center gap-3 mx-auto"
                >
                  <User className="w-5 h-5" />
                  Create Your Profile
                </button>
              </div>
            )}

            {/* Enhanced Activity Section */}
            {hasProfile && (
              <div className="bg-gradient-to-br from-backgroundLight to-backgroundAccent border border-patriotBlue/30 rounded-xl p-6 shadow-xl">
                <h3 className="text-xl sm:text-2xl font-bold text-patriotWhite mb-6 flex items-center gap-3">
                  <Activity className="w-6 h-6 text-patriotBlue" />
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-4 border-b border-patriotBlue/20 last:border-b-0">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-patriotBlue/20 rounded-full flex items-center justify-center">
                        <Vote className="w-5 h-5 text-patriotBlue" />
                      </div>
                      <div>
                        <p className="text-patriotWhite font-semibold">
                          Profile Created
                        </p>
                        <p className="text-textSecondary text-sm">
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
                    <div className="text-green-500 text-sm font-medium">
                      Completed
                    </div>
                  </div>
                  <div className="text-center py-12 text-textSecondary bg-patriotBlue/5 rounded-lg border border-patriotBlue/10">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">
                      More activity coming soon
                    </p>
                    <p className="text-sm">
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

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="absolute right-0 top-0 h-full w-80 max-w-[80vw] bg-backgroundBase border-l border-patriotBlue/30 overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-patriotWhite">
                  Profile Menu
                </h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-textSecondary hover:text-patriotWhite hover:bg-patriotBlue/10 transition-all duration-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
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
        />
      )}
    </div>
  );
}
