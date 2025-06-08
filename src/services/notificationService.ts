'use client';

export interface VMFNotification {
  id: string;
  type:
    | 'holiday_proposal'
    | 'voting_reminder'
    | 'proposal_result'
    | 'live_update'
    | 'milestone';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  priority?: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  browserNotifications: boolean;
  votingReminders: boolean;
  proposalResults: boolean;
  liveUpdates: boolean;
  milestones: boolean;
}

export class NotificationService {
  private static instance: NotificationService;
  private notifications: VMFNotification[] = [];
  private preferences: NotificationPreferences = {
    browserNotifications: false,
    votingReminders: true,
    proposalResults: true,
    liveUpdates: true,
    milestones: true,
  };
  private permissionRequested = false;
  private isClientInitialized = false;

  constructor() {
    this.notifications = [];
    this.preferences = this.loadPreferences();
    // Only load notifications if we're in the browser
    if (typeof window !== 'undefined') {
      this.loadNotifications();
      this.isClientInitialized = true;
    }
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Request browser notification permission
   */
  public async requestBrowserPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser notifications not supported');
      return false;
    }

    if (this.permissionRequested) {
      return Notification.permission === 'granted';
    }

    this.permissionRequested = true;

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';

      if (granted) {
        this.preferences.browserNotifications = true;
        this.savePreferences();
      }

      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Show browser notification
   */
  private showBrowserNotification(notification: VMFNotification): void {
    if (
      !this.preferences.browserNotifications ||
      Notification.permission !== 'granted'
    ) {
      return;
    }

    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'high',
        silent: notification.priority === 'low',
      });

      browserNotification.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
        browserNotification.close();
      };

      // Auto-close after 5 seconds for non-high priority notifications
      if (notification.priority !== 'high') {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }

  /**
   * Send notification for new holiday proposal
   */
  public notifyHolidayProposal(
    holidayName: string,
    fundAmount: number,
    daysLeft: number
  ): void {
    const notification: VMFNotification = {
      id: `holiday-${Date.now()}`,
      type: 'holiday_proposal',
      title: `🎖️ New ${holidayName} Charity Voting`,
      message: `Vote on which charities should receive $${fundAmount.toLocaleString()} for ${holidayName}. Voting ends in ${daysLeft} days.`,
      timestamp: new Date(),
      isRead: false,
      actionUrl: '/vote',
      priority: 'high',
      metadata: { holidayName, fundAmount, daysLeft },
    };

    this.addNotification(notification);
  }

  /**
   * Send voting reminder
   */
  public notifyVotingReminder(proposalTitle: string, hoursLeft: number): void {
    if (!this.preferences.votingReminders) return;

    const notification: VMFNotification = {
      id: `reminder-${Date.now()}`,
      type: 'voting_reminder',
      title: '⏰ Voting Reminder',
      message: `Don't forget to vote on "${proposalTitle}". Only ${hoursLeft} hours left!`,
      timestamp: new Date(),
      isRead: false,
      actionUrl: '/vote',
      priority: hoursLeft <= 24 ? 'high' : 'medium',
      metadata: { proposalTitle, hoursLeft },
    };

    this.addNotification(notification);
  }

  /**
   * Send live update notification
   */
  public notifyLiveUpdate(
    title: string,
    message: string,
    actionUrl?: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): void {
    if (!this.preferences.liveUpdates) return;

    this.addNotification({
      id: `live-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'live_update',
      title,
      message,
      timestamp: new Date(),
      isRead: false,
      priority,
      actionUrl,
    });
  }

  /**
   * Send milestone notification
   */
  public notifyMilestone(
    proposalTitle: string,
    milestone: string,
    description: string
  ): void {
    if (!this.preferences.milestones) return;

    const notification: VMFNotification = {
      id: `milestone-${Date.now()}`,
      type: 'milestone',
      title: `🎉 Milestone Reached: ${milestone}`,
      message: `${proposalTitle}: ${description}`,
      timestamp: new Date(),
      isRead: false,
      actionUrl: '/vote',
      priority: 'medium',
      metadata: { proposalTitle, milestone, description },
    };

    this.addNotification(notification);
  }

  /**
   * Send proposal result notification
   */
  public notifyProposalResult(
    proposalTitle: string,
    result: 'passed' | 'failed',
    details: string
  ): void {
    if (!this.preferences.proposalResults) return;

    const notification: VMFNotification = {
      id: `result-${Date.now()}`,
      type: 'proposal_result',
      title: `📋 Proposal ${result === 'passed' ? 'Passed' : 'Failed'}`,
      message: `${proposalTitle}: ${details}`,
      timestamp: new Date(),
      isRead: false,
      actionUrl: '/vote',
      priority: 'high',
      metadata: { proposalTitle, result, details },
    };

    this.addNotification(notification);
  }

  /**
   * Save notifications to localStorage
   */
  private saveNotifications(): void {
    // Only save if we're in the browser
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        'vmf_notifications',
        JSON.stringify(this.notifications)
      );
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  /**
   * Load notifications from localStorage
   */
  private loadNotifications(): void {
    // Only load if we're in the browser
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('vmf_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.notifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      this.notifications = [];
    }
  }

  /**
   * Add notification to the system
   */
  public addNotification(notification: VMFNotification): void {
    this.notifications.unshift(notification);

    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.saveNotifications();

    // Show browser notification if enabled
    if (this.preferences.browserNotifications) {
      this.showBrowserNotification(notification);
    }

    console.log(`📢 Notification sent: ${notification.title}`);
  }

  /**
   * Simulate user notification (browser notification, toast, etc.)
   */
  private simulateUserNotification(notification: VMFNotification): void {
    // In a real app, this would show browser notifications, toasts, etc.
    console.log(`🔔 User notification: ${notification.title}`);
    console.log(`📝 Message: ${notification.message}`);
  }

  /**
   * Get all notifications
   */
  public getNotifications(): VMFNotification[] {
    return this.notifications;
  }

  /**
   * Get notifications by type
   */
  public getNotificationsByType(
    type: VMFNotification['type']
  ): VMFNotification[] {
    return this.notifications.filter(n => n.type === type);
  }

  /**
   * Get unread notifications
   */
  public getUnreadNotifications(): VMFNotification[] {
    return this.notifications.filter(n => !n.isRead);
  }

  /**
   * Mark notification as read
   */
  public markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  }

  /**
   * Mark all notifications as read
   */
  public markAllAsRead(): void {
    this.notifications.forEach(n => (n.isRead = true));
  }

  /**
   * Delete notification
   */
  public deleteNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(
      n => n.id !== notificationId
    );
  }

  /**
   * Clear all notifications
   */
  public clearAllNotifications(): void {
    this.notifications = [];
  }

  /**
   * Get unread count
   */
  public getUnreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  /**
   * Get notification preferences
   */
  public getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Update notification preferences
   */
  public updatePreferences(updates: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...updates };
    this.savePreferences();
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    // Only save if we're in the browser
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        'vmf-notification-preferences',
        JSON.stringify(this.preferences)
      );
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): NotificationPreferences {
    // Only load if we're in the browser
    if (typeof window === 'undefined') {
      return { ...this.preferences };
    }

    try {
      const saved = localStorage.getItem('vmf-notification-preferences');
      if (saved) {
        return { ...this.preferences, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
    return { ...this.preferences };
  }

  /**
   * Check if browser notifications are supported
   */
  public isBrowserNotificationSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Get browser notification permission status
   */
  public getBrowserPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!this.isBrowserNotificationSupported()) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  /**
   * Initialize client-side functionality after hydration
   * Call this from useEffect in your components
   */
  public initializeClient(): void {
    if (typeof window !== 'undefined' && !this.isClientInitialized) {
      this.loadNotifications();
      this.isClientInitialized = true;
    }
  }

  /**
   * Check if client-side functionality is initialized
   */
  public isInitialized(): boolean {
    return this.isClientInitialized;
  }
}

export const notificationService = NotificationService.getInstance();
