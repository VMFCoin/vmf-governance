'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

interface ProfileButtonProps {
  onCreateProfile?: () => void;
  onViewProfile?: () => void;
  onDisconnect?: () => void;
  className?: string;
}

export const ProfileButton: React.FC<ProfileButtonProps> = ({
  onCreateProfile,
  onViewProfile,
  onDisconnect,
  className,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Use wagmi's useAccount for connection status (same as Header)
  const { address } = useAccount();

  // Use useProfile for profile-specific data only
  const { profile, hasProfile, fetchProfileIfNeeded } = useProfile();

  // Fetch profile when wallet connects
  useEffect(() => {
    if (address) {
      fetchProfileIfNeeded();
    }
  }, [address, fetchProfileIfNeeded]);

  // Enhanced dropdown position calculation with better mobile support
  const calculateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const isMobile = viewportWidth < 640;

      // Responsive dropdown sizing
      const dropdownWidth = isMobile ? Math.min(280, viewportWidth - 32) : 256;
      const dropdownHeight = 200; // Approximate dropdown height
      const padding = isMobile ? 16 : 20;

      let left = rect.right + window.scrollX - dropdownWidth;
      let top = rect.bottom + window.scrollY + 8;

      // Adjust horizontal position
      if (left < padding) {
        left = padding;
      } else if (left + dropdownWidth > viewportWidth - padding) {
        left = viewportWidth - dropdownWidth - padding;
      }

      // Adjust vertical position to prevent overflow
      if (top + dropdownHeight > viewportHeight + window.scrollY - padding) {
        // Show dropdown above button if there's not enough space below
        top = rect.top + window.scrollY - dropdownHeight - 8;

        // If still not enough space above, position at top of viewport
        if (top < window.scrollY + padding) {
          top = window.scrollY + padding;
        }
      }

      setDropdownPosition({
        top: top,
        left: left,
      });
    }
  };

  // Close dropdown when clicking outside or on escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      calculateDropdownPosition();

      // Recalculate position on scroll/resize with throttling
      let timeoutId: NodeJS.Timeout;
      const handlePositionUpdate = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(calculateDropdownPosition, 16); // ~60fps
      };

      window.addEventListener('scroll', handlePositionUpdate, {
        passive: true,
      });
      window.addEventListener('resize', handlePositionUpdate);

      // Prevent body scroll on mobile when dropdown is open
      if (window.innerWidth < 640) {
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
        window.removeEventListener('scroll', handlePositionUpdate);
        window.removeEventListener('resize', handlePositionUpdate);
        clearTimeout(timeoutId);

        // Restore body scroll
        document.body.style.overflow = 'unset';
      };
    }
  }, [isDropdownOpen, profile]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleCreateProfile = () => {
    setIsDropdownOpen(false);
    onCreateProfile?.();
  };

  const handleViewProfile = () => {
    setIsDropdownOpen(false);
    onViewProfile?.();
  };

  const handleDisconnect = () => {
    setIsDropdownOpen(false);
    onDisconnect?.();
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropdownOpen(prev => !prev);
  };

  // Use address presence for reliable connection detection
  if (!address) {
    return null;
  }

  // Enhanced dropdown content with better mobile support
  const dropdownContent = isDropdownOpen && (
    <>
      {/* Mobile backdrop overlay */}
      {window.innerWidth < 640 && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          style={{ zIndex: 9998 }}
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

      <div
        ref={dropdownRef}
        className={cn(
          'fixed bg-backgroundLight border border-patriotBlue/30 rounded-lg sm:rounded-xl shadow-2xl py-2',
          'max-h-[80vh] overflow-y-auto',
          // Responsive width
          'w-[calc(100vw-2rem)] max-w-xs sm:w-64 sm:max-w-sm'
        )}
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          zIndex: 9999,
          background:
            'linear-gradient(135deg, rgba(27, 41, 81, 0.98) 0%, rgba(42, 59, 92, 0.95) 100%)',
          backdropFilter: 'blur(12px)',
          boxShadow:
            '0 25px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(27, 41, 81, 0.3)',
        }}
      >
        {/* Enhanced Profile Section */}
        <div className="px-3 sm:px-4 py-3 sm:py-4 border-b border-patriotBlue/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-backgroundBase flex items-center justify-center flex-shrink-0 border-2 border-patriotBlue/20">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-patriotWhite text-sm sm:text-base truncate">
                {hasProfile ? profile?.name || 'Anonymous' : 'No Profile'}
              </div>
              <div className="text-xs sm:text-sm text-textSecondary truncate mt-0.5">
                {address ? formatAddress(address) : ''}
              </div>
              {/* Profile status indicator */}
              <div className="mt-1">
                {hasProfile ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Profile Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-yellow-400">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    Setup Required
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Menu Items */}
        <div className="py-1">
          {!hasProfile ? (
            <button
              onClick={handleCreateProfile}
              className={cn(
                'w-full px-3 sm:px-4 py-3 text-left text-sm sm:text-base',
                'text-textBase hover:bg-backgroundAccent hover:text-patriotWhite',
                'transition-all duration-200 flex items-center gap-3',
                'active:bg-backgroundAccent/80', // Touch feedback
                'focus:outline-none focus:bg-backgroundAccent/50'
              )}
            >
              <div className="w-8 h-8 rounded-full bg-patriotBlue/20 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-patriotBlue" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">Create Profile</div>
                <div className="text-xs text-textSecondary truncate">
                  Required for governance participation
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={handleViewProfile}
              className={cn(
                'w-full px-3 sm:px-4 py-3 text-left text-sm sm:text-base',
                'text-textBase hover:bg-backgroundAccent hover:text-patriotWhite',
                'transition-all duration-200 flex items-center gap-3',
                'active:bg-backgroundAccent/80', // Touch feedback
                'focus:outline-none focus:bg-backgroundAccent/50'
              )}
            >
              <div className="w-8 h-8 rounded-full bg-patriotBlue/20 flex items-center justify-center flex-shrink-0">
                <Settings className="w-4 h-4 text-patriotBlue" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">Manage Profile</div>
                <div className="text-xs text-textSecondary truncate">
                  Edit your profile settings
                </div>
              </div>
            </button>
          )}

          <button
            onClick={handleDisconnect}
            className={cn(
              'w-full px-3 sm:px-4 py-3 text-left text-sm sm:text-base',
              'text-patriotRed hover:bg-patriotRed/10 hover:text-patriotRed',
              'transition-all duration-200 flex items-center gap-3',
              'active:bg-patriotRed/20', // Touch feedback
              'focus:outline-none focus:bg-patriotRed/10'
            )}
          >
            <div className="w-8 h-8 rounded-full bg-patriotRed/20 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-4 h-4 text-patriotRed" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">Disconnect Wallet</div>
              <div className="text-xs text-textSecondary truncate">
                Sign out of your account
              </div>
            </div>
          </button>
        </div>

        {/* Enhanced Footer with governance info */}
        <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-patriotBlue/30 bg-backgroundBase/30">
          <div className="text-xs text-textSecondary text-center">
            {hasProfile ? (
              <div className="space-y-1">
                <div className="text-green-400 font-medium">
                  ✓ Ready for Governance
                </div>
                <div>You can now vote on proposals</div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-yellow-400 font-medium">
                  ⚠ Profile Required
                </div>
                <div>Create a profile to participate in voting</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className={cn('relative', className)}>
        {/* Enhanced Profile Button */}
        <button
          ref={buttonRef}
          onClick={handleButtonClick}
          className={cn(
            'flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl',
            'transition-all duration-200 transform',
            'bg-backgroundLight hover:bg-backgroundAccent active:bg-backgroundAccent/80',
            'border border-patriotBlue/30 hover:border-patriotBlue/50',
            'text-textBase hover:text-patriotWhite',
            'min-w-[44px] sm:min-w-[120px] lg:min-w-[160px]', // Touch-friendly minimum size
            'hover:scale-105 active:scale-95', // Interactive scaling
            'focus:outline-none focus:ring-2 focus:ring-patriotBlue/50',
            isDropdownOpen &&
              'bg-backgroundAccent border-patriotBlue/50 scale-105'
          )}
        >
          {/* Enhanced Avatar with status indicator */}
          <div className="relative flex-shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-backgroundBase flex items-center justify-center border border-patriotBlue/20">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              )}
            </div>
            {/* Status dot */}
            <div
              className={cn(
                'absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border border-backgroundLight',
                hasProfile ? 'bg-green-400' : 'bg-yellow-400'
              )}
            />
          </div>

          {/* Profile Info - Enhanced responsive visibility */}
          <div className="hidden sm:block text-left flex-1 min-w-0">
            <div className="text-xs sm:text-sm font-medium truncate">
              {hasProfile ? profile?.name || 'Anonymous' : 'No Profile'}
            </div>
            <div className="text-xs text-textSecondary truncate">
              {address ? formatAddress(address) : ''}
            </div>
          </div>

          {/* Enhanced Dropdown Arrow */}
          <ChevronDown
            className={cn(
              'w-3 h-3 sm:w-4 sm:h-4 transition-all duration-200 flex-shrink-0',
              'text-textSecondary group-hover:text-patriotWhite',
              isDropdownOpen && 'rotate-180 text-patriotBlue'
            )}
          />
        </button>
      </div>

      {/* Render dropdown in portal to bypass stacking context */}
      {typeof window !== 'undefined' &&
        dropdownContent &&
        createPortal(dropdownContent, document.body)}
    </>
  );
};
