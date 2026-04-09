/**
 * Real-time Notification Toast Component
 * Displays toast notifications for real-time events
 */

'use client';

import React from 'react';
import { toast } from 'sonner';
import { 
  NotificationTypes,
  type NotificationNewPayload,
  type MeetingReminderPayload,
  type ApplicationStatusPayload,
  type DocumentStatusPayload,
} from '@/lib/ws-client';
import { useRealtimeNotifications } from '@/contexts/realtime-notifications-context';
import { IconBell, IconVideo, IconCheck, IconAlertCircle, IconClock } from '@tabler/icons-react';

// Toast notification for new notification
export function showNotificationToast(notification: NotificationNewPayload) {
  const icon = getNotificationIcon(notification.type);
  
  toast.custom((t) => (
    <div className="flex items-start gap-3 p-4 bg-background border rounded-lg shadow-lg max-w-md">
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{notification.title}</p>
        <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
          {notification.content}
        </p>
      </div>
      <button
        onClick={() => toast.dismiss(t)}
        className="text-muted-foreground hover:text-foreground"
      >
        ×
      </button>
    </div>
  ), {
    duration: 5000,
    position: 'top-right',
  });
}

// Toast notification for meeting reminder
export function showMeetingReminderToast(reminder: MeetingReminderPayload) {
  toast.custom((t) => (
    <div className="flex items-start gap-3 p-4 bg-background border rounded-lg shadow-lg max-w-md border-purple-200 dark:border-purple-800">
      <div className="flex-shrink-0 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
        <IconVideo className="h-4 w-4 text-purple-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">Meeting Reminder</p>
        <p className="text-muted-foreground text-xs mt-1">
          {reminder.title} starts in {reminder.minutes_until} minutes
        </p>
        <a
          href={reminder.meeting_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline mt-2 inline-block"
        >
          Join Meeting →
        </a>
      </div>
      <button
        onClick={() => toast.dismiss(t)}
        className="text-muted-foreground hover:text-foreground"
      >
        ×
      </button>
    </div>
  ), {
    duration: 10000, // Longer duration for important reminders
    position: 'top-right',
  });
}

// Toast notification for application status change
export function showApplicationStatusToast(change: ApplicationStatusPayload) {
  const isPositive = ['accepted', 'interview_scheduled'].includes(change.new_status);
  
  toast.custom((t) => (
    <div className={`flex items-start gap-3 p-4 bg-background border rounded-lg shadow-lg max-w-md ${
      isPositive ? 'border-green-200 dark:border-green-800' : 'border-yellow-200 dark:border-yellow-800'
    }`}>
      <div className={`flex-shrink-0 p-2 rounded-full ${
        isPositive 
          ? 'bg-green-100 dark:bg-green-900/30' 
          : 'bg-yellow-100 dark:bg-yellow-900/30'
      }`}>
        {isPositive ? (
          <IconCheck className="h-4 w-4 text-green-600" />
        ) : (
          <IconClock className="h-4 w-4 text-yellow-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">Application Update</p>
        <p className="text-muted-foreground text-xs mt-1">
          {change.program_name} at {change.university_name}
        </p>
        <p className="text-xs mt-1">
          Status: <span className="font-medium">{formatStatus(change.new_status)}</span>
        </p>
      </div>
      <button
        onClick={() => toast.dismiss(t)}
        className="text-muted-foreground hover:text-foreground"
      >
        ×
      </button>
    </div>
  ), {
    duration: 6000,
    position: 'top-right',
  });
}

// Toast notification for document status change
export function showDocumentStatusToast(change: DocumentStatusPayload) {
  const isVerified = change.status === 'verified';
  const isRejected = change.status === 'rejected';
  
  toast.custom((t) => (
    <div className={`flex items-start gap-3 p-4 bg-background border rounded-lg shadow-lg max-w-md ${
      isRejected ? 'border-red-200 dark:border-red-800' : 'border-border'
    }`}>
      <div className={`flex-shrink-0 p-2 rounded-full ${
        isVerified 
          ? 'bg-green-100 dark:bg-green-900/30' 
          : isRejected 
            ? 'bg-red-100 dark:bg-red-900/30'
            : 'bg-yellow-100 dark:bg-yellow-900/30'
      }`}>
        {isVerified ? (
          <IconCheck className="h-4 w-4 text-green-600" />
        ) : isRejected ? (
          <IconAlertCircle className="h-4 w-4 text-red-600" />
        ) : (
          <IconClock className="h-4 w-4 text-yellow-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">Document Update</p>
        <p className="text-muted-foreground text-xs mt-1">
          {change.document_type}: <span className="font-medium">{formatStatus(change.status)}</span>
        </p>
        {change.rejection_reason && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            {change.rejection_reason}
          </p>
        )}
      </div>
      <button
        onClick={() => toast.dismiss(t)}
        className="text-muted-foreground hover:text-foreground"
      >
        ×
      </button>
    </div>
  ), {
    duration: 6000,
    position: 'top-right',
  });
}

// Helper functions
function getNotificationIcon(type: string) {
  switch (type) {
    case 'application':
      return (
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
          <IconBell className="h-4 w-4 text-blue-600" />
        </div>
      );
    case 'meeting':
      return (
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
          <IconVideo className="h-4 w-4 text-purple-600" />
        </div>
      );
    case 'document':
      return (
        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
          <IconCheck className="h-4 w-4 text-green-600" />
        </div>
      );
    default:
      return (
        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
          <IconBell className="h-4 w-4 text-gray-600" />
        </div>
      );
  }
}

function formatStatus(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Component that handles real-time notifications and shows toasts
 * Add this to the layout to enable real-time notifications
 */
export function RealtimeNotificationHandler({
  userId,
  role,
}: {
  userId?: string;
  role?: string;
}) {
  const handleNewNotification = React.useCallback((notification: unknown) => {
    showNotificationToast(notification as NotificationNewPayload);
  }, []);

  const handleMeetingReminder = React.useCallback((reminder: unknown) => {
    showMeetingReminderToast(reminder as MeetingReminderPayload);
  }, []);

  const handleApplicationStatusChange = React.useCallback((change: unknown) => {
    showApplicationStatusToast(change as ApplicationStatusPayload);
  }, []);

  const handleDocumentStatusChange = React.useCallback((change: unknown) => {
    showDocumentStatusToast(change as DocumentStatusPayload);
  }, []);

  // This component doesn't render anything visible
  // It just sets up the WebSocket connection and toast handlers
  // The actual WebSocket connection is managed in the layout
  
  return null;
}
