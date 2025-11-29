# AppLayout Notification Integration Guide

## Overview

This guide shows how to wire the **real notification system** into the existing AppLayout reminder button, replacing the hardcoded sample reminders.

**File to Update**: `/renubu/src/components/layout/AppLayout.tsx`

---

## Step 1: Copy useNotifications Hook

First, copy the `useNotifications` hook from the automation repo to your frontend:

**Source**: `/automation/hooks/useNotifications.ts`
**Destination**: `/renubu/src/hooks/useNotifications.ts`

This hook handles:
- Fetching notifications from API
- Auto-polling every 60 seconds
- Unread count tracking
- Mark as read functionality

---

## Step 2: Update AppLayout Imports

**Replace this:**

```tsx
import { useState } from 'react';
import { Cog6ToothIcon, MagnifyingGlassIcon, SunIcon, XMarkIcon, BookmarkIcon } from '@heroicons/react/24/outline';
```

**With this:**

```tsx
import { useState } from 'react';
import { Cog6ToothIcon, MagnifyingGlassIcon, SunIcon, XMarkIcon, BellIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation'; // For navigation on click
import { useNotifications } from '@/hooks/useNotifications';
```

**Note**: Changed `BookmarkIcon` to `BellIcon` for standard notification icon.

---

## Step 3: Replace Sample Reminders with Real Notifications

**Remove this entire block (lines 59-85):**

```tsx
const sampleReminders = [
  {
    title: "Draft Amendment",
    description: "Prepare amendment for additional seats",
    dueDate: "Tomorrow",
  },
  // ... rest of hardcoded reminders
];
```

**Add this instead:**

```tsx
const router = useRouter();

// Fetch real notifications
const {
  notifications,
  unreadCount,
  isLoading,
  markAsRead,
  hasUnreadUrgent
} = useNotifications({
  onError: (error) => {
    console.error('Failed to fetch notifications:', error);
  }
});

// Handle notification click - navigate to customer page
const handleNotificationClick = async (notification: any) => {
  // Mark as read
  if (!notification.read) {
    await markAsRead(notification.id);
  }

  // Navigate based on metadata
  if (notification.metadata?.customerId) {
    router.push(`/customers/${notification.metadata.customerId}`);
  } else if (notification.metadata?.taskId) {
    router.push(`/tasks/${notification.metadata.taskId}`);
  } else if (notification.metadata?.workflowExecutionId) {
    router.push(`/workflows/${notification.metadata.workflowExecutionId}`);
  }

  // Optional: Close popover after navigation
  // setIsPopoverOpen(false);
};

// Format timestamp for display
const formatTimestamp = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
};

// Get priority styling
const getPriorityClass = (priority: number): string => {
  if (priority <= 2) return 'urgent'; // Red/urgent
  if (priority === 3) return 'normal'; // Blue/normal
  return 'low'; // Gray/low
};
```

---

## Step 4: Update Reminder Button Icon and Badge

**Replace this (lines 123-133):**

```tsx
<button
  id="reminder-button"
  type="button"
  className="rounded-lg p-2 text-blue-600 hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 relative"
  aria-label="Reminders"
  tabIndex={0}
  data-testid="reminder-icon"
>
  <BookmarkIcon className="h-6 w-6" aria-hidden="true" />
  {/* Alert badge */}
  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full border-2 border-white shadow">1</span>
</button>
```

**With this:**

```tsx
<button
  id="reminder-button"
  type="button"
  className="rounded-lg p-2 text-blue-600 hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 relative"
  aria-label={`Notifications (${unreadCount} unread)`}
  tabIndex={0}
  data-testid="reminder-icon"
>
  <BellIcon className="h-6 w-6" aria-hidden="true" />

  {/* Dynamic badge with pulsing effect for urgent notifications */}
  {unreadCount > 0 && (
    <span
      className={`absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white rounded-full border-2 border-white shadow ${
        hasUnreadUrgent() ? 'bg-red-600 animate-pulse' : 'bg-blue-600'
      }`}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  )}
</button>
```

---

## Step 5: Update Popover Content

**Replace this entire PopoverContent block (lines 136-164):**

```tsx
<PopoverContent className="w-80 p-0 z-50 bg-green-50" align="end">
  <div className="p-4 border-b border-gray-200">
    <h3 className="font-semibold text-gray-900">Sample Reminders</h3>
    <p className="text-sm text-gray-500">Common tasks for renewal workflow</p>
  </div>
  <div className="max-h-[300px] overflow-y-auto">
    {sampleReminders.map((reminder, index) => (
      // ... hardcoded reminder content
    ))}
  </div>
  <div className="p-3 bg-gray-50 border-t border-gray-200">
    <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium">
      Add New Reminder
    </button>
  </div>
</PopoverContent>
```

**With this:**

```tsx
<PopoverContent className="w-96 p-0 z-50" align="end">
  {/* Header */}
  <div className="p-4 border-b border-gray-200 bg-gray-50">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
        </p>
      </div>
      {unreadCount > 0 && (
        <button
          onClick={() => markAllRead()}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          Mark all read
        </button>
      )}
    </div>
  </div>

  {/* Content */}
  <div className="max-h-[400px] overflow-y-auto">
    {isLoading && notifications.length === 0 ? (
      // Loading state
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-sm text-gray-500">Loading notifications...</p>
      </div>
    ) : notifications.length === 0 ? (
      // Empty state
      <div className="p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h4 className="font-medium text-gray-900 mb-1">All caught up!</h4>
        <p className="text-sm text-gray-500">You have no notifications at this time.</p>
      </div>
    ) : (
      // Notifications list
      notifications.slice(0, 20).map((notification) => (
        <div
          key={notification.id}
          onClick={() => handleNotificationClick(notification)}
          className={`
            p-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 transition
            ${!notification.read ? 'bg-blue-50/50' : ''}
            ${getPriorityClass(notification.priority) === 'urgent' ? 'border-l-4 border-l-red-500' : ''}
          `}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Title */}
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                  {notification.title}
                </h4>
                {!notification.read && (
                  <span className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0"></span>
                )}
              </div>

              {/* Message */}
              {notification.message && (
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {notification.message}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{formatTimestamp(notification.createdAt)}</span>

                {notification.priority <= 2 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    Urgent
                  </span>
                )}

                {notification.metadata?.workflowStage && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    {notification.metadata.workflowStage}
                  </span>
                )}
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteNotification(notification.id);
              }}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))
    )}
  </div>

  {/* Footer */}
  {notifications.length > 0 && (
    <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
      <button
        onClick={() => router.push('/notifications')}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        View all notifications
      </button>
    </div>
  )}
</PopoverContent>
```

---

## Step 6: Add Missing useNotifications Methods

Add `markAllRead` and `deleteNotification` to the hook destructuring:

```tsx
const {
  notifications,
  unreadCount,
  isLoading,
  markAsRead,
  markAllRead,        // ADD THIS
  deleteNotification, // ADD THIS
  hasUnreadUrgent
} = useNotifications({
  onError: (error) => {
    console.error('Failed to fetch notifications:', error);
  }
});
```

---

## Step 7: Add Custom CSS for Pulse Animation (Optional)

If the `animate-pulse` Tailwind utility isn't giving the desired effect, add custom CSS:

```tsx
<style jsx>{`
  @keyframes notification-pulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 0 0 4px rgba(220, 38, 38, 0);
    }
  }

  .animate-pulse {
    animation: notification-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`}</style>
```

---

## Step 8: Update TypeScript Types (if needed)

If TypeScript complains about notification types, add this interface:

```tsx
interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message?: string;
  priority: number;
  metadata?: Record<string, any>;
  read: boolean;
  createdAt: Date | string;
  readAt?: Date | string;
  customerId?: string;
  taskId?: string;
  workflowExecutionId?: string;
}
```

---

## Complete Before/After Summary

### Before (Sample Reminders):
- ❌ Hardcoded array of 5 sample reminders
- ❌ Static badge showing "1"
- ❌ No real-time updates
- ❌ No navigation on click
- ❌ No mark as read functionality

### After (Real Notifications):
- ✅ Fetches real notifications from API
- ✅ Dynamic badge showing actual unread count
- ✅ Auto-polling every 60 seconds
- ✅ Pulsing red badge for urgent notifications
- ✅ Click to navigate to customer/workflow
- ✅ Mark as read on click
- ✅ "Mark all read" button
- ✅ Delete individual notifications
- ✅ Empty state when no notifications
- ✅ Loading state during fetch

---

## Testing

1. **Create Test Notification** (via database):
   ```sql
   INSERT INTO notifications (user_id, type, title, message, priority)
   VALUES ('your-user-id', 'overdue_alert', 'Test Notification', 'This is a test', 1);
   ```

2. **Verify Badge Shows Count**:
   - Check that bell icon shows "1" badge

3. **Verify Urgent Pulse**:
   - Notifications with priority 1-2 should have pulsing red badge

4. **Verify Click Navigation**:
   - Click notification → should navigate to customer page

5. **Verify Mark as Read**:
   - Click notification → badge count should decrease

6. **Verify Auto-Polling**:
   - Add notification in database → should appear within 60 seconds

---

## API Requirements

Ensure these API endpoints are available:

- `GET /api/notifications` - Fetch notifications
- `GET /api/notifications/unread-count` - Get count
- `PATCH /api/notifications/:id` - Mark as read
- `POST /api/notifications/mark-all-read` - Mark all read
- `DELETE /api/notifications/:id` - Delete notification

These are implemented in `/automation/api/notifications.js`.

---

## Next Steps

After updating AppLayout:

1. Test with sample data
2. Wire workflow configs to send notifications (see `NOTIFICATION_SYSTEM.md`)
3. Add notification types to other areas (tasks, recommendations, etc.)
4. Consider adding browser push notifications (future enhancement)

---

## Full Example (Complete Updated Reminder Button Section)

```tsx
{/* Reminder/Notification Icon */}
<Popover>
  <PopoverTrigger asChild>
    <button
      id="reminder-button"
      type="button"
      className="rounded-lg p-2 text-blue-600 hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 relative"
      aria-label={`Notifications (${unreadCount} unread)`}
      tabIndex={0}
      data-testid="reminder-icon"
    >
      <BellIcon className="h-6 w-6" aria-hidden="true" />

      {unreadCount > 0 && (
        <span
          className={`absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white rounded-full border-2 border-white shadow ${
            hasUnreadUrgent() ? 'bg-red-600 animate-pulse' : 'bg-blue-600'
          }`}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  </PopoverTrigger>

  <PopoverContent className="w-96 p-0 z-50" align="end">
    {/* ... full content from Step 5 ... */}
  </PopoverContent>
</Popover>
```

This completes the integration of real notifications into the AppLayout reminder button!
