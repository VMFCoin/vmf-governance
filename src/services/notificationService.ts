'use client';

export interface VMFNotification {
  id: string;
  type: 'holiday_proposal' | 'voting_reminder' | 'proposal_result';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private notifications: VMFNotification[] = [];

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
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
    };

    this.notifications.unshift(notification);
    console.log(`📢 Notification sent: ${notification.title}`);

    // In a real app, this would trigger push notifications, emails, etc.
    this.simulateUserNotification(notification);
  }

  /**
   * Send voting reminder
   */
  public notifyVotingReminder(proposalTitle: string, hoursLeft: number): void {
    const notification: VMFNotification = {
      id: `reminder-${Date.now()}`,
      type: 'voting_reminder',
      title: '⏰ Voting Reminder',
      message: `Don't forget to vote on "${proposalTitle}". Only ${hoursLeft} hours left!`,
      timestamp: new Date(),
      isRead: false,
      actionUrl: '/vote',
    };

    this.notifications.unshift(notification);
    console.log(`⏰ Reminder sent: ${notification.title}`);
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
   * Mark notification as read
   */
  public markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  }

  /**
   * Get unread count
   */
  public getUnreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }
}

export const notificationService = NotificationService.getInstance();
