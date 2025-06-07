'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { ConnectWallet } from '../wallet';
import { NotificationPanel } from '../community';
import { ProfileButton } from '../profile/ProfileButton';
import { CreateProfileModal } from '../profile/CreateProfileModal';
import { mockNotifications } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { SecureConnectWallet } from '../wallet/SecureConnectWallet';
import { HydrationBoundary } from './HydrationBoundary';
import { useWalletSync } from '@/hooks/useWalletSync';

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isConnected, address } = useWalletSync();
  const [showCreateProfileModal, setShowCreateProfileModal] = useState(false);

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/vote', label: 'Proposals' },
    { href: '/charities', label: 'Charities' },
    { href: '/community', label: 'Community' },
    { href: '/submit', label: 'Submit' },
  ];

  const handleNotificationClick = (notification: any) => {
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    // In a real app, this would update the notification status
    console.log('Marking notification as read:', notificationId);
  };

  const handleMarkAllAsRead = () => {
    // In a real app, this would mark all notifications as read
    console.log('Marking all notifications as read');
  };

  const handleCreateProfile = () => {
    setShowCreateProfileModal(true);
  };

  const handleViewProfile = () => {
    router.push('/profile');
  };

  const handleDisconnect = () => {
    // This will be handled by the wallet component
    // The ProfileButton will trigger wallet disconnection
  };

  return (
    <>
      <header
        className={cn(
          'border-b border-patriotBlue/30 bg-backgroundLight/50 backdrop-blur-sm',
          className
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Star className="w-6 h-6 text-starGold mr-2" />
              <h1 className="text-2xl font-display font-bold text-patriotWhite">
                VMF Voice
              </h1>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'font-medium transition-colors',
                    pathname === item.href
                      ? 'text-patriotRed'
                      : 'text-textBase hover:text-patriotRed'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right Side - Notifications, Profile & Wallet */}
            <div className="flex items-center space-x-4">
              <NotificationPanel
                notifications={mockNotifications}
                onNotificationClick={handleNotificationClick}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
              />

              {/* Profile Button - Shows when wallet is connected */}
              <ProfileButton
                onCreateProfile={handleCreateProfile}
                onViewProfile={handleViewProfile}
                onDisconnect={handleDisconnect}
              />

              {/* Wallet Connection - Only show connect button when disconnected */}
              {!address && (
                <div className="ml-2 sm:ml-4 lg:ml-6">
                  <HydrationBoundary
                    fallback={
                      <div className="animate-pulse bg-gray-200 h-8 w-24 sm:h-10 sm:w-32 rounded-lg" />
                    }
                  >
                    <SecureConnectWallet
                      showBalance={false}
                      showChainStatus={false}
                    />
                  </HydrationBoundary>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Create Profile Modal */}
      {showCreateProfileModal && (
        <CreateProfileModal
          isOpen={showCreateProfileModal}
          onClose={() => setShowCreateProfileModal(false)}
        />
      )}
    </>
  );
};
