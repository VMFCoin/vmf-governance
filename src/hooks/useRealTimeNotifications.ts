import { useState, useEffect, useCallback, useRef } from 'react';
import {
  notificationService,
  VMFNotification,
} from '@/services/notificationService';

interface UseRealTimeNotificationsOptions {
  enableWebSocket?: boolean;
  pollingInterval?: number;
  onNewNotification?: (notification: VMFNotification) => void;
}

interface RealTimeNotificationState {
  notifications: VMFNotification[];
  unreadCount: number;
  isConnected: boolean;
  lastUpdate: Date | null;
}

export const useRealTimeNotifications = (
  options: UseRealTimeNotificationsOptions = {}
) => {
  const {
    enableWebSocket = false,
    pollingInterval = 5000,
    onNewNotification,
  } = options;

  const [state, setState] = useState<RealTimeNotificationState>({
    notifications: [],
    unreadCount: 0,
    isConnected: false,
    lastUpdate: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastNotificationCountRef = useRef(0);

  // Update state from notification service
  const updateNotifications = useCallback(() => {
    const notifications = notificationService.getNotifications();
    const unreadCount = notificationService.getUnreadCount();

    // Check for new notifications
    if (notifications.length > lastNotificationCountRef.current) {
      const newNotifications = notifications.slice(
        lastNotificationCountRef.current
      );
      newNotifications.forEach(notification => {
        if (onNewNotification) {
          onNewNotification(notification);
        }
      });
    }

    lastNotificationCountRef.current = notifications.length;

    setState(prev => ({
      ...prev,
      notifications,
      unreadCount,
      lastUpdate: new Date(),
    }));
  }, [onNewNotification]);

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    if (!enableWebSocket || typeof window === 'undefined') return;

    try {
      // In a real implementation, this would connect to your WebSocket server
      // For now, we'll simulate WebSocket behavior
      const ws = new WebSocket(
        process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/notifications'
      );

      ws.onopen = () => {
        console.log('WebSocket connected for notifications');
        setState(prev => ({ ...prev, isConnected: true }));
      };

      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'notification') {
            // Add new notification through service
            notificationService.addNotification(data.notification);
            updateNotifications();
          } else if (data.type === 'vote_update') {
            // Handle live vote updates
            notificationService.notifyLiveUpdate(
              'Live Vote Update',
              `New vote received: ${data.message}`,
              data.proposalId ? `/proposals/${data.proposalId}` : undefined,
              'medium'
            );
            updateNotifications();
          } else if (data.type === 'milestone') {
            // Handle milestone notifications
            notificationService.notifyMilestone(
              data.title || 'Milestone Reached',
              data.message,
              data.actionUrl
            );
            updateNotifications();
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setState(prev => ({ ...prev, isConnected: false }));

        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (enableWebSocket) {
            initializeWebSocket();
          }
        }, 5000);
      };

      ws.onerror = error => {
        console.error('WebSocket error:', error);
        setState(prev => ({ ...prev, isConnected: false }));
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }, [enableWebSocket, updateNotifications]);

  // Start polling for notifications
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(() => {
      updateNotifications();
    }, pollingInterval);
  }, [updateNotifications, pollingInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    // Initial load
    updateNotifications();

    // Start real-time updates
    if (enableWebSocket) {
      initializeWebSocket();
    } else {
      startPolling();
    }

    return () => {
      // Cleanup
      if (wsRef.current) {
        wsRef.current.close();
      }
      stopPolling();
    };
  }, [
    enableWebSocket,
    initializeWebSocket,
    startPolling,
    stopPolling,
    updateNotifications,
  ]);

  // Notification management functions
  const markAsRead = useCallback(
    (notificationId: string) => {
      notificationService.markAsRead(notificationId);
      updateNotifications();
    },
    [updateNotifications]
  );

  const markAllAsRead = useCallback(() => {
    notificationService.markAllAsRead();
    updateNotifications();
  }, [updateNotifications]);

  const deleteNotification = useCallback(
    (notificationId: string) => {
      notificationService.deleteNotification(notificationId);
      updateNotifications();
    },
    [updateNotifications]
  );

  const clearAllNotifications = useCallback(() => {
    notificationService.clearAllNotifications();
    updateNotifications();
  }, [updateNotifications]);

  // Send test notification (for development)
  const sendTestNotification = useCallback(
    (type: VMFNotification['type'] = 'live_update') => {
      const testNotifications = {
        live_update: () =>
          notificationService.notifyLiveUpdate(
            'Test Live Update',
            'This is a test live update notification',
            '/dashboard',
            'medium'
          ),
        milestone: () =>
          notificationService.notifyMilestone(
            'Test Proposal',
            'Test Milestone',
            'This is a test milestone notification'
          ),
        holiday_proposal: () =>
          notificationService.notifyHolidayProposal('Test Holiday', 5000, 7),
        voting_reminder: () =>
          notificationService.notifyVotingReminder('Test Proposal', 24),
        proposal_result: () =>
          notificationService.addNotification({
            id: `test-${Date.now()}`,
            type: 'proposal_result',
            title: 'Test Proposal Result',
            message: 'The test proposal has been decided',
            timestamp: new Date(),
            isRead: false,
            priority: 'medium',
            actionUrl: '/proposals/test-proposal-id',
          }),
      };

      testNotifications[type]();
      updateNotifications();
    },
    [updateNotifications]
  );

  // Simulate live vote update (for development)
  const simulateLiveVoteUpdate = useCallback(
    (proposalId: string, voteType: 'for' | 'against') => {
      notificationService.notifyLiveUpdate(
        'New Vote Received',
        `A new ${voteType} vote has been cast on the proposal`,
        `/proposals/${proposalId}`,
        'medium'
      );
      updateNotifications();
    },
    [updateNotifications]
  );

  return {
    // State
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    isConnected: state.isConnected,
    lastUpdate: state.lastUpdate,

    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refresh: updateNotifications,

    // Development helpers
    sendTestNotification,
    simulateLiveVoteUpdate,

    // Connection management
    reconnect: initializeWebSocket,
  };
};
