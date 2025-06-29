'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Star, Menu, X } from 'lucide-react';
import { useDisconnect } from 'wagmi';
import { ConnectWallet } from '../wallet';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { ProfileButton } from '../profile/ProfileButton';
import { CreateProfileModal } from '../profile/CreateProfileModal';
import { cn } from '@/lib/utils';
import { SecureConnectWallet } from '../wallet/SecureConnectWallet';
import { HydrationBoundary } from './HydrationBoundary';
import { useWalletSync } from '@/hooks/useWalletSync';
import { useProfile } from '@/hooks/useProfile';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isConnected, address } = useWalletSync();
  const { createProfile } = useProfile();
  const { disconnect } = useDisconnect();
  const [showCreateProfileModal, setShowCreateProfileModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/vote', label: 'Proposals' },
    { href: '/charities', label: 'Charities' },
    { href: '/community', label: 'Community' },
    { href: '/submit', label: 'Submit' },
  ];

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when mobile menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleCreateProfile = () => {
    setShowCreateProfileModal(true);
  };

  const handleCreateProfileSubmit = async (data: {
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
      setShowCreateProfileModal(false);
    } catch (error) {
      console.error('Failed to create profile in Header:', error);
      throw error;
    }
  };

  const handleViewProfile = () => {
    router.push('/profile');
  };

  const handleDisconnect = () => {
    console.log('Disconnecting wallet...');
    disconnect();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const mobileMenuVariants = {
    closed: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2,
        ease: 'easeInOut',
      },
    },
    open: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  };

  const navItemVariants = {
    closed: {
      opacity: 0,
      x: -20,
    },
    open: (index: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.3,
        ease: 'easeOut',
      },
    }),
  };

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 border-b border-patriotBlue/30 bg-backgroundLight/50 backdrop-blur-sm',
          className
        )}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4 md:py-6">
            {/* Logo - Responsive sizing */}
            <Link href="/" className="flex items-center flex-shrink-0">
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-starGold mr-1.5 sm:mr-2" />
              <h1 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-patriotWhite">
                VMF Voice
              </h1>
            </Link>

            {/* Desktop Navigation - Hidden on mobile/tablet */}
            <nav className="hidden lg:flex space-x-6 xl:space-x-8">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'font-medium transition-all duration-200 px-3 py-2 rounded-lg hover:bg-patriotBlue/10',
                    pathname === item.href
                      ? 'text-patriotRed bg-patriotRed/10'
                      : 'text-textBase hover:text-patriotRed'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right Side - Responsive spacing and sizing */}
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4">
              {/* Notification Center - Hidden on small mobile */}
              <div className="hidden xs:block">
                <NotificationCenter />
              </div>

              {/* Profile Button - Always visible when connected */}
              <ProfileButton
                onCreateProfile={handleCreateProfile}
                onViewProfile={handleViewProfile}
                onDisconnect={handleDisconnect}
                className="flex-shrink-0"
              />

              {/* Wallet Connection - Responsive sizing */}
              {!address && (
                <div className="flex-shrink-0">
                  <HydrationBoundary
                    fallback={
                      <div className="animate-pulse bg-gray-200 h-8 w-20 sm:h-9 sm:w-24 md:h-10 md:w-32 rounded-lg" />
                    }
                  >
                    <SecureConnectWallet
                      showBalance={false}
                      showChainStatus={false}
                      className="text-xs sm:text-sm"
                    />
                  </HydrationBoundary>
                </div>
              )}

              {/* Mobile Menu Button - Only visible on mobile/tablet */}
              <button
                onClick={toggleMobileMenu}
                className={cn(
                  'lg:hidden p-2 rounded-lg transition-all duration-200',
                  'text-textBase hover:text-patriotWhite hover:bg-patriotBlue/10',
                  'focus:outline-none focus:ring-2 focus:ring-patriotBlue/50',
                  'active:scale-95 touch-manipulation',
                  isMobileMenuOpen && 'bg-patriotBlue/10 text-patriotWhite'
                )}
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              variants={mobileMenuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="lg:hidden border-t border-patriotBlue/30 bg-backgroundLight/95 backdrop-blur-md"
            >
              <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4">
                {/* Mobile Navigation Items */}
                <nav className="space-y-1">
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.href}
                      variants={navItemVariants}
                      initial="closed"
                      animate="open"
                      custom={index}
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          'block px-4 py-3 rounded-lg font-medium transition-all duration-200',
                          'text-base sm:text-lg touch-manipulation',
                          pathname === item.href
                            ? 'text-patriotRed bg-patriotRed/10 border-l-4 border-patriotRed'
                            : 'text-textBase hover:text-patriotWhite hover:bg-patriotBlue/10'
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                {/* Mobile-only items */}
                <div className="mt-4 pt-4 border-t border-patriotBlue/30 xs:hidden">
                  <div className="px-4">
                    <NotificationCenter />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu Backdrop */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
        </AnimatePresence>
      </header>

      {/* Create Profile Modal */}
      {showCreateProfileModal && (
        <CreateProfileModal
          isOpen={showCreateProfileModal}
          onClose={() => setShowCreateProfileModal(false)}
          onCreateProfile={handleCreateProfileSubmit}
        />
      )}
    </>
  );
};
