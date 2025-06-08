# VMF Voice Notification System

## Overview

The VMF Voice notification system provides real-time updates and notifications for the holiday voting platform. This system includes browser notifications, in-app notifications, a notification center, and real-time updates for voting activities.

## Phase 17.2 Implementation

### Components Implemented

#### 1. Enhanced Notification Service (`src/services/notificationService.ts`)

**Features:**

- Browser notification support with permission management
- Multiple notification types (holiday proposals, voting reminders, live updates, milestones, proposal results)
- User preference management with localStorage persistence
- Notification persistence and management
- Real-time notification capabilities

**Key Methods:**

```typescript
// Send different types of notifications
notificationService.notifyHolidayProposal(holidayName, fundAmount, daysLeft);
notificationService.notifyVotingReminder(proposalTitle, hoursLeft);
notificationService.notifyLiveUpdate(title, message, actionUrl, priority);
notificationService.notifyMilestone(proposalTitle, milestone, description);
notificationService.notifyProposalResult(proposalTitle, result, details);

// Manage notifications
notificationService.markAsRead(notificationId);
notificationService.markAllAsRead();
notificationService.deleteNotification(notificationId);
notificationService.clearAllNotifications();

// Browser notifications
notificationService.requestBrowserPermission();
notificationService.updatePreferences(preferences);
```

#### 2. Notification Center (`src/components/notifications/NotificationCenter.tsx`)

**Features:**

- Dropdown notification panel with bell icon
- Unread count badge with animations
- Notification list with different types and priorities
- Settings panel for user preferences
- Mark as read/delete individual notifications
- Bulk actions (mark all as read, clear all)
- Real-time updates with polling

**Usage:**

```tsx
import { NotificationCenter } from '@/components/notifications';

// In header or layout component
<NotificationCenter />;
```

#### 3. Real-time Notifications Hook (`src/hooks/useRealTimeNotifications.ts`)

**Features:**

- WebSocket support for real-time updates
- Polling fallback for notifications
- Connection status monitoring
- Automatic reconnection
- Development helpers for testing

**Usage:**

```tsx
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';

const {
  notifications,
  unreadCount,
  isConnected,
  markAsRead,
  markAllAsRead,
  sendTestNotification,
  simulateLiveVoteUpdate,
} = useRealTimeNotifications({
  enableWebSocket: true,
  pollingInterval: 5000,
  onNewNotification: notification => {
    console.log('New notification:', notification);
  },
});
```

#### 4. Toast Notifications (`src/components/notifications/NotificationToast.tsx`)

**Features:**

- Animated toast notifications
- Auto-dismiss with progress bar
- Multiple positioning options
- Priority-based styling
- Action buttons for navigation
- Toast container for managing multiple toasts

**Usage:**

```tsx
import { NotificationToast, NotificationToastContainer } from '@/components/notifications';

// Single toast
<NotificationToast
  notification={notification}
  onClose={() => removeToast(notification.id)}
  duration={5000}
  position="top-right"
/>

// Toast container
<NotificationToastContainer
  notifications={toastNotifications}
  onRemove={removeToast}
  maxToasts={3}
  position="top-right"
/>
```

#### 5. Notification Tester (`src/components/notifications/NotificationTester.tsx`)

**Features:**

- Development tool for testing notifications
- Individual notification type testing
- Live vote simulation
- Bulk notification testing
- Connection status monitoring
- Only visible in development mode

**Usage:**

```tsx
import { NotificationTester } from '@/components/notifications';

// Only in development
{
  process.env.NODE_ENV === 'development' && <NotificationTester />;
}
```

## Notification Types

### 1. Holiday Proposal (`holiday_proposal`)

- Triggered when new holiday charity proposals are submitted
- Includes holiday name, funding amount, and voting deadline
- High priority for time-sensitive voting

### 2. Voting Reminder (`voting_reminder`)

- Sent before voting deadlines
- Includes proposal title and time remaining
- Priority increases as deadline approaches

### 3. Live Update (`live_update`)

- Real-time voting updates
- Vote count changes, trending proposals
- Medium priority for engagement

### 4. Milestone (`milestone`)

- Achievement notifications
- Funding milestones, participation goals
- Medium priority for celebration

### 5. Proposal Result (`proposal_result`)

- Final voting outcomes
- Passed/failed status with details
- High priority for closure

## User Preferences

Users can control notification types through the notification center settings:

```typescript
interface NotificationPreferences {
  browserNotifications: boolean; // Browser/system notifications
  votingReminders: boolean; // Deadline reminders
  proposalResults: boolean; // Voting outcomes
  liveUpdates: boolean; // Real-time updates
  milestones: boolean; // Achievement notifications
}
```

## Real-time Features

### WebSocket Integration

- Connects to notification WebSocket server
- Handles live vote updates
- Automatic reconnection on disconnect
- Graceful fallback to polling

### Polling Fallback

- 5-second polling interval by default
- Configurable polling frequency
- Automatic notification detection
- Efficient update mechanism

## Browser Notification Support

### Permission Management

- Automatic permission request
- Permission status checking
- Graceful degradation if denied
- User-friendly permission prompts

### Notification Features

- Rich notifications with icons
- Action buttons for navigation
- Persistent notifications for important updates
- Respect system notification settings

## Development and Testing

### Testing Tools

- `NotificationTester` component for development
- Individual notification type testing
- Live vote simulation
- Bulk notification testing
- Connection status monitoring

### Environment Configuration

```env
# WebSocket URL for real-time notifications
NEXT_PUBLIC_WS_URL=ws://localhost:8080/notifications
```

### Development Usage

```tsx
// Add to any page for testing
{
  process.env.NODE_ENV === 'development' && <NotificationTester />;
}
```

## Integration Points

### Header Integration

The notification center is integrated into the main header:

```tsx
// src/components/layout/Header.tsx
import { NotificationCenter } from '@/components/notifications';

// In header component
<NotificationCenter />;
```

### Voting Integration

Live updates are triggered during voting activities:

```tsx
// When a vote is cast
notificationService.notifyLiveUpdate(
  'New Vote Received',
  `A new ${voteType} vote has been cast`,
  `/proposals/${proposalId}`,
  'medium'
);
```

### Proposal Integration

Notifications are sent for proposal lifecycle events:

```tsx
// New proposal submitted
notificationService.notifyHolidayProposal(
  holidayName,
  fundingAmount,
  daysUntilDeadline
);

// Voting deadline approaching
notificationService.notifyVotingReminder(proposalTitle, hoursRemaining);

// Proposal decided
notificationService.notifyProposalResult(proposalTitle, result, details);
```

## Performance Considerations

### Optimization Features

- Notification limit (50 max stored)
- Efficient localStorage usage
- Debounced polling updates
- Lazy loading of notification components
- Memory cleanup on unmount

### Best Practices

- Use appropriate notification priorities
- Batch notifications when possible
- Respect user preferences
- Provide clear action paths
- Maintain notification history

## Future Enhancements

### Planned Features

- Push notification support
- Email notification integration
- Advanced filtering and search
- Notification scheduling
- Analytics and engagement tracking

### Scalability Considerations

- Database-backed notification storage
- User notification preferences API
- Notification delivery tracking
- Performance monitoring
- Load balancing for WebSocket connections

## Troubleshooting

### Common Issues

1. **Browser notifications not showing**

   - Check permission status
   - Verify browser support
   - Check user preferences

2. **Real-time updates not working**

   - Verify WebSocket connection
   - Check polling fallback
   - Monitor network connectivity

3. **Notifications not persisting**
   - Check localStorage availability
   - Verify data serialization
   - Monitor storage limits

### Debug Tools

- Browser console logging
- Notification service status
- Connection monitoring
- Performance profiling

## API Reference

### NotificationService Methods

```typescript
class NotificationService {
  // Notification sending
  notifyHolidayProposal(
    holidayName: string,
    fundAmount: number,
    daysLeft: number
  ): void;
  notifyVotingReminder(proposalTitle: string, hoursLeft: number): void;
  notifyLiveUpdate(
    title: string,
    message: string,
    actionUrl?: string,
    priority?: string
  ): void;
  notifyMilestone(
    proposalTitle: string,
    milestone: string,
    description: string
  ): void;
  notifyProposalResult(
    proposalTitle: string,
    result: string,
    details: string
  ): void;

  // Notification management
  getNotifications(): VMFNotification[];
  getUnreadNotifications(): VMFNotification[];
  getUnreadCount(): number;
  markAsRead(notificationId: string): void;
  markAllAsRead(): void;
  deleteNotification(notificationId: string): void;
  clearAllNotifications(): void;

  // Browser notifications
  requestBrowserPermission(): Promise<boolean>;
  isBrowserNotificationSupported(): boolean;
  getBrowserPermissionStatus(): NotificationPermission | 'unsupported';

  // Preferences
  getPreferences(): NotificationPreferences;
  updatePreferences(updates: Partial<NotificationPreferences>): void;
}
```

This notification system provides a comprehensive solution for keeping users engaged and informed about voting activities, proposal updates, and platform milestones while respecting user preferences and providing excellent user experience.
