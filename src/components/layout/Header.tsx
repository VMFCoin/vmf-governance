'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Star } from 'lucide-react';
import { ConnectWallet } from '../wallet';
import { NotificationPanel } from '../community';
import { mockNotifications } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { SecureConnectWallet } from '../wallet/SecureConnectWallet';
import { HydrationBoundary } from './HydrationBoundary';

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className }) => {
  const pathname = usePathname();

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

  return (
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

          {/* Right Side - Notifications & Wallet */}
          <div className="flex items-center space-x-4">
            <NotificationPanel
              notifications={mockNotifications}
              onNotificationClick={handleNotificationClick}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
            />
            <HydrationBoundary
              fallback={
                <div className="animate-pulse bg-gray-200 h-10 w-32 rounded-lg" />
              }
            >
              <SecureConnectWallet />
            </HydrationBoundary>
          </div>
        </div>
      </div>
    </header>
  );
};
