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
  const { profile, hasProfile } = useProfile();

  // Calculate dropdown position
  const calculateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = window.innerWidth < 640 ? 240 : 256; // Smaller on mobile
      const viewportWidth = window.innerWidth;
      const padding = 16; // Padding from screen edge

      // Calculate left position, ensuring dropdown stays within viewport
      let left = rect.right + window.scrollX - dropdownWidth;

      // Adjust if dropdown would go off-screen on the left
      if (left < padding) {
        left = padding;
      }

      // Adjust if dropdown would go off-screen on the right
      if (left + dropdownWidth > viewportWidth - padding) {
        left = viewportWidth - dropdownWidth - padding;
      }

      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8, // 8px gap
        left: left,
      });
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    console.log('profile', profile);
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

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      calculateDropdownPosition();

      // Recalculate position on scroll/resize
      const handlePositionUpdate = () => calculateDropdownPosition();
      window.addEventListener('scroll', handlePositionUpdate);
      window.addEventListener('resize', handlePositionUpdate);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handlePositionUpdate);
        window.removeEventListener('resize', handlePositionUpdate);
      };
    }
  }, [isDropdownOpen]);

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

  // Dropdown content to be rendered in portal
  const dropdownContent = isDropdownOpen && (
    <div
      ref={dropdownRef}
      className="fixed w-60 sm:w-64 bg-backgroundLight border border-patriotBlue/30 rounded-lg shadow-2xl py-2"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        zIndex: 9999, // Highest possible z-index
        background:
          'linear-gradient(135deg, rgba(27, 41, 81, 0.98) 0%, rgba(42, 59, 92, 0.95) 100%)',
        backdropFilter: 'blur(12px)',
        boxShadow:
          '0 25px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(27, 41, 81, 0.3)',
      }}
    >
      {/* Profile Section */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-patriotBlue/30">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-backgroundBase flex items-center justify-center flex-shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-patriotWhite text-sm sm:text-base truncate">
              {hasProfile ? profile?.name || 'Anonymous' : 'No Profile'}
            </div>
            <div className="text-xs sm:text-sm text-textSecondary truncate">
              {address ? formatAddress(address) : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-1">
        {!hasProfile ? (
          <button
            onClick={handleCreateProfile}
            className="w-full px-3 sm:px-4 py-2 text-left text-sm text-textBase hover:bg-backgroundAccent hover:text-patriotWhite transition-colors duration-200 flex items-center gap-2"
          >
            <User className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Create Profile</span>
          </button>
        ) : (
          <button
            onClick={handleViewProfile}
            className="w-full px-3 sm:px-4 py-2 text-left text-sm text-textBase hover:bg-backgroundAccent hover:text-patriotWhite transition-colors duration-200 flex items-center gap-2"
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Manage Profile</span>
          </button>
        )}

        <button
          onClick={handleDisconnect}
          className="w-full px-3 sm:px-4 py-2 text-left text-sm text-patriotRed hover:bg-patriotRed/10 transition-colors duration-200 flex items-center gap-2"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Disconnect Wallet</span>
        </button>
      </div>

      {/* Profile Status */}
      <div className="px-3 sm:px-4 py-2 border-t border-patriotBlue/30">
        <div className="text-xs text-textSecondary">
          {hasProfile ? (
            <span className="text-green-500">✓ Profile Active</span>
          ) : (
            <span className="text-yellow-500">
              ⚠ Profile Required for Voting
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className={cn('relative', className)}>
        {/* Profile Button */}
        <button
          ref={buttonRef}
          onClick={handleButtonClick}
          className={cn(
            'flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-200',
            'bg-backgroundLight hover:bg-backgroundAccent border border-patriotBlue/30',
            'text-textBase hover:text-patriotWhite',
            'min-w-[40px] sm:min-w-[120px] lg:min-w-[160px]',
            isDropdownOpen && 'bg-backgroundAccent'
          )}
        >
          {/* Avatar */}
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-backgroundBase flex items-center justify-center flex-shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-3 h-3 sm:w-5 sm:h-5 text-gray-400" />
            )}
          </div>

          {/* Profile Info - Hidden on mobile, shown on sm and up */}
          <div className="hidden sm:block text-left flex-1 min-w-0">
            <div className="text-xs sm:text-sm font-medium truncate">
              {hasProfile ? profile?.name || 'Anonymous' : 'No Profile'}
            </div>
            <div className="text-xs text-textSecondary truncate">
              {address ? formatAddress(address) : ''}
            </div>
          </div>

          {/* Dropdown Arrow */}
          <ChevronDown
            className={cn(
              'w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 flex-shrink-0',
              isDropdownOpen && 'rotate-180'
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
