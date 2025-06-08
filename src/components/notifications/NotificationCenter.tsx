'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellRing,
  X,
  Check,
  CheckCheck,
  Settings,
  Trash2,
  ExternalLink,
  Clock,
  AlertCircle,
  Info,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { SimpleTooltip } from '@/components/ui/AnimatedTooltip';
import {
  notificationService,
  VMFNotification,
  NotificationPreferences,
} from '@/services/notificationService';
import { cn } from '@/lib/utils';
import { fadeInVariants, slideUpVariants } from '@/lib/animations';

interface NotificationCenterProps {
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<VMFNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    notificationService.getPreferences()
  );

  // Refresh notifications
  const refreshNotifications = () => {
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadCount());
  };

  // Initialize and set up polling for notifications
  useEffect(() => {
    // Initialize client-side functionality
    notificationService.initializeClient();

    refreshNotifications();

    // Poll for new notifications every 5 seconds
    const interval = setInterval(refreshNotifications, 5000);

    return () => clearInterval(interval);
  }, []);

  // Handle notification click
  const handleNotificationClick = (notification: VMFNotification) => {
    notificationService.markAsRead(notification.id);
    refreshNotifications();

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  // Handle mark as read
  const handleMarkAsRead = (
    notificationId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    notificationService.markAsRead(notificationId);
    refreshNotifications();
  };

  // Handle delete notification
  const handleDeleteNotification = (
    notificationId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    notificationService.deleteNotification(notificationId);
    refreshNotifications();
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
    refreshNotifications();
  };

  // Handle clear all notifications
  const handleClearAll = () => {
    notificationService.clearAllNotifications();
    refreshNotifications();
  };

  // Handle preference update
  const handlePreferenceUpdate = (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    notificationService.updatePreferences(newPreferences);

    // Request browser permission if enabling browser notifications
    if (key === 'browserNotifications' && value) {
      notificationService.requestBrowserPermission();
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: VMFNotification['type']) => {
    switch (type) {
      case 'holiday_proposal':
        return <Trophy className="w-4 h-4 text-starGold" />;
      case 'voting_reminder':
        return <Clock className="w-4 h-4 text-patriotRed" />;
      case 'proposal_result':
        return <CheckCheck className="w-4 h-4 text-green-400" />;
      case 'live_update':
        return <TrendingUp className="w-4 h-4 text-patriotBlue" />;
      case 'milestone':
        return <Trophy className="w-4 h-4 text-starGold" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-patriotRed bg-patriotRed/5';
      case 'medium':
        return 'border-l-starGold bg-starGold/5';
      case 'low':
        return 'border-l-gray-400 bg-gray-400/5';
      default:
        return 'border-l-patriotBlue bg-patriotBlue/5';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <div className={cn('relative', className)}>
      {/* Notification Bell Button */}
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-300 hover:text-white hover:bg-white/10"
        >
          {unreadCount > 0 ? (
            <BellRing className="w-5 h-5" />
          ) : (
            <Bell className="w-5 h-5" />
          )}

          {/* Unread Count Badge */}
          {unreadCount > 0 && (
            <motion.div
              className="absolute -top-1 -right-1 bg-patriotRed text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500 }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.div>
          )}
        </Button>
      </motion.div>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Notification Panel */}
            <motion.div
              className="absolute right-0 top-full mt-2 w-96 max-h-96 z-50"
              variants={slideUpVariants}
              initial="initial"
              animate="enter"
              exit="exit"
            >
              <Card className="bg-backgroundDark/95 backdrop-blur-lg border-white/20 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-5 h-5 text-patriotBlue" />
                    <h3 className="text-lg font-semibold text-white">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <span className="text-sm text-gray-400">
                        ({unreadCount} unread)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <SimpleTooltip text="Settings">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-1 text-gray-400 hover:text-white"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </SimpleTooltip>

                    <SimpleTooltip text="Close">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsOpen(false)}
                        className="p-1 text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </SimpleTooltip>
                  </div>
                </div>

                {/* Settings Panel */}
                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      className="p-4 border-b border-white/10 bg-white/5"
                      variants={fadeInVariants}
                      initial="initial"
                      animate="enter"
                      exit="exit"
                    >
                      <h4 className="text-sm font-medium text-white mb-3">
                        Notification Preferences
                      </h4>

                      <div className="space-y-2">
                        {Object.entries(preferences).map(([key, value]) => (
                          <label
                            key={key}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-gray-300 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </span>
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={e =>
                                handlePreferenceUpdate(
                                  key as keyof NotificationPreferences,
                                  e.target.checked
                                )
                              }
                              className="rounded border-gray-600 bg-gray-700 text-patriotBlue focus:ring-patriotBlue"
                            />
                          </label>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                {notifications.length > 0 && (
                  <div className="flex items-center justify-between p-3 border-b border-white/10 bg-white/5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-patriotBlue hover:text-white"
                      disabled={unreadCount === 0}
                    >
                      <CheckCheck className="w-3 h-3 mr-1" />
                      Mark all read
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAll}
                      className="text-xs text-gray-400 hover:text-patriotRed"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Clear all
                    </Button>
                  </div>
                )}

                {/* Notifications List */}
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">
                        No notifications yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {notifications.map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          className={cn(
                            'p-3 rounded-lg border-l-4 cursor-pointer transition-all duration-200',
                            getPriorityColor(notification.priority),
                            notification.isRead
                              ? 'opacity-60 hover:opacity-80'
                              : 'hover:bg-white/10',
                            'group'
                          )}
                          onClick={() => handleNotificationClick(notification)}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <h4
                                  className={cn(
                                    'text-sm font-medium truncate',
                                    notification.isRead
                                      ? 'text-gray-300'
                                      : 'text-white'
                                  )}
                                >
                                  {notification.title}
                                </h4>

                                <div className="flex items-center space-x-1 ml-2">
                                  {!notification.isRead && (
                                    <SimpleTooltip text="Mark as read">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={e =>
                                          handleMarkAsRead(notification.id, e)
                                        }
                                        className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Check className="w-3 h-3 text-green-400" />
                                      </Button>
                                    </SimpleTooltip>
                                  )}

                                  <SimpleTooltip text="Delete">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={e =>
                                        handleDeleteNotification(
                                          notification.id,
                                          e
                                        )
                                      }
                                      className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="w-3 h-3 text-gray-400 hover:text-patriotRed" />
                                    </Button>
                                  </SimpleTooltip>
                                </div>
                              </div>

                              <p
                                className={cn(
                                  'text-xs mt-1 line-clamp-2',
                                  notification.isRead
                                    ? 'text-gray-400'
                                    : 'text-gray-300'
                                )}
                              >
                                {notification.message}
                              </p>

                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500">
                                  {formatTimestamp(notification.timestamp)}
                                </span>

                                {notification.actionUrl && (
                                  <ExternalLink className="w-3 h-3 text-gray-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
