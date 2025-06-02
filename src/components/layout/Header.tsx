'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Bell,
  Wallet,
  Home,
  FileText,
  Users,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationPanel } from '../community/NotificationPanel';
import { ConnectWallet } from '../wallet';
import { mockNotifications } from '@/data/mockData';

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className }) => {
  const pathname = usePathname();
  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu when route changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  React.useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const navigationItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/proposals', label: 'Proposals', icon: FileText },
    { href: '/community', label: 'Community', icon: Users },
    { href: '/submit', label: 'Submit', icon: Plus },
  ];

  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const handleNotificationClick = (notification: any) => {
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    console.log('Marking notification as read:', notificationId);
  };

  const handleMarkAllAsRead = () => {
    console.log('Marking all notifications as read');
  };

  return (
    <>
      <motion.header
        className={cn(
          'sticky top-0 z-40 w-full border-b border-patriotBlue/30 bg-backgroundDark/95 backdrop-blur supports-[backdrop-filter]:bg-backgroundDark/60',
          className
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <motion.div
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-patriotBlue to-patriotRed flex items-center justify-center">
                  <span className="text-patriotWhite font-bold text-sm">V</span>
                </div>
                <span className="font-display text-xl font-bold text-patriotWhite">
                  VMF Voice
                </span>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigationItems.map(item => {
                const isActive = isActiveRoute(item.href);
                return (
                  <motion.div
                    key={item.href}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        'relative px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-lg',
                        isActive
                          ? 'text-patriotWhite bg-patriotBlue/20'
                          : 'text-textSecondary hover:text-patriotWhite hover:bg-patriotBlue/10'
                      )}
                    >
                      {item.label}
                      {isActive && (
                        <motion.div
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-patriotBlue rounded-full"
                          layoutId="activeTab"
                          transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 30,
                          }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Notification Button */}
              <motion.button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 text-textSecondary hover:text-patriotWhite transition-colors duration-200 rounded-lg hover:bg-patriotBlue/10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-patriotRed rounded-full"></span>
              </motion.button>

              {/* Wallet Connection */}
              <ConnectWallet />
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-textSecondary hover:text-patriotWhite transition-colors duration-200 rounded-lg hover:bg-patriotBlue/10 touch-manipulation"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Toggle mobile menu"
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-6 w-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-6 w-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Desktop Notification Panel */}
        <AnimatePresence>
          {isNotificationOpen && !isMobile && (
            <motion.div
              className="absolute right-4 top-full mt-2 z-50"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <NotificationPanel
                notifications={mockNotifications}
                onNotificationClick={handleNotificationClick}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile Menu */}
            <motion.div
              className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-backgroundDark border-l border-patriotBlue/30 md:hidden"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="flex flex-col h-full">
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between p-4 border-b border-patriotBlue/30">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-patriotBlue to-patriotRed flex items-center justify-center">
                      <span className="text-patriotWhite font-bold text-sm">
                        V
                      </span>
                    </div>
                    <span className="font-display text-lg font-bold text-patriotWhite">
                      VMF Voice
                    </span>
                  </div>
                  <motion.button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-textSecondary hover:text-patriotWhite transition-colors duration-200 rounded-lg hover:bg-patriotBlue/10 touch-manipulation"
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="h-6 w-6" />
                  </motion.button>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2">
                  {navigationItems.map((item, index) => {
                    const isActive = isActiveRoute(item.href);
                    const Icon = item.icon;

                    return (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center space-x-3 px-4 py-3 text-base font-medium transition-colors duration-200 rounded-lg touch-manipulation',
                            isActive
                              ? 'text-patriotWhite bg-patriotBlue/20 border border-patriotBlue/30'
                              : 'text-textSecondary hover:text-patriotWhite hover:bg-patriotBlue/10'
                          )}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                          {isActive && (
                            <motion.div
                              className="ml-auto w-2 h-2 bg-patriotBlue rounded-full"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{
                                type: 'spring',
                                stiffness: 400,
                                damping: 10,
                              }}
                            />
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                {/* Mobile Actions */}
                <div className="p-4 border-t border-patriotBlue/30 space-y-4">
                  {/* Mobile Notifications */}
                  <motion.button
                    onClick={() => {
                      setIsNotificationOpen(!isNotificationOpen);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between w-full px-4 py-3 text-base font-medium text-textSecondary hover:text-patriotWhite transition-colors duration-200 rounded-lg hover:bg-patriotBlue/10 touch-manipulation"
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3">
                      <Bell className="h-5 w-5" />
                      <span>Notifications</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-patriotRed">3</span>
                      <div className="w-2 h-2 bg-patriotRed rounded-full"></div>
                    </div>
                  </motion.button>

                  {/* Mobile Wallet */}
                  <div className="px-4">
                    <ConnectWallet />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Notification Panel */}
      <AnimatePresence>
        {isNotificationOpen && isMobile && (
          <motion.div
            className="fixed inset-0 z-50 bg-backgroundDark md:hidden"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-patriotBlue/30">
                <h2 className="text-lg font-semibold text-patriotWhite">
                  Notifications
                </h2>
                <motion.button
                  onClick={() => setIsNotificationOpen(false)}
                  className="p-2 text-textSecondary hover:text-patriotWhite transition-colors duration-200 rounded-lg hover:bg-patriotBlue/10 touch-manipulation"
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="h-6 w-6" />
                </motion.button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <NotificationPanel
                  notifications={mockNotifications}
                  onNotificationClick={handleNotificationClick}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAllAsRead={handleMarkAllAsRead}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
