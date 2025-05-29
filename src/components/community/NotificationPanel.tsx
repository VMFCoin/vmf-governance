'use client';

import { useState } from 'react';
import {
  Bell,
  X,
  Check,
  AlertCircle,
  Vote,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import { Notification } from '@/types';
import { Card } from '@/components/ui';

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationPanel({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
}: NotificationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'vote_reminder':
        return <Vote className="w-4 h-4 text-patriotBlue" />;
      case 'new_proposal':
        return <AlertCircle className="w-4 h-4 text-patriotRed" />;
      case 'community_post':
        return <MessageSquare className="w-4 h-4 text-starGold" />;
      case 'event_reminder':
        return <Calendar className="w-4 h-4 text-patriotBlue" />;
      default:
        return <Bell className="w-4 h-4 text-textSecondary" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'vote_reminder':
        return 'border-l-patriotBlue bg-patriotBlue/5';
      case 'new_proposal':
        return 'border-l-patriotRed bg-patriotRed/5';
      case 'community_post':
        return 'border-l-starGold bg-starGold/5';
      case 'event_reminder':
        return 'border-l-patriotBlue bg-patriotBlue/5';
      default:
        return 'border-l-backgroundAccent bg-backgroundAccent/5';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      onMarkAsRead?.(notification.id);
    }
    onNotificationClick?.(notification);
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative p-2 text-textSecondary hover:text-patriotWhite transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-patriotRed text-patriotWhite text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isExpanded && (
        <div className="absolute right-0 top-full mt-2 w-80 z-50">
          <Card className="max-h-96 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-patriotBlue/30">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-patriotBlue" />
                <h3 className="font-semibold text-patriotWhite">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-1 bg-patriotRed text-patriotWhite text-xs rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-xs text-patriotBlue hover:text-patriotRed transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-textSecondary hover:text-patriotWhite transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-patriotBlue/20">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-backgroundAccent/20 border-l-4 ${getNotificationColor(
                        notification.type
                      )} ${!notification.isRead ? 'bg-backgroundAccent/10' : ''}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4
                              className={`text-sm font-medium ${
                                notification.isRead
                                  ? 'text-textSecondary'
                                  : 'text-patriotWhite'
                              }`}
                            >
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  onMarkAsRead?.(notification.id);
                                }}
                                className="text-patriotBlue hover:text-patriotRed transition-colors"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p
                            className={`text-xs leading-relaxed ${
                              notification.isRead
                                ? 'text-textSecondary'
                                : 'text-textBase'
                            }`}
                          >
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-textSecondary">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            {notification.actionUrl && (
                              <span className="text-xs text-patriotBlue">
                                Click to view →
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-textSecondary mx-auto mb-3 opacity-50" />
                  <p className="text-textSecondary">No notifications yet</p>
                  <p className="text-xs text-textSecondary mt-1">
                    You'll see updates about voting, proposals, and community
                    activity here
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-patriotBlue/30 bg-backgroundAccent/10">
                <button className="w-full text-center text-xs text-patriotBlue hover:text-patriotRed transition-colors">
                  View all notifications
                </button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}
